import { isGateway } from "./binHelpers"

// What a device is in the mesh, from what the server already knows:
// - "gateway": a pole gateway, no fill sensor (kind "gateway");
// - "meshBin": a bin without a SIM, reporting through a gateway;
// - "gatewayBin": a bin with a SIM, reporting itself and serving nearby
//   leaves; a device that has not reported yet registered over cellular.
export function getDeviceRole(bin) {
    if (isGateway(bin)) return "gateway"
    if (bin?.status?.connection?.via === "mesh") return "meshBin"
    return "gatewayBin"
}
