// bar_tilt_subset_custom.js

// This D3 script creates a horizontal bar chart of Δ(swing_path_tilt) for a subset of players:
// 10 players above the target and 30 players below the target, highlighting the target player.
//
// Assumes an HTML container:
// <div id="chart"></div>
//
// Also assumes you have a CSV file "delta_angles.csv" with at least these columns:
//   name_with_stand,delta_swing_path_tilt
//
// Example CSV header:
// name_with_stand,delta_swing_path_tilt
// Yordan AlvarezL,-14.460727
// Player A,7.123456
// Player B,0.345678
// ...

// -------------------------
// PARAMETERS
// -------------------------
const targetPlayer = "Yordan AlvarezL";
const csvFile = "files/delta/delta_variance.csv";  // Path to your CSV file

const margin = { top: 30, right: 20, bottom: 40, left: 180 };
const width = 900 - margin.left - margin.right;
const height = 600 - margin.top - margin.bottom;

// We want exactly 10 players above (higher Δ) and 30 players below (lower Δ) the target
const numAbove = 10; // number of players just above the target
const numBelow = 30; // number of players just below the target

// -------------------------
// CREATE SVG
// -------------------------
const svg = d3
  .select("#horizon")  // or "#horizon" in tilt.js
  .append("svg")
    .attr("viewBox", `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
    .attr("preserveAspectRatio", "xMidYMid meet")
  .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);


// -------------------------
// LOAD DATA
// -------------------------
d3.csv(csvFile, d3.autoType).then(data => {
  // Ensure delta_swing_path_tilt is numeric
  data.forEach(d => {
    d.delta_swing_path_tilt = +d.delta_swing_path_tilt;
  });

  // 1) Sort data descending by delta_swing_path_tilt
  data.sort((a, b) => b.delta_swing_path_tilt - a.delta_swing_path_tilt);

  // 2) Find index of target player in the sorted array
  const idxTarget = data.findIndex(d => d.name_with_stand === targetPlayer);
  if (idxTarget === -1) {
    console.error(`Target player "${targetPlayer}" not found in data.`);
    return;
  }

  // 3) Compute slice indices:
  //    - numAbove above means indices [idxTarget - numAbove, idxTarget)
  //    - numBelow below means indices (idxTarget, idxTarget + numBelow]
  const startIdx = Math.max(0, idxTarget - numAbove);
  const endIdx = Math.min(data.length, idxTarget + numBelow + 1);
    // +1 because slice end is exclusive but should include the target row

  // 4) Extract the subset of players
  const subset = data.slice(startIdx, endIdx);

  // 5) Create scales based on the subset
  const y = d3
    .scaleBand()
    .domain(subset.map(d => d.name_with_stand))
    .range([0, height])
    .padding(0.1);

  const x = d3
    .scaleLinear()
    .domain([
      d3.min(subset, d => d.delta_swing_path_tilt),
      d3.max(subset, d => d.delta_swing_path_tilt)
    ])
    .nice()
    .range([0, width]);

  // 6) DRAW AXES

  // X Axis (bottom)
  svg
    .append("g")
      .attr("transform", `translate(0, ${height})`)
      .call(d3.axisBottom(x))
    .append("text")
      .attr("x", width / 2)
      .attr("y", 35)
      .attr("fill", "#000")
      .attr("text-anchor", "middle")
      .style("font-size", "14px")
      .text("Δ Swing Path Tilt");

  // Y Axis (left)
  svg
    .append("g")
      .call(d3.axisLeft(y).tickSize(0))
    .selectAll("text")
      .style("font-size", "12px");

  // 7) DRAW BARS for the subset
  svg
    .selectAll("rect")
    .data(subset)
    .enter()
    .append("rect")
      .attr("y", d => y(d.name_with_stand))
      .attr("height", y.bandwidth())
      .attr("x", d => x(Math.min(0, d.delta_swing_path_tilt)))
      .attr("width", d => Math.abs(x(d.delta_swing_path_tilt) - x(0)))
      .attr("fill", d =>
        d.name_with_stand === targetPlayer ? "#ff7f0e" : "steelblue"
      );

  // 8) ADD VALUE LABELS ON BARS
  svg
    .selectAll("text.bar-label")
    .data(subset)
    .enter()
    .append("text")
      .attr("class", "bar-label")
      .attr("y", d => y(d.name_with_stand) + y.bandwidth() / 2 + 4)
      .attr("x", d => {
        const val = x(d.delta_swing_path_tilt);
        return d.delta_swing_path_tilt >= 0 ? val + 5 : val - 5;
      })
      .attr("text-anchor", d => (d.delta_swing_path_tilt >= 0 ? "start" : "end"))
      .style("font-size", "11px")
      .style("fill", d => (d.name_with_stand === targetPlayer ? "#000" : "#fff"))
      .text(d => d.delta_swing_path_tilt.toFixed(2));

  // 9) TITLE
  svg
    .append("text")
      .attr("x", width / 2)
      .attr("y", -10)
      .attr("text-anchor", "middle")
      .style("font-size", "16px")
      .style("font-weight", "bold")
      .text("Change in Variance (Swing Path Tilt) 0 strike vs. 2 strikes");

  // 10) OUTLINE TARGET PLAYER'S BAR
  const targetData = subset.find(d => d.name_with_stand === targetPlayer);
  svg
    .append("rect")
      .attr("y", y(targetPlayer) - 2)
      .attr("height", y.bandwidth() + 4)
      .attr("x", x(Math.min(0, targetData.delta_swing_path_tilt)))
      .attr("width", Math.abs(x(targetData.delta_swing_path_tilt) - x(0)))
      .attr("fill", "none")
      .attr("stroke", "red")
      .attr("stroke-width", 2)
      .lower();  // ensure the outline is behind the bars
});
