import mqtt from "mqtt";
import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { getAllOrgsForMqtt } from "../db/service/sharedService.js";

dotenv.config({ path: path.resolve("../.env") });

await mongoose.connect(process.env.DB_URL);
console.log("Connected to DB for MQTT test ");


const client = mqtt.connect("mqtt://broker.hivemq.com:1883", {
    protocolVersion: 4
});

const REGISTER_TOPIC = "bins/register";
const BINS_COUNT = 15;

// helpers
const sleep = ms => new Promise(r => setTimeout(r, ms));

const randomInt = (min, max) =>
    Math.floor(Math.random() * (max - min + 1)) + min;

const randomMac = () =>
    Array.from({ length: 6 })
        .map(() => randomInt(0, 255).toString(16).padStart(2, "0"))
        .join(":")
        .toUpperCase();

function isPointInPolygon(point, vs) {
    const x = point[0], y = point[1];
    let inside = false;

    for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
        const xi = vs[i].lat, yi = vs[i].lng;
        const xj = vs[j].lat, yj = vs[j].lng;

        const intersect = ((yi > y) !== (yj > y)) &&
            (x < (xj - xi) * (y - yi) / (yj - yi) + xi);

        if (intersect) inside = !inside;
    }

    return inside;
}

function getRandomPointInPolygon() {
    const polygon = [
        { lat: 32.7767, lng: 35.0215 },
        { lat: 32.7798, lng: 35.0285 },
        { lat: 32.7735, lng: 35.0330 },
        { lat: 32.7705, lng: 35.0240 }
    ];

    let minLat = polygon[0].lat;
    let maxLat = polygon[0].lat;
    let minLng = polygon[0].lng;
    let maxLng = polygon[0].lng;

    for (let point of polygon) {
        if (point.lat < minLat) minLat = point.lat;
        if (point.lat > maxLat) maxLat = point.lat;
        if (point.lng < minLng) minLng = point.lng;
        if (point.lng > maxLng) maxLng = point.lng;
    }

    while (true) {
        const rLat = minLat + Math.random() * (maxLat - minLat);
        const rLng = minLng + Math.random() * (maxLng - minLng);

        const randomPoint = [rLat, rLng];

        if (isPointInPolygon(randomPoint, polygon)) {
            return randomPoint;
        }
    }
}

client.on("connect", async () => {
    console.log("Connected to MQTT broker");
    const orgs = await getAllOrgsForMqtt();

    for (let i = 0; i < BINS_COUNT; i++) {
        const payload = {
            mac: randomMac(),
            orgId: orgs[Math.floor(Math.random() * orgs.length)]._id,
            location: getRandomPointInPolygon(),
            battery: 99
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
