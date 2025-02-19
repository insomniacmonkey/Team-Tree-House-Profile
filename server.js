const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const trackPoints = require("./server/utils/trackPoints");

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: "5mb" })); // Increase limit to 5MB

// Paths
const profiles = ["brandonmartin5", "chansestrode", "kellydollins"];
const dataFolderPath = path.join(__dirname, "public", "data");
const logFilePath = path.join(__dirname, "server", "log.txt");

// Ensure `data` folder exists
if (!fs.existsSync(dataFolderPath)) {
    fs.mkdirSync(dataFolderPath, { recursive: true });
}

// Ensure log.txt exists
if (!fs.existsSync(logFilePath)) {
    fs.writeFileSync(logFilePath, "=== Points Tracking Log ===\n", "utf8");
}

// Append to log file
const appendLog = (message) => {
    const now = new Date().toLocaleString("en-US", { timeZone: "America/Chicago" });
    const [month, day, year] = now.split(",")[0].split("/"); // MM/DD/YYYY format
    const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`; // Convert to YYYY-MM-DD

    const logFileName = `log_${dateStr}.txt`;
    const logFilePath = path.join(__dirname, "server/logs", logFileName);

    const logMessage = `[${now}] ${message}\n`;

    // Ensure the server directory exists
    const logDir = path.join(__dirname, "server");
    if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
    }

    fs.appendFileSync(logFilePath, logMessage, "utf8");
};



// Get points data for a specific profile
app.get("/api/points/:username", (req, res) => {
    const username = req.params.username;
    const filePath = path.join(dataFolderPath, `${username}.json`);

    if (!fs.existsSync(filePath)) {
        return res.status(404).json({ message: `No data found for ${username}` });
    }

    try {
        const data = fs.readFileSync(filePath, "utf8");
        res.json(JSON.parse(data));
    } catch (error) {
        console.error(`❌ Error reading data for ${username}:`, error);
        res.status(500).json({ message: `Error reading data for ${username}` });
    }
});

// Fetch data for all profiles
const fetchDataForProfiles = async () => {
    for (const username of profiles) {
        try {
            if (typeof username !== "string") {
                console.error(`❌ Invalid username detected: ${JSON.stringify(username)}`);
                appendLog(`❌ Skipping invalid username: ${JSON.stringify(username)}`);
                continue; // Skip this iteration
            }

            console.log(`🔄 Fetching data for ${username}...`);
            const response = await axios.get(`https://teamtreehouse.com/profiles/${username}.json`);
            const newData = response.data;

            if (!newData || typeof newData !== "object") {
                console.error(`❌ Error: Invalid response format for ${username}`);
                appendLog(`❌ Invalid API response for ${username}. Skipping update.`);
                continue;
            }

            if (!newData.points || typeof newData.points.total !== "number") {
                console.error(`❌ Error: Missing 'points' data for ${username}`);
                appendLog(`❌ No valid points data for ${username}. Skipping update.`);
                continue;
            }

            const filePath = path.join(dataFolderPath, `${username}.json`);
            let existingData = {};

            // ✅ Read existing data if it exists
            if (fs.existsSync(filePath)) {
                try {
                    existingData = JSON.parse(fs.readFileSync(filePath, "utf8"));
                } catch (readError) {
                    console.error(`❌ Error reading existing data for ${username}:`, readError);
                    appendLog(`❌ Error reading existing data for ${username}. Resetting data.`);
                }
            }

            // Ensure the structure is correct
            existingData.points = existingData.points || { total: 0, categories: {} };
            existingData.badges = existingData.badges || [];

            // ✅ Merge points data
            const updatedPoints = { ...existingData.points.categories };

            Object.keys(newData.points).forEach((category) => {
                if (category !== "total") {
                    updatedPoints[category] = (updatedPoints[category] || 0) + newData.points[category];
                }
            });

            existingData.points = {
                total: newData.points.total, // Update total points
                categories: updatedPoints, // Update category-wise points
            };

            // ✅ Merge new badges (avoid duplicates)
            const existingBadgeIds = new Set(existingData.badges.map(badge => badge.id));
            const newBadges = newData.badges.filter(badge => !existingBadgeIds.has(badge.id));

            if (newBadges.length > 0) {
                existingData.badges.push(...newBadges);
            }

            // ✅ Write updated data back to file
            fs.writeFileSync(filePath, JSON.stringify(existingData, null, 2));

            console.log(`✅ Points & Badges updated successfully for ${username}.`);
            
            // 📝 Append Log with Category Breakdown
            let categoryLogs = `✅ Points updated for ${username}. Total: ${existingData.points.total}.`;
            Object.entries(updatedPoints).forEach(([category, points]) => {
                categoryLogs += ` ${category}: ${points} points.`;
            });

            appendLog(categoryLogs);
            appendLog(`✅ New badges for ${username}: ${newBadges.length}`);

        } catch (error) {
            console.error(`❌ Error fetching data for ${username}:`, error.message);
            appendLog(`❌ Error fetching data for ${username}: ${error.message}`);
        }
    }
};



//setInterval(fetchDataForProfiles, 3600000); // Runs every hour (3600000 ms)

setInterval(fetchDataForProfiles, 60000); // Fetch data every minute for testing

//setInterval(fetchDataForProfiles, 300000); // fetch data every 5 minutes

// Start Server
app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
    appendLog("✅ Server started.");
});
