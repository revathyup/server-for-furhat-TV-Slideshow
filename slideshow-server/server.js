console.log("slideshow server starting");

const express = require("express");
const path = require("path");
const fs = require("fs");
const https = require("https");

const app = express();
const PORT = 8090;

const adminImagesDir = path.join(__dirname, "..", "admin-server", "images");
const orderPath = path.join(__dirname, "..", "admin-server", "order.json");
const notesPath = path.join(__dirname, "..", "admin-server", "notes.json");
const CALENDAR_ID =
  "c_f98ac9aced62fd3fef6a8a93c9312dba238fcc6ea3665b05f2333d536483379c@group.calendar.google.com";
const CALENDAR_TZ = "Europe/Berlin";
const GOOGLE_API_KEY =
  process.env.GOOGLE_API_KEY || "AIzaSyBr8IB-LqKYUa0fq9_NQ9dKwi-zLW6nI7U";

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

function getWeekRange() {
  const now = new Date();
  const day = (now.getDay() + 6) % 7; // Monday = 0
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  start.setDate(now.getDate() - day);
  const end = new Date(start);
  end.setDate(start.getDate() + 7);
  return { start, end };
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

app.get("/api/calendar", (req, res) => {
  if (!GOOGLE_API_KEY) {
    return res.status(500).json({ error: "missing Google API key" });
  }
  const { start, end } = getWeekRange();
  const params = new URLSearchParams({
    key: GOOGLE_API_KEY,
    singleEvents: "true",
    orderBy: "startTime",
    timeMin: start.toISOString(),
    timeMax: end.toISOString(),
    timeZone: CALENDAR_TZ,
  });
  const url =
    "https://www.googleapis.com/calendar/v3/calendars/" +
    encodeURIComponent(CALENDAR_ID) +
    "/events?" +
    params.toString();

  https
    .get(url, apiRes => {
      let data = "";
      apiRes.on("data", chunk => {
        data += chunk;
      });
      apiRes.on("end", () => {
        try {
          const payload = JSON.parse(data);
          res.json(payload);
        } catch (err) {
          res.status(500).json({ error: "calendar parse error" });
        }
      });
    })
    .on("error", () => {
      res.status(500).json({ error: "calendar fetch error" });
    });
});

app.listen(PORT, () => {
  console.log(`Slideshow running on http://localhost:${PORT}`);
});
