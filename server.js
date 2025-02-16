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
const pointsFilePath = path.join(__dirname, "public", "data", "points.json");
const logFilePath = path.join(__dirname, "server", "log.txt");

// Ensure `points.json` exists
if (!fs.existsSync(pointsFilePath)) {
    fs.writeFileSync(
        pointsFilePath,
        JSON.stringify({
            lastRecorded: { total: 0, categories: {} },
            history: [],
            badgesEarned: []
        }, null, 2)
    );
}

// **🔹 Ensure log.txt exists**
if (!fs.existsSync(logFilePath)) {
    fs.writeFileSync(logFilePath, "=== Points Tracking Log ===\n", "utf8");
}

// **🔹 Append to log file**
const appendLog = (message) => {
    const timestamp = new Date().toLocaleString("en-US", { timeZone: "America/Chicago" });
    const logMessage = `[${timestamp}] ${message}\n`;
    fs.appendFileSync(logFilePath, logMessage, "utf8");
};

// **🔹 Get points.json data**
app.get("/api/points", (req, res) => {
    try {
        const data = fs.readFileSync(pointsFilePath, "utf8");
        res.json(JSON.parse(data));
    } catch (error) {
        console.error("❌ Error reading points data:", error);
        res.status(500).json({ message: "Error reading points data" });
    }
});

// **🔹 API to update points by calling trackPoints()**
app.post("/api/track", async (req, res) => {
    try {
        const newData = req.body;
        const updatedData = trackPoints(newData);

        // Save the updated data back to points.json
        fs.writeFileSync(pointsFilePath, JSON.stringify(updatedData, null, 2));

        // Log the update
        appendLog(`✅ Points updated via API. Total: ${updatedData.lastRecorded.total}`);

        res.json({ message: "✅ Points updated successfully", data: updatedData });
    } catch (error) {
        console.error("❌ Error updating points data:", error);
        res.status(500).json({ message: "Error updating points data" });
    }
});

// **🔹 Function to Fetch Data & Track Points**
const fetchDataAndTrackPoints = async () => {
    try {
        console.log("🔄 Fetching data and tracking points...");

        // Fetch latest profile data from API
        const response = await axios.get("https://teamtreehouse.com/profiles/chansestrode.json");
        const newData = response.data;

        if (!newData || !newData.points) {
            console.log("⚠️ No new data from API, skipping...");
            appendLog("⚠️ No new data fetched.");
            return;
        }

        // Call trackPoints function with new data
        const updatedData = trackPoints({
            points: newData.points,
            badges: newData.badges || []
        });

        // Save updated data to points.json
        fs.writeFileSync(pointsFilePath, JSON.stringify(updatedData, null, 2));

        console.log("✅ Points updated successfully.");

        // Log added points and badges
        const addedPoints = updatedData.history.length > 0 
            ? updatedData.history[updatedData.history.length - 1]
            : null;

        // ✅ FIX: Only log newly earned badges
        const previouslyEarnedBadges = new Set(updatedData.badgesEarned.map(b => b.id));
        const newBadges = (newData.badges || []).filter(badge => !previouslyEarnedBadges.has(badge.id));

        let logMessage = `✅ Points updated. Total: ${updatedData.lastRecorded.total}`;

        if (addedPoints) {
            logMessage += ` | Gained: ${addedPoints.totalGained} (${Object.entries(addedPoints.pointsBreakdown).map(([k, v]) => `${k}: ${v}`).join(", ")})`;
        }
        
        if (newBadges.length > 0) {
            logMessage += ` | New Badges: ${newBadges.map(b => b.name).join(", ")}`;
        }

        appendLog(logMessage);
    } catch (error) {
        console.error("❌ Error fetching data:", error);
        appendLog(`❌ Error fetching data: ${error.message}`);
    }
};

//setInterval(fetchDataAndTrackPoints, 3600000); // Runs every hour (3600000 ms)
setInterval(fetchDataAndTrackPoints, 60000); // Runs every minute (60000 ms)

// **Start Server**
app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
    appendLog("✅ Server started.");
});
