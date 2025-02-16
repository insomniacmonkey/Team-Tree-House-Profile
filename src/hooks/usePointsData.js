import { useState, useEffect } from "react";

const usePointsData = () => {
    const [points, setPoints] = useState(null);
    const [badges, setBadges] = useState([]);
    const [error, setError] = useState(false);

    const fetchPoints = async () => {
        try {
            const response = await fetch("/data/points.json");
            if (!response.ok) throw new Error("Failed to load points data");

            const data = await response.json();
            setPoints(data);
            setBadges(data.badgesEarned || []);
            setError(false);
        } catch (err) {
            console.error("❌ Error fetching points:", err);
            setError(true);
        }
    };

    useEffect(() => {
        fetchPoints();
    }, []);

    return { points, badges, error };
};

export default usePointsData;
