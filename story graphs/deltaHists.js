// deltaHists.js
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

console.log("deltaHists.js script started");

const targetPlayer = "Yordan AlvarezL";
const angles = ["attack_angle", "attack_direction", "swing_path_tilt"];
let currentIndex = 0;

const margin = { top: 30, right: 20, bottom: 40, left: 50 };
const chartW = 600 - margin.left - margin.right;
const chartH = 300 - margin.top - margin.bottom;

// A helper to compute percentile ranks in [%]
function computePercentiles(data, key) {
  console.log(`Computing percentiles for ${key}`);
  const vals = data.map(d => +d[key]).sort(d3.ascending);
  data.forEach(d => {
    const v = +d[key];
    const idx = d3.bisectLeft(vals, v);
    d[`${key}_pct`] = idx / (vals.length - 1) * 100;
  });
}

// Function to handle window resize
function handleResize() {
  const container = d3.select("#delta-hists");
  const containerWidth = container.node().getBoundingClientRect().width;
  const newChartWidth = Math.min(400, containerWidth - 100);
  
  // Update the active chart
  container.select(".hist-container.active")
    .style("width", `${newChartWidth + margin.left + margin.right}px`)
    .each(function() {
      const svg = d3.select(this).select("svg");
      svg.attr("width", newChartWidth + margin.left + margin.right);
      
      // Update scales and redraw if needed
      const angle = d3.select(this).datum();
      updateChart(svg, angle, newChartWidth);
    });
}

// Function to switch between histograms
function switchHistogram(direction) {
  const container = d3.select("#delta-hists");
  const containers = container.selectAll(".hist-container");
  const total = containers.size();
  
  // Remove active class from current
  containers.classed("active", false)
    .style("opacity", "0")
    .style("pointer-events", "none")
    .style("transform", "translateY(20px)")
    .style("z-index", "0");
  
  // Update current index
  currentIndex = (currentIndex + direction + total) % total;
  
  // Add active class to new current
  containers.filter((d, i) => i === currentIndex)
    .classed("active", true)
    .transition()
    .duration(300)
    .style("opacity", "1")
    .style("pointer-events", "all")
    .style("transform", "translateY(0)")
    .style("z-index", "1");
  
  // Update counter
  container.select(".hist-counter").text(`${currentIndex + 1}/${angles.length}`);
}

// Function to update a single chart
function updateChart(svg, angle, width) {
  const key = `delta_${angle}`;
  const pctKey = `${key}_pct`;
  
  // Update x scale
  const x = d3.scaleLinear()
    .domain(d3.extent(data, d => +d[key]))
    .nice()
    .range([0, width]);

  // Update bins
  const bins = d3.bin()
    .domain(x.domain())
    .thresholds(13)
    (data.map(d => +d[key]));

  // Update densities
  const densities = bins.map(b => b.length / (data.length * (b.x1 - b.x0)));

  // Update y scale
  const y = d3.scaleLinear()
    .domain([0, d3.max(densities)])
    .nice()
    .range([chartH, 0]);

  // Update bars
  svg.selectAll("rect")
    .data(bins)
    .join("rect")
    .attr("x", b => x(b.x0) + 1)
    .attr("y", (_,i) => y(densities[i]))
    .attr("width", b => Math.max(0, x(b.x1) - x(b.x0) - 1))
    .attr("height", (_,i) => chartH - y(densities[i]))
    .attr("fill", "#1f77b4")
    .attr("fill-opacity", 1.0);

  // Update axes
  svg.select(".x-axis").call(d3.axisBottom(x));
  svg.select(".y-axis").call(d3.axisLeft(y));
}

let data; // Store data globally for resize handler

