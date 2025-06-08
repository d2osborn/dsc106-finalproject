import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

function drawContactScatter() {
  // Clear any existing SVG to prevent multiple graphs on resize
  d3.select("#scatter-contact-woba").select("svg").remove();

  // Get the container element
  const container = document.querySelector("#scatter-contact-woba");

  // Use getBoundingClientRect for more accurate dimensions after layout
  const rect = container.getBoundingClientRect();
  const containerWidth = rect.width;
  const containerHeight = rect.height;

  const margin = { top: 60, right: 30, bottom: 60, left: 80 };
  const width = containerWidth - margin.left - margin.right;
  const height = containerHeight - margin.top - margin.bottom;

  // Only proceed if dimensions are valid
  if (width <= 0 || height <= 0) return;

  const svg = d3.select("#scatter-contact-woba")
    .append("svg")
    .attr("width", "100%")
    .attr("height", "100%")
    .attr("viewBox", `0 0 ${containerWidth} ${containerHeight}`)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  d3.json("files/yordan/contact_vs_wOBA_2str.json")
    .then(data => {
      data.forEach(d => {
        d.wOBA = +d.wOBA;
        d["contact%"] = +d["contact%"];
      });

      const x = d3.scaleLinear()
        .domain(d3.extent(data, d => d.wOBA)).nice()
        .range([0, width]);

      const y = d3.scaleLinear()
        .domain(d3.extent(data, d => d["contact%"])).nice()
        .range([height, 0]);

      svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x));

      svg.append("g").call(d3.axisLeft(y));

      svg.append("g")
        .call(d3.axisLeft(y).tickSize(-width).tickFormat(""))
        .attr("opacity", 0.3)
        .selectAll("line")
        .attr("stroke-dasharray", "4");

      svg.selectAll("circle")
        .data(data)
        .enter()
        .append("circle")
        .attr("cx", d => x(d.wOBA))
        .attr("cy", d => y(d["contact%"]))
        .attr("r", 4)
        .attr("fill", "orange")
        .attr("opacity", 0.6);

      const target = data.find(d => d.name_with_stand === "Yordan AlvarezL");
      if (target) {
        const xVal = x(target.wOBA);
        const yVal = y(target["contact%"]);

        svg.append("circle")
          .attr("cx", xVal)
          .attr("cy", yVal)
          .attr("r", 8)
          .attr("stroke", "black")
          .attr("fill", "none");

        svg.append("text")
          .attr("x", xVal + 6)
          .attr("y", yVal - 10)
          .text(target.name_with_stand)
          .attr("font-weight", "bold")
          .attr("font-size", "12px");
      }

      svg.append("text")
        .attr("x", width / 2)
        .attr("y", height + margin.bottom / 2)
        .attr("text-anchor", "middle")
        .text("wOBA");

      svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", -margin.left + 20)
        .attr("x", -height / 2)
        .attr("text-anchor", "middle")
        .text("Contact %");

      svg.append("text")
        .attr("x", width / 2)
        .attr("y", -margin.top / 2)
        .attr("text-anchor", "middle")
        .attr("font-size", 18)
        .text("At Two Strikes: Contact % vs wOBA");
    })
    .catch(error => {
      console.error("Failed to load JSON data:", error);
    });
}

// Initial draw with a slight delay to ensure layout is complete
setTimeout(drawContactScatter, 100);

// Redraw on window resize with a slight delay
window.addEventListener('resize', () => setTimeout(drawContactScatter, 100));
