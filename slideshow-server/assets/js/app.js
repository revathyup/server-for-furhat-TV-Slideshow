const app = document.getElementById("app");

const img = document.createElement("img");
img.alt = "Slideshow image";
app.appendChild(img);

let images = [];
let lastIndex = -1;

async function fetchImages() {
  const response = await fetch("/api/images", { cache: "no-store" });
  const newImages = await response.json();

  const oldKey = [...images].sort().join("|");
  const newKey = [...newImages].sort().join("|");

  const changed = oldKey !== newKey;
  images = newImages;

  if (!img.src && images.length > 0) {
    showRandomImage();
  }

  if (changed) {
    lastIndex = -1;
  }
}

function showRandomImage() {
  if (images.length === 0) return;

  if (images.length === 1) {
    img.src = "/images/" + images[0];
    return;
  }

  let randomIndex = Math.floor(Math.random() * images.length);
  while (randomIndex === lastIndex) {
    randomIndex = Math.floor(Math.random() * images.length);
  }

  lastIndex = randomIndex;
  img.src = "/images/" + images[randomIndex];
}

(async function start() {
  await fetchImages();
  showRandomImage();

  setInterval(showRandomImage, 5000);

  setInterval(fetchImages, 60_000);
})();
