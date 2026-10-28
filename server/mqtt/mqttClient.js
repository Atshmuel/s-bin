import mqtt from "mqtt";
import { handleMqttMessage } from "./mqttHandlers.js";
import { BIN_REGISTER_TOPIC, BIN_UPDATE_TOPIC } from "./mqttTopics.js";
import { MQTT_BROKER_URL, MQTT_CONNECT_TIMEOUT_MS, MQTT_RECONNECT_MS } from '../utils/constants.js'

export const mqttClient = mqtt.connect(MQTT_BROKER_URL, {
    clientId: "sbin_server_" + Math.random().toString(16).slice(2),
    protocolVersion: 4,
    connectTimeout: MQTT_CONNECT_TIMEOUT_MS,
    reconnectPeriod: MQTT_RECONNECT_MS,
});

// The client connects as soon as this module loads, while the server is still
// connecting to the database; initMqtt() runs after that. So the first
// "connect" may already have happened: subscribe now if it has, and on every
// (re)connect after.
function subscribeToDevices() {
    console.log("Connected to MQTT broker");
    mqttClient.subscribe(BIN_UPDATE_TOPIC, { qos: 1 }, (err) => {
        if (err) console.error("Subscribe error:", err);
        else console.log("Subscribed to ", BIN_UPDATE_TOPIC);
    });
    mqttClient.subscribe(BIN_REGISTER_TOPIC, { qos: 1 }, (err) => {
        if (err) console.error("Subscribe error:", err);
        else console.log("Subscribed to ", BIN_REGISTER_TOPIC);
    });
}

export function initMqtt() {
    mqttClient.on("connect", subscribeToDevices);
    if (mqttClient.connected) subscribeToDevices();
    mqttClient.on("offline", () => console.warn("MQTT broker unreachable; reconnecting."));
    mqttClient.on("error", (err) => console.error("MQTT error:", err?.message ?? err));

    mqttClient.on("message", async (topic, message) => {
        try {
            const payload = JSON.parse(message.toString());
            await handleMqttMessage(topic, payload);
        } catch (err) {
            console.error("Invalid message format:", err);
        }
    });

}
