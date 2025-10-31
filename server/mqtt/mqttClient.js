import mqtt from "mqtt";
import { handleMqttMessage } from "./mqttHandlers.js";
import { BIN_REGISTER_TOPIC, BIN_UPDATE_TOPIC } from "./mqttTopics.js";

export const mqttClient = mqtt.connect("wss://broker.hivemq.com:8884/mqtt", {
    clientId: "sbin_server_" + Math.random().toString(16).slice(2),
    connectTimeout: 5000,
    reconnectPeriod: 1000,
    protocolVersion: 4,

});

//test with mosquitto to create bin registration message
//  mosquitto_pub -h broker.hivemq.com -p 1883 -t "bins/register" -m '{"mac":"EC:FA:11:9F:42:A2","userId":"68c5841c822b68f8c6fc4224","location":[32.123,34.232]}' -V mqttv311



export function initMqtt() {
    mqttClient.on("connect", () => {
        console.log("Connected to MQTT broker");
        mqttClient.subscribe(BIN_UPDATE_TOPIC, { qos: 1 }, (err) => {
            if (err) console.error("Subscribe error:", err);
            else console.log("Subscribed to ", BIN_UPDATE_TOPIC);
        });
        mqttClient.subscribe(BIN_REGISTER_TOPIC, { qos: 1 }, (err) => {
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

}