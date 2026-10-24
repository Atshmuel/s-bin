#!/bin/sh
# Prepares OSRM's road data for the car profile: Geofabrik's Israel and
# Palestine extract, processed for the MLD algorithm that docker-compose's
# osrm service runs. Run on the VM from ~/s-bin:
#
#   sh routing/prepare-osrm.sh && docker compose up -d osrm vroom
#
# It needs about 2-3 GB of memory and 15-30 minutes on one core. Run it again
# to refresh the map (monthly is plenty), then: docker compose restart osrm.
set -e
IMAGE=ghcr.io/project-osrm/osrm-backend:v26.4.0 # the same tag as in docker-compose.yml
EXTRACT=israel-and-palestine-latest
cd "$(dirname "$0")/osrm"

curl -fL -o "$EXTRACT.osm.pbf" "https://download.geofabrik.de/asia/$EXTRACT.osm.pbf"
docker run --rm -v "$PWD:/data" "$IMAGE" osrm-extract -p /opt/car.lua "/data/$EXTRACT.osm.pbf"
docker run --rm -v "$PWD:/data" "$IMAGE" osrm-partition "/data/$EXTRACT.osrm"
docker run --rm -v "$PWD:/data" "$IMAGE" osrm-customize "/data/$EXTRACT.osrm"
echo "OSRM data ready in $(pwd)"
