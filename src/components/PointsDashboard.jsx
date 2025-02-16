import React, { useState, useEffect } from "react";

const PointsDashboard = () => {
    const [points, setPoints] = useState(null);
    const [badges, setBadges] = useState([]);
    const [error, setError] = useState(false);

    // Fetch points and badges from public/data/points.json
    const fetchPoints = async () => {
        try {
            const response = await fetch("/data/points.json");
            if (!response.ok) throw new Error("Failed to load points data");

            const data = await response.json();
            setPoints(data);
            setBadges(data.badgesEarned || []);
            setError(false); // Reset error if successful
        } catch (err) {
            console.error("❌ Error fetching points:", err);
            setError(true); // Set error state
        }
    };

    useEffect(() => {
        fetchPoints(); // Fetch data when component mounts
    }, []);

    if (error) {
        return (
            <div className="p-4">
                <h1 className="text-2xl font-bold">Points Dashboard</h1>
                <p className="text-red-500">❌ Error: Could not fetch points. Check if `public/data/points.json` exists.</p>
            </div>
        );
    }

    if (!points) return <p>Loading...</p>;

    // Function to find badges earned on a given date
    const getBadgesForDate = (date) => {
        return badges.filter((badge) => badge.earned_date.startsWith(date));
    };

    return (
        <div className="p-4 space-y-4">
            <h1 className="text-2xl font-bold">Points Dashboard</h1>
            <p className="text-xl">Total Points: {points.lastRecorded?.total || 0}</p>

            <h2 className="text-lg font-semibold mt-4">Daily Points History</h2>
            <ul className="border rounded-md p-2 bg-gray-100">
                {points.history && points.history.length > 0 ? (
                    points.history.slice(-7).map((entry, index) => {
                        const earnedBadges = getBadgesForDate(entry.date);
                        return (
                            <li key={index} className="border-b py-2">
                                <strong>{entry.date}:</strong> {entry.totalGained} points
                                {earnedBadges.length > 0 && (
                                    <div className="mt-2">
                                        <h3 className="text-md font-semibold">🏅 Badges Earned:</h3>
                                        <ul className="list-disc ml-4">
                                            {earnedBadges.map((badge) => (
                                                <li key={badge.id} className="flex items-center space-x-2">
                                                    <img src={badge.icon_url} alt={badge.name} className="w-6 h-6" />
                                                    <a href={badge.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                                                        {badge.name}
                                                    </a>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </li>
                        );
                    })
                ) : (
                    <p>No history available</p>
                )}
            </ul>
        </div>
    );
};

export default PointsDashboard;
