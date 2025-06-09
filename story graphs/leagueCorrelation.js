// leagueCorrelation.js
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

// Add error handling for module loading
window.addEventListener('error', function(e) {
    console.error('Module loading error:', e);
});

const iMetrics = ['wOBA', 'swing%', 'zone_swing%', 'chase%', 'contact%', 'whiff%', 
                  'foul%', 'in_play%', 'oppo%', 'gb%', 'barrel%'];
const jMetrics = ['delta_attack_angle', 'delta_attack_direction', 'delta_swing_path_tilt'];

// Color scheme
const colors = {
  primary: '#002D62',
  secondary: '#002D62',
  background: '#ffffff',
  text: '#002D62',
  grid: '#e0e0e0'
};

function displayValue(metric, v) {
  if (metric === 'wOBA' || !metric.endsWith('%')) {
    return v.toFixed(3);
  }

  const rounded     = Number(v.toFixed(3));  
  const percentage  = rounded * 100;         
  return percentage.toFixed(1);            
}

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
  if (metric === 'wOBA') return 'wOBA';
  if (metric === 'gb%')  return 'GB%';

  const parts = metric.split('_');

  if (parts[0] === 'delta') {
    const rest = parts.slice(1).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    return `Δ Var(${rest})`;
  }

  return parts
    .map((word, i) => {
      if (word.toLowerCase() === 'gb') return 'GB';
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join('');
}

function drawScatterMatrix(data, selectedMetric) {
    const width = 320, height = 300, margin = { top: 40, right: 10, bottom: 40, left: 40 };
    const container = d3.select("#correlation-graphs");
    container.html(""); // Clear old
  
    jMetrics.forEach(j => {
      // Prepare data safely
      const filtered = data.filter(d =>
        isFinite(d[selectedMetric]) && isFinite(d[j])
      );
  
      const x = filtered.map(d => +d[j]);
      const y = filtered.map(d => +d[selectedMetric]);
  
      const r = x.length > 1 ? pearsonCorr(x, y).toFixed(3) : "N/A";
  
      const div = container.append("div")
        .attr("class", "correlation-graph")
        .style("margin", "1rem")
        .style("background", colors.background)
        .style("border-radius", "8px")
        .style("box-shadow", "0 2px 4px rgba(0,0,0,0.1)")
        .style("padding", "1rem")

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

      const yTickFormat = (metric => {
        if (metric === "wOBA" || !metric.endsWith("%")) {
          return d => d.toFixed(2);
        }
        return d => (Number(d.toFixed(3)) * 100).toFixed(1);
      })(selectedMetric);
  
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
        .text(formatMetricName(j));

      // Use a constant offset matching the third graph, adjusted a tiny bit upward:
      const yOffset = -margin.left + 7.25;
      
      svg.append("g")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(yScale)
        .tickFormat(yTickFormat))
        .style("color", colors.text)
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", yOffset)
        .attr("fill", colors.text)
        .attr("text-anchor", "middle")
        .text(formatMetricName(selectedMetric));

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
      const pointData = filtered.map(d => ({
        xVal: +d[j],                // Δ-metric  (x-axis)
        yVal: +d[selectedMetric]    // chosen metric (y-axis)
      }));

      svg.selectAll("circle")
        .data(pointData)
        .join("circle")
          .attr("cx", d => xScale(d.xVal))
          .attr("cy", d => yScale(d.yVal))
          .attr("r", 5)
          .attr("fill", colors.secondary)
          .attr("opacity", 0.8)
          .on("mouseover", (event, d) => {
            tooltip
              .style("visibility", "visible")
              .html(
                `${formatMetricName(j)}: ${d.xVal.toFixed(3)}<br>` +
                `${formatMetricName(selectedMetric)}: ${displayValue(selectedMetric, d.yVal)}`
              );
          })
          .on("mousemove", event =>
            tooltip
              .style("top",  (event.pageY - 10) + "px")
              .style("left", (event.pageX + 20) + "px")
          )
          .on("mouseout", () => tooltip.style("visibility", "hidden"));
    });
}

function setupCorrelationGraph(data) {
  const container = d3.select("#correlation-section")
    .style("margin", "2em 0")
    .style("padding", "1em");

  // container.append("h3")
  //   .style("color", colors.primary)
  //   .style("text-align", "center")
  //   .style("margin-bottom", "1em")
  //   .text("Explore Swing Metric Correlations");

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
      const graphs = d3.select("#correlation-graphs");
    
      // fade old charts out
      graphs.transition()
        .duration(300)
        .style("opacity", 0)
        .on("end", () => {
          // clear & draw new
          drawScatterMatrix(data, this.value);
    
          // fade the fresh charts back in
          graphs
            .style("opacity", 0)
            .transition()
            .duration(300)
            .style("opacity", 1);
        });
    });
    

  drawScatterMatrix(data, iMetrics[0]);
}

d3.json("files/But/league_trend.json").then(raw => {
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