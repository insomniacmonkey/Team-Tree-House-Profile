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

    const lastRecorded = userData.lastRecorded;
    const newTotalPoints = typeof newData.points?.total === "number" ? newData.points.total : lastRecorded.total || 0;
    
    let totalPointsGained = newTotalPoints - lastRecorded.total;
    let pointsGained = {};

    
    // ✅ Ensure category points are tracked correctly
    userData.lastRecorded = {
        total: newTotalPoints,
        categories: {
            ...lastRecorded.categories, // Keep previous data
            ...pointsGained // Only add newly earned points
        }
    };


    console.log(`📊 Checking for new points earned for ${username}...`);
    console.log(`🔹 Previous Total: ${lastRecorded.total}, New Total: ${newData.points?.total}`);


    // ✅ FIX: Only include categories where points were actually gained
    Object.keys(newData.points || {}).forEach(category => {
        if (category !== 'total') {
            const newPointsInCategory = newData.points[category] || 0;
            const lastPointsInCategory = lastRecorded.categories?.[category] || 0;
            const pointDifference = newPointsInCategory - lastPointsInCategory;

            if (pointDifference > 0) {
                pointsGained[category] = pointDifference; // ✅ Only store categories where points increased
            }
        }
    });

    console.log(`🔹 Total Points Change Detected for ${username}: ${totalPointsGained}`);

    // Update history if there are actually points gained
    const nowCST = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Chicago" }));
    console.log(`🕒 Current CST Time: ${nowCST}`);
    const todayCST = `${nowCST.getFullYear()}-${String(nowCST.getMonth() + 1).padStart(2, "0")}-${String(nowCST.getDate()).padStart(2, "0")}`;
    console.log(`📅 Today in CST: ${todayCST}`);
   
    if (totalPointsGained > 0) {
        let existingEntry = userData.history.find(entry => entry.date.startsWith(todayCST));

        if (existingEntry) {
            existingEntry.totalGained += totalPointsGained;
            Object.keys(pointsGained).forEach(category => {
                existingEntry.pointsBreakdown[category] = 
                    (existingEntry.pointsBreakdown[category] || 0) + pointsGained[category];
            });
        } else {
            userData.history.push({
                date: todayCST,
                totalGained: totalPointsGained,
                pointsBreakdown: pointsGained
            });
        }
    }

    // Ensure `lastRecorded.categories` exists and updates properly
    userData.lastRecorded = {
        total: newTotalPoints,
        categories: {
            ...newData.points  // Overwrite with latest API data
        }
    };

    console.log(`🏅 Checking for new badges earned for ${username}...`);
    if (!userData.badgesEarned) {
        userData.badgesEarned = [];
    }

    // ✅ FIX: Remove unnecessary badge date assignment
    newData.badges.forEach(badge => {
        if (!userData.badgesEarned.some(existingBadge => existingBadge.id === badge.id)) {
            console.log(`🏆 New badge earned for ${username}: ${badge.name}`);
            userData.badgesEarned.push({
                id: badge.id,
                name: badge.name,
                url: badge.url,
                icon_url: badge.icon_url,
                earned_date: badge.earned_date
            });
        }
    });

    // Write updated data to user-specific file
    fs.writeFileSync(userFilePath, JSON.stringify(userData, null, 2));
    console.log(`✅ Database updated for ${username} with new points and badges.`);

    return userData;
}

module.exports = trackPoints;
