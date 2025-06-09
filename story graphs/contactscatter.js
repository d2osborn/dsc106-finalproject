import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

function drawContactScatter() {
  // Clear existing SVG
  d3.select("#scatter-contact-woba").select("svg").remove();

  const container = document.querySelector("#scatter-contact-woba");
  const rect = container.getBoundingClientRect();
  const containerWidth = Math.max(400, rect.width); // Minimum width
  const containerHeight = Math.max(300, rect.height); // Minimum height

  const margin = { top: 80, right: 40, bottom: 80, left: 90 }; // Increased margins
  const width = containerWidth - margin.left - margin.right;
  const height = containerHeight - margin.top - margin.bottom;
  
  if (width <= 0 || height <= 0) {
    // Retry after a short delay if container isn't ready
    setTimeout(drawContactScatter, 100);
    return;
  }

  const svg = d3.select("#scatter-contact-woba")
    .append("svg")
    .attr("width", "100%")
    .attr("height", "100%")
    .attr("viewBox", `0 0 ${containerWidth} ${containerHeight}`)
    .attr("preserveAspectRatio", "xMidYMid meet")
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // Tooltip
  const tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("position", "absolute")
    .style("background", "rgba(0,0,0,0.8)")
    .style("color", "#fff")
    .style("padding", "6px 8px")
    .style("border-radius", "4px")
    .style("font-size", "12px")
    .style("pointer-events", "none")
    .style("opacity", 0);

  Promise.all([
    d3.json("files/yordan/contact_vs_wOBA_2str.json"),
    d3.json("files/sandbox/league_average_rates_2str.json")
  ]).then(([data, league]) => {
    data.forEach(d => {
      d.wOBA = +d.wOBA;
      d["contact%"] = +d["contact%"];
      d.cleanName = d.name_with_stand.replace(/[LR]$/, "");
    });

    const league_woba = d3.mean(data, d => d.wOBA);
    const league_contact = +league[0]["contact%"];

    const xMin = 0.160;
    const xMax = 0.380;
    const xStep = 0.040;
    const xTicks = [0.160, 0.200, 0.240, 0.280, 0.320, 0.360];

    const x = d3.scaleLinear()
      .domain([xMin, xMax])
      .range([0, width]);

    const yTicks = [0.55, 0.65, 0.75, 0.85, 0.95];

    const y = d3.scaleLinear()
      .domain([0.55, 1.0])
      .range([height, 0]);

    svg.append("g")
      .call(d3.axisLeft(y)
        .tickValues(yTicks)
        .tickFormat(d => (d * 100).toFixed(1)) // formats e.g. 0.65 → 65.0
      );

    svg.append("g")
      .call(d3.axisLeft(y).tickSize(-width).tickFormat(""))
      .attr("opacity", 0.3)
      .selectAll("line")
      .attr("stroke-dasharray", "4");

    // Axes
    svg.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x)
        .tickValues(xTicks)
        .tickFormat(d => d.toFixed(3))
      );

    // League average lines
    svg.append("line")
      .attr("x1", 0).attr("x2", width)
      .attr("y1", y(league_contact)).attr("y2", y(league_contact))
      .attr("stroke", "black").attr("stroke-dasharray", "4");
    svg.append("line")
      .attr("y1", 0).attr("y2", height)
      .attr("x1", x(league_woba)).attr("x2", x(league_woba))
      .attr("stroke", "black").attr("stroke-dasharray", "4");

    // Player dots
    svg.selectAll("circle.player-dot")
      .data(data)
      .enter()
      .append("circle")
      .attr("class", "player-dot")
      .attr("cx", d => x(d.wOBA))
      .attr("cy", d => y(d["contact%"]))
      .attr("r", 5)
      .attr("fill", "#EB6E1F")
      .attr("opacity", 0.6)
      .on("mouseover", (event, d) => {
        tooltip.html(`
          <strong>${d.cleanName}</strong><br/>
          wOBA: ${d.wOBA.toFixed(3)}<br/>
          Contact%: ${(d["contact%"] * 100).toFixed(1)}%
        `).style("opacity", 1);
      })
      .on("mousemove", event => {
        tooltip.style("left", (event.clientX + 15) + "px")
               .style("top", (event.clientY - 30) + "px");
      })
      .on("mouseout", () => tooltip.style("opacity", 0));

    // Highlight Yordan Alvarez with circular image
    const t = data.find(d => d.cleanName === "Yordan Alvarez");
    if (t) {
      const xVal = x(t.wOBA);
      const yVal = y(t["contact%"]);
      const size = 28;

      svg.append("defs")
        .append("clipPath")
        .attr("id", "yordanCircle")
        .append("circle")
        .attr("r", size / 2)
        .attr("cx", 0)
        .attr("cy", 0);

      const yordanGroup = svg.append("g")
        .attr("transform", `translate(${xVal},${yVal})`)
        .style("cursor", "pointer");

      yordanGroup.append("circle")
        .attr("r", size / 2)
        .attr("fill", "#fff")
        .attr("stroke", "#000")
        .attr("stroke-width", 1.5);

      yordanGroup.append("image")
        .attr("href", "files/yordan/yadro.png")
        .attr("x", -size / 2)
        .attr("y", -size / 2)
        .attr("width", size)
        .attr("height", size)
        .attr("clip-path", "url(#yordanCircle)");

      yordanGroup.append("circle")
        .attr("r", size / 2)
        .attr("fill", "transparent")
        .on("mouseover", () => {
          tooltip.html(`
            <strong>${t.cleanName}</strong><br/>
            wOBA: ${t.wOBA.toFixed(3)}<br/>
            Contact%: ${(t["contact%"] * 100).toFixed(1)}%
          `).style("opacity", 1);
        })
        .on("mousemove", event => {
          tooltip.style("left", (event.clientX + 15) + "px")
                 .style("top", (event.clientY - 30) + "px");
        })
        .on("mouseout", () => tooltip.style("opacity", 0));
    }

    // Labels with adjusted positioning
    svg.append("text")
      .attr("x", width / 2)
      .attr("y", height + margin.bottom - 15) // Moved up slightly
      .attr("text-anchor", "middle")
      .style("font-size", "14px")
      .text("wOBA");

    svg.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", -margin.left + 25) // Adjusted position
      .attr("x", -height / 2)
      .attr("text-anchor", "middle")
      .style("font-size", "14px")
      .text("Contact %");

    svg.append("text")
      .attr("x", width / 2)
      .attr("y", -20) // Adjusted title position
      .attr("text-anchor", "middle")
      .style("font-size", "18px")
      .style("font-weight", "bold")
      .text("At Two Strikes: Contact % vs wOBA");
  }).catch(error => {
    console.error("Error loading data:", error);
  });
}

// Debounced resize function
let resizeTimeout;
function handleResize() {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(drawContactScatter, 150);
}

// Initial draw and resize handling
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => setTimeout(drawContactScatter, 200));
} else {
  setTimeout(drawContactScatter, 200);
}

window.addEventListener("resize", handleResize);

// Also redraw when the container becomes visible (for lazy loading)
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      setTimeout(drawContactScatter, 100);
    }
  });
});

const container = document.querySelector("#scatter-contact-woba");
if (container) {
  observer.observe(container);
}
