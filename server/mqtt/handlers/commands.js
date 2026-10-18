import { mqttClient } from "../mqttClient.js";
import { BIN_ACK_COMMAND } from "../mqttTopics.js";

export function removeBinConfig(macId) {
    mqttClient.publish(`${BIN_ACK_COMMAND}/${macId}`, JSON.stringify({
        command: "reset",
        reason: "removed_by_user"
    }));
}
