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
    const timestamp = new Date().toLocaleString("en-US", { timeZone: "America/Chicago" });
    const logMessage = `[${timestamp}] ${message}\n`;
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
    console.log("🔄 Fetching data for all profiles...");

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

            // ✅ Ensure username is passed as a string
            const updatedData = trackPoints(username.toString(), {
                points: newData.points,
                badges: newData.badges || [],
            });

            // ✅ Ensure correct file path format
            const filePath = path.join(dataFolderPath, `${username}.json`);
            fs.writeFileSync(filePath, JSON.stringify(updatedData, null, 2));

            console.log(`✅ Points updated successfully for ${username}.`);
            appendLog(`✅ Points updated for ${username}. Total: ${updatedData.lastRecorded.total}`);

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
