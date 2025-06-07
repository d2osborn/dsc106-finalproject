// leagueCorrelation.js
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

// Add error handling for module loading
window.addEventListener('error', function(e) {
    console.error('Module loading error:', e);
});

const iMetrics = ['swing%', 'zone_swing%', 'chase%', 'contact%', 'whiff%', 
                  'foul%', 'in_play%', 'oppo%', 'gb%', 'barrel%'];
const jMetrics = ['delta_attack_angle', 'delta_attack_direction', 'delta_swing_path_tilt'];

// Color scheme
const colors = {
  primary: '#000080',
  secondary: '#4169E1',
  background: '#ffffff',
  text: '#333333',
  grid: '#e0e0e0'
};

function pearsonCorr(x, y) {
  const meanX = d3.mean(x), meanY = d3.mean(y);
  const numerator = d3.sum(x.map((_, i) => (x[i] - meanX) * (y[i] - meanY)));
  const denominator = Math.sqrt(
    d3.sum(x.map(xi => (xi - meanX) ** 2)) *
    d3.sum(y.map(yi => (yi - meanY) ** 2))
  );
  return numerator / denominator;
}

function formatMetricName(metric) {
  return metric.replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase())
    .replace('Delta ', 'Δ');
}

function drawScatterMatrix(data, selectedMetric) {
    const width = 300, height = 300, margin = {top: 40, right: 20, bottom: 40, left: 40};
    const container = d3.select("#correlation-graphs");
    container.html(""); // Clear old
  
    jMetrics.forEach(j => {
      // Prepare data safely
      const filtered = data.filter(d =>
        isFinite(d[selectedMetric]) && isFinite(d[j])
      );
  
      const x = filtered.map(d => +d[selectedMetric]);
      const y = filtered.map(d => +d[j]);
  
      const r = x.length > 1 ? pearsonCorr(x, y).toFixed(2) : "N/A";
  
      const div = container.append("div")
        .attr("class", "correlation-graph")
        .style("margin", "1rem")
        .style("background", colors.background)
        .style("border-radius", "8px")
        .style("box-shadow", "0 2px 4px rgba(0,0,0,0.1)")
        .style("padding", "1rem");

      // Title with correlation coefficient
      div.append("div")
        .attr("class", "title")
        .style("text-align", "center")
        .style("font-weight", "bold")
        .style("color", colors.primary)
        .style("margin-bottom", "0.5rem")
        .html(`${formatMetricName(selectedMetric)} vs ${formatMetricName(j)}<br>r = ${r}`);
  
      const svg = div.append("svg")
        .attr("width", width)
        .attr("height", height)
        .style("display", "block");
  
      const xScale = d3.scaleLinear()
        .domain(d3.extent(x))
        .nice()
        .range([margin.left, width - margin.right]);
      
      const yScale = d3.scaleLinear()
        .domain(d3.extent(y))
        .nice()
        .range([height - margin.bottom, margin.top]);
  
      // Add grid lines
      svg.append("g")
        .attr("class", "grid")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(xScale)
          .tickSize(-(height - margin.top - margin.bottom))
          .tickFormat("")
        )
        .style("color", colors.grid);

      svg.append("g")
        .attr("class", "grid")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(yScale)
          .tickSize(-(width - margin.left - margin.right))
          .tickFormat("")
        )
        .style("color", colors.grid);

      // Add axes
      svg.append("g")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(xScale))
        .style("color", colors.text)
        .append("text")
        .attr("x", width / 2)
        .attr("y", margin.bottom - 5)
        .attr("fill", colors.text)
        .attr("text-anchor", "middle")
        .text(formatMetricName(selectedMetric));

      // Use a constant offset matching the third graph, adjusted a tiny bit upward:
      const yOffset = -margin.left + 10;
      
      svg.append("g")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(yScale))
        .style("color", colors.text)
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", yOffset)
        .attr("fill", colors.text)
        .attr("text-anchor", "middle")
        .text(formatMetricName(j));

      // Add points with tooltips
      const tooltip = div.append("div")
        .attr("class", "tooltip")
        .style("position", "absolute")
        .style("visibility", "hidden")
        .style("background", "rgba(0,0,0,0.8)")
        .style("color", "white")
        .style("padding", "5px")
        .style("border-radius", "4px")
        .style("font-size", "12px");

      // Calculate regression line
      const n = x.length;
      const sumX = d3.sum(x);
      const sumY = d3.sum(y);
      const sumXY = d3.sum(x.map((xi, i) => xi * y[i]));
      const sumX2 = d3.sum(x.map(xi => xi * xi));
      const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
      const intercept = (sumY - slope * sumX) / n;

      // Add regression line
      const line = d3.line()
        .x(d => d)
        .y(d => slope * d + intercept);

      svg.append("path")
        .datum(x)
        .attr("fill", "none")
        .attr("stroke", colors.primary)
        .attr("stroke-width", 2)
        .attr("d", line);

      // Add points with increased size and opacity
      svg.selectAll("circle")
        .data(x)
        .join("circle")
        .attr("cx", (_, i) => xScale(x[i]))
        .attr("cy", (_, i) => yScale(y[i]))
        .attr("r", 5)  // Increased from 4
        .attr("fill", colors.secondary)
        .attr("opacity", 0.8)  // Increased from 0.7
        .on("mouseover", function(event, d) {
          const i = x.indexOf(d);
          tooltip
            .style("visibility", "visible")
            .html(`${formatMetricName(selectedMetric)}: ${d.toFixed(2)}<br>${formatMetricName(j)}: ${y[i].toFixed(2)}`);
        })
        .on("mousemove", function(event) {
          tooltip
            .style("top", (event.pageY - 10) + "px")
            .style("left", (event.pageX + 10) + "px");
        })
        .on("mouseout", function() {
          tooltip.style("visibility", "hidden");
        });
    });
}

