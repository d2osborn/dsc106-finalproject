import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

function drawOverallScatter() {
  // Clear any existing SVG to prevent multiple graphs on resize
  d3.select("#overall-graph").select("svg").remove();

  // Get the container element
  const container = document.querySelector("#overall-graph");
  const containerWidth = container.clientWidth;
  const containerHeight = container.clientHeight;

  const margin = { top: 60, right: 30, bottom: 60, left: 80 };
  const width = containerWidth - margin.left - margin.right;
  const height = containerHeight - margin.top - margin.bottom;

  const svg = d3.select("#overall-graph")
    .append("svg")
    .attr("width", "100%")
    .attr("height", "100%")
    .attr("viewBox", `0 0 ${containerWidth} ${containerHeight}`)
    .attr("preserveAspectRatio", "xMidYMid meet")
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  const tooltip = d3.select("#tooltip");

  d3.json("files/yordan/overall_wOBA_vs_barrel_percent.json")
    .then(data => {
      // parse numerics
      data.forEach(d => {
        d.wOBA = +d.wOBA;
        d["barrel%"] = +d["barrel%"];
        d["swing%"] = +d["swing%"];
        d["zone_swing%"] = +d["zone_swing%"];
        d["chase%"] = +d["chase%"];
        d["contact%"] = +d["contact%"];
        d["whiff%"] = +d["whiff%"];
        d["foul%"] = +d["foul%"];
        d["in_play%"] = +d["in_play%"];
        d["oppo%"] = +d["oppo%"];
        d["gb%"] = +d["gb%"];
        d.cleanName = d.name_with_stand.replace(/[LR]$/, "");
      });

      // scales
      const x = d3.scaleLinear()
        .domain(d3.extent(data, d => d.wOBA)).nice()
        .range([0, width]);

      const y = d3.scaleLinear()
        .domain(d3.extent(data, d => d["barrel%"])).nice()
        .range([height, 0]);

      // axes
      svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x));
      svg.append("g")
        .call(d3.axisLeft(y));
      svg.append("g")
        .call(d3.axisLeft(y).tickSize(-width).tickFormat(""))
        .attr("opacity", 0.3)
        .selectAll("line")
        .attr("stroke-dasharray", "4");

      // draw circles + tooltip
      svg.selectAll("circle")
        .data(data)
        .enter().append("circle")
        .attr("cx", d => x(d.wOBA))
        .attr("cy", d => y(d["barrel%"]))
        .attr("r", 6)
        .attr("fill", "steelblue")
        .attr("opacity", 0.6)
        .on("mouseover", (event, d) => {
          tooltip.html(`
            <strong>${d.cleanName}</strong><br/>
            wOBA: ${d.wOBA.toFixed(3)}<br/>
            Barrel %: ${(d["barrel%"] * 100).toFixed(1)}%<br/>
          `)
            .style("opacity", 1);
        })
        .on("mousemove", event => {
          tooltip
            .style("left", (event.pageX + 12) + "px")
            .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", () => {
          tooltip.style("opacity", 0);
        });

      // highlight Yordan with an image instead of circle
      const t = data.find(d => d.cleanName === "Yordan Alvarez");
      if (t) {
        const xVal = x(t.wOBA),
              yVal = y(t["barrel%"]);

        svg.append("image")
          .attr("href", "files/yordan/yadro.png")   // <-- your image path here
          .attr("width", 10)
          .attr("height", 10)
          .attr("x", xVal )                        // center the icon
          .attr("y", yVal );

        svg.append("text")
          .attr("x", xVal + 18)
          .attr("y", yVal - 18)
          .text(t.cleanName)
          .attr("font-weight", "bold")
          .attr("font-size", "12px");
      }

      // labels
      svg.append("text")
        .attr("x", width / 2).attr("y", height + margin.bottom / 2)
        .attr("text-anchor", "middle").text("wOBA");
      svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", -margin.left + 20).attr("x", -height / 2)
        .attr("text-anchor", "middle").text("Barrel %");
      svg.append("text")
        .attr("x", width / 2).attr("y", -margin.top / 2)
        .attr("text-anchor", "middle")
        .attr("font-size", "18px")
        .text("Overall: Barrel % vs wOBA");
    })
    .catch(err => console.error("JSON load error:", err));
}

// Initial draw
window.addEventListener('DOMContentLoaded', drawOverallScatter);

// Redraw on window resize
window.addEventListener('resize', drawOverallScatter);