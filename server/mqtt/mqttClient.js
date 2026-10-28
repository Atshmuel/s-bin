import mqtt from "mqtt";
import { handleMqttMessage } from "./mqttHandlers.js";
import { BIN_REGISTER_TOPIC, BIN_UPDATE_TOPIC } from "./mqttTopics.js";
import { MQTT_CONNECT_TIMEOUT_MS, MQTT_PUBLIC_BROKER_URL, MQTT_RECONNECT_MS } from '../utils/constants.js'

// The server's MQTT: the public broker (devices before 2i) and, when .env
// names it, the private one. Devices send to one of them; the server listens
// on both and sends every reply to both, so a device gets it wherever it is.

const options = {
    protocolVersion: 4,
    connectTimeout: MQTT_CONNECT_TIMEOUT_MS,
    reconnectPeriod: MQTT_RECONNECT_MS,
};
const clientId = () => "sbin_server_" + Math.random().toString(16).slice(2);

// Connects as this module loads, so a reply never waits for it; it starts
// listening in initMqtt().
const publicClient = mqtt.connect(MQTT_PUBLIC_BROKER_URL, { ...options, clientId: clientId() });
const clients = [publicClient];
let privateBroker = null;

// What the handlers publish with: to every broker (the callback, if any,
// once, with the first error).
export const mqttClient = {
    publish(topic, message, publishOptions = {}, callback) {
        let pending = clients.length;
        let firstError = null;
        for (const client of clients) {
            client.publish(topic, message, publishOptions, error => {
                firstError ??= error ?? null;
                if (--pending === 0 && callback) callback(firstError);
            });
        }
    },
};

// The private broker's client, or null when it is not set up.
export function privateBrokerClient() {
    return privateBroker;
}

// Subscribes on a broker's every (re)connect: the client may already have
// connected before this runs (it connects while the database does).
function listen(client, name, onConnect) {
    const subscribe = () => {
        console.log(`Connected to the ${name} MQTT broker`);
        for (const topic of [BIN_UPDATE_TOPIC, BIN_REGISTER_TOPIC]) {
            client.subscribe(topic, { qos: 1 }, (err) => {
                if (err) console.error(`Subscribe error on the ${name} broker:`, err);
                else console.log(`Subscribed to ${topic} on the ${name} broker`);
            });
        }
        onConnect?.();
    };
    client.on("connect", subscribe);
    if (client.connected) subscribe();
    client.on("offline", () => console.warn(`The ${name} MQTT broker is unreachable; reconnecting.`));
    client.on("error", (err) => console.error(`MQTT error on the ${name} broker:`, err?.message ?? err));
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

// Starts listening (after .env is loaded); `onPrivateConnect` runs on every
// connect to the private broker (the device accounts are synced then).
export function initMqtt({ onPrivateConnect } = {}) {
    listen(publicClient, "public");
    const { MQTT_BROKER_URL: url, MQTT_BROKER_USERNAME: username, MQTT_BROKER_PASSWORD: password } = process.env;
    if (url && username && password) {
        privateBroker = mqtt.connect(url, { ...options, clientId: clientId(), username, password });
        clients.push(privateBroker);
        listen(privateBroker, "private", onPrivateConnect);
    } else {
        console.log("No private MQTT broker in .env; only the public one is used.");
    }
}
