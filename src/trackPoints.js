const { LowSync } = require('lowdb');
const { JSONFileSync } = require('lowdb/node'); // Correct import
const fs = require('fs');

const dbFilePath = './data/points.json';

console.log("🔹 Starting trackPoints.js...");

// Step 1: Ensure the `data/` directory exists
if (!fs.existsSync('./data')) {
    console.log("📁 'data/' directory not found. Creating now...");
    fs.mkdirSync('./data');
} else {
    console.log("✅ 'data/' directory exists.");
}

// Step 2: Ensure the `points.json` file exists with default data
if (!fs.existsSync(dbFilePath)) {
    console.log("📄 'points.json' not found. Creating with default data...");
    fs.writeFileSync(dbFilePath, JSON.stringify({ lastRecorded: 0, history: [] }, null, 2));
} else {
    console.log("✅ 'points.json' exists.");
}

// Step 3: Set up LowDB adapter
console.log("🔹 Initializing LowDB...");
const adapter = new JSONFileSync(dbFilePath);
const db = new LowSync(adapter, { defaultData: { lastRecorded: 0, history: [] } });

// Step 4: Read database
console.log("📖 Reading database...");
db.read();

// Step 5: Debug: Log current database contents
console.log("🔍 Current database state before checking defaults:", db.data);

// Step 6: Ensure `db.data` is assigned correctly
if (!db.data || typeof db.data !== 'object' || Object.keys(db.data).length === 0) {
    console.log("⚠️ Database data is missing or empty! Initializing default structure...");
    db.data = { lastRecorded: 0, history: [] };
    db.write();
    console.log("✅ Database initialized with default data.");
} else {
    console.log("✅ Database already initialized.");
}

console.log("🚀 trackPoints.js setup complete.");

function trackPoints(data) {
    console.log("🔹 Running trackPoints function...");

    if (!data || !data.points || typeof data.points.total !== 'number') {
        console.log("❌ Invalid data received. Skipping tracking.");
        return;
    }

    const { points } = data;
    const lastRecorded = db.data.lastRecorded;

    console.log(`📊 Current total points: ${points.total}, Last recorded: ${lastRecorded}`);

    if (points.total > lastRecorded) {
        console.log(`🎉 New points earned: ${points.total - lastRecorded}`);
        db.data.history.push({ date: new Date().toISOString(), points: points.total });
        db.data.lastRecorded = points.total;
        db.write();
        console.log("✅ Database updated with new points.");
    } else {
        console.log('ℹ️ No new points earned today.');
    }
}

module.exports = trackPoints;
