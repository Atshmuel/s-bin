import { checkPayloadFields } from "../../utils/helpers.js";
import { mqttClient } from "../mqttClient.js";
import { BIN_ACK_COMMAND } from "../mqttTopics.js";

//TODO: implement these handlers
export async function handleDeviceError(mac, { deviceKey, location, health, level, battery, message }) {
    if (!checkPayloadFields({ location, health, level, battery })) return;

}
export async function handleDeviceMaintenance(mac, { deviceKey, location, health, level, battery }) {
    if (!checkPayloadFields({ location, health, level, battery })) return;

}


export function removeBinConfig(macId) {
    mqttClient.publish(`${BIN_ACK_COMMAND}/${macId}`, JSON.stringify({
        command: "reset",
        reason: "removed_by_user"
    }));
}
