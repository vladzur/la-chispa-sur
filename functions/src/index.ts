import * as functions from 'firebase-functions/v1';
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
        const postId = pathParts[2];

        if (!postId) {
            res.status(404).send("Not found");
            return;
        }

        const docRef = db.collection('posts').doc(postId);
        const docSnap = await docRef.get();

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
        const imageUrl = post?.headerImageUrl || '';

        const metaTags = `
            <title>${title} | La Chispa Sur</title>
            <meta name="description" content="${contentPreview}" />
            <meta property="og:type" content="article" />
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

        res.set('Cache-Control', 'public, max-age=300, s-maxage=3600');
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

// ── approveEditor ─────────────────────────────────────────────────────────────

/**
 * Cloud Function callable (v1) que permite al admin aprobar o rechazar
 * solicitudes de registro de editores.
 *
 * Recibe: { uid: string, action: 'approve' | 'reject' }
 */
export const approveEditor = functions.https.onCall(
  async (data: { uid: string; action: 'approve' | 'reject' }, context) => {
    // 1. Verificar autenticación
    if (!context.auth) {
        throw new functions.https.HttpsError(
            'unauthenticated',
            'Debes estar autenticado para realizar esta acción.'
        );
    }

    // 2. Verificar que el llamante es admin
    const callerDoc = await db.collection('users').doc(context.auth.uid).get();
    if (!callerDoc.exists || callerDoc.data()?.role !== 'admin') {
        throw new functions.https.HttpsError(
            'permission-denied',
            'Solo los administradores pueden aprobar o rechazar editores.'
        );
    }

    const { uid, action } = data;

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
            approvedBy: context.auth.uid,
        });
        return { success: true, message: 'Editor aprobado exitosamente.' };
    } else {
        await db.collection('users').doc(uid).delete();
        await admin.auth().deleteUser(uid);
        return { success: true, message: 'Usuario rechazado y eliminado.' };
    }
});

// ── revokeEditor ──────────────────────────────────────────────────────────────

/**
 * Cloud Function callable (v1) para revocar o eliminar un editor activo.
 *
 * Recibe: { uid: string, action: 'revoke' | 'delete' }
 */
export const revokeEditor = functions.https.onCall(
  async (data: { uid: string; action: 'revoke' | 'delete' }, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'No autenticado.');
    }

    const callerDoc = await db.collection('users').doc(context.auth.uid).get();
    if (!callerDoc.exists || callerDoc.data()?.role !== 'admin') {
        throw new functions.https.HttpsError('permission-denied', 'Solo administradores.');
    }

    const { uid, action } = data;

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
