import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

function drawRadarChart() {
  // Clear any existing SVG
  d3.select("#radarChart").select("svg").remove();

  // Get container dimensions
  const container = document.querySelector('#radarChart');
  if (!container) {
    console.error("Radar chart container not found");
    return;
  }

  const containerWidth = container.clientWidth || 450;
  const containerHeight = container.clientHeight || 450;
  const width = Math.min(containerWidth, containerHeight);
  const height = width;
  const margin = { top: 70, right: 70, bottom: 70, left: 70 };
  const innerW = width - margin.left - margin.right;
  const innerH = height - margin.top - margin.bottom;
  const radius = Math.min(innerW, innerH) / 2;

  // Metrics and scales
  const metrics = ["wOBA", "contact%", "oppo%", "chase%", "barrel%"];
  const angleSlice = (Math.PI * 2) / metrics.length;
  const rScale = d3.scaleLinear().domain([0, 1]).range([0, radius]);

  // Create SVG container
  const svg = d3.select("#radarChart")
    .append("svg")
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("preserveAspectRatio", "xMidYMid meet");

  const g = svg.append("g")
      .attr("transform", `translate(${margin.left + innerW/2}, ${margin.top + innerH/2})`);

  // Draw radial grid
  const levels = 5;
  for (let lvl = 1; lvl <= levels; lvl++) {
    const circleRadius = Math.abs(radius * (lvl / levels));
    g.append("circle")
      .attr("r", circleRadius)
      .attr("fill", "none")
      .attr("stroke", "#002D62")
      .attr("stroke-dasharray", "2 2");
  }

  g.selectAll(".radar-level-label")
    .data(d3.range(1, levels + 1))
    .enter()
    .append("text")
      .attr("class", "radar-level-label")
      .attr("y", d => -Math.abs(rScale(d / levels)))
      .attr("dy", "-0.3em")
      .attr("text-anchor", "middle")
      .style("font-size", "12px") // Increased font size
      .attr("fill", "#002D62")
      .text(d => `${d * (100 / levels)}%`);

  // Draw axes and axis labels
  const axis = g.append("g").attr("class", "axis-wrapper");
  metrics.forEach((m, i) => {
    const angle = angleSlice * i - Math.PI / 2;

    axis.append("line")
      .attr("x1", 0).attr("y1", 0)
      .attr("x2", Math.cos(angle) * radius)
      .attr("y2", Math.sin(angle) * radius)
      .attr("stroke", "#002D62")
      .attr("stroke-width", 1);

    // Increased label distance from center
    const labelDistance = radius + 40;
    axis.append("text")
      .attr("x", Math.cos(angle) * labelDistance)
      .attr("y", Math.sin(angle) * labelDistance)
      .attr("dy", "0.35em")
      .attr("text-anchor", "middle")
      .style("font-size", "14px") // Increased font size
      .attr("fill", "#002D62")
      .text(m === "wOBA" ? "wOBA" : m.replace("%", "") + "%");
  });

  // Load data & plot polygon
  d3.json("files/yordan/radar.json").then(data => {
    if (!data || data.length === 0) {
      console.error("Radar data is empty or failed to load.");
      return;
    }

    const y = data.find(d => d.name_with_stand === "Yordan AlvarezL");
    if (!y) {
      console.error("Yordan AlvarezL not found in data.");
      return;
    }

    const values = metrics.map(m => {
      let raw;
      if (m === "wOBA") raw = parseFloat(y["wOBA_2str_pctile"]) / 100;
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
      .attr("y", margin.top / 6)
      .attr("text-anchor", "middle")
      .style("font-size", "16px")
      .style("font-weight", "bold")
      .attr("fill", "#002D62")
      .text("Yordan Alvarez – 2-Strike Profile vs Peers (Percentiles)");
  }).catch(console.error);
}

// Initial draw with a slight delay to ensure layout is complete
window.addEventListener('DOMContentLoaded', () => {
  setTimeout(drawRadarChart, 100);
});

// Redraw on window resize
window.addEventListener('resize', () => setTimeout(drawRadarChart, 100));