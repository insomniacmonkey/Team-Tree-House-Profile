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

    // Helper function to calculate points for a specific period
    const calculatePeriodTotal = (period) => {
        return filterHistory(points.history, period).reduce(
            (sum, entry) => sum + entry.totalGained,
            0
        );
    };

    if (error) {
        return (
            <div className="p-6 bg-green-50 rounded-lg shadow-lg">
                <h1 className="text-2xl font-bold text-green-700">Points Dashboard</h1>
                <select
                    className="border px-3 py-1 rounded-md bg-white shadow-sm mt-4"
                    value={selectedOption}
                    onChange={(e) => setSelectedOption(e.target.value)}
                >
                    {DROPDOWN_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                            {option}
                        </option>
                    ))}
                </select>
                <p className="text-red-500 mt-4">
                    ❌ Error: Could not fetch points. Check if `public/data/filename.json` exists.
                </p>
            </div>
        );
    }

    if (!points) return <p className="p-6">Loading...</p>;

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

    return (
        <div className="p-6 space-y-6 bg-green-50 min-h-screen">
            <div className="flex flex-col md:flex-row justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-green-700">Points Dashboard</h1>
                    {lastUpdated && (
                        <p className="text-sm text-green-600">
                            Last Updated: {new Date(lastUpdated).toLocaleString()}
                        </p>
                    )}
                </div>
                <div>
                    <label htmlFor="userSelect" className="mr-2 font-medium text-green-700">
                        Select User:
                    </label>
                    <select
                        id="userSelect"
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
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-white rounded-lg shadow">
                    <p className="text-xl font-semibold text-green-700">Total Points:</p>
                    <p className="text-2xl">{points.lastRecorded?.total || 0}</p>
                </div>
                <div className="p-4 bg-white rounded-lg shadow">
                    <p className="text-xl font-semibold text-green-700">This Week:</p>
                    <p className="text-2xl">{calculatePeriodTotal("This Week")}</p>
                </div>
                <div className="p-4 bg-white rounded-lg shadow">
                    <p className="text-xl font-semibold text-green-700">This Month:</p>
                    <p className="text-2xl">{calculatePeriodTotal("This Month")}</p>
                </div>
                <div className="p-4 bg-white rounded-lg shadow">
                    <p className="text-xl font-semibold text-green-700">This Year:</p>
                    <p className="text-2xl">{calculatePeriodTotal("This Year")}</p>
                </div>
            </div>
            <div>
                <a
                    href={`https://teamtreehouse.com/profiles/${selectedOption}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-green-600 hover:underline font-medium"
                >
                    View {selectedOption}'s Profile
                </a>
            </div>
            <div>
                {/* Tabs Navigation */}
                <div className="flex space-x-4 border-b mb-4">
                    {TABS.map((tab) => (
                        <button
                            key={tab}
                            className={`px-4 py-2 transition-colors duration-200 ${
                                activeTab === tab
                                    ? "border-b-4 border-green-500 font-bold text-green-700"
                                    : "text-green-500 hover:text-green-700"
                            }`}
                            onClick={() => setActiveTab(tab)}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
                {activeTab === "All" ? (
                    <div className="border rounded-lg p-4 bg-white shadow">
                        {Object.keys(historyByYearAndMonth)
                            .sort((a, b) => b - a)
                            .map((year) => (
                                <div key={year} className="mb-4">
                                    <h3 className="text-xl font-bold border-b pb-1 text-green-700">
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
                    <ul className="border rounded-lg p-4 bg-white shadow">
                        {filteredHistory.length > 0 ? (
                            filteredHistory.map((entry, index) => {
                                const earnedBadges = getBadgesForDate(entry.date);
                                return (
                                    <li key={index} className="border-b py-2">
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
