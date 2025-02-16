// Get week number based on Sunday start
export const getWeekNumber = (date) => {
    const startOfYear = new Date(date.getFullYear(), 0, 1);
    const dayOffset = startOfYear.getDay() === 0 ? 0 : 7 - startOfYear.getDay();
    const firstSunday = new Date(date.getFullYear(), 0, 1 + dayOffset);
    return Math.floor((date - firstSunday) / (7 * 24 * 60 * 60 * 1000)) + 1;
};

// Filter history based on active tab
export const filterHistory = (history, activeTab) => {
    const now = new Date();
    return history.filter((entry) => {
        const entryDate = new Date(entry.date);

        if (activeTab === "Today") {
            return entryDate.toDateString() === now.toDateString();
        }
        if (activeTab === "This Week") {
            return getWeekNumber(entryDate) === getWeekNumber(now) && entryDate.getFullYear() === now.getFullYear();
        }
        if (activeTab === "This Month") {
            return (
                entryDate.getUTCFullYear() === now.getUTCFullYear() &&
                entryDate.getUTCMonth() === now.getUTCMonth()
            );
        }
        if (activeTab === "This Year") {
            return entryDate.getUTCFullYear() === now.getUTCFullYear();
        }
        return true; // "All" tab shows everything
    });
};

// Group history by year and month for "All" tab
export const groupHistoryByYearAndMonth = (history) => {
    const grouped = {};
    history.forEach((entry) => {
        const entryDate = new Date(entry.date);
        const year = entryDate.getFullYear();
        const month = entryDate.toLocaleString("default", { month: "long" });

        if (!grouped[year]) grouped[year] = {};
        if (!grouped[year][month]) grouped[year][month] = [];

        grouped[year][month].push(entry);
    });
    return grouped;
};
