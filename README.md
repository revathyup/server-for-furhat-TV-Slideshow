Two-screen office display system built for a shared TV setup. It combines a fullscreen media slideshow with a lightweight admin dashboard so a team can upload content, rearrange the playback order, and add short notes without touching code.

The display also surfaces live context for the office: clock, weather, upcoming Google Calendar events, and real-time Stockholm metro departures for the Green line at S:t Eriksplan.

## What it does

- Plays uploaded images and videos in a fullscreen slideshow.
- Lets admins upload, delete, and reorder media from a browser.
- Supports short text notes that appear on the TV overlay.
- Shows current weather and a short forecast for Stockholm.
- Pulls upcoming events from a Google Calendar using a service account.
- Shows real-time Green line departures from Trafiklab.
- Runs as two small Node.js services or through Docker Compose.

## Architecture

The project is split into two services:

- `admin-server` on `http://localhost:9080`
  Handles uploads, deletion, drag-and-drop ordering, notes, and the admin dashboard UI.

- `slideshow-server` on `http://localhost:9090`
  Renders the TV view and serves calendar, notes, image order, weather, and transit data to the display.

Both services share the same media and JSON state files:

- `admin-server/images/` stores uploaded media
- `admin-server/order.json` stores slideshow order
- `admin-server/notes.json` stores note cards

## Project structure

```text
TV-Slideshow---part-2-main/
|-- admin-server/
|   |-- images/
|   |-- notes.json
|   |-- order.json
|   `-- server.js
|-- slideshow-server/
|   |-- assets/
|   |-- index.html
|   `-- server.js
|-- docker-compose.yml
`-- README.md
```

## Prerequisites

- Node.js 18 or newer
- npm
- Docker Desktop, if you want to use containers
- A Trafiklab API key for transit data
- A Google service account JSON file with read access to the target calendar

## Environment variables

Both servers load environment variables from either `.env.local` or `.env` in the project root.

Create one of those files and add:

```env
TRAFIKLAB_API_KEY=your_trafiklab_key
ST_ERIKSPLAN_AREA_ID=740021665
GOOGLE_SERVICE_ACCOUNT_JSON=C:\absolute\path\to\service-account.json
```

Notes:

- `TRAFIKLAB_API_KEY` is required for the departures widget.
- `ST_ERIKSPLAN_AREA_ID` defaults to `740021665` in the slideshow server and can be changed if the display should point to another stop area.
- `GOOGLE_SERVICE_ACCOUNT_JSON` should point to the Google service account file used for calendar access.

## Local development

Install dependencies:

```bash
cd admin-server
npm install

cd ../slideshow-server
npm install
```

Start the admin server:

```bash
cd admin-server
node server.js
```

Start the slideshow server in a second terminal:

```bash
cd slideshow-server
node server.js
```

Open:

- Admin dashboard: `http://localhost:9080`
- TV slideshow: `http://localhost:9090`

## Docker

To build and start both services:

```bash
docker compose up --build -d
```

To stop them:

```bash
docker compose down
```

The Compose file mounts:

- `admin-server/images`
- `admin-server/order.json`
- `admin-server/notes.json`

This means uploaded content and ordering survive container restarts.

## Daily workflow

1. Open the admin dashboard.
2. Upload images or videos.
3. Drag media cards to set the playback order.
4. Add notes or reminders for the display.
5. Open the slideshow URL on the TV browser.

The slideshow refreshes its content automatically, so new uploads, notes, and ordering changes appear without a manual redeploy.

## Supported media

The app currently supports:

- Images: `jpg`, `jpeg`, `png`, `webp`, `gif`
- Videos: `mp4`, `webm`, `mov`, `m4v`

Images display for about 10 seconds each. Videos play until they finish, then the slideshow advances automatically.

## External integrations

### Google Calendar

The slideshow fetches upcoming events from a Google Calendar using a service account and the Calendar API. The current server code expects access to a specific calendar and filters the list to events still relevant for the current week.

### Trafiklab

Transit departures are fetched from Trafiklab's realtime departures API and filtered to Green line routes `17`, `18`, and `19`.

### Open-Meteo

Weather data is pulled client-side from Open-Meteo for Stockholm.

## Data files

- `order.json` is automatically updated when media is reordered.
- `notes.json` stores note cards created in the admin UI.
- Uploaded files are renamed with a timestamp prefix to avoid filename collisions.

## Security note

Before publishing or sharing this project outside a trusted environment:

- Move API keys and service account credentials out of version control.
- Store secrets in `.env.local`, Docker secrets, or your deployment platform's secret manager.
- Review access to the Google Calendar service account and Trafiklab key.

## Ideas for next improvements

- Add authentication to the admin dashboard.
- Add per-slide display durations.
- Support multiple playlists or themed channels.
- Add better handling for very large video files.
- Add an `.env.example` file for easier onboarding.

## License

No license is currently defined in this repository. Add one before distributing the project publicly.
