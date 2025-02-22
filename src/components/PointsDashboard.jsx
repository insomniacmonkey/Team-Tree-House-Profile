/**
 * PointsDashboard.jsx
 * 
 * This React component serves as the main dashboard for displaying user points,
 * badges, and historical progress. It allows users to switch between different 
 * time-based views (Today, This Week, This Month, This Year, All) and see their 
 * earned points and badges dynamically.
 * 
 * Key functionalities:
 * - Fetches user data using `usePointsData` and displays total points.
 * - Allows users to switch between different time filters.
 * - Displays historical points grouped by year and month.
 * - Expands/collapses monthly breakdowns in the "All" tab.
 * - Fetches and displays badges earned on specific dates.
 * 
 * This component ensures a clear and interactive way for users to track their 
 * progress and achievements within the system.
 */

import React, { useState } from "react";
import usePointsData from "../hooks/usePointsData";
import { filterHistory, groupHistoryByYearAndMonth } from "../utils/pointsUtils";

const TABS = ["Today", "This Week", "This Month", "This Year", "All"];

const PointsDashboard = () => {
    const DROPDOWN_OPTIONS = ["chansestrode", "brandonmartin5", "kellydollins"];
    const [selectedOption, setSelectedOption] = useState(DROPDOWN_OPTIONS[0]);
    const { points, badges, error } = usePointsData(selectedOption);
    const [activeTab, setActiveTab] = useState("Today");
    const [expandedMonths, setExpandedMonths] = useState({});
  


    if (error) {
        return (
            <div className="p-4">
                <h1 className="text-2xl font-bold\">Points Dashboard</h1>
            <select
                className="border px-3 py-1 rounded-md bg-white shadow-sm\"
                value={selectedOption}
                onChange={(e) => setSelectedOption(e.target.value)}
            >
                {DROPDOWN_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                        {option}
                    </option>
                ))}
            </select>
                

                <p className="text-red-500">❌ Error: Could not fetch points. Check if `public/data/points.json` exists.</p>
            </div>
        );
    }

    if (!points) return <p>Loading...</p>;

    const filteredHistory = filterHistory(points?.history || [], activeTab);
    const historyByYearAndMonth = groupHistoryByYearAndMonth(points.history);

    // Toggle expansion for "All" tab
    const toggleMonthExpansion = (year, month) => {
        setExpandedMonths((prev) => ({
            ...prev,
            [`${year}-${month}`]: !prev[`${year}-${month}`],
        }));
    };

    // Get badges earned on a given date
    const getBadgesForDate = (date) => {

        return badges.filter((badge) => {
            // Convert badge timestamp to CST/CDT
            const badgeUTC = new Date(badge.earned_date);
            const badgeCST = new Date(badgeUTC.toLocaleString("en-US", { timeZone: "America/Chicago" }));
    
            // Format YYYY-MM-DD in CST
            const badgeDate = `${badgeCST.getFullYear()}-${String(badgeCST.getMonth() + 1).padStart(2, "0")}-${String(badgeCST.getDate()).padStart(2, "0")}`;
    
            //console.log(`🎖 Badge: ${badge.name} | UTC: ${badge.earned_date} | CST: ${badgeDate} | Expected: ${date}`);
    
            return badgeDate === date;
        });

    };
    

    return (
        <div className="p-4 space-y-4">
            <h1 className="text-2xl font-bold">Select User</h1>
          <select
                    className="border px-3 py-1 rounded-md bg-white shadow-sm"
                    value={selectedOption}
                    onChange={(e) => setSelectedOption(e.target.value)}
                >
                    {DROPDOWN_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                            {option}
                        </option>
                    ))}
                </select>
            <p className="text-xl">Total Points: {points.lastRecorded?.total || 0}</p>
            {/* User Profile Link */}
            <p className="mt-2">
                <a 
                    href={`https://teamtreehouse.com/profiles/${selectedOption}`} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-blue-500 hover:underline"
                >
                    View {selectedOption}'s Profile
                </a>
            </p>

            {/* Tabs Navigation */}
            <div className="flex space-x-2 border-b mb-4">
                {TABS.map((tab) => (
                    <button
                        key={tab}
                        className={`px-4 py-2 ${activeTab === tab ? "border-b-4 border-blue-500 font-bold" : "text-gray-500"}`}
                        onClick={() => setActiveTab(tab)}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* "All" Tab: Grouped by Year → Month */}
            {activeTab === "All" ? (
                <div className="border rounded-md p-2 bg-gray-100">
                    {Object.keys(historyByYearAndMonth)
                        .sort((a, b) => b - a)
                        .map((year) => (
                            <div key={year} className="mb-4">
                                <h3 className="text-xl font-bold border-b pb-1">{year}</h3>
                                {Object.keys(historyByYearAndMonth[year])
                                    .sort((a, b) => new Date(`${b} 1, ${year}`) - new Date(`${a} 1, ${year}`))
                                    .map((month) => (
                                        <div key={month} className="ml-4">
                                            <button
                                                className="text-lg font-semibold text-blue-500 hover:underline flex items-center"
                                                onClick={() => toggleMonthExpansion(year, month)}
                                            >
                                                {expandedMonths[`${year}-${month}`] ? "▼" : "►"} {month}
                                            </button>
                                            {expandedMonths[`${year}-${month}`] && (
                                                <ul className="ml-6 mt-2 border-l pl-4">
                                                    {historyByYearAndMonth[year][month].map((entry, index) => {
                                                        const earnedBadges = getBadgesForDate(entry.date);
                                                        return (
                                                            <li key={index} className="border-b py-2">
                                                                <strong>{entry.date}:</strong> {entry.totalGained} points
                                                                <div className="mt-2">
                                                                    <h3 className="text-md font-semibold">📊 Points Breakdown:</h3>
                                                                    {entry.pointsBreakdown && Object.keys(entry.pointsBreakdown).length > 0 ? (
                                                                        <ul className="list-disc ml-4">
                                                                            {Object.entries(entry.pointsBreakdown).map(([category, points]) => (
                                                                                <li key={category}>{category}: {points} points</li>
                                                                            ))}
                                                                        </ul>
                                                                    ) : (
                                                                        <p className="text-gray-500">No detailed breakdown available.</p>
                                                                    )}
                                                                </div>
                                                                <div className="mt-2">
                                                                    <h3 className="text-md font-semibold">🏅 Badges Earned:</h3>
                                                                    {earnedBadges.length > 0 ? (
                                                                        <ul className="list-disc ml-4">
                                                                            {earnedBadges.map((badge) => (
                                                                                <li key={badge.id} className="flex items-center space-x-3">
                                                                                    <img src={badge.icon_url} alt={badge.name} className="w-6 h-6" />
                                                                                    <a href={badge.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                                                                                        {badge.name}
                                                                                    </a>
                                                                                </li>
                                                                            ))}
                                                                        </ul>
                                                                    ) : (
                                                                        <p className="text-gray-500">No badges earned on this day.</p>
                                                                    )}
                                                                </div>
                                                            </li>
                                                        );
                                                    })}
                                                </ul>
                                            )}
                                        </div>
                                    ))}
                            </div>
                        ))}
                </div>
            ) : (
                // ✅ Fixed: Show Points Breakdown in Other Tabs Too
                <ul className="border rounded-md p-2 bg-gray-100">
                    {filteredHistory.length > 0 ? (
                        filteredHistory.map((entry, index) => {
                            const earnedBadges = getBadgesForDate(entry.date);
                            return (
                                <li key={index} className="border-b py-2">
                                    <strong>{entry.date}:</strong> {entry.totalGained} points
                                    <div className="mt-2">
                                        <h3 className="text-md font-semibold">📊 Points Breakdown:</h3>
                                        {entry.pointsBreakdown && Object.keys(entry.pointsBreakdown).length > 0 ? (
                                            <ul className="list-disc ml-4">
                                                {Object.entries(entry.pointsBreakdown).map(([category, points]) => (
                                                    <li key={category}>{category}: {points} points</li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <p className="text-gray-500">No detailed breakdown available.</p>
                                        )}
                                    </div>
                                    <div className="mt-2">
                                        <h3 className="text-md font-semibold">🏅 Badges Earned:</h3>
                                        {earnedBadges.length > 0 ? (
                                            <ul className="list-disc ml-4">
                                                {earnedBadges.map((badge) => (
                                                    <li key={badge.id} className="flex items-center space-x-3">
                                                        <img src={badge.icon_url} alt={badge.name} className="w-6 h-6" />
                                                        <a href={badge.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                                                            {badge.name}
                                                        </a>
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <p className="text-gray-500">No badges earned on this day.</p>
                                        )}
                                    </div>
                                </li>
                            );
                        })
                    ) : (
                        <p>No history available for {activeTab}.</p>
                    )}
                </ul>
            )}
        </div>
    );
};

export default PointsDashboard;
