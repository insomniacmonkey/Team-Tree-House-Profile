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

// Path to points.json
const pointsFilePath = path.join(__dirname, "public", "data", "points.json");

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

        res.json({ message: "✅ Points updated successfully", data: updatedData });
    } catch (error) {
        console.error("❌ Error updating points data:", error);
        res.status(500).json({ message: "Error updating points data" });
    }
});

// **🔹 Function to Fetch Data & Track Points Every 1 Minute**
const fetchDataAndTrackPoints = async () => {
    try {
        console.log("🔄 Fetching data and tracking points...");

        // Fetch latest profile data from API
        const response = await axios.get("https://teamtreehouse.com/profiles/chansestrode.json");
        const newData = response.data;

        if (!newData || !newData.points) {
            console.log("⚠️ No new data from API, skipping...");
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
    } catch (error) {
        console.error("❌ Error fetching data:", error);
    }
};

setInterval(fetchDataAndTrackPoints, 21600000); // Runs every 6 hours


// **Start Server**
app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
});