function setupCorrelationGraph(data) {
  const container = d3.select("#correlation-section")
    .style("margin", "2em 0")
    .style("padding", "1em");

  container.append("h3")
    .style("color", colors.primary)
    .style("text-align", "center")
    .style("margin-bottom", "1em")
    .text("Explore Swing Metric Correlations");

  const controls = container.append("div")
    .style("display", "flex")
    .style("justify-content", "center")
    .style("align-items", "center")
    .style("gap", "1em")
    .style("margin-bottom", "1em");

  controls.append("label")
    .style("font-weight", "bold")
    .style("color", colors.text)
    .text("Select Metric: ");

  controls.append("select")
    .attr("id", "correlation-select")
    .style("padding", "0.5em")
    .style("border", `1px solid ${colors.grid}`)
    .style("border-radius", "4px")
    .style("background", colors.background)
    .selectAll("option")
    .data(iMetrics)
    .enter()
    .append("option")
    .attr("value", d => d)
    .text(d => formatMetricName(d));

  container.append("div")
    .attr("id", "correlation-graphs")
    .style("display", "flex")
    .style("flex-wrap", "wrap")
    .style("justify-content", "center")
    .style("gap", "1rem");

  d3.select("#correlation-select").on("change", function() {
    drawScatterMatrix(data, this.value);
  });

  drawScatterMatrix(data, iMetrics[0]);
}

d3.json("files/BUt/league_trend.json").then(raw => {
  // 1) Convert each raw[col] from an object into a real array
  Object.keys(raw).forEach(col => {
    raw[col] = Object.values(raw[col]);
  });
  
  // 2) Now derive keys and the length
  const keys = Object.keys(raw);
  const length = raw[keys[0]].length;
  
  // 3) Build a row-wise array of objects
  const data = Array.from({ length }, (_, i) => {
    const row = {};
    keys.forEach(k => row[k] = raw[k][i]);
    return row;
  });
  
  setupCorrelationGraph(data);
}).catch(error => {
  console.error("Error loading data:", error);
});