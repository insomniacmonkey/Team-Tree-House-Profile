const { LowSync } = require('lowdb');
const { JSONFileSync } = require('lowdb/node');
const fs = require('fs');

const dbFilePath = './data/points.json';
console.log("🔹 Starting trackPoints.js...");

// Ensure `data/` directory exists
if (!fs.existsSync('./data')) {
    console.log("📁 'data/' directory not found. Creating now...");
    fs.mkdirSync('./data');
}

// Ensure `points.json` exists with default data
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

// Set up LowDB
console.log("🔹 Initializing LowDB...");
const adapter = new JSONFileSync(dbFilePath);
const db = new LowSync(adapter, { defaultData: { lastRecorded: { total: 0, categories: {} }, history: [], badgesEarned: [] } });

// **FORCE RELOAD OF DATABASE FROM DISK**
db.read();
console.log("✅ Reloaded database before checking for new points.");

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

    // **Check for Total Points Difference First**
    let totalPointsGained = newPoints.total - (lastRecorded.total || 0);
    console.log(`🔹 Total Points Change Detected: ${totalPointsGained} (New: ${newPoints.total}, Last: ${lastRecorded.total})`);

    let pointsGained = {};

    Object.keys(newPoints).forEach((category) => {
        if (category !== 'total') {
            const newPointsInCategory = newPoints[category] || 0;
            const lastPointsInCategory = lastRecorded.categories?.[category] || 0;
            const pointDifference = newPointsInCategory - lastPointsInCategory;

            console.log(`🔎 Checking ${category}: Last: ${lastPointsInCategory}, New: ${newPointsInCategory}, Difference: ${pointDifference}`);

            if (pointDifference !== 0) {
                pointsGained[category] = pointDifference;
            }

            db.data.lastRecorded.categories[category] = newPointsInCategory;
        }
    });

    console.log(`🔹 Corrected Total Points Gained: ${totalPointsGained}`);
    console.log("🔹 Points Gained by Category:", JSON.stringify(pointsGained, null, 2));

    if (totalPointsGained !== 0) {
        console.log(`🎉 New total points change detected: ${totalPointsGained}`);
        console.log("📊 Breakdown of points changed:", pointsGained);

        const today = new Date().toISOString().split("T")[0];
        let existingEntry = db.data.history.find(entry => entry.date.startsWith(today));

        if (existingEntry) {
            console.log(`🔄 Merging points with existing entry for ${today}`);

            Object.keys(pointsGained).forEach(category => {
                existingEntry.pointsBreakdown[category] = 
                    (existingEntry.pointsBreakdown[category] || 0) + pointsGained[category];
            });

            existingEntry.totalGained = Object.values(existingEntry.pointsBreakdown).reduce((sum, val) => sum + val, 0);
        } else {
            console.log(`📌 Creating new history entry for ${today}`);
            db.data.history.push({
                date: new Date().toISOString(),
                totalGained: totalPointsGained,
                pointsBreakdown: pointsGained
            });
        }

        // **Update lastRecorded.total correctly**
        db.data.lastRecorded.total = newPoints.total;

        db.write();
        console.log("✅ Database updated with new points.");
    } else {
        console.log('ℹ️ No new points earned or lost today.');
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
