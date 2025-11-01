export const BIN_REGISTER_TOPIC = "bins/register";
export const BIN_UPDATE_TOPIC = "bins/+/update/#";

// Used by server to notify all bins of any info,
// specific bin acknowledgments are sent to "bins/ack/<mac>"
// listen to commands on "bins/<mac>/command"
export const BIN_ACK_TOPIC = "bins/ack";
export const BIN_ACK_COMMAND = "bins/command";