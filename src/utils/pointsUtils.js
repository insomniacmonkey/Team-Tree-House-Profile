// ✅ Get the correct Sunday (start of week) in CST/CDT
const getSundayOfWeek = (date) => {
    const cstDate = new Date(new Date(date).toLocaleString("en-US", { timeZone: "America/Chicago" }));
    const sunday = new Date(cstDate);
    sunday.setDate(sunday.getDate() - sunday.getDay());
    sunday.setHours(0, 0, 0, 0);
    return toCentralDate(sunday); // Ensure YYYY-MM-DD format
};

// ✅ Get the first day of the month in CST/CDT (fixed)
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
    const todayCST = toCentralDate(nowCST);
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
            return entryCST >= startOfThisMonth && entryCST <= todayCST; // 🔥 FIXED: Corrected date format for comparison
        }

        if (activeTab === "This Year") {
            return entryCST.startsWith(todayCST.slice(0, 4)); // Compare just the year
        }

        return true; // "All" tab shows everything
    });
};

// ✅ Group history by year and month for "All" tab
export const groupHistoryByYearAndMonth = (history) => {
    const grouped = {};

    history.forEach((entry) => {
        const entryDate = toCentralDate(entry.date);
        const year = entryDate.split("-")[0]; // Extract YYYY
        const month = new Date(entryDate).toLocaleString("en-US", { month: "long" });

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
