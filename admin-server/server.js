const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const imagesDir = path.join(__dirname, 'images');
if (!fs.existsSync(imagesDir)) fs.mkdirSync(imagesDir);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, imagesDir),
  filename: (req, file, cb) => {
    const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, Date.now() + '_' + safe);
  }
});
const upload = multer({ storage });

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use('/images', express.static(imagesDir));

app.get('/', (req, res) => {
  const files = fs.readdirSync(imagesDir).filter(f => !f.startsWith('.'));
  const list = files.map(f => `
    <div style="margin:8px 0;">
      <img src="/images/${f}" style="height:60px;vertical-align:middle;margin-right:10px;">
      ${f}
      <form method="POST" action="/delete" style="display:inline;">
        <input type="hidden" name="file" value="${f}">
        <button>Delete</button>
      </form>
    </div>
  `).join('');
  res.send(`
    <h2>Admin Dashboard</h2>
    <form method="POST" action="/upload" enctype="multipart/form-data">
      <input type="file" name="image" accept="image/*" required>
      <button>Upload</button>
    </form>
    <hr>
    ${list || '<i>No images yet</i>'}
  `);
});

app.post('/upload', upload.single('image'), (req, res) => res.redirect('/'));
app.post('/delete', (req, res) => {
  const file = path.basename(req.body.file || '');
  const p = path.join(imagesDir, file);
  if (fs.existsSync(p)) fs.unlinkSync(p);
  res.redirect('/');
});

app.listen(8080, () => console.log('Admin server on :8080'));
