/**
 * usePointsData.js
 * 
 * This custom React hook fetches and manages user points and badge data from the static JSON files.
 * It retrieves data dynamically and ensures real-time updates when the username changes.
 *
 * Key functionalities:
 * - Fetches points and badge data from `/data/{username}.json`.
 * - Uses the browser's relative URL (no need for a separate base URL).
 * - Handles errors gracefully and logs fetch failures.
 * - Uses an AbortController to prevent memory leaks on component unmount.
 */

import { useState, useEffect } from "react";

const usePointsData = (username) => {
    const [points, setPoints] = useState(null);
    const [badges, setBadges] = useState([]);
    const [error, setError] = useState(false);

    // Set the API base URL based on the environment.
    // In development, use http://localhost:5000.
    // In production, use http://localhost:10000.
    const baseUrl = window.location.origin.includes("onrender.com") 
        ? "https://team-tree-house-profile.onrender.com"
        : "http://localhost:10000";

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

        return () => controller.abort(); // Clean up fetch on component unmount
    }, [username, baseUrl]);

    return { points, badges, error };
};

export default usePointsData;
