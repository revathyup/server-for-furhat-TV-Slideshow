tv-remote
New: Green line departures (S:t Eriksplan)
The slideshow now shows real-time departures for the Stockholm Metro Green line (17/18/19) at S:t Eriksplan.

Docker (auto-start)
If you want both services to come up automatically with Docker once the host boots, use:

docker compose up --build -d
The compose file already sets restart: unless-stopped, so containers will restart with the Docker daemon.

Backend setup
Set your Trafiklab API key (do not expose it to the frontend):

export TRAFIKLAB_API_KEY=YOUR_KEY_HERE
# Optional: override stop/area id if needed (default 9204)
export ST_ERIKSPLAN_AREA_ID=9204
Then start the servers:

cd admin-server
npm install
node server.js

cd ../slideshow-server
npm install
npm start
Usage
Open http://localhost:9080 to manage uploads.
Open http://localhost:9090 to view the slideshow with the departures widget.
Data attribution: Trafiklab.se.
