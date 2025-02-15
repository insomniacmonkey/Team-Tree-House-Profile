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

// Set up LowDB (UNCHANGED)
console.log("🔹 Initializing LowDB...");
const adapter = new JSONFileSync(dbFilePath);
const db = new LowSync(adapter, { defaultData: { lastRecorded: { total: 0, categories: {} }, history: [], badgesEarned: [] } });

// Read database **after assigning default data**
db.read();

// Ensure `db.data` is properly initialized
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
    let newCategories = [];

    Object.keys(newPoints).forEach((category) => {
        if (category !== 'total') {
            const newPointsInCategory = newPoints[category];
            const lastPointsInCategory = lastRecorded.categories?.[category] || 0;

            if (newPointsInCategory > lastPointsInCategory) {
                pointsGained[category] = newPointsInCategory - lastPointsInCategory;
            }

            if (!(category in lastRecorded.categories)) {
                console.log(`🆕 New category detected: "${category}" with ${newPointsInCategory} points.`);
                newCategories.push({ category, points: newPointsInCategory });
                db.data.lastRecorded.categories[category] = newPointsInCategory;
            }
        }
    });

    if (newCategories.length > 0) {
        db.write();
    }

    if (totalPointsGained > 0) {
        console.log(`🎉 New total points earned: ${totalPointsGained}`);
        console.log("📊 Breakdown of points gained:", pointsGained);

        const today = new Date().toISOString().split("T")[0];

        let existingEntry = db.data.history.find(entry => entry.date.startsWith(today));

        if (existingEntry) {
            console.log(`🔄 Merging points with existing entry for ${today}`);
            existingEntry.totalGained += totalPointsGained;

            Object.keys(pointsGained).forEach(category => {
                existingEntry.pointsBreakdown[category] = 
                    (existingEntry.pointsBreakdown[category] || 0) + pointsGained[category];
            });
        } else {
            db.data.history.push({
                date: new Date().toISOString(),
                totalGained: totalPointsGained,
                pointsBreakdown: pointsGained
            });
        }

        db.data.lastRecorded.total = newPoints.total;
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
