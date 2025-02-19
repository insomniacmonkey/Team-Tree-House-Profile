// ✅ Get the correct Sunday (start of week) in CST/CDT
const getSundayOfWeek = (date) => {
    const cstDate = new Date(new Date(date).toLocaleString("en-US", { timeZone: "America/Chicago" }));
    const sunday = new Date(cstDate);
    sunday.setDate(sunday.getDate() - sunday.getDay());
    sunday.setHours(0, 0, 0, 0);
    const formattedSunday = toCentralDate(sunday);

    console.log(`🔹 [getSundayOfWeek] Input Date: ${date}, CST Date: ${cstDate.toISOString()}, Computed Sunday: ${formattedSunday}`);
    return formattedSunday; // Ensure YYYY-MM-DD format
};

// ✅ Get the first day of the month in CST/CDT
const getFirstOfMonth = (date) => {
    const cstDate = new Date(new Date(date).toLocaleString("en-US", { timeZone: "America/Chicago" }));
    const firstOfMonth = toCentralDate(new Date(cstDate.getFullYear(), cstDate.getMonth(), 1, 0, 0, 0, 0));

    console.log(`🔹 [getFirstOfMonth] Input Date: ${date}, CST Date: ${cstDate.toISOString()}, First of Month: ${firstOfMonth}`);
    return firstOfMonth; // Ensure YYYY-MM-DD format
};

// ✅ Convert date to `YYYY-MM-DD` in CST/CDT
const toCentralDate = (date) => {
    const convertedDate = new Date(new Date(date).toLocaleString("en-US", { timeZone: "America/Chicago" }))
        .toISOString()
        .split("T")[0]; // Format as YYYY-MM-DD

    //console.log(`🔹 [toCentralDate] Input Date: ${date}, CST Formatted Date: ${convertedDate}`);
    return convertedDate;
};

// ✅ Filter history based on active tab
export const filterHistory = (history, activeTab) => {
    // Get today's date in CST/CDT (Keeping JSON and UI consistent)
    const nowUTC = new Date(); // Current time in UTC
    const nowCST = new Date(nowUTC.toLocaleString("en-US", { timeZone: "America/Chicago" })); // Convert to CST/CDT
    const todayCST = nowCST.getFullYear() + "-" + 
                    String(nowCST.getMonth() + 1).padStart(2, "0") + "-" + 
                    String(nowCST.getDate()).padStart(2, "0");

    console.log(`✅ [filterHistory] Final Fixed Today CST: ${todayCST}`);

    const startOfThisWeek = getSundayOfWeek(nowCST);
    const startOfThisMonth = getFirstOfMonth(nowCST);

    console.log(`✅ [filterHistory] Now CST: ${nowCST.toISOString()}, Today CST: ${todayCST}`);
    console.log(`✅ [filterHistory] Start of This Week: ${startOfThisWeek}, Start of This Month: ${startOfThisMonth}`);

    return history.filter((entry) => {
        const entryCST = toCentralDate(entry.date); // Convert to YYYY-MM-DD format

        if (activeTab === "Today") {
            //console.log(`🔹 [filterHistory] Checking Today: Entry CST: ${entryCST}, Today CST: ${todayCST}`);
            return entryCST === todayCST;
        }

        if (activeTab === "This Week") {
            //console.log(`🔹 [filterHistory] Checking This Week: Entry CST: ${entryCST}, Week Start: ${startOfThisWeek}, Today CST: ${todayCST}`);
            return entryCST >= startOfThisWeek && entryCST <= todayCST;
        }

        if (activeTab === "This Month") {
            //console.log(`🔹 [filterHistory] Checking This Month: Entry CST: ${entryCST}, Month Start: ${startOfThisMonth}, Today CST: ${todayCST}`);
            return entryCST >= startOfThisMonth && entryCST <= todayCST;
        }

        if (activeTab === "This Year") {
            //console.log(`🔹 [filterHistory] Checking This Year: Entry CST: ${entryCST}, Expected Year: ${todayCST.slice(0, 4)}`);
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

export const getBadgesForDate = (date, badges) => {
    console.log(`🔹 [getBadgesForDate] Filtering for Date: ${date}`);

    return badges.filter((badge) => {
        // Convert UTC earned_date to Date object
        const badgeUTC = new Date(badge.earned_date);

        // Convert UTC Date to CST Date using `toLocaleDateString`
        const badgeDate = badgeUTC.toLocaleDateString("en-US", { timeZone: "America/Chicago" });

        // Log details
        console.log("-------------------------------------------------");
        console.log(`🔍 Processing Badge: ${badge.name}`);
        console.log(`🆔 Badge ID: ${badge.id}`);
        console.log(`⏳ Original UTC Earned Date: ${badge.earned_date}`);
        console.log(`🌎 Converted CST Date: ${badgeDate}`);
        console.log(`🔄 Comparing Against Filter Date: ${date}`);
        console.log(`✅ Match Found: ${badgeDate === date}`);
        console.log("-------------------------------------------------");

        return badgeDate === date; // Match against today's CST date
    });
};




