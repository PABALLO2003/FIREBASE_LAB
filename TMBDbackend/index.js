const express = require("express");
const cors = require("cors");
const axios = require("axios");
const admin = require("firebase-admin");
const dotenv = require("dotenv");
const fs = require("fs");
const path = require("path");

dotenv.config();

const PORT = process.env.PORT || 4000;
const TMDB_API_KEY = process.env.TMDB_API_KEY;
const SERVICE_ACCOUNT_PATH = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || process.env.GOOGLE_APPLICATION_CREDENTIALS || "./firebase-service-account.json";

const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "http://localhost:3000";

if (!TMDB_API_KEY) {
  console.error("Error: TMDB_API_KEY is not set in .env");
  process.exit(1);
}

let adminInitialized = false;
try {
  const serviceAccountPath = path.resolve(SERVICE_ACCOUNT_PATH);
  if (fs.existsSync(serviceAccountPath)) {
    const serviceAccount = require(serviceAccountPath);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: serviceAccount.project_id || process.env.FIREBASE_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT
    });
    console.log('Firebase Admin initialized using service account file. Project:', serviceAccount.project_id);
    adminInitialized = true;
  } else {
    console.warn(`Service account JSON not found at ${serviceAccountPath}. Attempting Application Default Credentials (ADC).`);
    try {
      admin.initializeApp();
      console.log('Firebase Admin initialized using Application Default Credentials.');
      adminInitialized = true;
    } catch (adcErr) {
      console.error('Failed to initialize Admin SDK via ADC:', adcErr && (adcErr.stack || adcErr.message || adcErr));
    }
  }
} catch (err) {
  console.error('Failed to initialize Firebase Admin (unexpected error):', err && (err.stack || err.message || err));
}

let db = null;
if (adminInitialized) {
  try {
    db = admin.firestore();
  } catch (e) {
    console.error('Failed to create Firestore client:', e && (e.stack || e.message || e));
    db = null;
  }
} else {
  console.warn('Admin SDK not initialized; Firestore operations will fail until credentials are available.');
}

const app = express();

const allowedOrigins = (FRONTEND_ORIGIN || '').split(',').map(s => s.trim()).filter(Boolean);
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); 
    if (allowedOrigins.includes('*')) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true); 
    console.warn('Blocked CORS request from origin:', origin);
    return callback(new Error('CORS not allowed for origin: ' + origin));
  },
  optionsSuccessStatus: 200,
  credentials: true
}));

app.use(express.json());

// Request logger
app.use((req, res, next) => {
  console.log(new Date().toISOString(), req.method, req.url, 'origin:', req.headers.origin, 'hasAuthHeader:', !!req.headers.authorization);
  next();
});


app.get("/tmdb/search", async (req, res) => {
  const q = req.query.query || req.query.q;
  const page = req.query.page || 1;
  if (!q) return res.status(400).json({ message: "Missing query" });

  try {
    const tmdbRes = await axios.get("https://api.themoviedb.org/3/search/movie", {
      params: {
        api_key: TMDB_API_KEY,
        query: q,
        include_adult: false,
        page
      }
    });
    return res.json(tmdbRes.data);
  } catch (err) {
    console.error('TMDb proxy search failed:', err.response ? err.response.data : err.message);
    const body = err.response ? err.response.data : err.message;
    return res.status(502).json({ message: "TMDb search failed", error: body });
  }
});


app.get("/tmdb/movie/:id", async (req, res) => {
  try {
    const tmdbRes = await axios.get(`https://api.themoviedb.org/3/movie/${req.params.id}`, {
      params: { api_key: TMDB_API_KEY }
    });
    return res.json(tmdbRes.data);
  } catch (err) {
    console.error('TMDb proxy movie failed:', err.response ? err.response.data : err.message);
    const body = err.response ? err.response.data : err.message;
    return res.status(502).json({ message: "TMDb movie fetch failed", error: body });
  }
});


async function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;
  if (!token) return res.status(401).json({ message: "No token provided" });

  try {
    const decoded = await admin.auth().verifyIdToken(token);
    req.user = { uid: decoded.uid, email: decoded.email };
    next();
  } catch (err) {
    console.error('Token verification error:', err && (err.stack || err.message || err));
    return res.status(401).json({ message: "Invalid token", error: err.message });
  }
}


app.get("/api/reviews/movie/:movieId", async (req, res) => {
  const movieId = req.params.movieId;
  console.log('[reviews] GET movieId=', movieId);

  if (!db) {
    console.error('[reviews] Firestore client not available (admin not initialized).');
    return res.status(500).json({ message: 'Server misconfiguration: Firestore not initialized' });
  }

  try {
    const snapshot = await db.collection("reviews").where("movieId", "==", movieId).get();
    console.log(`[reviews] Firestore returned ${snapshot.size} docs for movieId=${movieId}`);

    const reviews = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    reviews.sort((a, b) => {
      const aTs = a.createdAt?.toMillis?.() || 0;
      const bTs = b.createdAt?.toMillis?.() || 0;
      return bTs - aTs;
    });

    return res.json(reviews);
  } catch (err) {
    console.error('[reviews] Failed to fetch reviews:', err && (err.stack || err.message || err));
    return res.status(500).json({ message: 'Failed to fetch reviews', error: err.message || String(err) });
  }
});


