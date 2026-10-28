#!/bin/sh
# One-time setup of the private broker on the VM: sudo sh mosquitto/setup.sh
# (from ~/s-bin). The certificate; the dynamic-security file with the
# server's account, its password made here and written into server/.env
# (MQTT_BROKER_URL / USERNAME / PASSWORD, replacing any older ones; a backup of
# .env is kept; the password is never printed); the broker; the device role.
# The server creates the devices' accounts itself when it connects. Run again,
# it keeps the accounts and only re-applies the roles.
set -e
cd "$(dirname "$0")/.."
SERVER_USER=sbin-server
IMAGE=eclipse-mosquitto:2.0.21
ENV_FILE=server/.env

sh mosquitto/sync-certs.sh
mkdir -p mosquitto/data
if [ ! -f mosquitto/data/dynamic-security.json ]; then
    PASSWORD=$(openssl rand -hex 24)
    docker run --rm -v "$PWD/mosquitto/data:/mosquitto/data" "$IMAGE" \
        mosquitto_ctrl dynsec init /mosquitto/data/dynamic-security.json "$SERVER_USER" "$PASSWORD" > /dev/null
    cp "$ENV_FILE" "$ENV_FILE.bak-$(date +%F)-broker"
    sed -i '/^MQTT_BROKER_URL=/d;/^MQTT_BROKER_USERNAME=/d;/^MQTT_BROKER_PASSWORD=/d' "$ENV_FILE"
    printf 'MQTT_BROKER_URL=mqtt://sbin-mosquitto:1883\nMQTT_BROKER_USERNAME=%s\nMQTT_BROKER_PASSWORD=%s\n' \
        "$SERVER_USER" "$PASSWORD" >> "$ENV_FILE"
    echo "The server's broker account is in $ENV_FILE (backup: $ENV_FILE.bak-$(date +%F)-broker)."
else
    PASSWORD=$(grep '^MQTT_BROKER_PASSWORD=' "$ENV_FILE" | cut -d= -f2-)
fi
chown -R 1883:1883 mosquitto/data
chmod 700 mosquitto/data
docker compose --profile broker up -d mosquitto
sleep 3

ctrl() {
    docker exec sbin-mosquitto mosquitto_ctrl -h localhost -p 1883 -u "$SERVER_USER" -P "$PASSWORD" dynsec "$@" > /dev/null 2>&1 || true
}
# The server (the init's admin role): every topic, besides the $CONTROL ones it has.
ctrl addRoleACL admin publishClientSend '#' allow 1
ctrl addRoleACL admin subscribePattern '#' allow 1
# A device: its MAC is its username (%u); it sends its reports and reads its replies and commands.
ctrl createRole device
ctrl addRoleACL device publishClientSend 'bins/%u/update/#' allow 5
ctrl addRoleACL device subscribePattern 'bins/ack/%u' allow 5
ctrl addRoleACL device subscribePattern 'bins/command/%u' allow 5
docker exec sbin-mosquitto mosquitto_ctrl -h localhost -p 1883 -u "$SERVER_USER" -P "$PASSWORD" dynsec getRole device
