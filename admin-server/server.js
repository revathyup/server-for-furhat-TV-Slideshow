const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const imagesDir = path.join(__dirname, 'images');
if (!fs.existsSync(imagesDir)) fs.mkdirSync(imagesDir);
const orderPath = path.join(__dirname, 'order.json');

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
app.use(express.json());
app.use('/images', express.static(imagesDir));

function loadOrder() {
  try {
    const raw = fs.readFileSync(orderPath, 'utf8');
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch (err) {
    return [];
  }
}

function saveOrder(order) {
  fs.writeFileSync(orderPath, JSON.stringify(order, null, 2));
}

function readImages() {
  return fs.readdirSync(imagesDir)
    .filter(f => !f.startsWith('.'))
    .map(f => {
      const p = path.join(imagesDir, f);
      const stat = fs.statSync(p);
      return { name: f, mtime: stat.mtimeMs, size: stat.size };
    })
    .sort((a, b) => b.mtime - a.mtime);
}

function getOrderedImages() {
  const files = readImages();
  const byName = new Map(files.map(f => [f.name, f]));
  const order = loadOrder();
  const ordered = [];
  const used = new Set();

  order.forEach(name => {
    if (byName.has(name)) {
      ordered.push(byName.get(name));
      used.add(name);
    }
  });

  files.forEach(f => {
    if (!used.has(f.name)) ordered.push(f);
  });

  const nextOrder = ordered.map(f => f.name);
  if (nextOrder.join('|') !== order.join('|')) {
    saveOrder(nextOrder);
  }

  return ordered;
}

app.get('/', (req, res) => {
  const files = getOrderedImages();
  const cards = files.map(f => {
    const isVideo = /\.(mp4|webm|mov|m4v)$/i.test(f.name);
    const media = isVideo
      ? `<video src="/images/${f.name}" muted playsinline preload="metadata"></video>`
      : `<img src="/images/${f.name}" alt="${f.name}">`;
    return `
    <div class="card" draggable="true" data-name="${f.name}">
      <div class="thumb">
        ${media}
      </div>
      <div class="meta">
        <div class="name">${f.name}</div>
        <div class="size">${Math.round(f.size / 1024)} KB</div>
      </div>
      <button class="danger" data-file="${f.name}">Delete</button>
    </div>
  `;
  }).join('');
  res.send(`
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Admin Dashboard</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap');
          :root {
            --bg:#f4efe8;
            --ink:#0f1318;
            --muted:#5f6470;
            --card:#ffffff;
            --accent:#0f766e;
            --accent-2:#f59e0b;
            --danger:#e23d3d;
            --shadow:0 12px 30px rgba(18, 22, 30, 0.12);
          }
          * { box-sizing:border-box; }
          body {
            margin:0;
            font-family: "Space Grotesk", sans-serif;
            color:var(--ink);
            background:
              radial-gradient(1200px 600px at 20% -10%, #f7e4cf 0%, transparent 60%),
              radial-gradient(900px 500px at 90% 10%, #d9f1ec 0%, transparent 55%),
              var(--bg);
          }
          .wrap { max-width:1200px; margin:0 auto; padding:28px 22px 40px; }
          header { display:flex; gap:16px; align-items:center; justify-content:space-between; }
          .title { display:flex; flex-direction:column; gap:6px; }
          h1 { margin:0; font-size:26px; letter-spacing:-0.5px; }
          .subtitle { color:var(--muted); font-size:14px; }
          .top-actions { display:flex; gap:10px; align-items:center; flex-wrap:wrap; }
          main { margin-top:22px; }
          .panel {
            display:flex;
            gap:14px;
            align-items:center;
            flex-wrap:wrap;
            background:var(--card);
            border-radius:16px;
            padding:16px;
            box-shadow:var(--shadow);
            position:relative;
            overflow:hidden;
          }
          .panel::after {
            content:"";
            position:absolute;
            inset:-20px;
            background:radial-gradient(200px 120px at 80% -10%, rgba(245,158,11,0.15), transparent 60%);
            pointer-events:none;
          }
          .drop {
            border:2px dashed #b7bcc7;
            background:linear-gradient(135deg, #fff6ea, #ffffff);
            padding:16px 18px;
            border-radius:12px;
            min-width:220px;
          }
          .drop.drag { border-color:var(--accent); box-shadow:0 0 0 4px rgba(15,118,110,0.12); }
          .btn {
            background:var(--accent);
            color:#fff;
            border:none;
            padding:10px 14px;
            border-radius:12px;
            cursor:pointer;
            font-weight:600;
          }
          .btn.ghost {
            background:#fff;
            color:var(--ink);
            border:1px solid #d1d5db;
            text-decoration:none;
            display:inline-block;
          }
          .btn.warn { background:var(--accent-2); color:#111; }
          .hidden { position:absolute; left:-9999px; }
          .chip { background:#fff; border:1px solid #e5e7eb; padding:6px 10px; border-radius:999px; font-size:12px; color:var(--muted); }
          .grid {
            margin-top:22px;
            display:grid;
            grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
            gap:16px;
          }
          .card {
            background:var(--card);
            border-radius:16px;
            padding:12px;
            box-shadow:var(--shadow);
            transition:transform 0.2s ease, box-shadow 0.2s ease;
            opacity:0;
            transform:translateY(10px);
            animation:cardIn 0.5s ease forwards;
          }
          .card:hover { transform:translateY(-4px); box-shadow:0 18px 40px rgba(18, 22, 30, 0.16); }
          .card:nth-child(1) { animation-delay:0.02s; }
          .card:nth-child(2) { animation-delay:0.04s; }
          .card:nth-child(3) { animation-delay:0.06s; }
          .card:nth-child(4) { animation-delay:0.08s; }
          .card:nth-child(5) { animation-delay:0.10s; }
          .card:nth-child(6) { animation-delay:0.12s; }
          .card:nth-child(7) { animation-delay:0.14s; }
          .card:nth-child(8) { animation-delay:0.16s; }
          .card:nth-child(9) { animation-delay:0.18s; }
          .card:nth-child(10) { animation-delay:0.20s; }
          .thumb { border-radius:12px; overflow:hidden; background:#f1f1f1; }
          .card img,
          .card video { width:100%; height:auto; display:block; }
          .meta { margin:10px 0 6px; }
          .name { font-size:12px; color:#1f2937; word-break:break-all; }
          .size { font-size:11px; color:var(--muted); }
          .danger {
            background:var(--danger);
            color:#fff;
            border:none;
            padding:8px 12px;
            border-radius:10px;
            cursor:pointer;
          }
          .danger:hover { filter:brightness(0.95); }
          .muted { color:var(--muted); font-size:13px; }
          @keyframes cardIn {
            to { opacity:1; transform:translateY(0); }
          }
          @media (max-width: 720px) {
            header { flex-direction:column; align-items:flex-start; }
            .panel { align-items:flex-start; }
          }
        </style>
      </head>
      <body>
        <div class="wrap">
          <header>
            <div class="title">
              <h1>Furboard</h1>
              <div class="subtitle"> happy vibes.</div>
            </div>
            <div class="top-actions">
              <span class="chip">${files.length} image(s)</span>
              <a class="btn ghost" href="http://${req.hostname}:8090" target="_blank" rel="noreferrer">Preview slideshow</a>
            </div>
          </header>
          <main>
            <div class="panel">
              <form id="uploadForm" method="POST" action="/upload" enctype="multipart/form-data">
                <label class="btn warn" for="fileInput">Choose files</label>
                <input id="fileInput" class="hidden" type="file" name="images" accept="image/*,video/mp4,video/webm,video/quicktime,video/x-m4v" multiple required>
                <button class="btn" type="submit">Upload</button>
              </form>
              <div class="drop" id="dropZone">Drag & drop images here</div>
              <div class="muted">Tip: drag cards to reorder the slideshow.</div>
            </div>
            <div class="grid">
              ${cards || '<div class="muted">No images yet</div>'}
            </div>
          </main>
        </div>
        <script>
          const drop = document.getElementById('dropZone');
          const input = document.getElementById('fileInput');
          const form = document.getElementById('uploadForm');

          window.addEventListener('dragover', (e) => e.preventDefault());
          window.addEventListener('drop', (e) => e.preventDefault());

          drop.addEventListener('dragover', (e) => {
            e.preventDefault();
            drop.classList.add('drag');
          });
          drop.addEventListener('dragleave', () => drop.classList.remove('drag'));
          drop.addEventListener('drop', (e) => {
            e.preventDefault();
            drop.classList.remove('drag');
            if (!e.dataTransfer.files.length) return;
            const data = new FormData();
            for (const file of e.dataTransfer.files) data.append('images', file);
            fetch('/upload', { method: 'POST', body: data }).then(() => location.reload());
          });

          form.addEventListener('submit', (e) => {
            e.preventDefault();
            const data = new FormData(form);
            fetch('/upload', { method: 'POST', body: data }).then(() => location.reload());
          });

          document.querySelectorAll('button[data-file]').forEach(btn => {
            btn.addEventListener('click', () => {
              if (!confirm('Delete this image?')) return;
              const data = new URLSearchParams({ file: btn.dataset.file });
              fetch('/delete', { method: 'POST', body: data }).then(() => location.reload());
            });
          });

          let dragEl = null;
          document.querySelectorAll('.card').forEach(card => {
            card.addEventListener('dragstart', (e) => {
              dragEl = card;
              e.dataTransfer.effectAllowed = 'move';
              card.style.opacity = '0.5';
            });
            card.addEventListener('dragend', () => {
              dragEl = null;
              card.style.opacity = '1';
            });
            card.addEventListener('dragover', (e) => e.preventDefault());
            card.addEventListener('drop', () => {
              if (!dragEl || dragEl === card) return;
              const grid = card.parentNode;
              const nodes = Array.from(grid.children);
              const from = nodes.indexOf(dragEl);
              const to = nodes.indexOf(card);
              if (from < to) grid.insertBefore(dragEl, card.nextSibling);
              else grid.insertBefore(dragEl, card);
              const order = Array.from(grid.querySelectorAll('.card')).map(el => el.dataset.name);
              fetch('/reorder', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ order })
              });
            });
          });
        </script>
      </body>
    </html>
  `);
});

app.post('/upload', upload.array('images', 50), (req, res) => res.redirect('/'));
app.post('/delete', (req, res) => {
  const file = path.basename(req.body.file || '');
  const p = path.join(imagesDir, file);
  if (fs.existsSync(p)) fs.unlinkSync(p);
  const order = loadOrder().filter(name => name !== file);
  saveOrder(order);
  res.redirect('/');
});

app.post('/reorder', (req, res) => {
  const order = Array.isArray(req.body.order) ? req.body.order : [];
  const existing = new Set(readImages().map(f => f.name));
  const cleaned = order.filter(name => existing.has(name));
  const missing = [...existing].filter(name => !cleaned.includes(name));
  saveOrder(cleaned.concat(missing));
  res.json({ ok: true });
});

app.listen(8080, () => console.log('Admin server on :8080'));
