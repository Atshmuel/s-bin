import mqtt from "mqtt";
import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { getAllOrgsForMqtt } from "../db/service/sharedService.js";

dotenv.config({ path: path.resolve("../.env") });

await mongoose.connect(process.env.DB_URL);
console.log("Connected to DB for MQTT test");


const client = mqtt.connect("mqtt://broker.hivemq.com:1883", {
    protocolVersion: 4
});

const REGISTER_TOPIC = "bins/register";
const BINS_COUNT = 20;

// helpers
const sleep = ms => new Promise(r => setTimeout(r, ms));

const randomInt = (min, max) =>
    Math.floor(Math.random() * (max - min + 1)) + min;

const randomMac = () =>
    Array.from({ length: 6 })
        .map(() => randomInt(0, 255).toString(16).padStart(2, "0"))
        .join(":")
        .toUpperCase();

// ישראל בקירוב
const randomLocationIL = () => ([
    29 + Math.random() * 4,   // latitude
    34 + Math.random() * 2    // longitude
]);

client.on("connect", async () => {
    console.log("Connected to MQTT broker");
    const orgs = await getAllOrgsForMqtt();

    for (let i = 0; i < BINS_COUNT; i++) {
        const payload = {
            mac: randomMac(),
            orgId: orgs[Math.floor(Math.random() * orgs.length)]._id,
            location: randomLocationIL(),
            battery: randomInt(10, 100)
        };

        client.publish(
            REGISTER_TOPIC,
            JSON.stringify(payload),
            { qos: 0 },
        );

        console.log("Registered bin:", payload);
        await sleep(300);
    }

    console.log("Done registering bins");
    client.end();
});