app.post("/api/reviews", authenticateToken, async (req, res) => {
  if (!db) return res.status(500).json({ message: 'Server misconfiguration: Firestore not initialized' });

  const { movieId, movieTitle, rating, text } = req.body;
  if (!movieId || rating === undefined) return res.status(400).json({ message: "movieId and rating required" });

  try {
    const now = admin.firestore.FieldValue.serverTimestamp();
    const docRef = await db.collection("reviews").add({
      movieId,
      movieTitle: movieTitle || "",
      rating,
      text: text || "",
      uid: req.user.uid,
      userEmail: req.user.email || "",
      createdAt: now,
      updatedAt: now
    });
    const doc = await docRef.get();
    return res.status(201).json({ id: docRef.id, ...doc.data() });
  } catch (err) {
    console.error('[reviews] Failed to create review:', err && (err.stack || err.message || err));
    return res.status(500).json({ message: 'Failed to create review', error: err.message || String(err) });
  }
});


app.put("/api/reviews/:id", authenticateToken, async (req, res) => {
  if (!db) return res.status(500).json({ message: 'Server misconfiguration: Firestore not initialized' });

  const id = req.params.id;
  const { rating, text } = req.body;

  try {
    const docRef = db.collection("reviews").doc(id);
    const doc = await docRef.get();
    if (!doc.exists) return res.status(404).json({ message: 'Review not found' });

    const data = doc.data();
    if (data.uid !== req.user.uid) return res.status(403).json({ message: 'Not authorized' });

    await docRef.update({
      rating: rating ?? data.rating,
      text: text ?? data.text,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    const updated = await docRef.get();
    return res.json({ id: updated.id, ...updated.data() });
  } catch (err) {
    console.error('[reviews] Failed to update review:', err && (err.stack || err.message || err));
    return res.status(500).json({ message: 'Failed to update review', error: err.message || String(err) });
  }
});


app.delete("/api/reviews/:id", authenticateToken, async (req, res) => {
  if (!db) return res.status(500).json({ message: 'Server misconfiguration: Firestore not initialized' });

  const id = req.params.id;
  try {
    const docRef = db.collection("reviews").doc(id);
    const doc = await docRef.get();
    if (!doc.exists) return res.status(404).json({ message: 'Review not found' });

    const data = doc.data();
    if (data.uid !== req.user.uid) return res.status(403).json({ message: 'Not authorized' });

    await docRef.delete();
    return res.json({ message: 'Deleted' });
  } catch (err) {
    console.error('[reviews] Failed to delete review:', err && (err.stack || err.message || err));
    return res.status(500).json({ message: 'Failed to delete review', error: err.message || String(err) });
  }
});


app.get("/api/my-reviews", authenticateToken, async (req, res) => {
  if (!db) return res.status(500).json({ message: 'Server misconfiguration: Firestore not initialized' });

  try {
    const snapshot = await db.collection("reviews").where("uid", "==", req.user.uid).get();
    const reviews = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return res.json(reviews);
  } catch (err) {
    console.error('[reviews] Failed to fetch my reviews:', err && (err.stack || err.message || err));
    return res.status(500).json({ message: 'Failed to fetch my reviews', error: err.message || String(err) });
  }
});


app.get("/api/posts", async (req, res) => {
  if (!db) return res.status(500).json({ message: 'Server misconfiguration: Firestore not initialized' });
  try {
    const limit = parseInt(req.query.limit || "5", 10);
    const snapshot = await db.collection("posts").orderBy("createdAt", "desc").limit(limit).get();
    const posts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return res.json(posts);
  } catch (err) {
    console.error('[posts] Failed to fetch posts:', err && (err.stack || err.message || err));
    return res.status(500).json({ message: 'Failed to fetch posts', error: err.message || String(err) });
  }
});


app.post("/api/posts", authenticateToken, async (req, res) => {
  if (!db) return res.status(500).json({ message: 'Server misconfiguration: Firestore not initialized' });
  try {
    const { title, excerpt, content } = req.body;
    if (!title) return res.status(400).json({ message: 'Title required' });
    const now = admin.firestore.FieldValue.serverTimestamp();
    const docRef = await db.collection("posts").add({
      title,
      excerpt: excerpt || "",
      content: content || "",
      authorUid: req.user.uid,
      authorEmail: req.user.email || "",
      createdAt: now,
      updatedAt: now
    });
    const doc = await docRef.get();
    return res.status(201).json({ id: docRef.id, ...doc.data() });
  } catch (err) {
    console.error('[posts] Failed to create post:', err && (err.stack || err.message || err));
    return res.status(500).json({ message: 'Failed to create post', error: err.message || String(err) });
  }
});


app.get("/api/posts/:id", async (req, res) => {
  if (!db) return res.status(500).json({ message: 'Server misconfiguration: Firestore not initialized' });
  try {
    const doc = await db.collection("posts").doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ message: 'Post not found' });
    return res.json({ id: doc.id, ...doc.data() });
  } catch (err) {
    console.error('[posts] Failed to fetch post:', err && (err.stack || err.message || err));
    return res.status(500).json({ message: 'Failed to fetch post', error: err.message || String(err) });
  }
});


app.get("/", (req, res) => res.send("🎬 TMDB backend is running successfully"));


app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
