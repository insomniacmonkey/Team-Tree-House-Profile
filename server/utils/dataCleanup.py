import json
import math
from collections import defaultdict

# Load the latest uploaded points.json file
file_path = "brandonmartin5.json"

with open(file_path, "r") as file:
    data = json.load(file)

# Initialize badge-earned history
history_map = {entry["date"]: entry for entry in data["history"]}
badge_years = defaultdict(set)

print("\n🔍 Processing badge-earned points...")
for badge in data["badgesEarned"]:
    earned_date = badge["earned_date"].split("T")[0]  # YYYY-MM-DD
    earned_year = earned_date[:4]  # YYYY
    category = "Badge Points"  # Generic label for badge-earned points

    print(f"🆕 Badge earned: {badge['name']} (+30 points on {earned_date})")

    if earned_date not in history_map:
        history_map[earned_date] = {"date": earned_date, "totalGained": 0, "pointsBreakdown": {}}

    history_map[earned_date]["totalGained"] += 30
    history_map[earned_date]["pointsBreakdown"][category] = history_map[earned_date]["pointsBreakdown"].get(category, 0) + 30

    badge_years[category].add(earned_year)  # Track the year this category was earned


print("\n🔍 Initial Remaining Points Before Subtraction:")
print(json.dumps(data["lastRecorded"]["categories"], indent=4))

# 🔥 Step 1: Separate badge-earned and non-badge-earned points
remaining_points = data["lastRecorded"]["categories"].copy()
badge_only_points = {k: 0 for k in remaining_points}

# 🔍 Step 2: Subtract only badge-earned points
print("\n🔍 Subtracting badge-earned points from remaining points...")
for date, entry in history_map.items():
    for category, points in entry["pointsBreakdown"].items():
        if category in remaining_points:
            remaining_before = remaining_points[category]
            badge_only_points[category] += points

            # ✅ Prevent over-subtraction by only removing badge-earned points
            badge_points = min(points, remaining_before)

            print(f"🔹 Subtracting {badge_points} from {category} (Before: {remaining_before})")
            remaining_points[category] -= badge_points
            print(f"   ➡️ After: {remaining_points[category]}")

# 🔥 Step 3: Distribute remaining **non-badge-earned** points correctly
print(f"\n📊 Remaining points after badge subtraction: {json.dumps(remaining_points, indent=4)}\n")

for category, total_points in remaining_points.items():
    if total_points > 0:
        related_years = sorted(badge_years.get(category, []))

        if related_years:
            per_year = math.floor(total_points / len(related_years))
            remainder = total_points % len(related_years)

            print(f"\n📌 Splitting {total_points} points for {category} across {related_years} (Each gets {per_year}, remainder {remainder})")

            for i, year in enumerate(related_years):
                last_day = f"{year}-12-31"

                if last_day not in history_map:
                    history_map[last_day] = {"date": last_day, "totalGained": 0, "pointsBreakdown": {}}

                history_map[last_day]["totalGained"] += per_year
                history_map[last_day]["pointsBreakdown"][category] = (
                    history_map[last_day]["pointsBreakdown"].get(category, 0) + per_year
                )

                # Assign remainder to the last available year
                if i == len(related_years) - 1:
                    print(f"🔹 Assigning remainder {remainder} to {last_day}")
                    history_map[last_day]["totalGained"] += remainder
                    history_map[last_day]["pointsBreakdown"][category] += remainder

        else:
            # If no valid years were found, place points in the earliest available year
            fallback_date = "2024-12-31"

            if fallback_date not in history_map:
                history_map[fallback_date] = {"date": fallback_date, "totalGained": 0, "pointsBreakdown": {}}

            history_map[fallback_date]["totalGained"] += total_points
            history_map[fallback_date]["pointsBreakdown"][category] = (
                history_map[fallback_date]["pointsBreakdown"].get(category, 0) + total_points
            )
            print(f"⚠️ No valid years found for {category}, dumping {total_points} points into {fallback_date}")

# Convert history map to sorted list
sorted_history = sorted(history_map.values(), key=lambda x: x["date"])

# Update history in data
data["history"] = sorted_history

# Save the fixed file
output_file = "fixed_points.json"
with open(output_file, "w") as file:
    json.dump(data, file, indent=4)

print("\n✅ Fixed file saved as", output_file)

# 🔍 **Final Verification**
print("\n🔍 FINAL CHECK: FIXED HISTORY PREVIEW")
for entry in sorted_history[-10:]:
    print(json.dumps(entry, indent=4))

# ✅ Sanity Checks
for category, value in remaining_points.items():
    assert value >= 0, f"❌ ERROR: {category} has negative remaining points!"
    print(f"✅ Sanity check passed for {category}: {value} remaining.")
