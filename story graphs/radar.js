// radar.js
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

// 1) CONFIG & SCALES
const width  = 600;
const height = 600;
const margin = { top: 60, right: 60, bottom: 60, left: 60 };
const innerW = width  - margin.left - margin.right;
const innerH = height - margin.top  - margin.bottom;
const radius = Math.min(innerW, innerH) / 2;

// the metrics we care about
const metrics = ["wOBA", "contact%", "chase%", "oppo%", "barrel%", "OBP"];

// angle for each axis
const angleSlice = (Math.PI * 2) / metrics.length;

// radial scale from 0 → 1 mapped to 0 → radius
const rScale = d3.scaleLinear()
  .domain([0, 1])
  .range([0, radius]);

// 2) SVG & GROUP
const svg = d3.select("#radarChart")
  .append("svg")
    .attr("width",  width)
    .attr("height", height);

const g = svg.append("g")
    .attr(
      "transform",
      `translate(${margin.left + innerW/2}, ${margin.top + innerH/2})`
    );

// 3) DRAW GRID: concentric circles + percent ticks
const levels = 5;
for (let lvl = 1; lvl <= levels; lvl++) {
  g.append("circle")
    .attr("r", radius * (lvl / levels))
    .attr("fill", "none")
    .attr("stroke", "#CDCDCD")
    .attr("stroke-dasharray", "2 2");
}

// y‐axis labels (20%, 40%, …)
g.selectAll(".radar-level-label")
  .data(d3.range(1, levels + 1))
  .enter()
  .append("text")
    .attr("class", "radar-level-label")
    .attr("y", d => -rScale(d / levels))
    .attr("dy", "-0.3em")
    .attr("text-anchor", "middle")
    .attr("fill", "#777")
    .style("font-size", "10px")
    .text(d => `${d * (100/levels)}%`);

// 4) AXES: lines + labels
const axis = g.append("g").attr("class", "axis-wrapper");

metrics.forEach((m, i) => {
  const angle = angleSlice * i - Math.PI/2;
  // axis line
  axis.append("line")
    .attr("x1", 0).attr("y1", 0)
    .attr(
      "x2", 
      Math.cos(angle) * radius
    )
    .attr(
      "y2", 
      Math.sin(angle) * radius
    )
    .attr("stroke", "#888")
    .attr("stroke-width", 1);
  
  // axis label
  axis.append("text")
    .attr(
      "x", 
      Math.cos(angle) * (radius + 20)
    )
    .attr(
      "y", 
      Math.sin(angle) * (radius + 20)
    )
    .attr("dy", "0.35em")
    .attr("text-anchor", "middle")
    .style("font-size", "11px")
    .text(m.replace("%", ""));  // strip the % for cleaner labels
});

// 5) LOAD DATA & DRAW POLYGON
d3.json("files/yordan/radar.json").then(data => {
  console.log('All players:', data);
  console.log('Matching entry:', y);

  // find Yordan by name_with_stand
  const y = data.find(d => d.name_with_stand === "Yordan AlvarezL");
  if (!y) {
    console.error("Yordan AlvarezL not found in radar.json");
    return;
  }

  // build an array of his percentile values [p1, p2, …, p1] to close the loop
  const values = metrics.map(m => {
    const val = parseFloat(y[`${m}_pctile`]);
    return isNaN(val) ? 0 : val;
  });
  

  // lineRadial generator
  const radarLine = d3.lineRadial()
    .radius((d,i) => rScale(d))
    .angle((d,i) => angleSlice * i)
    .curve(d3.curveLinearClosed);

  // draw the filled area
  g.append("path")
    .datum(values)
    .attr("d", radarLine)
    .attr("fill", "crimson")
    .attr("fill-opacity", 0.3)
    .attr("stroke", "crimson")
    .attr("stroke-width", 2);

  // title
  svg.append("text")
    .attr("x", width/2)
    .attr("y", margin.top/2)
    .attr("text-anchor", "middle")
    .style("font-size", "16px")
    .style("font-weight", "bold")
    .text("Yordan Alvarez – 2-Strike Profile vs Peers (Percentiles)");
});
