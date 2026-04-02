import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';

admin.initializeApp();
const db = admin.firestore();

// Helper to sanitize html strings
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

export const renderPostTags = functions.https.onRequest(async (req, res) => {
    try {
        // req.path will be something like "/post/abc123xyz"
        const pathParts = req.path.split('/');
        // the index will be [ "", "post", "postId" ]
        const postId = pathParts[2];

        if (!postId) {
            res.status(404).send("Not found");
            return;
        }

        const docRef = db.collection('posts').doc(postId);
        const docSnap = await docRef.get();

        if (!docSnap.exists) {
            // Serve normal index.html, let Vue handle 404
            let html = fs.readFileSync(path.resolve(__dirname, './index.html'), 'utf-8');
            res.set('Cache-Control', 'public, max-age=60, s-maxage=300');
            res.status(200).send(html);
            return;
        }

        const post = docSnap.data();
        
        // Let Vue handle draft protection logic - we just don't inject rich previews for drafts unless we want to.
        if (post?.published === false) {
             let html = fs.readFileSync(path.resolve(__dirname, './index.html'), 'utf-8');
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
        
        // Let's replace the placeholder or <title>
        html = html.replace('<!-- __META_TAGS__ -->', metaTags);
        html = html.replace('<title>La Chispa Sur</title>', ''); // Clean the default title

        // Cache so we don't bombard Firestore
        res.set('Cache-Control', 'public, max-age=300, s-maxage=3600');
        res.status(200).send(html);
    } catch (error) {
        console.error("Error fetching post data", error);
        // Fallback to static html
        try {
            let html = fs.readFileSync(path.resolve(__dirname, './index.html'), 'utf-8');
            res.status(200).send(html);
        } catch {
            res.status(500).send("Server Error");
        }
    }
});
