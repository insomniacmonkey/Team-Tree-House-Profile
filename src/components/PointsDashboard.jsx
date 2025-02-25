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
 *
 * Updated and modernized UI with a green color theme.
 */
import React, { useState, useEffect } from "react";
import usePointsData from "../hooks/usePointsData";
import { filterHistory, groupHistoryByYearAndMonth } from "../utils/pointsUtils";
import "../PointsDashboard.css"; // Importing CSS file

const TABS = ["Today", "This Week", "This Month", "This Year", "All"];

const PointsDashboard = () => {
    const DROPDOWN_OPTIONS = ["chansestrode", "brandonmartin5", "kellydollins"];
    const [selectedOption, setSelectedOption] = useState(DROPDOWN_OPTIONS[0]);
    const { points, badges, error } = usePointsData(selectedOption);
    const [activeTab, setActiveTab] = useState("Today");
    const [expandedMonths, setExpandedMonths] = useState({});
    const [lastUpdated, setLastUpdated] = useState(null);

    useEffect(() => {
        fetch('/api/last-updated')
            .then((res) => res.json())
            .then((data) => setLastUpdated(data.lastUpdated))
            .catch((error) => console.error("Error fetching last updated time:", error));
    }, [selectedOption]);

    const calculatePeriodTotal = (period) => {
        return filterHistory(points.history, period).reduce(
            (sum, entry) => sum + entry.totalGained,
            0
        );
    };

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
            const badgeUTC = new Date(badge.earned_date);
            const badgeCST = new Date(
                badgeUTC.toLocaleString("en-US", { timeZone: "America/Chicago" })
            );
            const badgeDate = `${badgeCST.getFullYear()}-${String(
                badgeCST.getMonth() + 1
            ).padStart(2, "0")}-${String(badgeCST.getDate()).padStart(2, "0")}`;
            return badgeDate === date;
        });
    };

    if (error) {
        return (
            <div className="dashboard-container">
                <h1 className="dashboard-title">Team TreeHouse Points Dashboard</h1>
                <select className="dropdown" value={selectedOption} onChange={(e) => setSelectedOption(e.target.value)}>
                    {DROPDOWN_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                            {option}
                        </option>
                    ))}
                </select>
                <p className="error-message">❌ Error: Could not fetch points.</p>
            </div>
        );
    }

    if (!points) return <p className="loading">Loading...</p>;

    const filteredHistory = filterHistory(points?.history || [], activeTab);
    const historyByYearAndMonth = groupHistoryByYearAndMonth(points.history);

    return (
        <div className="dashboard-container">
            <div className="header">
                <h1 className="dashboard-title">Team TreeHouse Points Dashboard</h1>
                {lastUpdated && <p className="last-updated">Last Updated: {new Date(lastUpdated).toLocaleString()}</p>}
                <select className="dropdown" value={selectedOption} onChange={(e) => setSelectedOption(e.target.value)}>
                    {DROPDOWN_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                            {option}
                        </option>
                    ))}
                </select>
            </div>

            <div className="stats-grid">
                {[
                    { label: "Total Points", value: points.lastRecorded?.total || 0 },
                    { label: "This Week", value: calculatePeriodTotal("This Week") },
                    { label: "This Month", value: calculatePeriodTotal("This Month") },
                    { label: "This Year", value: calculatePeriodTotal("This Year") },
                ].map((stat, index) => (
                    <div key={index} className="stat-card">
                        <p className="stat-label">{stat.label}:</p>
                        <p className="stat-value">{stat.value}</p>
                    </div>
                ))}
            </div>
            <a href={`https://teamtreehouse.com/profiles/${selectedOption}`} target="_blank" rel="noopener noreferrer" className="profile-link">
                View {selectedOption}'s Profile
            </a>
            <div>
                {/* Tabs Navigation */}
                <div className="tabs">
                    {TABS.map((tab) => (
                        <button key={tab} className={`tab-button ${activeTab === tab ? "active" : ""}`} onClick={() => setActiveTab(tab)}>
                            {tab}
                        </button>
                    ))}
                </div>
                {activeTab === "All" ? (
                    <div className="history-container">
                        {Object.keys(historyByYearAndMonth)
                            .sort((a, b) => b - a)
                            .map((year) => (
                                <div key={year} className="history-entry">
                                    <h3 className="badges-title">
                                        {year}
                                    </h3>
                                    {Object.keys(historyByYearAndMonth[year])
                                        .sort(
                                            (a, b) =>
                                                new Date(`${b} 1, ${year}`) -
                                                new Date(`${a} 1, ${year}`)
                                        )
                                        .map((month) => (
                                            <div key={month} className="ml-4">
                                                <button
                                                    className="text-lg font-semibold text-green-600 hover:underline flex items-center"
                                                    onClick={() => toggleMonthExpansion(year, month)}
                                                >
                                                    {expandedMonths[`${year}-${month}`]
                                                        ? "▼"
                                                        : "►"}{" "}
                                                    {month}
                                                </button>
                                                {expandedMonths[`${year}-${month}`] && (
                                                    <ul className="ml-6 mt-2 border-l pl-4">
                                                        {historyByYearAndMonth[year][month].map(
                                                            (entry, index) => {
                                                                const earnedBadges =
                                                                    getBadgesForDate(entry.date);
                                                                return (
                                                                    <li key={index} className="border-b py-2">
                                                                        <strong>
                                                                            {entry.date}:
                                                                        </strong>{" "}
                                                                        {entry.totalGained} points
                                                                        <div className="mt-2">
                                                                            <h3 className="text-md font-semibold text-green-700">
                                                                                📊 Points Breakdown:
                                                                            </h3>
                                                                            {entry.pointsBreakdown &&
                                                                            Object.keys(
                                                                                entry.pointsBreakdown
                                                                            ).length > 0 ? (
                                                                                <ul className="list-disc ml-4">
                                                                                    {Object.entries(
                                                                                        entry.pointsBreakdown
                                                                                    ).map(
                                                                                        ([
                                                                                            category,
                                                                                            points,
                                                                                        ]) => (
                                                                                            <li key={category}>
                                                                                                {category}:{" "}
                                                                                                {points} points
                                                                                            </li>
                                                                                        )
                                                                                    )}
                                                                                </ul>
                                                                            ) : (
                                                                                <p className="text-green-500">
                                                                                    No detailed breakdown
                                                                                    available.
                                                                                </p>
                                                                            )}
                                                                        </div>
                                                                        <div className="mt-2">
                                                                            <h3 className="text-md font-semibold text-green-700">
                                                                                🏅 Badges Earned:
                                                                            </h3>
                                                                            {earnedBadges.length > 0 ? (
                                                                                <ul className="list-disc ml-4">
                                                                                    {earnedBadges.map((badge) => (
                                                                                        <li
                                                                                            key={badge.id}
                                                                                            className="flex items-center space-x-3"
                                                                                        >
                                                                                            <img
                                                                                                src={
                                                                                                    badge.icon_url
                                                                                                }
                                                                                                alt={
                                                                                                    badge.name
                                                                                                }
                                                                                                className="w-6 h-6"
                                                                                            />
                                                                                            <a
                                                                                                href={
                                                                                                    badge.url
                                                                                                }
                                                                                                target="_blank"
                                                                                                rel="noopener noreferrer"
                                                                                                className="text-green-600 hover:underline"
                                                                                            >
                                                                                                {badge.name}
                                                                                            </a>
                                                                                        </li>
                                                                                    ))}
                                                                                </ul>
                                                                            ) : (
                                                                                <p className="text-green-500">
                                                                                    No badges earned on this day.
                                                                                </p>
                                                                            )}
                                                                        </div>
                                                                    </li>
                                                                );
                                                            }
                                                        )}
                                                    </ul>
                                                )}
                                            </div>
                                        ))}
                                </div>
                            ))}
                    </div>
                ) : (
                    <ul className="history-container">
                        {filteredHistory.length > 0 ? (
                            filteredHistory.map((entry, index) => {
                                const earnedBadges = getBadgesForDate(entry.date);
                                return (
                                    <li key={index} className="history-entry">
                                        <strong>{entry.date}:</strong> {entry.totalGained} points
                                        <div className="mt-2">
                                            <h3 className="text-md font-semibold text-green-700">
                                                📊 Points Breakdown:
                                            </h3>
                                            {entry.pointsBreakdown &&
                                            Object.keys(entry.pointsBreakdown).length > 0 ? (
                                                <ul className="list-disc ml-4">
                                                    {Object.entries(entry.pointsBreakdown).map(
                                                        ([category, points]) => (
                                                            <li key={category}>
                                                                {category}: {points} points
                                                            </li>
                                                        )
                                                    )}
                                                </ul>
                                            ) : (
                                                <p className="text-green-500">
                                                    No detailed breakdown available.
                                                </p>
                                            )}
                                        </div>
                                        <div className="mt-2">
                                            <h3 className="text-md font-semibold text-green-700">
                                                🏅 Badges Earned:
                                            </h3>
                                            {earnedBadges.length > 0 ? (
                                                <ul className="list-disc ml-4">
                                                    {earnedBadges.map((badge) => (
                                                        <li key={badge.id} className="flex items-center space-x-3">
                                                            <img
                                                                src={badge.icon_url}
                                                                alt={badge.name}
                                                                className="w-6 h-6"
                                                            />
                                                            <a
                                                                href={badge.url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-green-600 hover:underline"
                                                            >
                                                                {badge.name}
                                                            </a>
                                                        </li>
                                                    ))}
                                                </ul>
                                            ) : (
                                                <p className="text-green-500">
                                                    No badges earned on this day.
                                                </p>
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
        </div>
    );
};

export default PointsDashboard;
