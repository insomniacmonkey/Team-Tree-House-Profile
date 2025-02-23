/**
 * fetchData.js
 * 
 * This module handles fetching user points and badge data from the backend API.
 * It retrieves data from the Express server running on `http://localhost:5000`
 * and returns the user's latest recorded progress.
 * 
 * Key functionalities:
 * - Makes a GET request to `/api/points/{username}` to fetch user data.
 * - Returns the fetched data or `null` if an error occurs.
 * - Logs errors to the console for debugging purposes.
 * 
 * This function is used in various parts of the system where real-time user 
 * progress needs to be displayed or processed.
 */


import axios from "axios";

// Log window.location.origin to debug in the browser console
console.log("🌎 Current Origin:", window.location.origin);

const baseUrl = window.location.origin.includes("onrender.com") 
    ? "https://team-tree-house-profile.onrender.com"  // Render backend URL
    : "http://localhost:5000";  // Local development

const fetchData = async (username) => {
    try {
        const response = await axios.get(`${baseUrl}/api/points/${username}`);
        return response.data;
    } catch (error) {
        console.error(`❌ Error fetching data for ${username}:`, error.message);
        return null;
    }
};

export default fetchData;
