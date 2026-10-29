import cron from "node-cron";
import { syncDeviceAccounts } from "../../mqtt/brokerAccounts.js";
import { CRON_SCHEDULES } from "../../utils/constants.js";

// Every hour, besides each connect to the private broker: every device keeps
// its account and none outlives its bin, so a deletion the broker never heard
// of (made from a developer machine, whose MQTT is off, or while the broker
// was down) locks the device out within the hour, and it learns it was deleted.
if (!global.brokerAccountsCronStarted) {
    global.brokerAccountsCronStarted = true;
    console.log("brokerAccountsCronStarted");

    // syncDeviceAccounts logs its own errors.
    cron.schedule(CRON_SCHEDULES.brokerAccounts, syncDeviceAccounts);
}
