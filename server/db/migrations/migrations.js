import mongoose from "mongoose";

// Each one runs once, in this order, recorded in the `migrations` collection.
// A migration's changes and its record are written in one transaction, so a
// failed run leaves nothing half done and runs again at the next start.
const MIGRATIONS = Object.freeze([
    {
        // Locations were stored [lat, lng]; MongoDB's geo search reads
        // GeoJSON, [lng, lat], so radius searches were skewed. Bins and depots
        // are turned around (routes were only ever written [lng, lat]).
        id: "2026-10-25-locations-lng-lat",
        async run(db, session) {
            const swap = field => [{ $arrayElemAt: [field, 1] }, { $arrayElemAt: [field, 0] }];
            const bins = await db.collection("bins").updateMany(
                { "location.coordinates.1": { $exists: true } },
                [{ $set: { "location.coordinates": swap("$location.coordinates") } }],
                { session },
            );
            const depots = await db.collection("organizations").updateMany(
                { "depot.location.1": { $exists: true } },
                [{ $set: { "depot.location": swap("$depot.location") } }],
                { session },
            );
            return `${bins.modifiedCount} bins, ${depots.modifiedCount} depots`;
        },
    },
]);

// Runs the migrations not yet recorded. The server calls it after connecting
// and before taking device messages or requests.
export async function runMigrations() {
    const db = mongoose.connection.db;
    const done = new Set((await db.collection("migrations").find({}, { projection: { _id: 1 } }).toArray()).map(m => m._id));
    for (const migration of MIGRATIONS) {
        if (done.has(migration.id)) continue;
        const session = await mongoose.startSession();
        try {
            await session.withTransaction(async () => {
                const summary = await migration.run(db, session);
                await db.collection("migrations").insertOne({ _id: migration.id, ranAt: new Date(), summary }, { session });
                console.log(`Migration ${migration.id}: ${summary}.`);
            });
        } finally {
            await session.endSession();
        }
    }
}
