import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';

admin.initializeApp();
const db = admin.firestore();

// ── Helper functions ─────────────────────────────────────────────────────────

const escapeHtml = (unsafe?: string) => {
    if (!unsafe) return '';
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
};

const extractText = (html?: string) => {
    if (!html) return '';
    return html.replace(/<[^>]*>?/gm, '').replace(/&nbsp;/g, ' ').trim();
};

// ── renderPostTags ────────────────────────────────────────────────────────────

export const renderPostTags = functions.https.onRequest(async (req, res) => {
    try {
        const pathParts = req.path.split('/');
        const slugOrId = pathParts[2];

        if (!slugOrId) {
            res.status(404).send("Not found");
            return;
        }

        // 1. Intentar búsqueda directa por ID de documento (rutas antiguas)
        let docSnap = await db.collection('posts').doc(slugOrId).get();

        // 2. Si no existe como ID, buscar por campo slug (rutas nuevas)
        if (!docSnap.exists) {
            const slugQuery = await db.collection('posts')
                .where('slug', '==', slugOrId)
                .limit(1)
                .get();
            if (!slugQuery.empty) {
                docSnap = slugQuery.docs[0] as any;
            }
        }

        if (!docSnap.exists) {
            const html = fs.readFileSync(path.resolve(__dirname, './index.html'), 'utf-8');
            res.set('Cache-Control', 'public, max-age=60, s-maxage=300');
            res.status(200).send(html);
            return;
        }

        const post = docSnap.data();

        if (post?.published === false) {
            const html = fs.readFileSync(path.resolve(__dirname, './index.html'), 'utf-8');
            res.status(200).send(html);
            return;
        }

        const title = escapeHtml(post?.title || 'Noticia');
        const contentPreview = escapeHtml(extractText(post?.content).substring(0, 160) + '...');
        const imageUrl = post?.headerImageUrl || 'https://lachispasur.cl/logo.webp';
        // Usar slug en la URL canónica si existe, si no usar el ID del documento
        const canonicalSlug = post?.slug || docSnap.id;
        const postUrl = `https://lachispasur.cl/post/${canonicalSlug}`;

        const metaTags = `
            <title>${title} | La Chispa Sur</title>
            <meta name="description" content="${contentPreview}" />
            <link rel="canonical" href="${postUrl}" />
            <meta property="og:site_name" content="La Chispa Sur" />
            <meta property="og:type" content="article" />
            <meta property="og:url" content="${postUrl}" />
            <meta property="og:title" content="${title}" />
            <meta property="og:description" content="${contentPreview}" />
            <meta property="og:image" content="${imageUrl}" />
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content="${title}" />
            <meta name="twitter:description" content="${contentPreview}" />
            <meta name="twitter:image" content="${imageUrl}" />
        `;

        let html = fs.readFileSync(path.resolve(__dirname, './index.html'), 'utf-8');
        html = html.replace('<!-- __META_TAGS__ -->', metaTags);
        html = html.replace('<title>La Chispa Sur</title>', '');

        res.set('Cache-Control', 'public, max-age=60, s-maxage=0');
        res.status(200).send(html);
    } catch (error) {
        console.error("Error fetching post data", error);
        try {
            const html = fs.readFileSync(path.resolve(__dirname, './index.html'), 'utf-8');
            res.status(200).send(html);
        } catch {
            res.status(500).send("Server Error");
        }
    }
});

// ── approveEditor ────────────────────────────────────────────────────────────────────────────────────

/**
 * Permite al admin aprobar o rechazar solicitudes de registro de editores.
 * Recibe: { uid: string, action: 'approve' | 'reject' }
 */
export const approveEditor = functions.https.onCall(
  async (request) => {
    // 1. Verificar autenticación
    if (!request.auth) {
        throw new functions.https.HttpsError(
            'unauthenticated',
            'Debes estar autenticado para realizar esta acción.'
        );
    }

    // 2. Verificar que el llamante es admin
    const callerDoc = await db.collection('users').doc(request.auth.uid).get();
    if (!callerDoc.exists || callerDoc.data()?.role !== 'admin') {
        throw new functions.https.HttpsError(
            'permission-denied',
            'Solo los administradores pueden aprobar o rechazar editores.'
        );
    }

    const { uid, action } = request.data as { uid: string; action: 'approve' | 'reject' };

    if (!uid || !['approve', 'reject'].includes(action)) {
        throw new functions.https.HttpsError(
            'invalid-argument',
            'Datos inválidos. Se requieren uid y action (approve|reject).'
        );
    }

    // 3. Verificar que el usuario objetivo existe y está pendiente
    const targetDoc = await db.collection('users').doc(uid).get();
    if (!targetDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'Usuario no encontrado.');
    }
    if (targetDoc.data()?.role !== 'pending') {
        throw new functions.https.HttpsError(
            'failed-precondition',
            'Este usuario no está pendiente de aprobación.'
        );
    }

    if (action === 'approve') {
        await db.collection('users').doc(uid).update({
            role: 'editor',
            approvedAt: admin.firestore.FieldValue.serverTimestamp(),
            approvedBy: request.auth.uid,
        });
        return { success: true, message: 'Editor aprobado exitosamente.' };
    } else {
        await db.collection('users').doc(uid).delete();
        await admin.auth().deleteUser(uid);
        return { success: true, message: 'Usuario rechazado y eliminado.' };
    }
});

