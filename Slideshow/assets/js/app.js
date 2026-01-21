const app = document.getElementById("app");

// Skapa <img> en gång
const img = document.createElement("img");
img.alt = "Slideshow image";
app.appendChild(img);

let allImages = [];   // Senast hämtade listan från servern
let deck = [];        // Shuffle:ad ordning som vi går igenom
let deckIndex = 0;    // Vilket "kort" vi är på just nu

function shuffle(array) {
  // Fisher–Yates shuffle (standard och korrekt)
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

async function fetchImages() {
  const response = await fetch("/api/images", { cache: "no-store" });
  const images = await response.json();
  return images;
}

async function rebuildDeck() {
  allImages = await fetchImages();

  // Bygg en ny kortlek (kopiera listan och shuffle:a)
  deck = shuffle([...allImages]);
  deckIndex = 0;
}

function showNextFromDeck() {
  if (deck.length === 0) return;

  const filename = deck[deckIndex];
  img.src = "/assets/images/" + filename;

  deckIndex++;

  // Om vi nått slutet av varvet, bygg ny kortlek (med ev. nya/borttagna bilder)
  if (deckIndex >= deck.length) {
    // OBS: vi rebuild:ar efter att sista bilden satts,
    // så nästa tick får den nya listan.
    rebuildDeck().catch((err) => {
      console.error("Kunde inte uppdatera bildlistan:", err);
    });
  }
}

img.addEventListener("error", () => {
  console.warn("Bild kunde inte laddas, hoppar vidare:", img.src);

  // Försök visa nästa bild
  if (deck.length > 0) {
    showNextFromDeck();
  }
});
