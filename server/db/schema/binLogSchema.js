export const binLogSchema = new mongoose.Schema({
    binId: {
        type: mongoose.Schema.Types.String,
        ref: "Bin",
        required: true
    },
    level: { type: Number, required: true },
    weight: { type: Number },
    timestamp: { type: Date, default: Date.now }
});