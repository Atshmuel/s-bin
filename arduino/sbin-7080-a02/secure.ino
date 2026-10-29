#include "globals.h"

// TLS to the S-Bin servers (2i): the modem checks them against Let's Encrypt's
// roots, which this file loads into its file system; a new device registers
// over HTTPS with its organization's registration code, and gets the device
// key it then logs in to the private MQTT broker with.

namespace {
// ISRG Root X1 (RSA, to 2035) and ISRG Root X2 (ECDSA, to 2040): the site's
// chain ends at X2 today (YE1, Root YE); X1 covers an RSA chain.
const char LETS_ENCRYPT_ROOTS[] = R"PEM(-----BEGIN CERTIFICATE-----
MIIFazCCA1OgAwIBAgIRAIIQz7DSQONZRGPgu2OCiwAwDQYJKoZIhvcNAQELBQAwTzELMAkGA1UE
BhMCVVMxKTAnBgNVBAoTIEludGVybmV0IFNlY3VyaXR5IFJlc2VhcmNoIEdyb3VwMRUwEwYDVQQD
EwxJU1JHIFJvb3QgWDEwHhcNMTUwNjA0MTEwNDM4WhcNMzUwNjA0MTEwNDM4WjBPMQswCQYDVQQG
EwJVUzEpMCcGA1UEChMgSW50ZXJuZXQgU2VjdXJpdHkgUmVzZWFyY2ggR3JvdXAxFTATBgNVBAMT
DElTUkcgUm9vdCBYMTCCAiIwDQYJKoZIhvcNAQEBBQADggIPADCCAgoCggIBAK3oJHP0FDfzm54r
Vygch77ct984kIxuPOZXoHj3dcKi/vVqbvYATyjb3miGbESTtrFj/RQSa78f0uoxmyF+0TM8ukj1
3Xnfs7j/EvEhmkvBioZxaUpmZmyPfjxwv60pIgbz5MDmgK7iS4+3mX6UA5/TR5d8mUgjU+g4rk8K
b4Mu0UlXjIB0ttov0DiNewNwIRt18jA8+o+u3dpjq+sWT8KOEUt+zwvo/7V3LvSye0rgTBIlDHCN
Aymg4VMk7BPZ7hm/ELNKjD+Jo2FR3qyHB5T0Y3HsLuJvW5iB4YlcNHlsdu87kGJ55tukmi8mxdAQ
4Q7e2RCOFvu396j3x+UCB5iPNgiV5+I3lg02dZ77DnKxHZu8A/lJBdiB3QW0KtZB6awBdpUKD9jf
1b0SHzUvKBds0pjBqAlkd25HN7rOrFleaJ1/ctaJxQZBKT5ZPt0m9STJEadao0xAH0ahmbWnOlFu
hjuefXKnEgV4We0+UXgVCwOPjdAvBbI+e0ocS3MFEvzG6uBQE3xDk3SzynTnjh8BCNAw1FtxNrQH
usEwMFxIt4I7mKZ9YIqioymCzLq9gwQbooMDQaHWBfEbwrbwqHyGO0aoSCqI3Haadr8faqU9GY/r
OPNk3sgrDQoo//fb4hVC1CLQJ13hef4Y53CIrU7m2Ys6xt0nUW7/vGT1M0NPAgMBAAGjQjBAMA4G
A1UdDwEB/wQEAwIBBjAPBgNVHRMBAf8EBTADAQH/MB0GA1UdDgQWBBR5tFnme7bl5AFzgAiIyBpY
9umbbjANBgkqhkiG9w0BAQsFAAOCAgEAVR9YqbyyqFDQDLHYGmkgJykIrGF1XIpu+ILlaS/V9lZL
ubhzEFnTIZd+50xx+7LSYK05qAvqFyFWhfFQDlnrzuBZ6brJFe+GnY+EgPbk6ZGQ3BebYhtF8GaV
0nxvwuo77x/Py9auJ/GpsMiu/X1+mvoiBOv/2X/qkSsisRcOj/KKNFtY2PwByVS5uCbMiogziUwt
hDyC3+6WVwW6LLv3xLfHTjuCvjHIInNzktHCgKQ5ORAzI4JMPJ+GslWYHb4phowim57iaztXOoJw
TdwJx4nLCgdNbOhdjsnvzqvHu7UrTkXWStAmzOVyyghqpZXjFaH3pO3JLF+l+/+sKAIuvtd7u+Nx
e5AW0wdeRlN8NwdCjNPElpzVmbUq4JUagEiuTDkHzsxHpFKVK7q4+63SM1N95R1NbdWhscdCb+ZA
JzVcoyi3B43njTOQ5yOf+1CceWxG1bQVs5ZufpsMljq4Ui0/1lvh+wjChP4kqKOJ2qxq4RgqsahD
YVvTH9w7jXbyLeiNdd8XM2w9U/t7y0Ff/9yi0GE44Za4rF2LN9d11TPAmRGunUHBcnWEvgJBQl9n
JEiU0Zsnvgc/ubhPgXRR4Xq37Z0j4r7g1SgEEzwxA57demyPxgcYxn/eR44/KJ4EBs+lVDR3veyJ
m+kXQ99b21/+jh5Xos1AnX5iItreGCc=
-----END CERTIFICATE-----
-----BEGIN CERTIFICATE-----
MIICGzCCAaGgAwIBAgIQQdKd0XLq7qeAwSxs6S+HUjAKBggqhkjOPQQDAzBPMQswCQYDVQQGEwJV
UzEpMCcGA1UEChMgSW50ZXJuZXQgU2VjdXJpdHkgUmVzZWFyY2ggR3JvdXAxFTATBgNVBAMTDElT
UkcgUm9vdCBYMjAeFw0yMDA5MDQwMDAwMDBaFw00MDA5MTcxNjAwMDBaME8xCzAJBgNVBAYTAlVT
MSkwJwYDVQQKEyBJbnRlcm5ldCBTZWN1cml0eSBSZXNlYXJjaCBHcm91cDEVMBMGA1UEAxMMSVNS
RyBSb290IFgyMHYwEAYHKoZIzj0CAQYFK4EEACIDYgAEzZvVn4CDCuwJSvMWSj5cz3es3mcFDR0H
ttwW+1qLFNvicWDEukWVEYmO6gbf9yoWHKS5xcUy4APgHoIYOIvXRdgKam7mAHf7AlF9ItgKbppb
d9/w+kHsOdx1ymgHDB/qo0IwQDAOBgNVHQ8BAf8EBAMCAQYwDwYDVR0TAQH/BAUwAwEB/zAdBgNV
HQ4EFgQUfEKWrt5LSDv6kviejM9ti6lyN5UwCgYIKoZIzj0EAwMDaAAwZQIwe3lORlCEwkSHRhtF
cP9Ymd70/aTSVaYgLXTWNLxBo1BfASdWtL4ndQavEi51mI38AjEAi/V3bNTIZargCyzuFJ0nN6T5
U6VR5CmD1/iQMVtCnwr1/q4AaOeMSQ+2b1tbFfLn
-----END CERTIFICATE-----
)PEM";
constexpr uint16_t HTTPS_PORT = 443;
constexpr int HTTPS_CONNECT_TIMEOUT_S = 30;
constexpr unsigned long HTTPS_RESPONSE_TIMEOUT_MS = 20000UL;
constexpr size_t HTTPS_MAX_BODY = 1024;
constexpr uint8_t HTTPS_MUX = 1;  // the MQTT socket is mux 0
}