// ── revokeEditor ─────────────────────────────────────────────────────────────────────────────────────

/**
 * Revoca o elimina un editor activo.
 * Recibe: { uid: string, action: 'revoke' | 'delete' }
 */
export const revokeEditor = functions.https.onCall(
  async (request) => {
    if (!request.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'No autenticado.');
    }

    const callerDoc = await db.collection('users').doc(request.auth.uid).get();
    if (!callerDoc.exists || callerDoc.data()?.role !== 'admin') {
        throw new functions.https.HttpsError('permission-denied', 'Solo administradores.');
    }

    const { uid, action } = request.data as { uid: string; action: 'revoke' | 'delete' };

    if (!uid || !['revoke', 'delete'].includes(action)) {
        throw new functions.https.HttpsError('invalid-argument', 'Datos inválidos.');
    }

    const targetDoc = await db.collection('users').doc(uid).get();
    if (!targetDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'Usuario no encontrado.');
    }

    if (action === 'delete') {
        await db.collection('users').doc(uid).delete();
        await admin.auth().deleteUser(uid);
        return { success: true, message: 'Editor eliminado.' };
    } else {
        await db.collection('users').doc(uid).update({ role: 'pending' });
        return { success: true, message: 'Acceso revocado. Editor movido a pendientes.' };
    }
});

// ── generateSitemap ───────────────────────────────────────────────────────────

const SITE_BASE_URL = 'https://lachispasur.cl';

/**
 * Genera un sitemap.xml dinámico con todos los posts publicados.
 * Es llamado por Firebase Hosting rewrite en /sitemap.xml.
 */
export const generateSitemap = functions.https.onRequest(async (_req, res) => {
    try {
        const snapshot = await db
            .collection('posts')
            .where('published', '!=', false)
            .get();

        const postUrls = snapshot.docs.map(docSnap => {
            const data = docSnap.data();
            // Obtener fecha de última modificación como string YYYY-MM-DD
            let lastmod = '';
            const ts = data.updatedAt ?? data.createdAt;
            if (ts?.toDate) {
                lastmod = ts.toDate().toISOString().split('T')[0];
            }
            // Usar slug en la URL si exist, si no usar el ID de Firestore
            const urlSegment = data.slug || docSnap.id;
            return `
  <url>
    <loc>${SITE_BASE_URL}/post/${urlSegment}</loc>${lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : ''}
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`;
        });

        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${SITE_BASE_URL}/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>${postUrls.join('')}
</urlset>`;

        res.set('Content-Type', 'application/xml; charset=utf-8');
        res.set('Cache-Control', 'public, max-age=3600, s-maxage=3600');
        res.status(200).send(xml);
    } catch (error) {
        console.error('Error generating sitemap', error);
        res.status(500).send('Error generating sitemap');
    }
});

// ── generateRss ───────────────────────────────────────────────────────────────

export const generateRss = functions.https.onRequest(async (_req, res) => {
    try {
        const snapshot = await db
            .collection('posts')
            .where('published', '!=', false)
            .get();

        const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Ordenar en memoria por fecha descendente
        docs.sort((a: any, b: any) => {
            const dateA = a.createdAt?.toDate?.() || new Date(0);
            const dateB = b.createdAt?.toDate?.() || new Date(0);
            return dateB.getTime() - dateA.getTime();
        });

        // Tomamos los últimos 50 posts para el feed
        const latestDocs = docs.slice(0, 50);

        const items = latestDocs.map((data: any) => {
            const urlSegment = data.slug || data.id;
            const postUrl = `${SITE_BASE_URL}/post/${urlSegment}`;
            const title = escapeHtml(data.title || 'Noticia');
            const description = escapeHtml(extractText(data.content).substring(0, 300) + '...');
            
            let pubDate = '';
            const ts = data.createdAt || data.updatedAt;
            if (ts?.toDate) {
                pubDate = ts.toDate().toUTCString();
            }

            return `
    <item>
      <title>${title}</title>
      <link>${postUrl}</link>
      <guid>${postUrl}</guid>
      <description>${description}</description>
      ${pubDate ? `<pubDate>${pubDate}</pubDate>` : ''}
    </item>`;
        });

        const xml = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>La Chispa Sur</title>
    <link>${SITE_BASE_URL}</link>
    <description>Noticias e ideas desde el sur</description>
    <atom:link href="${SITE_BASE_URL}/rss.xml" rel="self" type="application/rss+xml" />
    <language>es</language>${items.join('')}
  </channel>
</rss>`;

        res.set('Content-Type', 'application/rss+xml; charset=utf-8');
        res.set('Cache-Control', 'public, max-age=3600, s-maxage=3600');
        res.status(200).send(xml);
    } catch (error) {
        console.error('Error generating RSS', error);
        res.status(500).send('Error generating RSS');
    }
});
