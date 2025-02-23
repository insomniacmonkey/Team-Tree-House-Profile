/**
 * usePointsData.js
 * 
 * This custom React hook is responsible for fetching and managing user points 
 * and badge data from the local JSON files stored on Render's persistent disk.
 * It allows components to retrieve and display user progress dynamically.
 * 
 * Key functionalities:
 * - Fetches points and badge data from `/public/data/{username}.json`.
 * - Stores retrieved data in state (`points`, `badges`).
 * - Handles errors gracefully and sets an `error` flag if the fetch fails.
 * - Automatically re-fetches data when the `username` prop changes.
 * 
 * This hook is primarily used in components that need to display user progress 
 * and achievements in the UI, ensuring real-time updates when the data changes.
 */

import { useState, useEffect } from "react";

const usePointsData = (username) => {
    const [points, setPoints] = useState(null);
    const [badges, setBadges] = useState([]);
    const [error, setError] = useState(false);

    const fetchPoints = async () => {
        try {
            const baseUrl = process.env.NODE_ENV === "production" 
                ? "https://team-tree-house-profile.onrender.com/" 
                : ""; // Use relative path locally
    
            const response = await fetch(`${baseUrl}/data/${username}.json`);
            if (!response.ok) throw new Error("Failed to load points data");
    
            const data = await response.json();
            setPoints(data);
            setBadges(data.badgesEarned || []);
            setError(false);
        } catch (err) {
            console.error(`❌ Error fetching points for ${username}:`, err);
            setError(true);
        }
    };
    
    

    useEffect(() => {
        if (username) {
            fetchPoints();
        }
    }, [username]); // Re-fetch data when username changes

    return { points, badges, error };
};

export default usePointsData;
