import axios from "axios";

const trackPoints = async () => {
    try {
        // Fetch latest profile data from API
        const newData = await axios.get("https://teamtreehouse.com/profiles/chansestrode.json");

        if (!newData.data) {
            console.error("❌ No data fetched from API");
            return;
        }

        // Send the new data to the backend to process
        const response = await axios.post("http://localhost:5000/api/track", {
            points: newData.data.points,
            badges: newData.data.badges || []
        });

        console.log("✅ Points updated successfully:", response.data);
    } catch (error) {
        console.error("❌ Error tracking points:", error);
    }
};

export default trackPoints;
