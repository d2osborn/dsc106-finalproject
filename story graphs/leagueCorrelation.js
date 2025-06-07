// leagueCorrelation.js
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

const iMetrics = ['swing%', 'zone_swing%', 'chase%', 'contact%', 'whiff%', 
                  'foul%', 'in_play%', 'oppo%', 'gb%', 'barrel%'];
const jMetrics = ['delta_attack_angle', 'delta_attack_direction', 'delta_swing_path_tilt'];

function pearsonCorr(x, y) {
  const meanX = d3.mean(x), meanY = d3.mean(y);
  const numerator = d3.sum(x.map((_, i) => (x[i] - meanX) * (y[i] - meanY)));
  const denominator = Math.sqrt(
    d3.sum(x.map(xi => (xi - meanX) ** 2)) *
    d3.sum(y.map(yi => (yi - meanY) ** 2))
  );
  return numerator / denominator;
}

function drawScatterMatrix(data, selectedMetric) {
    const width = 250, height = 250, margin = 40;
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
  
      const div = container.append("div").style("margin", "0 10px");
      div.append("div")
        .attr("class", "title")
        .style("text-align", "center")
        .text(`${selectedMetric} vs ${j} | r = ${r}`);
  
      const svg = div.append("svg")
        .attr("width", width)
        .attr("height", height);
  
      const xScale = d3.scaleLinear().domain(d3.extent(x)).nice().range([margin, width - margin]);
      const yScale = d3.scaleLinear().domain(d3.extent(y)).nice().range([height - margin, margin]);
  
      svg.append("g").attr("transform", `translate(0,${height - margin})`).call(d3.axisBottom(xScale));
      svg.append("g").attr("transform", `translate(${margin},0)`).call(d3.axisLeft(yScale));
  
      svg.selectAll("circle")
        .data(x)
        .join("circle")
        .attr("cx", (_, i) => xScale(x[i]))
        .attr("cy", (_, i) => yScale(y[i]))
        .attr("r", 3)
        .attr("fill", "steelblue")
        .attr("opacity", 0.7);
    });
  }
  

function setupCorrelationGraph(data) {
  const container = d3.select("body").append("div").attr("id", "correlation-section").style("margin", "2em 0");
  container.append("h3").text("Explore Swing Metric Correlations");
  container.append("label")
    .text("Select Metric: ")
    .append("select")
    .attr("id", "correlation-select")
    .selectAll("option")
    .data(iMetrics)
    .enter()
    .append("option")
    .attr("value", d => d)
    .text(d => d);

  container.append("div").attr("id", "correlation-graphs").style("display", "flex");

  d3.select("#correlation-select").on("change", function() {
    drawScatterMatrix(data, this.value);
  });

  drawScatterMatrix(data, iMetrics[0]);
}

d3.json("files/But/league_trend.json").then(raw => {
    const keys = Object.keys(raw);
    const length = raw[keys[0]].length;
  
    const data = Array.from({ length }, (_, i) => {
      const row = {};
      keys.forEach(k => row[k] = raw[k][i]);
      return row;
    });
  
    setupCorrelationGraph(data);
  });