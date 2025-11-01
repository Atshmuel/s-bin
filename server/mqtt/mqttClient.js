import mqtt from "mqtt";
import { handleMqttMessage } from "./mqttHandlers.js";
import { BIN_REGISTER_TOPIC, BIN_UPDATE_TOPIC } from "./mqttTopics.js";

export const mqttClient = mqtt.connect("mqtt://broker.hivemq.com:1883", {
    clientId: "sbin_server_" + Math.random().toString(16).slice(2),
    protocolVersion: 4,
    connectTimeout: 5000,
    reconnectPeriod: 1000,
});

/*
-- test with mosquitto to create bin registration message:
mosquitto_pub -h broker.hivemq.com -p 1883 -t "bins/register" -m '{"mac":"EC:FA:11:9F:42:A2","userId":"68c5841c822b68f8c6fc4224","location":[32.123,34.232],"battery":60}' -V mqttv311

-- log from device:
mosquitto_pub -h broker.hivemq.com -p 1883 -t "bins/EC:FA:11:9F:42:A2/update/log" -m '{"location":[32.123,34.232],"health":"good","level":0,"battery":57,"deviceKey":"602818730e9290ac667b6d8ea04abeea48f039115e7e58fe7ec5ea639fb7ef48"}' -V mqttv311 

-- command for bin to listen for events
 - subscribe to specific bin commands
mosquitto_sub -h broker.hivemq.com -p 1883 -t "bins/command/EC:FA:11:9F:42:A2" 
 - subscribe to all acks
mosquitto_sub -h broker.hivemq.com -p 1883 -t "bins/ack" 
 - subscribe to specific bin acks
 - this topic will get the deviceKey after registration and need to save it in eeprom
mosquitto_sub -h broker.hivemq.com -p 1883 -t "bins/ack/EC:FA:11:9F:42:A2" 
*/




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