console.log("Attempting to load delta_angles.json...");
d3.json("files/yordan/delta_angles.json")
  .then(loadedData => {
    data = loadedData;
    console.log("delta_angles.json data loaded successfully:", data);
    
    const container = d3.select("#delta-hists");
    container.html("");

    // Create container for all histograms
    const histContainer = container.append("div")
      .attr("class", "histograms-stack")
      .style("position", "relative")
      .style("width", `${chartW + margin.left + margin.right}px`)
      .style("height", `${chartH + margin.top + margin.bottom + 40}px`)
      .style("margin", "0 auto");

    // Create individual containers for each histogram
    const containers = histContainer.selectAll(".hist-container")
      .data(angles)
      .enter()
      .append("div")
      .attr("class", "hist-container")
      .style("position", "absolute")
      .style("top", "0")
      .style("left", "0")
      .style("width", "100%")
      .style("height", "100%")
      .style("background", "transparent")
      .style("border-radius", "8px")
      .style("box-shadow", "none")
      .style("padding", "0.75rem")
      .style("transition", "all 0.5s ease")
      .style("cursor", "pointer")
      .style("opacity", (d, i) => i === 0 ? 1 : 0)
      .style("transform", (d, i) => i === 0 ? "translateY(0)" : "translateY(20px)")
      .style("z-index", (d, i) => i === 0 ? 1 : 0)
      .classed("active", (d, i) => i === 0)
      .on("click", function() {
        switchHistogram(1);
      });

    // Add titles to each container
    containers.append("h4")
      .attr("class", "hist-title")
      .style("text-align", "center")
      .style("margin", "0 0 0.5rem 0")
      .style("color", "#333")
      .style("font-size", "0.9rem")
      .style("font-weight", "bold")
      .text(d => `Δ Var(${d.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase())})`);

    // Add navigation arrows
    const nav = histContainer.append("div")
      .attr("class", "hist-navigation")
      .style("position", "absolute")
      .style("bottom", "-40px")
      .style("left", "50%")
      .style("transform", "translateX(-50%)")
      .style("display", "flex")
      .style("align-items", "center")
      .style("gap", "1rem")
      .style("z-index", "10");

    // Left arrow: goes back one
    nav.append("div")
      .attr("class", "nav-arrow left")
      .html("◀")
      .style("font-size", "1.5rem")
      .style("color", "#EB6E1F")
      .style("cursor", "pointer")
      .style("padding", "0.5rem")
      .style("border-radius", "50%")
      .style("background", "rgba(235, 110, 31, 0.1)")
      .style("transition", "all 0.2s ease")
      .style("user-select", "none")
      .on("mouseover", function() {
        d3.select(this)
          .style("background", "rgba(235, 110, 31, 0.2)")
          .style("transform", "scale(1.1)");
      })
      .on("mouseout", function() {
        d3.select(this)
          .style("background", "rgba(235, 110, 31, 0.1)")
          .style("transform", "scale(1)");
      })
      .on("click", function(event) {
        event.stopPropagation();
        switchHistogram(-1);
      });

    // Counter display
    nav.append("div")
      .attr("class", "hist-counter")
      .style("font-size", "0.9rem")
      .style("color", "#333")
      .style("font-weight", "bold")
      .style("min-width", "3rem")
      .style("text-align", "center")
      .text(`1/${angles.length}`);

    // Right arrow: goes forward one
    nav.append("div")
      .attr("class", "nav-arrow right")
      .html("▶")
      .style("font-size", "1.5rem")
      .style("color", "#EB6E1F")
      .style("cursor", "pointer")
      .style("padding", "0.5rem")
      .style("border-radius", "50%")
      .style("background", "rgba(235, 110, 31, 0.1)")
      .style("transition", "all 0.2s ease")
      .style("user-select", "none")
      .on("mouseover", function() {
        d3.select(this)
          .style("background", "rgba(235, 110, 31, 0.2)")
          .style("transform", "scale(1.1)");
      })
      .on("mouseout", function() {
        d3.select(this)
          .style("background", "rgba(235, 110, 31, 0.1)")
          .style("transform", "scale(1)");
      })
      .on("click", function(event) {
        event.stopPropagation();
        switchHistogram(1);
      });

    // Create SVGs in each container
    containers.each(function(angle) {
      const key = `delta_${angle}`;
      const pctKey = `${key}_pct`;

      // Compute percentiles
      computePercentiles(data, key);

      // Extract Yordan's values
      const you = data.find(d => d.name_with_stand === targetPlayer);
      if (!you) {
        console.error(`No record found for player: ${targetPlayer}`);
        return;
      }
      const x0 = +you[key];
      const p0 = you[pctKey];

      // Create SVG
      const svg = d3.select(this).append("svg")
        .attr("width", chartW + margin.left + margin.right)
        .attr("height", chartH + margin.top + margin.bottom)
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

      // 8) draw bars (changed color to blue)
      svg.selectAll("rect")
        .data(bins)
        .join("rect")
        .attr("x", b => x(b.x0) + 1)
        .attr("y", (_,i) => y(densities[i]))
        .attr("width", b => Math.max(0, x(b.x1) - x(b.x0) - 1))
        .attr("height", (_,i) => chartH - y(densities[i]))
        .attr("fill", "#1f77b4")
        .attr("fill-opacity", 1.0);

      // 9) axes
      svg.append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(0,${chartH})`)
        .call(d3.axisBottom(x));
      svg.append("g")
        .attr("class", "y-axis")
        .call(d3.axisLeft(y));

      // 10) vertical line at Yordan's delta
      svg.append("line")
        .attr("x1", x(x0)).attr("x2", x(x0))
        .attr("y1", 24)     .attr("y2", chartH)
        .attr("stroke", "red")
        .attr("stroke-width", 2)
        .attr("stroke-dasharray", "4,2");

      // 11) annotation - centered and without connecting line
      svg.append("text")
        .attr("x", x(x0))
        .attr("y", y(d3.max(densities)) * 0.1)
        .attr("text-anchor", "middle")
        .attr("fill", "red")
        .attr("font-size", "0.7rem")
        .attr("dy", "-0.5em")  // Move text up slightly
        .text(`${targetPlayer}`)
        .append("tspan")
        .attr("x", x(x0))
        .attr("dy", "1.2em")
        .text(`Δ=${x0.toFixed(2)}`)
        .append("tspan")
        .attr("x", x(x0))
        .attr("dy", "1.2em")
        .text(`Pct=${p0.toFixed(1)}th`);
    });

    // Add resize listener
    window.addEventListener('resize', handleResize);
  })
  .catch(console.error);
