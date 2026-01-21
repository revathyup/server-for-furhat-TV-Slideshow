console.log("slideshow server starting");

const express = require("express");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = 8090;

const adminImagesDir = path.join(__dirname, "..", "admin-server", "images");
const orderPath = path.join(__dirname, "..", "admin-server", "order.json");
const notesPath = path.join(__dirname, "..", "admin-server", "notes.json");

app.use(express.static(path.join(__dirname)));
app.use("/images", express.static(adminImagesDir));

function readImages() {
  if (!fs.existsSync(adminImagesDir)) return [];
  const files = fs.readdirSync(adminImagesDir);
  return files.filter(file => /\.(jpg|jpeg|png|webp|gif|mp4|webm|mov|m4v)$/i.test(file));
}

function readOrder() {
  try {
    const raw = fs.readFileSync(orderPath, "utf8");
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch (err) {
    return [];
  }
}

function getOrderedList() {
  const files = readImages();
  const existing = new Set(files);
  const order = readOrder().filter(name => existing.has(name));
  const missing = files.filter(name => !order.includes(name));
  return order.concat(missing);
}

function readNotes() {
  try {
    const raw = fs.readFileSync(notesPath, "utf8");
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch (err) {
    return [];
  }
}

app.get("/api/images", (req, res) => {
  if (!fs.existsSync(adminImagesDir)) {
    return res.status(500).json({ error: "admin images folder not found" });
  }
  res.json(getOrderedList());
});

app.get("/api/notes", (req, res) => {
  res.json(readNotes());
});

app.listen(PORT, () => {
  console.log(`Slideshow running on http://localhost:${PORT}`);
});
