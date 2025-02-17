const fs = require('fs');
const path = require('path');

// Base directory for user-specific points data
const dataDirectory = path.join(__dirname, '../../public/data');

// Ensure `data` directory exists
if (!fs.existsSync(dataDirectory)) {
    fs.mkdirSync(dataDirectory, { recursive: true });
}

function trackPoints(username, newData) {
    if (typeof username !== "string") {
        console.error(`❌ trackPoints received invalid username: ${JSON.stringify(username)}`);
        return;
    }

    console.log(`🔹 Running trackPoints for ${username}...`);

    // Path to user-specific JSON file
    const userFilePath = path.join(dataDirectory, `${username}.json`);

    // Ensure user file exists
    if (!fs.existsSync(userFilePath)) {
        console.log(`📂 Creating new data file for ${username}`);
        fs.writeFileSync(userFilePath, JSON.stringify({
            lastRecorded: { total: 0, categories: {} },
            history: [],
            badgesEarned: []
        }, null, 2));
    }

    // Read user data
    const rawData = fs.readFileSync(userFilePath, 'utf8');
    let userData = JSON.parse(rawData);

    if (!userData.lastRecorded) {
        userData.lastRecorded = { total: 0, categories: {} };
    }

    const lastRecorded = userData.lastRecorded;

    console.log(`📊 Checking for new points earned for ${username}...`);
    console.log(`🔹 Previous Total: ${lastRecorded.total}, New Total: ${newData.points?.total}`);

    const newTotalPoints = newData.points?.total ?? lastRecorded.total;
    let totalPointsGained = newTotalPoints - lastRecorded.total;

    let pointsGained = {};

    Object.keys(newData.points || {}).forEach(category => {
        if (category !== 'total') {
            const newPointsInCategory = newData.points[category] || 0;
            const lastPointsInCategory = lastRecorded.categories?.[category] || 0;
            const pointDifference = newPointsInCategory - lastPointsInCategory;

            if (pointDifference !== 0) {
                pointsGained[category] = pointDifference;
            }
        }
    });

    console.log(`🔹 Total Points Change Detected for ${username}: ${totalPointsGained}`);

    // Update history
    const today = new Date().toISOString().split("T")[0];
    let existingEntry = userData.history.find(entry => entry.date.startsWith(today));

    if (existingEntry) {
        existingEntry.totalGained += totalPointsGained;
    } else {
        userData.history.push({
            date: today,
            totalGained: totalPointsGained,
            pointsBreakdown: pointsGained
        });
    }

    // Ensure `lastRecorded.categories` exists and updates properly
    userData.lastRecorded = {
        total: newTotalPoints,
        categories: {
            ...lastRecorded.categories,  // Preserve previous data
            ...newData.points            // Merge with new data
        }
    };

    console.log(`🏅 Checking for new badges earned for ${username}...`);
    if (!userData.badgesEarned) {
        userData.badgesEarned = [];
    }

    newData.badges.forEach(badge => {
        if (!userData.badgesEarned.some(existingBadge => existingBadge.id === badge.id)) {
            console.log(`🏆 New badge earned for ${username}: ${badge.name}`);
            userData.badgesEarned.push({
                id: badge.id,
                name: badge.name,
                url: badge.url,
                icon_url: badge.icon_url,
                earned_date: today
            });
        }
    });

    // Write updated data to user-specific file
    fs.writeFileSync(userFilePath, JSON.stringify(userData, null, 2));
    console.log(`✅ Database updated for ${username} with new points and badges.`);

    return userData;
}

module.exports = trackPoints;
