#include "globals.h"

// A gateway that cannot reach the server (no SIM, its modem failing, or two
// cycles in a row without a report) still reports: as a leaf, through another
// gateway of its organization, whose slot it shares. It opens no window of its
// own meanwhile (its leaves wait), and stays a gateway: every wake tries its
// own link first, so a SIM put back or the network returning ends it.

// Cycles in a row that ended without a report (RTC memory: a power loss
// starts over, and the first failure after it falls back again by itself).
RTC_DATA_ATTR uint8_t cyclesWithoutReport = 0;

namespace {
constexpr uint8_t FALLBACK_AFTER_FAILED_REPORTS = 2;
// Listened past the slot and the window, for the other gateway's clock.
constexpr uint32_t FALLBACK_LISTEN_SLACK_SECONDS = 30;
constexpr uint32_t FALLBACK_MIN_LISTEN_SECONDS = 20;
// Without a usable slot (no clock, no schedule) it listens this long at most.
constexpr uint32_t FALLBACK_MAX_LISTEN_SECONDS = 20UL * 60UL;

uint32_t fallbackListenSeconds() {
    if (!isSystemClockValid() || nextWakeEpoch == 0) {
        return FALLBACK_MAX_LISTEN_SECONDS;
    }
    const int64_t until = static_cast<int64_t>(nextWakeEpoch) + meshAwakeWindowSeconds + FALLBACK_LISTEN_SLACK_SECONDS;
    return static_cast<uint32_t>(constrain(until - static_cast<int64_t>(time(nullptr)),
                                           static_cast<int64_t>(FALLBACK_MIN_LISTEN_SECONDS),
                                           static_cast<int64_t>(FALLBACK_MAX_LISTEN_SECONDS)));
}
}

bool reportsFailedTooOften() {
    return cyclesWithoutReport >= FALLBACK_AFTER_FAILED_REPORTS;
}

void recordReportOutcome(bool reportSent) {
    if (reportSent) {
        cyclesWithoutReport = 0;
    } else if (cyclesWithoutReport < UINT8_MAX) {
        cyclesWithoutReport++;
    }
}

// Sends this cycle's reading through another gateway, why this one cannot
// (DATA_SIM_MISSING or DATA_NO_CELLULAR) with it. The beacon's slot becomes
// this gateway's next wake, so it keeps its slot without network time.
bool reportThroughAnotherGateway(uint8_t reasonFlag) {
    sbinmesh::LeafKeys keys = {};
    if (!ownLeafKeys(keys)) {
        Serial.println("⚠️ No mesh key yet, so no other gateway can take this report.");
        return false;
    }
    Serial.printf("🔁 Reporting through another gateway (%s).\n",
                  reasonFlag == sbinmesh::DATA_SIM_MISSING ? "no SIM card" : "no cellular link");
    leafFallbackFlags = reasonFlag;
    const sbinmesh::LeafConfig config = makeLeafConfig(keys);
    const sbinmesh::LeafExchange exchange = sbinmesh::runLeafExchange(config, fallbackListenSeconds() * 1000UL);
    leafFallbackFlags = 0;

    if (exchange.heardBeacon && exchange.nextWakeEpoch > 0) {
        nextWakeEpoch = exchange.nextWakeEpoch;
        preferences.begin("credentials", false);
        preferences.putULong64("nextWake", nextWakeEpoch);
        preferences.end();
    }
    Serial.println(exchange.delivered ? "✅ Report delivered through another gateway."
                                      : "⚠️ No other gateway took the report.");
    return exchange.delivered;
}
