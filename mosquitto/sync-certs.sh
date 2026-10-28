#!/bin/sh
# Copies the site's Let's Encrypt certificate for the broker, readable by its
# user (Mosquitto does not run as root; the original key is root's only), and
# restarts the broker so it loads it. Run once by setup.sh and after every
# renewal (certbot's deploy hook).
set -e
cd "$(dirname "$0")/.."
LIVE=certbot-etc/live/s-bins.duckdns.org-0001
mkdir -p mosquitto/certs
cp -L "$LIVE/fullchain.pem" "$LIVE/privkey.pem" mosquitto/certs/
chown 1883:1883 mosquitto/certs/*.pem
chmod 600 mosquitto/certs/privkey.pem
chmod 644 mosquitto/certs/fullchain.pem
if docker ps --format '{{.Names}}' | grep -q '^sbin-mosquitto$'; then
    docker restart sbin-mosquitto
fi
