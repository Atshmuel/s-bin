import mqtt from "mqtt";
import { handleMqttMessage } from "./mqttHandlers.js";
import { BIN_UPDATE_TOPIC } from "./mqttTopics.js";
import { MQTT_CONNECT_TIMEOUT_MS, MQTT_RECONNECT_MS } from '../utils/constants.js'

// The server's MQTT: the private broker named in .env (MQTT_BROKER_URL,
// MQTT_BROKER_USERNAME, MQTT_BROKER_PASSWORD; the server's own account),
// where every device logs in with its MAC and device key. Devices register
// over HTTPS, so the server only listens for their reports here.

const options = {
    protocolVersion: 4,
    connectTimeout: MQTT_CONNECT_TIMEOUT_MS,
    reconnectPeriod: MQTT_RECONNECT_MS,
};
let privateBroker = null;

// What the handlers publish with (the callback, if any, gets the error).
// Without a broker, which only a server without one set up has, nothing is sent.
export const mqttClient = {
    publish(topic, message, publishOptions = {}, callback) {
        if (!privateBroker) {
            callback?.(new Error("No MQTT broker is set up."));
            return;
        }
        privateBroker.publish(topic, message, publishOptions, callback);
    },
};

// The broker's client, or null when it is not set up.
export function privateBrokerClient() {
    return privateBroker;
}

// Subscribes on every (re)connect.
function listen(client, onConnect) {
    client.on("connect", () => {
        console.log("Connected to the MQTT broker");
        client.subscribe(BIN_UPDATE_TOPIC, { qos: 1 }, (err) => {
            if (err) console.error("MQTT subscribe error:", err);
            else console.log(`Subscribed to ${BIN_UPDATE_TOPIC}`);
        });
        onConnect?.();
    });
    client.on("offline", () => console.warn("The MQTT broker is unreachable; reconnecting."));
    client.on("error", (err) => console.error("MQTT error:", err?.message ?? err));
    client.on("message", async (topic, message) => {
        // The dynamic-security replies are read where they are awaited.
        if (topic.startsWith("$CONTROL/")) return;
        try {
            await handleMqttMessage(topic, JSON.parse(message.toString()));
        } catch (err) {
            console.error("Invalid message format:", err);
        }
    });
}

// Connects (after .env is loaded); `onConnect` runs on every connect (the
// device accounts are synced then).
export function initMqtt({ onConnect } = {}) {
    const { MQTT_BROKER_URL: url, MQTT_BROKER_USERNAME: username, MQTT_BROKER_PASSWORD: password } = process.env;
    if (!url || !username || !password) {
        console.error("No MQTT broker in .env (MQTT_BROKER_URL, MQTT_BROKER_USERNAME, MQTT_BROKER_PASSWORD): devices cannot report.");
        return;
    }
    privateBroker = mqtt.connect(url, {
        ...options,
        clientId: "sbin_server_" + Math.random().toString(16).slice(2),
        username,
        password,
    });
    listen(privateBroker, onConnect);
}
