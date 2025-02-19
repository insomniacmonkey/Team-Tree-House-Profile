/**
 * pointsUtils.js
 * 
 * This file contains utility functions for handling and processing user points history
 * within the system. It ensures that all date-related operations are correctly 
 * aligned with Central Standard Time (CST/CDT) and supports various filtering and 
 * formatting functions to help display user progress accurately.
 * 
 * Key functionalities:
 * - Converts timestamps to CST/CDT and formats them in `YYYY-MM-DD`.
 * - Filters user history based on selected tabs (Today, This Week, This Month, This Year).
 * - Groups historical point data by year and month for structured reporting.
 * - Fixes badge visibility issues by ensuring earned dates are correctly formatted.
 * 
 * This file is used throughout the system to standardize date processing and ensure 
 * that user activity data is displayed correctly on the front end.
 */


// ✅ Get the correct Sunday (start of week) in CST/CDT
const getSundayOfWeek = (date) => {
    const cstDate = new Date(new Date(date).toLocaleString("en-US", { timeZone: "America/Chicago" }));
    const sunday = new Date(cstDate);
    sunday.setDate(sunday.getDate() - sunday.getDay());
    sunday.setHours(0, 0, 0, 0);
    return toCentralDate(sunday); // Ensure YYYY-MM-DD format
};

// ✅ Get the first day of the month in CST/CDT
const getFirstOfMonth = (date) => {
    const cstDate = new Date(new Date(date).toLocaleString("en-US", { timeZone: "America/Chicago" }));
    return toCentralDate(new Date(cstDate.getFullYear(), cstDate.getMonth(), 1, 0, 0, 0, 0)); // Ensure YYYY-MM-DD format
};

// ✅ Convert date to `YYYY-MM-DD` in CST/CDT
const toCentralDate = (date) => {
    return new Date(new Date(date).toLocaleString("en-US", { timeZone: "America/Chicago" }))
        .toISOString()
        .split("T")[0]; // Format as YYYY-MM-DD
};

// ✅ Filter history based on active tab
export const filterHistory = (history, activeTab) => {
    const nowCST = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Chicago" }));
    //console.log(`🕒 Current CST Time: ${nowCST}`);
    const todayCST = `${nowCST.getFullYear()}-${String(nowCST.getMonth() + 1).padStart(2, "0")}-${String(nowCST.getDate()).padStart(2, "0")}`;
    //console.log(`📅 Today in CST: ${todayCST}`);
    const startOfThisWeek = getSundayOfWeek(nowCST);
    const startOfThisMonth = getFirstOfMonth(nowCST);

    return history.filter((entry) => {
        const entryCST = toCentralDate(entry.date); // Convert to YYYY-MM-DD format

        if (activeTab === "Today") {
            return entryCST === todayCST;
        }

        if (activeTab === "This Week") {
            return entryCST >= startOfThisWeek && entryCST <= todayCST;
        }

        if (activeTab === "This Month") {
            return entryCST >= startOfThisMonth && entryCST <= todayCST;
        }

        if (activeTab === "This Year") {
            return entryCST.startsWith(todayCST.slice(0, 4)); // Compare just the year
        }

        return true; // "All" tab shows everything
    });
};

// ✅ Group history by year and month for "All" tab (Corrected CST Handling)
export const groupHistoryByYearAndMonth = (history) => {
    const grouped = {};

    history.forEach((entry) => {
        const entryDate = new Date(entry.date); // Keep in UTC
        const year = entryDate.getUTCFullYear(); // Use UTC year
        const month = entryDate.toLocaleString("en-US", { month: "long", timeZone: "UTC" }); // Force month from UTC

        if (!grouped[year]) grouped[year] = {};
        if (!grouped[year][month]) grouped[year][month] = [];

        grouped[year][month].push(entry);
    });

    return grouped;
};




// ✅ Fix Badges Not Showing for Today & This Week
export const getBadgesForDate = (date, badges) => {
    return badges.filter((badge) => {
        const badgeDate = toCentralDate(badge.earned_date);
        return badgeDate === date;
    });
};
