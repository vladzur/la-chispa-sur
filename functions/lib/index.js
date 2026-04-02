"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderPostTags = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
admin.initializeApp();
const db = admin.firestore();
// Helper to sanitize html strings
const escapeHtml = (unsafe) => {
    if (!unsafe)
        return '';
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
};
const extractText = (html) => {
    if (!html)
        return '';
    return html.replace(/<[^>]*>?/gm, '').replace(/&nbsp;/g, ' ').trim();
};
exports.renderPostTags = functions.https.onRequest(async (req, res) => {
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
        if ((post === null || post === void 0 ? void 0 : post.published) === false) {
            let html = fs.readFileSync(path.resolve(__dirname, './index.html'), 'utf-8');
            res.status(200).send(html);
            return;
        }
        const title = escapeHtml((post === null || post === void 0 ? void 0 : post.title) || 'Noticia');
        const contentPreview = escapeHtml(extractText(post === null || post === void 0 ? void 0 : post.content).substring(0, 160) + '...');
        const imageUrl = (post === null || post === void 0 ? void 0 : post.headerImageUrl) || '';
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
    }
    catch (error) {
        console.error("Error fetching post data", error);
        // Fallback to static html
        try {
            let html = fs.readFileSync(path.resolve(__dirname, './index.html'), 'utf-8');
            res.status(200).send(html);
        }
        catch (_a) {
            res.status(500).send("Server Error");
        }
    }
});
//# sourceMappingURL=index.js.map