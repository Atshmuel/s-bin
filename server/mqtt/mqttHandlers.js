import { BIN_REGISTER_TOPIC } from "./mqttTopics.js";
import { handleRegistration } from "./handlers/registration.js";
import { handleDeviceLog } from "./handlers/telemetry.js";
import { handleRelay } from "./handlers/relay.js";
import { handleInstructionCheck, handleInstructionResult } from "./handlers/instructions.js";
import { handleDeviceError, handleDeviceMaintenance } from "./handlers/commands.js";

export { removeBinConfig } from "./handlers/commands.js";

export async function handleMqttMessage(topic, payload) {
    if (topic === BIN_REGISTER_TOPIC) {
        await handleRegistration(payload);
        return;
    }

    const parts = topic.split("/"); // bins/<mac>/update/<field>
    if (parts.length !== 4) {
        console.warn("Unknown topic format:", topic);
        return;
    }

    const mac = parts[1];
    const field = parts[3];
    console.log(`Received message for bin ${mac} on field ${field}:`, payload);
    switch (field) {
        case "log":
            await handleDeviceLog(mac, payload);
            break;
        case "error":
            await handleDeviceError(mac, payload);
            break;
        case "maintenance":
            await handleDeviceMaintenance(mac, payload);
            break;
        case "instructions":
            await handleInstructionCheck(mac, payload);
            break;
        case "instruction-result":
            await handleInstructionResult(mac, payload);
            break;
        case "relay":
            await handleRelay(mac, payload);
            break;
        default:
            console.log("Unknown topic:", field);
    }
}
