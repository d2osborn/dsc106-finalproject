// deltaHists.js
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

const targetPlayer = "Yordan AlvarezL";
const angles = ["attack_angle","attack_direction","swing_path_tilt"];

const margin = { top: 30, right: 20, bottom: 40, left: 50 };
const chartW = 500 - margin.left - margin.right;
const chartH = 300 - margin.top  - margin.bottom;

// A helper to compute percentile ranks in [%]
function computePercentiles(data, key) {
  const vals = data.map(d => +d[key]).sort(d3.ascending);
  data.forEach(d => {
    const v = +d[key];
    const idx = d3.bisectLeft(vals, v);
    d[`${key}_pct`] = idx / (vals.length - 1) * 100;
  });
}

d3.json("files/yordan/delta_angles.json").then(data => {
  const container = d3.select("#delta-hists");

  angles.forEach(angle => {
    const key     = `delta_${angle}`;
    const pctKey  = `${key}_pct`;

    // 1) compute percentiles
    computePercentiles(data, key);

    // 2) extract Yordan’s values
    const you = data.find(d => d.name_with_stand === targetPlayer);
    if (!you) return console.error("No record for", targetPlayer);
    const x0  = +you[key];
    const p0  = you[pctKey];

    // 3) set up SVG for this angle
    const svg = container.append("svg")
      .attr("width",  chartW + margin.left + margin.right)
      .attr("height", chartH + margin.top  + margin.bottom)
      .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // 4) x‐scale
    const x = d3.scaleLinear()
      .domain(d3.extent(data, d => +d[key]))
      .nice()
      .range([0, chartW]);

    // 5) bin to 13 buckets
    const bins = d3.bin()
      .domain(x.domain())
      .thresholds(13)
      (data.map(d => +d[key]));

    // 6) convert to density
    const densities = bins.map(b => b.length / (data.length * (b.x1 - b.x0)));

    // 7) y‐scale
    const y = d3.scaleLinear()
      .domain([0, d3.max(densities)])
      .nice()
      .range([chartH, 0]);

    // 8) draw bars (opacity=1.0)
    svg.selectAll("rect")
      .data(bins)
      .join("rect")
        .attr("x",    b => x(b.x0) + 1)
        .attr("y",    (_,i) => y(densities[i]))
        .attr("width", b => Math.max(0, x(b.x1) - x(b.x0) - 1))
        .attr("height", (_,i) => chartH - y(densities[i]))
        .attr("fill",  "steelblue")
        .attr("fill-opacity", 1.0);

    // 9) axes
    svg.append("g")
      .attr("transform", `translate(0,${chartH})`)
      .call(d3.axisBottom(x));
    svg.append("g")
      .call(d3.axisLeft(y));

    // 10) vertical line at Yordan’s delta
    svg.append("line")
      .attr("x1", x(x0)).attr("x2", x(x0))
      .attr("y1", 0)     .attr("y2", chartH)
      .attr("stroke", "red")
      .attr("stroke-width", 2)
      .attr("stroke-dasharray", "4,2");

    // 11) annotation
    svg.append("text")
      .attr("x", x(x0))
      .attr("y", y(d3.max(densities)) * 0.1)
      .attr("text-anchor", "middle")
      .attr("fill", "red")
      .attr("font-size", "0.9rem")
      .text(`${targetPlayer}  Δ=${x0.toFixed(2)}  Pct=${p0.toFixed(1)}th`);

    // 12) title
    svg.append("text")
      .attr("x", chartW/2)
      .attr("y", -10)
      .attr("text-anchor", "middle")
      .attr("font-weight", "bold")
      .text(`Histogram of Δ Var(${angle.replace("_"," ")})`);
  });
})
.catch(console.error);
