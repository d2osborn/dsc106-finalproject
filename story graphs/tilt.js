// bar_tilt_subset_custom.js

const targetPlayer = "Yordan AlvarezL";
const csvFile = "files/delta/delta_variance.csv";

const margin = { top: 30, right: 20, bottom: 40, left: 180 };
const width = 900 - margin.left - margin.right;
const height = 600 - margin.top - margin.bottom;

const numAbove = 10;
const numBelow = 30;

const outerSvg = d3
  .select("#horizon")
  .append("svg")
  .attr(
    "viewBox",
    `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`
  )
  .attr("preserveAspectRatio", "xMidYMid meet");

const svg = outerSvg
  .append("g")
  .attr("transform", `translate(${margin.left},${margin.top})`);

d3.csv(csvFile, d3.autoType).then((data) => {
  data.forEach((d) => {
    d.delta_swing_path_tilt = +d.delta_swing_path_tilt;
  });

  data.sort((a, b) => b.delta_swing_path_tilt - a.delta_swing_path_tilt);

  const idxTarget = data.findIndex(
    (d) => d.name_with_stand === targetPlayer
  );
  if (idxTarget === -1) {
    console.error(`Target player "${targetPlayer}" not found in data.`);
    return;
  }

  const startIdx = Math.max(0, idxTarget - numAbove);
  const endIdx = Math.min(data.length, idxTarget + numBelow + 1);
  const subset = data.slice(startIdx, endIdx);

  const y = d3
    .scaleBand()
    .domain(subset.map((d) => d.name_with_stand))
    .range([0, height])
    .padding(0.1);

  const rawMin = d3.min(subset, (d) => d.delta_swing_path_tilt);
  const rawMax = d3.max(subset, (d) => d.delta_swing_path_tilt);
  const span = rawMax - rawMin;
  const pad = span * 0.05;
  const paddedDomain = [rawMin - pad, rawMax + pad];

  const x = d3
    .scaleLinear()
    .domain(paddedDomain)
    .range([0, width])
    .nice();

  // X-Axis (Full SVG width including margins)
  outerSvg
    .append("g")
    .attr("transform", `translate(${margin.left}, ${height + margin.top})`)
    .call(d3.axisBottom(x).ticks(6))
    .append("text")
    .attr("x", width / 2)
    .attr("y", 35)
    .attr("fill", "#000")
    .attr("text-anchor", "middle")
    .style("font-size", "14px")
    .text("Δ Swing Path Tilt");

  // Y-Axis
  svg
    .append("g")
    .call(d3.axisLeft(y).tickSize(0))
    .selectAll("text")
    .style("font-size", "12px");

  // Baseline at x=0
  svg
    .append("line")
    .attr("x1", x(0))
    .attr("x2", x(0))
    .attr("y1", 0)
    .attr("y2", height)
    .attr("stroke", "#333")
    .attr("stroke-width", 1)
    .attr("stroke-dasharray", "3,2");

  // Bars
  svg
    .selectAll("rect.bar")
    .data(subset)
    .enter()
    .append("rect")
    .attr("class", "bar")
    .attr("y", (d) => y(d.name_with_stand))
    .attr("height", y.bandwidth())
    .attr("x", (d) =>
      d.delta_swing_path_tilt < 0 ? x(d.delta_swing_path_tilt) : x(0)
    )
    .attr("width", (d) =>
      Math.abs(x(d.delta_swing_path_tilt) - x(0))
    )
    .attr("fill", (d) =>
      d.name_with_stand === targetPlayer ? "#ff7f0e" : "steelblue"
    );

  // Labels
  svg
    .selectAll("text.bar-label")
    .data(subset)
    .enter()
    .append("text")
    .attr("class", "bar-label")
    .attr("y", (d) => y(d.name_with_stand) + y.bandwidth() / 2 + 4)
    .attr("x", (d) =>
      d.delta_swing_path_tilt >= 0
        ? x(d.delta_swing_path_tilt) + 5
        : x(d.delta_swing_path_tilt) - 5
    )
    .attr("text-anchor", (d) =>
      d.delta_swing_path_tilt >= 0 ? "start" : "end"
    )
    .style("font-size", "11px")
    .style("fill", (d) =>
      d.name_with_stand === targetPlayer ? "#000" : "#fff"
    )
    .text((d) => d.delta_swing_path_tilt.toFixed(2));

  // Title
  svg
    .append("text")
    .attr("x", width / 2)
    .attr("y", -10)
    .attr("text-anchor", "middle")
    .style("font-size", "16px")
    .style("font-weight", "bold")
    .text("Change in Variance (Swing Path Tilt) 0 strike vs. 2 strikes");

  // Highlight Target Player
  const targetData = subset.find(
    (d) => d.name_with_stand === targetPlayer
  );

  svg
    .append("rect")
    .attr("y", y(targetPlayer) - 2)
    .attr("height", y.bandwidth() + 4)
    .attr(
      "x",
      targetData.delta_swing_path_tilt < 0
        ? x(targetData.delta_swing_path_tilt)
        : x(0)
    )
    .attr("width", Math.abs(x(targetData.delta_swing_path_tilt) - x(0)))
    .attr("fill", "none")
    .attr("stroke", "red")
    .attr("stroke-width", 2)
    .lower();
});
