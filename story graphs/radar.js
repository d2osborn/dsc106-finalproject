import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

// 1) CONFIGURATION & DIMENSIONS
const width  = 600;
const height = 600;
const margin = { top: 60, right: 60, bottom: 60, left: 60 };
const innerW = width  - margin.left - margin.right;
const innerH = height - margin.top  - margin.bottom;
const radius = Math.min(innerW, innerH) / 2;

// Metrics and scales (chase and oppo swapped)
const metrics = ["wOBA", "contact%", "oppo%", "chase%", "barrel%"];
const angleSlice = (Math.PI * 2) / metrics.length;
const rScale = d3.scaleLinear().domain([0, 1]).range([0, radius]);

// 2) CREATE SVG CONTAINER
const svg = d3.select("#radarChart")
  .append("svg")
    .attr("width", width)
    .attr("height", height);

const g = svg.append("g")
    .attr("transform", `translate(${margin.left + innerW/2}, ${margin.top + innerH/2})`);

// 3) DRAW RADIAL GRID
const levels = 5;
for (let lvl = 1; lvl <= levels; lvl++) {
  g.append("circle")
    .attr("r", radius * (lvl / levels))
    .attr("fill", "none")
    .attr("stroke", "#002D62")
    .attr("stroke-dasharray", "2 2");
}
g.selectAll(".radar-level-label")
  .data(d3.range(1, levels + 1))
  .enter()
  .append("text")
    .attr("class", "radar-level-label")
    .attr("y", d => -rScale(d / levels))
    .attr("dy", "-0.3em")
    .attr("text-anchor", "middle")
    .style("font-size", "10px")
    .attr("fill", "#002D62")
    .text(d => `${d * (100 / levels)}%`);

// 4) DRAW AXES AND AXIS LABELS
const axis = g.append("g").attr("class", "axis-wrapper");
metrics.forEach((m, i) => {
  const angle = angleSlice * i - Math.PI / 2;

  axis.append("line")
    .attr("x1", 0).attr("y1", 0)
    .attr("x2", Math.cos(angle) * radius)
    .attr("y2", Math.sin(angle) * radius)
    .attr("stroke", "#002D62")
    .attr("stroke-width", 1);

  axis.append("text")
    .attr("x", m === "wOBA" ? Math.cos(angle) * (radius + 20) : Math.cos(angle) * (radius + 30))
    .attr("y", m === "wOBA" ? Math.sin(angle) * (radius + 20) : Math.sin(angle) * (radius + 30))
    .attr("dy", "0.35em")
    .attr("text-anchor", "middle")
    .style("font-size", "11px")
    .text(m === "wOBA" ? "wOBA" : m.replace("%", "") + "%");
});

// 5) LOAD DATA & PLOT POLYGON
const dataPath = "files/yordan/radar.json";
d3.json(dataPath).then(data => {
  if (!data || data.length === 0) {
    console.error(`${dataPath} is empty or failed to load.`);
    return;
  }

  const y = data.find(d => d.name_with_stand === "Yordan AlvarezL");
  if (!y) {
    console.error("Yordan AlvarezL not found in data.", data.map(d => d.name_with_stand));
    return;
  }

  const values = metrics.map(m => {
    let raw;
    if (m === "wOBA") raw = parseFloat(y["wOBA_2str_pctile"]) / 100;
    else if (m === "OBP") raw = parseFloat(y["OBP_percentile"]) / 100;
    else if (m === "barrel%") raw = parseFloat(y["barrel%_percentile"]) / 100;
    else if (m === "oppo%") raw = parseFloat(y["oppo%_percentile"]) / 100;
    else if (m === "chase%") raw = parseFloat(y["chase%_percentile"]) / 100;
    else raw = parseFloat(y[m]);
    if (isNaN(raw)) console.warn(`Invalid or missing value for ${m}`);
    return isNaN(raw) ? 0 : raw;
  });
  values.push(values[0]);

  const radarLine = d3.lineRadial()
    .radius(d => rScale(d))
    .angle((d, i) => i * angleSlice)
    .curve(d3.curveLinearClosed);

  g.append("path")
    .datum(values)
    .attr("d", radarLine)
    .attr("fill", "#EB6E1F")
    .attr("fill-opacity", 0.3)
    .attr("stroke", "#EB6E1F")
    .attr("stroke-width", 2);

  svg.append("text")
    .attr("x", width / 2)
    .attr("y", margin.top / 2)
    .attr("text-anchor", "middle")
    .style("font-size", "16px")
    .style("font-weight", "bold")
    .text("Yordan Alvarez – 2-Strike Profile vs Peers (Percentiles)");
});