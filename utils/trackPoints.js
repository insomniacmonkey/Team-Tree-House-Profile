const fs = require('fs');
const path = require('path');

// Path to points.json file
const dbFilePath = path.join(__dirname, '../../public/data/points.json');

// Ensure `points.json` exists
if (!fs.existsSync(dbFilePath)) {
    fs.writeFileSync(dbFilePath, JSON.stringify({
        lastRecorded: { total: 0, categories: {} },
        history: [],
        badgesEarned: []
    }, null, 2));
}

function trackPoints(newData) {
    console.log("🔹 Running trackPoints function...");

    // Read the current points data
    const rawData = fs.readFileSync(dbFilePath, 'utf8');
    let dbData = JSON.parse(rawData);

    const lastRecorded = dbData.lastRecorded || { total: 0, categories: {} };

    console.log("📊 Checking for new points earned...");

    let totalPointsGained = newData.points.total - (lastRecorded.total || 0);
    let pointsGained = {};

    Object.keys(newData.points).forEach(category => {
        if (category !== 'total') {
            const newPointsInCategory = newData.points[category] || 0;
            const lastPointsInCategory = lastRecorded.categories?.[category] || 0;
            const pointDifference = newPointsInCategory - lastPointsInCategory;

            if (pointDifference !== 0) {
                pointsGained[category] = pointDifference;
            }
        }
    });

    console.log(`🔹 Total Points Change Detected: ${totalPointsGained}`);

    // Update history
    const today = new Date().toISOString().split("T")[0];
    let existingEntry = dbData.history.find(entry => entry.date.startsWith(today));

    if (existingEntry) {
        existingEntry.totalGained += totalPointsGained;
    } else {
        dbData.history.push({
            date: today,
            totalGained: totalPointsGained,
            pointsBreakdown: pointsGained
        });
    }

    // Update last recorded points
    dbData.lastRecorded = {
        total: newData.points.total,
        categories: newData.points
    };

    // Write updated data to points.json
    fs.writeFileSync(dbFilePath, JSON.stringify(dbData, null, 2));
    console.log("✅ Database updated with new points.");

    return dbData;
}

module.exports = trackPoints;
