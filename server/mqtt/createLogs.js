import mqtt from "mqtt";
import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { getAllBinsForMqtt } from "../db/service/sharedService.js";

dotenv.config({ path: path.resolve("../.env") });

await mongoose.connect(process.env.DB_URL);
console.log("Connected to DB for MQTT test");

const client = mqtt.connect("mqtt://broker.hivemq.com:1883", {
    protocolVersion: 4
});

const randomInt = (min, max) =>
    Math.floor(Math.random() * (max - min + 1)) + min;

const randomHealth = (level) => {
    if (level < 60) return "good";
    if (level < 75 && level >= 60) return "warning";
    return "critical";
};

const sleep = ms => new Promise(r => setTimeout(r, ms));

client.on("connect", async () => {
    const bins = await getAllBinsForMqtt();

    if (!bins.length) {
        console.error("No bins found in DB");
        process.exit(1);
    }

    console.log("start");

    for (let bin of bins) {
        for (let i = 0; i < 2; i++) {
            const level = randomInt(0, 100);
            const payload = {
                location: bin.location.coordinates,
                health: randomHealth(level),
                level: level,
                battery: 100 - i * 2,
                deviceKey: bin.deviceKey
            };

            const topic = `bins/${bin.macAddress}/update/log`;

            client.publish(topic, JSON.stringify(payload));
            console.log(`Published to ${topic}`, payload);

            await sleep(200);
        }
    }

    client.end();
    mongoose.disconnect();
});
