import React, { useEffect, useState, useRef } from "react";
import Chart from "react-apexcharts";
import { Doughnut } from "react-chartjs-2";
import { Target, Mountain, Calendar, Clock } from "lucide-react";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import Sunburst from "highcharts/modules/sunburst.js";

// Register Chart.js elements
ChartJS.register(ArcElement, Tooltip, Legend);

// --- Chart.js shadow plugin for 3D effect ---
const shadowPlugin = {
  id: "shadow",
  beforeDraw: (chart) => {
    const ctx = chart.ctx;
    ctx.save();
    ctx.shadowColor = "rgba(0, 0, 0, 0.3)";
    ctx.shadowBlur = 10;
    ctx.shadowOffsetX = 4;
    ctx.shadowOffsetY = 4;
  },
  afterDraw: (chart) => {
    chart.ctx.restore();
  },
};
ChartJS.register(shadowPlugin);

// Initialize Highcharts Sunburst
if (typeof Sunburst === "function") Sunburst(Highcharts);

export default function Stats({
  userGoals,
  globalGoals,
  completedGoals,
  completedHikesData,
}) {
  const chartRef = useRef(null);

  // --- Doughnut chart state ---
  const completedPersonal = completedGoals.filter(
    (g) => g.source === "personal",
  ).length;
  const completedGlobal = completedGoals.filter(
    (g) => g.source === "global",
  ).length;
  const incompletePersonal = userGoals.filter((g) => !g.done).length;
  const incompleteGlobal = globalGoals.length;
  const [hiddenSlices, setHiddenSlices] = useState([]);

  const toggleSlice = (idx) => {
    setHiddenSlices((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx],
    );
  };

  const doughnutData = {
    labels: [
      "Completed Goals",
      "Completed Achievements",
      "Incomplete Goals",
      "Incomplete Achievements",
    ],
    datasets: [
      {
        data: [
          completedPersonal,
          completedGlobal,
          incompletePersonal,
          incompleteGlobal,
        ],
        backgroundColor: (ctx) => {
          const chart = ctx.chart;
          const { ctx: canvasCtx, chartArea } = chart;
          if (!chartArea) return;

          const g1 = canvasCtx.createLinearGradient(
            0,
            chartArea.bottom,
            0,
            chartArea.top,
          );
          g1.addColorStop(0, "#3ef5b2ff");
          g1.addColorStop(1, "#11b880ff");

          const g2 = canvasCtx.createLinearGradient(
            0,
            chartArea.bottom,
            0,
            chartArea.top,
          );
          g2.addColorStop(0, "#10b981");
          g2.addColorStop(1, "#035f45ff");

          const g3 = canvasCtx.createLinearGradient(
            0,
            chartArea.bottom,
            0,
            chartArea.top,
          );
          g3.addColorStop(0, "#b9b8b5ff");
          g3.addColorStop(1, "#979796ff");

          const g4 = canvasCtx.createLinearGradient(
            0,
            chartArea.bottom,
            0,
            chartArea.top,
          );
          g4.addColorStop(0, "#ffffffff");
          g4.addColorStop(1, "#cfccccff");

          return [g1, g2, g3, g4];
        },
        borderWidth: 0,
        borderColor: "transparent",
      },
    ],
  };

  const doughnutOptions = {
    maintainAspectRatio: false,
    cutout: "80%",
    layout: { padding: 20 },
    plugins: {
      tooltip: { callbacks: { label: (ctx) => `${ctx.label}: ${ctx.raw}` } },
    },
  };

  // --- Radial Bar & Sunburst state ---
  const [hikeChartOptions, setHikeChartOptions] = useState(null);
  const [hikeChartSeries, setHikeChartSeries] = useState([]);
  const [trailCounts, setTrailCounts] = useState([]);
  const [sunburstOptions, setSunburstOptions] = useState(null);
  const [sunburstLegend, setSunburstLegend] = useState([]);

  // --- Stats (Top Card) ---
  const completionPercent = Math.round(
    ((completedPersonal + completedGlobal) /
      (completedPersonal +
        completedGlobal +
        incompletePersonal +
        incompleteGlobal)) *
      100,
  );

  const userHikes = completedHikesData?.completed_hike_table || [];
  const totalHikes = userHikes.length;

  // Longest streak (month)
  let longestMonth = 0;
  let longestMonthName = "None";

  if (userHikes.length > 0) {
    const monthCounts = {};
    userHikes.forEach((h) => {
      const date = new Date(h.date);
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      monthCounts[key] = (monthCounts[key] || 0) + 1;
    });

    const maxEntry = Object.entries(monthCounts).reduce(
      (max, entry) => (entry[1] > max[1] ? entry : max),
      ["", 0],
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

  // Latest hike date
  const latestHikeDate =
    userHikes.length > 0
      ? new Date(
          Math.max(...userHikes.map((h) => new Date(h.date))),
        ).toLocaleDateString()
      : "None";

  // --- Sunburst Legend ---
  const updateSunburstLegend = () => {
    if (!chartRef.current) return;
    const points = chartRef.current.chart.series[0].points || [];
    const legendItems = points
      .filter((p) => p.id !== "center")
      .map((p) => ({
        id: p.id,
        name: p.name,
        value: p.y ?? p.value,
        color: p.color,
      }));
    setSunburstLegend(legendItems);
  };

  // --- Hike charts setup ---
  useEffect(() => {
    if (!completedHikesData) return;

    const userHikes = completedHikesData.completed_hike_table || [];
    const trails = completedHikesData.trail || [];

    const hikesWithTrail = userHikes
      .map((hike) => ({
        ...hike,
        trailName:
          trails.find((t) => t.trailid === hike.trailid)?.name ??
          "Unknown Trail",
      }))
      .filter((h) => h.trailName);

    // --- Radial Bar Chart ---
    const countsByName = {};
    hikesWithTrail.forEach((h) => {
      countsByName[h.trailName] = (countsByName[h.trailName] || 0) + 1;
    });
    const totalHikes =
      Object.values(countsByName).reduce((sum, val) => sum + val, 0) || 1;

    const trailsArray = Object.entries(countsByName)
      .map(([trail, count]) => ({
        trail,
        count,
        percentage: Math.round((count / totalHikes) * 100),
      }))
      .sort((a, b) => b.percentage - a.percentage);

    setHikeChartSeries(trailsArray.map((t) => t.percentage)); // bars in %
    setTrailCounts(trailsArray.map((t) => t.count)); // legend in number of hikes
    setHikeChartOptions({
      chart: { type: "radialBar", height: 350 },
      plotOptions: {
        radialBar: {
          dataLabels: {
            name: { show: true },
            value: { show: true, formatter: (val) => `${val}%` },
          },
          hollow: { size: "70%" },
          track: {
            background: "#e5e7eb",
            strokeWidth: "100%",
            dropShadow: {
              enabled: true,
              top: 6,
              left: 6,
              blur: 8,
              opacity: 0.5,
            },
          },
        },
      },
      labels: trailsArray.map((t) => t.trail),
      colors: [
        "#34d399",
        "#3b82f6",
        "#fbbf24",
        "#f43f5e",
        "#a78bfa",
        "#ec4899",
        "#fb923c",
        "#06b6d4",
      ],
      fill: {
        type: "gradient",
        gradient: {
          shade: "dark",
          type: "vertical",
          gradientToColors: [
            "#059669",
            "#2563eb",
            "#f59e0b",
            "#e11d48",
            "#8b5cf6",
            "#be185d",
            "#f97316",
            "#0ea5e9",
          ],
          inverseColors: false,
          opacityFrom: 1,
          opacityTo: 1,
          stops: [0, 100],
        },
      },
    });

    // --- Sunburst Chart ---
    const groupedData = {};
    hikesWithTrail.forEach((h) => {
      const month = h.date
        ? new Date(h.date).toLocaleString("default", { month: "long" })
        : "Unknown";
      if (!groupedData[month]) groupedData[month] = {};
      groupedData[month][h.trailName] =
        (groupedData[month][h.trailName] || 0) + 1;
    });

    // 20 distinct colors
    const palette = [
      "#34d399",
      "#0061fdff",
      "#f8b200ff",
      "#ff002bff",
      "#4405ffff",
      "#ff0783ff",
      "#ff7301ff",
      "#05d5faff",
      "#8b5cf6",
      "#f97316",
      "#10b981",
      "#ec4899",
      "#14b8a6",
      "#e11d48",
      "#0ea5e9",
      "#fde68a",
      "#9333ea",
      "#facc15",
      "#d946ef",
      "#84cc16",
    ];

    const monthNodes = [
      {
        id: "center",
        parent: "",
        name: "Hikes",
        value: hikesWithTrail.length,
        color: "#fffcfcff",
      },
      ...Object.entries(groupedData).map(([month, trails], idx) => ({
        id: `m${idx}`,
        parent: "center",
        name: month,
        value: Object.values(trails).reduce((a, b) => a + b, 0),
        trails,
        color: {
          linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
          stops: [
            [
              0,
              Highcharts.color(palette[idx % palette.length])
                .brighten(0)
                .get(),
            ],
            [
              1,
              Highcharts.color(palette[idx % palette.length])
                .brighten(-0.5)
                .get(),
            ],
          ],
        },
      })),
    ];

    setSunburstOptions({
      chart: { height: 350, backgroundColor: "transparent" },
      title: { text: undefined, align: "right" },
      legend: { enabled: false },
      credits: { enabled: false },
      plotOptions: {
        series: {
          borderWidth: 2,
          borderColor: "#d3d2d2ff",
          shadow: {
            color: "rgba(0,0,0,0.5)",
            offsetX: 3,
            offsetY: 3,
            opacity: 0.6,
            width: 5,
          },
          dataLabels: {
            style: {
              fontSize: "14px",
              fontWeight: "600",
              color: "#ffffff",
              fontFamily: "Arial,sans-serif",
            },
          },
          point: {
            events: {
              click: function () {
                const chart = chartRef.current.chart;
                if (!this.trails) return;
                if (!this.expanded) {
                  const childData = Object.entries(this.trails).map(
                    ([trail, count], idx) => ({
                      id: `${this.id}-t${idx}`,
                      parent: this.id,
                      name: trail,
                      value: count,
                      color: {
                        linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
                        stops: [
                          [
                            0,
                            Highcharts.color(
                              palette[(idx + 2) % palette.length],
                            )
                              .brighten(0)
                              .get(),
                          ],
                          [
                            1,
                            Highcharts.color(
                              palette[(idx + 2) % palette.length],
                            )
                              .brighten(-0.5)
                              .get(),
                          ],
                        ],
                      },
                    }),
                  );
                  const newData = [
                    { ...this.options, expanded: true },
                    ...childData,
                  ];
                  chart.series[0].setData(newData, true, false, false);
                  this.expanded = true;
                } else {
                  chart.series[0].setData(monthNodes, true, false, false);
                  monthNodes.forEach((n) => (n.expanded = false));
                }
                updateSunburstLegend();
              },
            },
          },
        },
      },
      series: [
        {
          type: "sunburst",
          data: monthNodes,
          allowDrillToNode: false,
          cursor: "pointer",
          dataLabels: {
            format: "{point.name}",
            style: { fontWeight: "600", color: "#f7f8f8ff" },
          },
          levels: [{ level: 1, colorByPoint: true, levelIsConstant: true }],
        },
      ],
      tooltip: {
        headerFormat: "",
        pointFormat: "<b>{point.name}</b>: {point.value} hike(s)",
      },
    });

    setTimeout(updateSunburstLegend, 100);
  }, [completedHikesData]);

  return (
    <section className="mt-4 space-y-6">
      {/* --- Stats Card --- */}
      <section className="grid grid-cols-2 gap-4 rounded-lg bg-white p-6 text-center shadow-md md:grid-cols-4">
        <section className="flex flex-col items-center">
          <Target className="mb-2 h-8 w-8 text-green-600" />
          <span className="text-2xl font-bold text-gray-800">
            {completionPercent}%
          </span>
          <p className="text-gray-600">Completion</p>
        </section>
        <section className="flex flex-col items-center">
          <Mountain className="mb-2 h-8 w-8 text-blue-600" />
          <span className="text-2xl font-bold text-gray-800">{totalHikes}</span>
          <p className="text-gray-600">Total Hikes</p>
        </section>
        <section className="flex flex-col items-center">
          <Calendar className="mb-2 h-8 w-8 text-yellow-600" />
          <span className="text-2xl font-bold text-gray-800">
            {longestMonth}
          </span>
          <p className="text-gray-600">
            Most Hikes in a Month ({longestMonthName})
          </p>
        </section>
        <section className="flex flex-col items-center">
          <Clock className="mb-2 h-8 w-8 text-red-600" />
          <span className="text-2xl font-bold text-gray-800">
            {latestHikeDate}
          </span>
          <p className="text-gray-600">Latest Hike</p>
        </section>
      </section>

      {/* --- Doughnut Chart --- */}
      <section className="rounded-lg bg-white p-6 shadow-md">
        <h2 className="mb-4 text-center text-2xl font-semibold text-gray-800">
          Goals & Achievements
        </h2>
        <section className="flex items-center justify-center space-x-6">
          <section style={{ width: "350px", height: "350px" }}>
            <Doughnut
              key="doughnut-goals"
              data={{
                ...doughnutData,
                datasets: doughnutData.datasets.map((ds) => ({
                  ...ds,
                  data: ds.data.map((val, idx) =>
                    hiddenSlices.includes(idx) ? 0 : val,
                  ),
                })),
              }}
              options={{
                ...doughnutOptions,
                plugins: {
                  ...doughnutOptions.plugins,
                  legend: { display: false },
                },
              }}
            />
          </section>
          <section className="flex flex-col justify-center space-y-3">
            {doughnutData.labels.map((label, idx) => {
              const legendColors = [
                "#3ef5b2",
                "#10b981",
                "#b9b8b5",
                "#cfccccff",
              ];
              return (
                <section
                  key={idx}
                  className={`flex cursor-pointer items-center space-x-2 ${hiddenSlices.includes(idx) ? "opacity-40" : ""}`}
                  onClick={() => toggleSlice(idx)}
                >
                  <section
                    style={{
                      width: "16px",
                      height: "16px",
                      background: legendColors[idx],
                      borderRadius: "50%",
                    }}
                  />
                  <span className="font-semibold text-gray-800">
                    {label}: {doughnutData.datasets[0].data[idx]}
                  </span>
                </section>
              );
            })}
          </section>
        </section>
      </section>

      {/* --- Radial Bar Chart --- */}
      {hikeChartOptions && hikeChartSeries.length > 0 && (
        <section className="rounded-lg bg-white p-6 shadow-md">
          <h2 className="mb-4 text-center text-2xl font-semibold text-gray-800">
            Completed Hikes by Trail
          </h2>
          <section className="flex items-center justify-center space-x-6">
            <section style={{ width: "400px", height: "400px" }}>
              <Chart
                options={hikeChartOptions}
                series={hikeChartSeries} // bars = %
                type="radialBar"
                height={400}
              />
            </section>
            <section className="flex flex-col justify-center space-y-3">
              {hikeChartOptions.labels.map((trail, idx) => (
                <section key={idx} className="flex items-center space-x-2">
                  <section
                    style={{
                      width: "16px",
                      height: "16px",
                      background:
                        hikeChartOptions.colors[
                          idx % hikeChartOptions.colors.length
                        ],
                      borderRadius: "50%",
                    }}
                  />
                  <span className="font-semibold text-gray-800">
                    {trail}: {trailCounts[idx]}
                  </span>
                </section>
              ))}
            </section>
          </section>
        </section>
      )}

      {/* --- Sunburst Chart --- */}
      {sunburstOptions && (
        <section className="rounded-lg bg-white p-6 shadow-md">
          <h2 className="mb-4 text-center text-2xl font-semibold text-gray-800">
            Hiking Timeline
          </h2>
          <section className="flex items-center justify-center space-x-6">
            <section style={{ width: "400px", height: "400px" }}>
              <HighchartsReact
                highcharts={Highcharts}
                options={sunburstOptions}
                ref={chartRef}
              />
            </section>
            <section className="flex flex-col justify-center space-y-3">
              {sunburstLegend.map((item, idx) => (
                <section key={idx} className="flex items-center space-x-2">
                  <section
                    style={{
                      width: "16px",
                      height: "16px",
                      background: item.color?.stops
                        ? item.color.stops[0][1]
                        : item.color || "#000",
                      borderRadius: "50%",
                    }}
                  />
                  <span className="font-semibold text-gray-800">
                    {item.name}: {item.value}
                  </span>
                </section>
              ))}
            </section>
          </section>
        </section>
      )}
    </section>
  );
}