// Loads the roots into the modem as SBIN_CA_FILE (every boot: about a second,
// and a modem swapped or reset gets them back); false when the modem refused.
bool loadModemCaCertificate() {
    const size_t length = strlen(LETS_ENCRYPT_ROOTS);
    modem.sendAT("+CFSINIT");
    modem.waitResponse(2000);  // ERROR when already open; the write below decides
    modem.sendAT("+CFSWFILE=3,\"", SBIN_CA_FILE, "\",0,", length, ",10000");
    bool written = modem.waitResponse(5000, "DOWNLOAD") == 1;
    if (written) {
        modem.stream.write(reinterpret_cast<const uint8_t*>(LETS_ENCRYPT_ROOTS), length);
        written = modem.waitResponse(10000) == 1;
    }
    modem.sendAT("+CFSTERM");
    modem.waitResponse(2000);
    if (!written) {
        Serial.println("❌ Could not write the CA certificates to the modem.");
        return false;
    }
    // Type 2: a root CA for the modem's TLS.
    modem.sendAT("+CSSLCFG=\"CONVERT\",2,\"", SBIN_CA_FILE, "\"");
    if (modem.waitResponse(5000) != 1) {
        Serial.println("❌ The modem did not accept the CA certificates.");
        return false;
    }
    Serial.println("🔐 CA certificates loaded into the modem.");
    return true;
}

