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

// Step 2: Ensure `points.json` exists with default data before LowDB reads it
if (!fs.existsSync(dbFilePath)) {
    console.log("📄 'points.json' not found. Creating with default data...");
    fs.writeFileSync(dbFilePath, JSON.stringify({
        lastRecorded: { total: 0, categories: {} },
        history: [],
        badgesEarned: []
    }, null, 2));
} else {
    console.log("✅ 'points.json' exists.");
}

// Step 3: Set up LowDB **with default data passed on initialization**
console.log("🔹 Initializing LowDB...");
const adapter = new JSONFileSync(dbFilePath);
const db = new LowSync(adapter, { defaultData: { lastRecorded: { total: 0, categories: {} }, history: [], badgesEarned: [] } });

// Step 4: Read database **after assigning default data**
db.read();

// Step 5: Debugging - Ensure database is properly initialized
console.log("🔍 Database state after read():", JSON.stringify(db.data, null, 2));

// Step 6: If `db.data` is still empty, force default values
if (!db.data || Object.keys(db.data).length === 0) {
    console.log("⚠️ Database is empty! Assigning default data...");
    db.data = { lastRecorded: { total: 0, categories: {} }, history: [], badgesEarned: [] };
    db.write();
    console.log("✅ Database initialized with default values.");
} else {
    console.log("✅ Database loaded successfully.");
}

console.log("🚀 trackPoints.js setup complete.");

function trackPoints(data) {
    console.log("🔹 Running trackPoints function...");

    if (!data || !data.points || !data.badges) {
        console.log("❌ Invalid data received. Skipping tracking.");
        return;
    }

    const newPoints = data.points;
    const newBadges = data.badges;
    const lastRecorded = db.data.lastRecorded;

    console.log("📊 Checking for new points earned...");

    let pointsGained = {};
    let totalPointsGained = newPoints.total - (lastRecorded.total || 0);

    Object.keys(newPoints).forEach((category) => {
        if (category !== 'total') {
            const newPointsInCategory = newPoints[category];
            const lastPointsInCategory = lastRecorded.categories?.[category] || 0;
            if (newPointsInCategory > lastPointsInCategory) {
                pointsGained[category] = newPointsInCategory - lastPointsInCategory;
            }
        }
    });

    if (totalPointsGained > 0) {
        console.log(`🎉 New total points earned: ${totalPointsGained}`);
        console.log("📊 Breakdown of points gained:", pointsGained);

        db.data.history.push({
            date: new Date().toISOString(),
            totalGained: totalPointsGained,
            pointsBreakdown: pointsGained
        });

        db.data.lastRecorded = {
            total: newPoints.total,
            categories: newPoints
        };
        db.write();
        console.log("✅ Database updated with new points.");
    } else {
        console.log('ℹ️ No new points earned today.');
    }

    console.log("🔍 Checking for new badges earned...");
    let newBadgesEarned = [];

    newBadges.forEach((badge) => {
        if (!db.data.badgesEarned.some(b => b.id === badge.id)) {
            console.log(`🏅 New badge earned: ${badge.name}`);
            newBadgesEarned.push({
                id: badge.id,
                name: badge.name,
                url: badge.url,
                icon_url: badge.icon_url,
                earned_date: badge.earned_date
            });
        }
    });

    if (newBadgesEarned.length > 0) {
        db.data.badgesEarned.push(...newBadgesEarned);
        db.write();
        console.log("✅ New badges added to the database.");
    } else {
        console.log("ℹ️ No new badges earned today.");
    }
}

module.exports = trackPoints;
