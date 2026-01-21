const app = document.getElementById("app");
const clock = document.getElementById("clock");
const notesEl = document.getElementById("notes");

const img = document.createElement("img");
img.alt = "Slideshow image";
const video = document.createElement("video");
video.muted = true;
video.playsInline = true;
video.preload = "auto";
app.appendChild(img);
app.appendChild(video);

let images = [];
let queue = [];
let advanceTimer = null;
let lastMode = "image";

function updateClock() {
  if (!clock) return;
  const now = new Date();
  clock.textContent = now.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function shuffle(list) {
  const arr = [...list];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function rebuildQueue() {
  queue = shuffle(images);
}

function isVideo(name) {
  return /\.(mp4|webm|mov|m4v)$/i.test(name);
}

function scheduleNext(ms) {
  if (advanceTimer) clearTimeout(advanceTimer);
  advanceTimer = setTimeout(showNextImage, ms);
}

function renderNotes(notes) {
  if (!notesEl) return;
  notesEl.innerHTML = "";
  if (!Array.isArray(notes) || notes.length === 0) {
    const empty = document.createElement("div");
    empty.className = "notes-empty";
    empty.textContent = "No notes yet";
    notesEl.appendChild(empty);
    return;
  }

  notes.forEach(note => {
    const item = document.createElement("div");
    item.className = "note-item";

    const title = document.createElement("div");
    title.className = "note-title";
    title.textContent = note.title || "Untitled";

    const body = document.createElement("div");
    body.className = "note-body";
    body.textContent = note.body || "";

    item.appendChild(title);
    item.appendChild(body);
    notesEl.appendChild(item);
  });
}

async function fetchNotes() {
  if (!notesEl) return;
  try {
    const response = await fetch("/api/notes", { cache: "no-store" });
    const notes = await response.json();
    renderNotes(notes);
  } catch (err) {
    renderNotes([]);
  }
}

async function fetchImages() {
  const response = await fetch("/api/images", { cache: "no-store" });
  const newImages = await response.json();

  const oldKey = [...images].sort().join("|");
  const newKey = [...newImages].sort().join("|");
  const changed = oldKey !== newKey;

  images = newImages;

  if (changed) {
    rebuildQueue();
  }

  if (!img.src && images.length > 0) {
    showNextImage();
  }
}

function showNextImage() {
  if (advanceTimer) clearTimeout(advanceTimer);
  if (images.length === 0) return;

  if (queue.length === 0) {
    rebuildQueue();
  }

  const next = queue.shift();
  if (isVideo(next)) {
    showVideo(next);
  } else {
    showImage(next);
  }
}

function showImage(name) {
  video.pause();
  video.removeAttribute("src");
  video.load();
  video.style.display = "none";
  img.style.display = "block";
  img.src = "/images/" + name;
  lastMode = "image";
  scheduleNext(10000);
}

function showVideo(name) {
  img.style.display = "none";
  video.style.display = "block";
  video.src = "/images/" + name;
  video.currentTime = 0;
  video.play().catch(() => {});
  lastMode = "video";
}

video.addEventListener("loadedmetadata", () => {
  if (lastMode !== "video") return;
  if (Number.isFinite(video.duration) && video.duration > 0) {
    // Let the video end naturally; duration is informative only.
    return;
  }
});

video.addEventListener("ended", () => {
  showNextImage();
});

video.addEventListener("error", () => {
  showNextImage();
});

(async function start() {
  await fetchImages();
  showNextImage();
  setInterval(fetchImages, 60_000);
  updateClock();
  setInterval(updateClock, 1000);
  fetchNotes();
  setInterval(fetchNotes, 30_000);
})();
