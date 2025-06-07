
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
  .select("#chart2")
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

  console.log('story graphs/tilt.js - x domain:', x.domain());
  console.log('story graphs/tilt.js - x range:', x.range());

  // 6) DRAW AXES

  // X Axis (bottom)
  svg
    .append("g")
      .attr("transform", `translate(0, ${height})`)
      .call(d3.axisBottom(x))
    .append("text")
      .attr("x", width / 2)
      .attr("y", 35)
      .attr("fill", "#002D62")
      .attr("text-anchor", "middle")
      .style("font-size", "14px")
      .text("Δ Swing Path Tilt");

  // Y Axis (left)
  svg
    .append("g")
      .call(d3.axisLeft(y).tickSize(0))
    .selectAll("text")
      .style("font-size", "12px");

  // Add clip path definition
  svg.append("defs").append("clipPath")
      .attr("id", "clip")
    .append("rect")
      .attr("width", width)
      .attr("height", height);

  // 7) DRAW BARS for the subset
  svg
    .selectAll("rect")
    .data(subset)
    .enter()
    .append("rect")
      .attr("clip-path", "url(#clip)") // Apply clip path
      .attr("y", d => y(d.name_with_stand))
      .attr("height", y.bandwidth())
      .attr("x", x(x.domain()[0])) // All bars start at the leftmost point of the x-axis domain
      .attr("width", d => {
        const barWidth = x(d.delta_swing_path_tilt) - x(x.domain()[0]);
        console.log(`Bar for ${d.name_with_stand}: value=${d.delta_swing_path_tilt}, x=${x(d.delta_swing_path_tilt)}, start_x=${x(x.domain()[0])}, width=${barWidth}`);
        return barWidth;
      })
      .attr("fill", d => d.name_with_stand === targetPlayer ? "#ff7f0e" : "navy");

  // 8) ADD VALUE LABELS ON BARS
  svg
    .selectAll("text.bar-label")
    .data(subset)
    .enter()
    .append("text")
      .attr("class", "bar-label")
      .attr("y", d => y(d.name_with_stand) + y.bandwidth() / 2 + 4)
      .attr("x", d => x(d.delta_swing_path_tilt) + 5) // Position label slightly to the right of the bar end
      .attr("text-anchor", "start") // Anchor labels to the start
      .style("font-size", "11px")
      .style("fill", d => d.name_with_stand === targetPlayer ? "#002D62" : "#fff")
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
      .attr("clip-path", "url(#clip)") // Apply clip path
      .attr("y", y(targetPlayer) - 2)
      .attr("height", y.bandwidth() + 4)
      .attr("x", x(x.domain()[0])) // Outline starts at the leftmost point of the x-axis domain
      .attr("width", x(targetData.delta_swing_path_tilt) - x(x.domain()[0])) // Width extends from start of domain to value
      .attr("fill", "none")
      .attr("stroke", "red")
      .attr("stroke-width", 2)
      .lower();
});