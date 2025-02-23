/**
 * usePointsData.js
 * 
 * This custom React hook fetches and manages user points and badge data from the backend API.
 * It retrieves data dynamically and ensures real-time updates when the user changes.
 * 
 * Key functionalities:
 * - Fetches points and badge data from `/data/{username}.json`.
 * - Dynamically determines API URL based on deployment environment.
 * - Handles errors gracefully and logs fetch failures.
 * - Uses an abort controller to prevent memory leaks on component unmount.
 */

import { useState, useEffect } from "react";

const usePointsData = (username) => {
    const [points, setPoints] = useState(null);
    const [badges, setBadges] = useState([]);
    const [error, setError] = useState(false);

    // ✅ Dynamically determine backend API URL
    const baseUrl = window.location.origin.includes("onrender.com") 
        ? "https://team-tree-house-profile.onrender.com"
        : "";

    // ✅ Debugging log to confirm base URL
    console.log("🌎 API Base URL:", baseUrl);

    useEffect(() => {
        if (!username) return;

        const controller = new AbortController();
        const signal = controller.signal;

        const fetchPoints = async () => {
            try {
                const response = await fetch(`${baseUrl}/data/${username}.json`, { signal });

                if (!response.ok) {
                    throw new Error(`Failed to load points data: ${response.status} ${response.statusText}`);
                }

                const data = await response.json();
                setPoints(data);
                setBadges(data.badgesEarned || []);
                setError(false);
            } catch (err) {
                if (err.name !== "AbortError") {
                    console.error(`❌ Error fetching points for ${username}:`, err);
                    setError(true);
                }
            }
        };

        fetchPoints();

        return () => controller.abort(); // ✅ Clean up fetch on unmount
    }, [username]); // Re-fetch data when username changes

    return { points, badges, error };
};

export default usePointsData;
