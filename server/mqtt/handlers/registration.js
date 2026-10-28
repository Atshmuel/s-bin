import { mqttClient } from "../mqttClient.js";
import { BIN_ACK_TOPIC } from "../mqttTopics.js";
import { registerDevice } from "../../db/service/deviceRegistrationService.js";

// The old registration over the public broker, kept while devices move to
// the HTTPS one with their organization's code (2i). A device already known,
// or a wrong request, gets no reply.
export async function handleRegistration({ mac, orgId, location, battery, kind = "bin" }) {
    try {
        const { status, ...registered } = await registerDevice({ mac, orgId, location, battery, kind });
        if (status !== "registered") {
            console.log(`MQTT registration of ${mac} not done: ${status}.`);
            return;
        }
        console.log("Registered a new device via MQTT:", mac);
        mqttClient.publish(`${BIN_ACK_TOPIC}/${mac}`, JSON.stringify({ status: "registered", ...registered }));
    } catch (error) {
        console.error("Error registering a device via MQTT:", error);
    }
}
