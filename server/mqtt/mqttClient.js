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
mosquitto_pub -h broker.hivemq.com -p 1883 -t "bins/register" -m '{"mac":"EC:FA:11:9F:42:A2","orgId":"6946b2ba3d4db230724caa9d","location":[32.705433,35.591543],"battery":60}' -V mqttv311

-- Register multiple bins:
mosquitto_pub \
  -h broker.hivemq.com \
  -p 1883 \
  -i bin_register_batch \
  -t "bins/register" \
  -l \
  -V mqttv311
  
{"mac":"E1:72:9C:4A:88:01","orgId":"6946b2ba3d4db230724caa9d","location":[32.706320,35.576880],"battery":66}
{"mac":"F4:0B:31:9E:57:C2","orgId":"6946b2ba3d4db230724caa9d","location":[32.708910,35.578210],"battery":42}
{"mac":"0A:95:DC:63:1F:B8","orgId":"6946b2ba3d4db230724caa9d","location":[32.704560,35.575190],"battery":79}
{"mac":"1C:44:8E:A7:32:5D","orgId":"6946b2ba3d4db230724caa9d","location":[32.707540,35.579670],"battery":34}
{"mac":"2F:B1:6A:90:EC:73","orgId":"6946b2ba3d4db230724caa9d","location":[32.705880,35.577940],"battery":91}
{"mac":"35:9A:F4:28:6D:C0","orgId":"6946b2ba3d4db230724caa9d","location":[32.709150,35.576320],"battery":58}
{"mac":"46:DE:02:B9:71:AF","orgId":"6946b2ba3d4db230724caa9d","location":[32.704980,35.578760],"battery":23}
{"mac":"5B:18:C7:ED:40:96","orgId":"6946b2ba3d4db230724caa9d","location":[32.706750,35.575420],"battery":85}
{"mac":"6C:FA:53:10:8B:2E","orgId":"6946b2ba3d4db230724caa9d","location":[32.708360,35.579120],"battery":49}
{"mac":"7E:03:AD:94:65:F1","orgId":"6946b2ba3d4db230724caa9d","location":[32.705210,35.576010],"battery":71}


-- log from device:
mosquitto_pub -h broker.hivemq.com -p 1883 -t "bins/EC:FA:11:9F:42:A2/update/log" -m '{"location":[32.705433,35.591543],"health":"warning","level":21,"battery":87,"deviceKey":"602818730e9290ac667b6d8ea04abeea48f039115e7e58fe7ec5ea639fb7ef48"}' -V mqttv311 

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