import { randomUUID } from "node:crypto";
import { privateBrokerClient } from "./mqttClient.js";
import { binModel } from "../db/models/models.js";
import { BROKER_ACCOUNT_BATCH, BROKER_CONTROL_TIMEOUT_MS, BROKER_CONTROL_TOPIC, DEVICE_BROKER_ROLE } from "../utils/constants.js";

// The devices' accounts on the private broker (Mosquitto's dynamic security,
// driven over its $CONTROL topic): the MAC as the username, the device key as
// the password, the device role. Without a private broker nothing happens.

const MAC_ADDRESS_PATTERN = /^([0-9A-F]{2}:){5}[0-9A-F]{2}$/i;
const RESPONSE_TOPIC = `${BROKER_CONTROL_TOPIC}/response`;

// Sends dynamic-security commands and waits for their answers (matched by
// correlation data); resolves to the responses, in order.
function sendCommands(client, commands) {
    const tagged = commands.map(command => ({ ...command, correlationData: randomUUID() }));
    const wanted = new Set(tagged.map(command => command.correlationData));
    return new Promise((resolve, reject) => {
        const answers = new Map();
        const timer = setTimeout(() => {
            client.removeListener("message", onMessage);
            reject(new Error("The private broker did not answer its account commands."));
        }, BROKER_CONTROL_TIMEOUT_MS);
        function onMessage(topic, message) {
            if (topic !== RESPONSE_TOPIC) return;
            let responses = [];
            try {
                responses = JSON.parse(message.toString()).responses ?? [];
            } catch {
                return;
            }
            for (const response of responses) {
                if (wanted.has(response.correlationData)) answers.set(response.correlationData, response);
            }
            if (answers.size === wanted.size) {
                clearTimeout(timer);
                client.removeListener("message", onMessage);
                resolve(tagged.map(command => answers.get(command.correlationData)));
            }
        }
        client.on("message", onMessage);
        client.subscribe(RESPONSE_TOPIC, { qos: 1 }, error => {
            if (error) {
                clearTimeout(timer);
                client.removeListener("message", onMessage);
                reject(error);
                return;
            }
            client.publish(BROKER_CONTROL_TOPIC, JSON.stringify({ commands: tagged }), { qos: 1 });
        });
    });
}

// In batches; a command's own error (an account that exists) is not a failure.
async function runCommands(commands) {
    const client = privateBrokerClient();
    if (!client || commands.length === 0) return [];
    const responses = [];
    for (let i = 0; i < commands.length; i += BROKER_ACCOUNT_BATCH) {
        responses.push(...await sendCommands(client, commands.slice(i, i + BROKER_ACCOUNT_BATCH)));
    }
    return responses;
}

const createCommand = (mac, deviceKey) => ({
    command: "createClient", username: mac, password: deviceKey, roles: [{ rolename: DEVICE_BROKER_ROLE }],
});

// A newly registered device's account; a failure is logged (the next sync repairs it).
export async function createDeviceAccount(mac, deviceKey) {
    try {
        await runCommands([createCommand(mac, deviceKey)]);
    } catch (error) {
        console.error(`Could not create the broker account of ${mac}:`, error?.message ?? error);
    }
}

// Deleted devices' accounts; a failure is logged (the next sync repairs it).
export async function deleteDeviceAccounts(macs) {
    try {
        await runCommands(macs.filter(Boolean).map(mac => ({ command: "deleteClient", username: mac })));
    } catch (error) {
        console.error("Could not delete broker accounts:", error?.message ?? error);
    }
}

// Every device has an account and no account outlives its device: run on
// each connect to the private broker, so it also creates the accounts of
// devices from before it and repairs a missed create or delete. Only
// accounts named like a MAC are touched (the server's own is not).
export async function syncDeviceAccounts() {
    try {
        const [listing] = await runCommands([{ command: "listClients", verbose: false, count: -1, offset: 0 }]);
        if (!listing) return;
        const existing = new Set((listing.data?.clients ?? []).filter(name => MAC_ADDRESS_PATTERN.test(name)));
        const devices = await binModel.find({ deviceKey: { $exists: true } }, { macAddress: 1, deviceKey: 1 }).lean();
        const known = new Set(devices.map(device => device.macAddress));
        const toCreate = devices.filter(device => device.macAddress && !existing.has(device.macAddress));
        const toDelete = [...existing].filter(mac => !known.has(mac));
        await runCommands([
            ...toCreate.map(device => createCommand(device.macAddress, device.deviceKey)),
            ...toDelete.map(mac => ({ command: "deleteClient", username: mac })),
        ]);
        if (toCreate.length || toDelete.length) {
            console.log(`[Broker] Device accounts synced: ${toCreate.length} created, ${toDelete.length} deleted.`);
        }
    } catch (error) {
        console.error("[Broker] Could not sync the device accounts:", error?.message ?? error);
    }
}
