// statsUtils.js

// --- Completion Percentage ---
export function getCompletionPercent(userGoals, globalGoals, completedGoals) {
  const completedPersonal = completedGoals.filter(g => g.source === "personal").length;
  const completedGlobal = completedGoals.filter(g => g.source === "global").length;
  const incompletePersonal = userGoals.filter(g => !g.done).length;
  const incompleteGlobal = globalGoals.length;

  if (completedPersonal + completedGlobal + incompletePersonal + incompleteGlobal === 0)
    return 0;

  return Math.round(
    ((completedPersonal + completedGlobal) /
      (completedPersonal + completedGlobal + incompletePersonal + incompleteGlobal)) *
      100
  );
}

// --- Hike Stats ---
export function getHikeStats(completedHikesData) {
  const hikes = completedHikesData?.completed_hike_table || [];
  const totalHikes = hikes.length;

  // Longest month
  let longestMonth = 0;
  let longestMonthName = "None";
  if (hikes.length > 0) {
    const monthCounts = {};
    hikes.forEach(h => {
      const date = new Date(h.date);
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      monthCounts[key] = (monthCounts[key] || 0) + 1;
    });
    const maxEntry = Object.entries(monthCounts).reduce(
      (max, entry) => (entry[1] > max[1] ? entry : max),
      ["", 0]
    );
    longestMonth = maxEntry[1];
    if (maxEntry[0]) {
      const [year, monthIdx] = maxEntry[0].split("-");
      longestMonthName = new Date(year, monthIdx).toLocaleString("default", {
        month: "long",
        year: "numeric",
      });
    }
  }

  // Latest hike
  const latestHikeDate =
    hikes.length > 0
      ? new Date(Math.max(...hikes.map(h => new Date(h.date)))).toLocaleDateString()
      : "None";

  return { totalHikes, longestMonth, longestMonthName, latestHikeDate };
}

// --- Doughnut Slice Toggle ---
export function toggleSlice(hiddenSlices, idx) {
  return hiddenSlices.includes(idx)
    ? hiddenSlices.filter(i => i !== idx)
    : [...hiddenSlices, idx];
}

// --- Trail Counts for Radial Bar ---
export function getTrailCounts(completedHikesData) {
  const hikes = completedHikesData?.completed_hike_table || [];
  const trails = completedHikesData?.trail || [];

  const countsByTrail = {};
  hikes.forEach(h => {
    const name = trails.find(t => t.trailid === h.trailid)?.name || "Unknown Trail";
    countsByTrail[name] = (countsByTrail[name] || 0) + 1;
  });

  const total = Object.values(countsByTrail).reduce((sum, val) => sum + val, 0) || 1;
  return Object.entries(countsByTrail)
    .map(([trail, count]) => ({
      trail,
      count,
      percentage: Math.round((count / total) * 100),
    }))
    .sort((a, b) => b.percentage - a.percentage);
}

// --- Sunburst Legend ---
export function buildSunburstLegend(monthNodes) {
  return monthNodes
    .filter(p => p.id !== "center")
    .map(p => ({
      id: p.id,
      name: p.name,
      value: p.y ?? p.value,
      color: p.color,
    }));
}
