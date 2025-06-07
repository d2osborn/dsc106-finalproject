// histogram.js

// Assumes you have an HTML container like:
// <div id="chart"></div>
//
// Also assumes you have a CSV file "delta_angles.csv" with at least these columns:
//   name_with_stand, delta_attack_angle
//
// Example CSV header:
//
// name_with_stand,delta_attack_angle
// Yordan AlvarezL,-162.251236
// Player A,  12.345678
// ...

// -------------------------
// PARAMETERS
// -------------------------
const targetPlayer = "Yordan AlvarezL";
const csvFile = "files/delta/delta_variance.csv";  // path to your CSV file

const margin = { top: 40, right: 30, bottom: 50, left: 50 };
const width = 800 - margin.left - margin.right;
const height = 500 - margin.top - margin.bottom;
const numBins = 30;                 // match plt.hist(bins=30)

// -------------------------
// CREATE SVG
// -------------------------
const svg = d3
  .select("#chart")
  .append("svg")
    .attr("viewBox", `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
    .attr("preserveAspectRatio", "xMidYMid meet")
    .style("width", "100%")
    .style("height", "100%")
  .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

// -------------------------
// LOAD DATA
// -------------------------
d3.csv(csvFile, d3.autoType).then(data => {
  // Parse numeric values for delta_attack_angle
  data.forEach(d => {
    d.delta_attack_angle = +d.delta_attack_angle;
  });

  // 1) Compute percentile of delta_attack_angle for each player
  //    We only need the target player's percentile, so:
  //    a) Extract all delta_attack_angle values, sort ascending
  //    b) Find index of target's value in sorted array
  //    c) pct = index / (n - 1) * 100

  const values = data
    .map(d => d.delta_attack_angle)
    .sort((a, b) => a - b);

  const n = values.length;

  // Find target player's delta and percentile
  const targetRow = data.find(d => d.name_with_stand === targetPlayer);
  if (!targetRow) {
    console.error(`Target player "${targetPlayer}" not found in data.`);
    return;
  }
  const targetDelta = targetRow.delta_attack_angle;

  // For percentile, find the first index where sorted value === targetDelta
  // If duplicates, indexOf returns the first occurrence.
  const idx = values.indexOf(targetDelta);
  const targetPct = (idx / (n - 1)) * 100;

  // 2) Create a histogram of all players' delta_attack_angle

  //   2a) Set up x‐scale domain from min to max of delta_attack_angle
  const x = d3
    .scaleLinear()
    .domain(d3.extent(data, d => d.delta_attack_angle))
    .nice()
    .range([0, width]);

  //   2b) Generate bins
  const histogram = d3
    .bin()
    .value(d => d.delta_attack_angle)
    .domain(x.domain())
    .thresholds(x.ticks(numBins));

  const bins = histogram(data);

  //   2c) Set up y‐scale based on bin counts
  const y = d3
    .scaleLinear()
    .domain([0, d3.max(bins, d => d.length)])
    .nice()
    .range([height, 0]);

  // 3) DRAW AXES

  //   X Axis
  svg
    .append("g")
      .attr("transform", `translate(0, ${height})`)
      .call(d3.axisBottom(x))
    .append("text")
      .attr("x", width / 2)
      .attr("y", 40)
      .attr("fill", "#002D62")
      .attr("text-anchor", "middle")
      .style("font-size", "14px")
      .text("Delta Attack Angle");

  //   Y Axis
  svg
    .append("g")
      .call(d3.axisLeft(y))
    .append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -height / 2)
      .attr("y", -40)
      .attr("fill", "#002D62")
      .attr("text-anchor", "middle")
      .style("font-size", "14px")
      .text("Number of Players");

  // 4) DRAW BARS
  svg
    .selectAll("rect")
    .data(bins)
    .enter()
    .append("rect")
      .attr("x", d => x(d.x0) + 1)
      .attr("y", d => y(d.length))
      .attr("width", d => Math.max(0, x(d.x1) - x(d.x0) - 1))
      .attr("height", d => height - y(d.length))
      .attr("fill", "#EB6E1F")
      .attr("stroke", "black");

  // 5) DRAW VERTICAL LINE FOR TARGET PLAYER
  svg
    .append("line")
      .attr("x1", x(targetDelta))
      .attr("x2", x(targetDelta))
      .attr("y1", 0)
      .attr("y2", height)
      .attr("stroke", "red")
      .attr("stroke-width", 2)
      .attr("stroke-dasharray", "4,4");

  // 6) ANNOTATE THE LINE WITH NAME AND PERCENTILE
  //    Positioning the text slightly above the top of the bars.

  // Determine a reasonable y‐position for the annotation (90% of max)
  const yMax = y.domain()[1];
  const yPosText = y(d3.max(bins, d => d.length)) * 0.1; // in pixel space: 10% down from top

  // Add text annotation
  svg
    .append("text")
      .attr("x", x(targetDelta))
      .attr("y", y(d3.max(bins, d => d.length)) +10)  // 10px above highest bar
      .attr("fill", "red")
      .attr("text-anchor", "middle")
      .style("font-size", "12px")
      .style("font-weight", "bold")
      .style("background-color", "white")
      .text(`${targetPlayer}  Δ=${targetDelta.toFixed(2)}  (${targetPct.toFixed(1)}%)`);

  // 7) TITLE
  svg
    .append("text")
      .attr("x", width / 2)
      .attr("y", -10)
      .attr("text-anchor", "middle")
      .style("font-size", "16px")
      .style("font-weight", "bold")
      .text("Change in Variance (attack angle) 0 strike vs. 2 strikes");
});
