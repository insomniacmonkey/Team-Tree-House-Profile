const fs = require("fs");
const path = require("path");

// Path to points.json file
const dbFilePath = path.join(__dirname, "../../public/data/points.json");

// Ensure `points.json` exists
if (!fs.existsSync(dbFilePath)) {
    fs.writeFileSync(
        dbFilePath,
        JSON.stringify({
            lastRecorded: { total: 0, categories: {} },
            history: [],
            badgesEarned: []
        }, null, 2)
    );
}

function trackPoints(newData) {
    console.log("🔹 Running trackPoints function...");

    // Read the current points data
    const rawData = fs.readFileSync(dbFilePath, "utf8");
    let dbData = JSON.parse(rawData);

    const lastRecorded = dbData.lastRecorded || { total: 0, categories: {} };

    console.log("📊 Checking for new points earned...");

    let totalPointsGained = newData.points.total - (lastRecorded.total || 0);
    let pointsGained = {};

    Object.keys(newData.points).forEach((category) => {
        if (category !== "total") {
            const newPointsInCategory = newData.points[category] || 0;
            const lastPointsInCategory = lastRecorded.categories?.[category] || 0;
            const pointDifference = newPointsInCategory - lastPointsInCategory;

            if (pointDifference !== 0) {
                pointsGained[category] = pointDifference;
            }
        }
    });

    console.log(`🔹 Total Points Change Detected: ${totalPointsGained}`);

    // ✅ Convert UTC to Central Time & Store in YYYY-MM-DD Format
    const centralDate = new Date().toLocaleDateString("en-CA", { timeZone: "America/Chicago" });

    let existingEntry = dbData.history.find((entry) => entry.date === centralDate);

    if (existingEntry) {
        existingEntry.totalGained += totalPointsGained;

        // ✅ Update each category in pointsBreakdown correctly
        Object.keys(pointsGained).forEach((category) => {
            existingEntry.pointsBreakdown[category] =
                (existingEntry.pointsBreakdown[category] || 0) + pointsGained[category];
        });
    } else {
        dbData.history.push({
            date: centralDate,
            totalGained: totalPointsGained,
            pointsBreakdown: Object.keys(pointsGained).length > 0 ? { ...pointsGained } : {}
        });
    }

    // ✅ Track New Badges
    console.log("🏅 Checking for new badges earned...");

    if (!dbData.badgesEarned) {
        dbData.badgesEarned = [];
    }

    if (!newData.badges || newData.badges.length === 0) {
        console.log("⚠️ No new badges found in incoming data.");
    } else {
        newData.badges.forEach((badge) => {
            if (!dbData.badgesEarned.some((existingBadge) => existingBadge.id === badge.id)) {
                console.log(`🏆 New badge earned: ${badge.name}`);
                dbData.badgesEarned.push({
                    id: badge.id,
                    name: badge.name,
                    url: badge.url || "",
                    icon_url: badge.icon_url || "",
                    earned_date: badge.earned_date // ✅ Keep API's original date
                });
            }
        });
    }

    // ✅ Write updated data to points.json
    fs.writeFileSync(dbFilePath, JSON.stringify(dbData, null, 2));
    console.log("✅ Database updated with new points and badges.");

    return dbData;
}

module.exports = trackPoints;
