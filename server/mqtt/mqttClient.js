import mqtt from "mqtt";
import { handleMqttMessage } from "./mqttHandlers.js";
import { BIN_REGISTER_TOPIC, BIN_UPDATE_TOPIC } from "./mqttTopics.js";

export const mqttClient = mqtt.connect("wss://broker.hivemq.com:8884/mqtt", {
    clientId: "server_" + Math.random().toString(16).slice(2),
});


export function initMqtt() {
    mqttClient.on("connect", () => {
        console.log("Connected to MQTT broker");
        mqttClient.subscribe(BIN_UPDATE_TOPIC, (err) => {
            if (err) console.error("Subscribe error:", err);
            else console.log("Subscribed to ", BIN_UPDATE_TOPIC);
        });
        mqttClient.subscribe(BIN_REGISTER_TOPIC, (err) => {
            if (err) console.error("Subscribe error:", err);
            else console.log("Subscribed to ", BIN_REGISTER_TOPIC);
        });
    });

    mqttClient.on("message", async (topic, message) => {
        try {
            const payload = JSON.parse(message.toString());
            await handleMqttMessage(topic, payload);
        } catch (err) {
            console.error("Invalid message format:", err);
        }
    });

    mqttClient.on("error", (err) => console.error("MQTT error:", err));
}