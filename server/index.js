const express = require('express');
const cors = require('cors');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { MongoClient, ObjectId } = require('mongodb');

const app = express();
const PORT = process.env.PORT || 3001;

// Print all env vars on startup to debug
console.log('=== STARTUP CHECK ===');
console.log('MONGO_URI exists:', !!process.env.MONGO_URI);
console.log('MONGO_URI value:', process.env.MONGO_URI ? process.env.MONGO_URI.substring(0, 30) + '...' : 'MISSING');
console.log('CLOUDINARY_CLOUD_NAME:', process.env.CLOUDINARY_CLOUD_NAME || 'MISSING');
console.log('CLOUDINARY_API_KEY exists:', !!process.env.CLOUDINARY_API_KEY);
console.log('CLOUDINARY_API_SECRET exists:', !!process.env.CLOUDINARY_API_SECRET);
console.log('=====================');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

let db;
const uri = process.env.MONGO_URI;

if (!uri) {
  console.error('FATAL: MONGO_URI environment variable is not set!');
  process.exit(1);
}

MongoClient.connect(uri, { serverSelectionTimeoutMS: 10000 })
  .then(client => {
    db = client.db('birthday');
    console.log('✅ MongoDB connected successfully!');
  })
  .catch(err => {
    console.error('❌ MongoDB connection failed:', err.message);
    console.error('Full error:', JSON.stringify(err, null, 2));
    process.exit(1);
  });

app.use(cors());
app.use(express.json());

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_, file, cb) =>
    file.mimetype.startsWith('image/') ? cb(null, true) : cb(new Error('Images only')),
});

const toCloud = (buf) => new Promise((res, rej) =>
  cloudinary.uploader.upload_stream({ folder: 'madhu' }, (e, r) => e ? rej(e) : res(r)).end(buf)
);

const fmt = (d) => ({ ...d, id: d._id.toString() });

app.get('/api/photos', async (req, res) => {
  const data = await db.collection('photos').find().sort({ createdAt: -1 }).toArray();
  res.json(data.map(fmt));
});

app.post('/api/photos', upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file' });
    const up = await toCloud(req.file.buffer);
    const doc = { url: up.secure_url, publicId: up.public_id, caption: req.body.caption || '', createdAt: new Date() };
    const r = await db.collection('photos').insertOne(doc);
    res.json(fmt({ ...doc, _id: r.insertedId }));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/photos/:id', async (req, res) => {
  try {
    const p = await db.collection('photos').findOne({ _id: new ObjectId(req.params.id) });
    if (!p) return res.status(404).json({ error: 'Not found' });
    await cloudinary.uploader.destroy(p.publicId);
    await db.collection('photos').deleteOne({ _id: new ObjectId(req.params.id) });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/notes', async (req, res) => {
  const data = await db.collection('notes').find().sort({ createdAt: -1 }).toArray();
  res.json(data.map(fmt));
});

app.post('/api/notes', async (req, res) => {
  try {
    const { name, message, color } = req.body;
    if (!name || !message) return res.status(400).json({ error: 'Missing fields' });
    const doc = { name, message, color: color || '#FFD166', createdAt: new Date() };
    const r = await db.collection('notes').insertOne(doc);
    res.json(fmt({ ...doc, _id: r.insertedId }));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/notes/:id', async (req, res) => {
  try {
    await db.collection('notes').deleteOne({ _id: new ObjectId(req.params.id) });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.listen(PORT, () => console.log(`Server on ${PORT}`));