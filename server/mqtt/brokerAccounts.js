import { randomUUID } from "node:crypto";
import { privateBrokerClient } from "./mqttClient.js";
import { binModel } from "../db/models/models.js";
import { BROKER_ACCOUNT_BATCH, BROKER_CONTROL_TIMEOUT_MS, BROKER_CONTROL_TOPIC, DEVICE_ROLE_PREFIX } from "../utils/constants.js";

// The devices' accounts on the private broker (Mosquitto's dynamic security,
// driven over its $CONTROL topic): the MAC as the username, the device key as
// the password, and a role of its own that reaches only its topics. Without a
// private broker nothing happens.

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

const roleName = mac => `${DEVICE_ROLE_PREFIX}${mac}`;

// A device's role: it sends its reports, and reads its replies and commands.
const createRoleCommand = mac => ({
    command: "createRole",
    rolename: roleName(mac),
    acls: [
        { acltype: "publishClientSend", topic: `bins/${mac}/update/#`, priority: 5, allow: true },
        { acltype: "subscribeLiteral", topic: `bins/ack/${mac}`, priority: 5, allow: true },
        { acltype: "subscribeLiteral", topic: `bins/command/${mac}`, priority: 5, allow: true },
    ],
});
const createClientCommand = (mac, deviceKey) => ({
    command: "createClient", username: mac, password: deviceKey, roles: [{ rolename: roleName(mac) }],
});
const deleteCommands = mac => [
    { command: "deleteClient", username: mac },
    { command: "deleteRole", rolename: roleName(mac) },
];

// A newly registered device's account; a failure is logged (the next sync repairs it).
export async function createDeviceAccount(mac, deviceKey) {
    try {
        await runCommands([createRoleCommand(mac), createClientCommand(mac, deviceKey)]);
    } catch (error) {
        console.error(`Could not create the broker account of ${mac}:`, error?.message ?? error);
    }
}

// Deleted devices' accounts and roles; a failure is logged (the next sync repairs it).
export async function deleteDeviceAccounts(macs) {
    try {
        await runCommands(macs.filter(Boolean).flatMap(deleteCommands));
    } catch (error) {
        console.error("Could not delete broker accounts:", error?.message ?? error);
    }
}

// Every device has its account and role, and none outlives its device: run
// on each connect to the private broker, so it also creates them for devices
// from before it and repairs a missed create or delete. Only accounts named
// like a MAC and roles named DEVICE_ROLE_PREFIX + MAC are touched.
export async function syncDeviceAccounts() {
    try {
        const [clientList, roleList] = await runCommands([
            { command: "listClients", verbose: false, count: -1, offset: 0 },
            { command: "listRoles", verbose: false, count: -1, offset: 0 },
        ]);
        if (!clientList || !roleList) return;
        const accounts = new Set((clientList.data?.clients ?? []).filter(name => MAC_ADDRESS_PATTERN.test(name)));
        const roles = new Set((roleList.data?.roles ?? [])
            .filter(name => name.startsWith(DEVICE_ROLE_PREFIX) && MAC_ADDRESS_PATTERN.test(name.slice(DEVICE_ROLE_PREFIX.length)))
            .map(name => name.slice(DEVICE_ROLE_PREFIX.length)));
        const devices = (await binModel.find({ deviceKey: { $exists: true } }, { macAddress: 1, deviceKey: 1 }).lean())
            .filter(device => MAC_ADDRESS_PATTERN.test(device.macAddress ?? ""));
        const known = new Set(devices.map(device => device.macAddress));
        const commands = [];
        for (const device of devices) {
            const mac = device.macAddress;
            if (!roles.has(mac)) commands.push(createRoleCommand(mac));
            if (!accounts.has(mac)) commands.push(createClientCommand(mac, device.deviceKey));
            else if (!roles.has(mac)) commands.push({ command: "addClientRole", username: mac, rolename: roleName(mac) });
        }
        const gone = [...new Set([...accounts, ...roles])].filter(mac => !known.has(mac));
        for (const mac of gone) {
            if (accounts.has(mac)) commands.push({ command: "deleteClient", username: mac });
            if (roles.has(mac)) commands.push({ command: "deleteRole", rolename: roleName(mac) });
        }
        await runCommands(commands);
        if (commands.length) {
            console.log(`[Broker] Device accounts synced: ${commands.length} change(s) for ${devices.length} devices, ${gone.length} removed.`);
        }
    } catch (error) {
        console.error("[Broker] Could not sync the device accounts:", error?.message ?? error);
    }
}
