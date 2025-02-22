/**
 * server.js
 * 
 * This file initializes and runs the Express.js server responsible for handling 
 * user points data and logging system activities. It fetches user profiles, 
 * tracks points, and stores updated records in JSON files.
 * 
 * Key functionalities:
 * - Serves as the backend API to provide user points data (`/api/points/:username`).
 * - Fetches data from the Team Treehouse API and updates user records.
 * - Logs system activities into daily log files (`log_YYYY-MM-DD.txt`).
 * - Runs on port `5000` and includes middleware for CORS and JSON handling.
 * - Uses `trackPoints.js` to process and update user progress.
 * - Periodically fetches data at configurable intervals.
 * 
 * This file is essential for keeping user data up-to-date and ensuring accurate
 * progress tracking across the system.
 */


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
const logsFolderPath = path.join(__dirname, "server/logs");

// Ensure `data` and `logs` folders exist
if (!fs.existsSync(dataFolderPath)) {
    fs.mkdirSync(dataFolderPath, { recursive: true });
}
if (!fs.existsSync(logsFolderPath)) {
    fs.mkdirSync(logsFolderPath, { recursive: true });
}

// Function to get the current CST log file path
const getLogFilePath = () => {
    const nowCST = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Chicago" }));
    const logFileName = `log_${nowCST.getFullYear()}-${String(nowCST.getMonth() + 1).padStart(2, "0")}-${String(nowCST.getDate()).padStart(2, "0")}.txt`;
    return path.join(logsFolderPath, logFileName);
};

// Append to log file with correct timestamp
const appendLog = (message) => {

    const logFilePath = getLogFilePath(); // Get current log file based on CST date
    const timestamp = new Date().toLocaleString("en-US", { timeZone: "America/Chicago" });
    const logMessage = `[${timestamp}] ${message}\n`;

    // Ensure the log file for today exists
    if (!fs.existsSync(logFilePath)) {
        fs.writeFileSync(logFilePath, "=== Points Tracking Log ===\n", "utf8");
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

            console.log(`✅ Points updated successfully for ${username}.`);

            let categoryLogs = `✅ Points updated for ${username}. Total: ${updatedData.lastRecorded.total}.`;

            // ✅ Ensure categories exist before logging
            if (updatedData.lastRecorded.categories && Object.keys(updatedData.lastRecorded.categories).length > 0) {
                Object.entries(updatedData.lastRecorded.categories).forEach(([category, points]) => {
                    categoryLogs += ` ${category}: ${points} points.`;
                });
            } else {
                categoryLogs += ` No category points found.`;
            }

            // ✅ Log existing earned points for the day
            const today = new Date().toISOString().split("T")[0];
            const todayEntry = updatedData.history.find(entry => entry.date.startsWith(today));

            if (todayEntry) {
                categoryLogs += ` | Earned today: ${todayEntry.totalGained} points. Breakdown:`;
                Object.entries(todayEntry.pointsBreakdown).forEach(([category, points]) => {
                    categoryLogs += ` ${category}: ${points} points.`;
                });
            } else {
                categoryLogs += ` | No points earned today yet.`;
            }

            // ✅ Always append log message
            //console.log(categoryLogs); // Debugging log
            appendLog(categoryLogs);

        } catch (error) {
            console.error(`❌ Error fetching data for ${username}:`, error.message);
            appendLog(`❌ Error fetching data for ${username}: ${error.message}`);
        }
    }
};



//setInterval(fetchDataForProfiles, 60000); // Fetch data every minute
//setInterval(fetchDataForProfiles, 300000); // Fetch every 5 minutes
//setInterval(fetchDataForProfiles, 600000); // Fetch every 10 minutes
//setInterval(fetchDataForProfiles, 1800000); // Fetch every 30 minutes
setInterval(fetchDataForProfiles, 3600000); // Fetch every hour


// Start Server
app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
    appendLog("✅ Server started.");
});