// POSTs JSON to the server over HTTPS; returns the HTTP status (0 when it
// could not be reached) and fills `reply` with the JSON answer.
int postJson(const char* path, JsonDocument& request, JsonDocument& reply) {
    TinyGsmClientSecure https(modem, HTTPS_MUX);
    https.setCertificate(SBIN_CA_FILE);
    if (!https.connect(SBIN_SERVER_HOST, HTTPS_PORT, HTTPS_CONNECT_TIMEOUT_S)) {
        Serial.printf("⚠️ Could not reach the server over HTTPS (%s).\n", path);
        return 0;
    }
    String body;
    serializeJson(request, body);
    https.print(String("POST ") + path + " HTTP/1.1\r\nHost: " + SBIN_SERVER_HOST +
                "\r\nContent-Type: application/json\r\nContent-Length: " + body.length() +
                "\r\nConnection: close\r\n\r\n" + body);

    // The status line, the headers, then the body (until the server closes).
    const unsigned long startedAt = millis();
    String response;
    while (millis() - startedAt < HTTPS_RESPONSE_TIMEOUT_MS && (https.connected() || https.available())) {
        while (https.available() && response.length() < HTTPS_MAX_BODY + 512) {
            response += static_cast<char>(https.read());
        }
        delay(10);
    }
    https.stop();

    const int bodyStart = response.indexOf("\r\n\r\n");
    if (bodyStart >= 0) {
        deserializeJson(reply, response.substring(bodyStart + 4));
    }
    return response.startsWith("HTTP/1.") ? response.substring(9, 12).toInt() : 0;
}

// Registers this device over HTTPS: its MAC, organization, registration code,
// location and battery. The device key it gets back is saved.
RegistrationOutcome registerOverHttps(int batteryPercent) {
    JsonDocument request;
    request["mac"] = DeviceMac;
    request["orgId"] = ownerId;
    request["code"] = registrationCode;
    request["battery"] = batteryPercent;
    request["location"][0] = latitude;
    request["location"][1] = longitude;
    JsonDocument reply;
    const int status = postJson("/api/devices/register", request, reply);
    if (status == 201 && reply["deviceKey"].is<const char*>()) {
        deviceKey = reply["deviceKey"].as<String>();
        saveDeviceKey(deviceKey);
        Serial.println("✅ Registered; device key received and saved.");
        return REGISTRATION_DONE;
    }
    Serial.printf("⚠️ Registration answered %d: %s\n", status, reply["message"] | "no message");
    // A wrong organization or code (or a request the server cannot take) will
    // not pass by retrying: the setup page opens again. Anything else (a known
    // MAC an owner can delete, a server error, no answer) is tried next cycle.
    return status == 403 || status == 400 ? REGISTRATION_REFUSED : REGISTRATION_RETRY;
}

// The broker refused this device's login: asks the server whether its bin
// still exists. Only the server's "deleted" (410) resets the device and opens
// its setup page; a broker that lost its accounts, or no answer, changes
// nothing (it tries again next cycle).
void checkDeviceAfterRefusedLogin() {
    JsonDocument request;
    request["mac"] = DeviceMac;
    request["deviceKey"] = deviceKey;
    JsonDocument reply;
    const int status = postJson("/api/devices/status", request, reply);
    if (status == 410) {
        Serial.println("🗑️ This device's bin was deleted; resetting and opening the setup page.");
        clearDeviceSettings();
        delay(500);
        ESP.restart();
    }
    Serial.printf("⚠️ The broker refused the login, but the server answered %d; keeping the settings.\n", status);
}
