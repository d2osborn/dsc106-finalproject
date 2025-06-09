import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

function drawOverallScatter() {
  d3.select("#overall-graph").select("svg").remove();

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
      // Count base names (without L/R suffix)
      const nameCounts = {};
      data.forEach(d => {
        const base = d.name_with_stand.replace(/[LR]$/, "");
        nameCounts[base] = (nameCounts[base] || 0) + 1;
      });

      // Parse numerics and assign cleanName based on counts
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
        const base = d.name_with_stand.replace(/[LR]$/, "");
        d.cleanName = nameCounts[base] === 1 ? base : d.name_with_stand;
      });

      const avg_wOBA = d3.mean(data, d => d.wOBA);
      const avg_barrel = 0.105168

      const x = d3.scaleLinear()
        .domain(d3.extent(data, d => d.wOBA)).nice()
        .range([0, width]);

      const y = d3.scaleLinear()
        .domain([0, 0.30])  // 0.30 means 30.0% on the visual axis
        .range([height, 0]);

      const xMin = 0.220;
      const xMax = 0.480;
      const step = 0.040;
      const xTicks = d3.range(xMin, xMax + step, step); // add a tiny buffer for inclusion

      svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x)
          .tickValues(xTicks)
          .tickFormat(d => d.toFixed(3))
        );

      const yTicks = d3.range(0, 0.31, 0.04);  // generates 0.00, 0.04, ..., 0.28, 0.30

      svg.append("g")
        .call(d3.axisLeft(y)
          .tickValues(yTicks)
          .tickFormat(d => (d * 100).toFixed(1))  // formats 0.04 as 4.0
        );

      svg.append("g")
        .call(d3.axisLeft(y).tickSize(-width).tickFormat(""))
        .attr("opacity", 0.3)
        .selectAll("line")
        .attr("stroke-dasharray", "4");

      svg.append("line")
        .attr("x1", x(avg_wOBA))
        .attr("x2", x(avg_wOBA))
        .attr("y1", 0)
        .attr("y2", height)
        .attr("stroke", "#002D62")
        .attr("stroke-dasharray", "4")
        .attr("stroke-width", 1.5);

      // Horizontal line for average barrel%
      svg.append("line")
        .attr("x1", 0)
        .attr("x2", width)
        .attr("y1", y(avg_barrel))
        .attr("y2", y(avg_barrel))
        .attr("stroke", "#002D62")
        .attr("stroke-dasharray", "4")
        .attr("stroke-width", 1.5);

      // Filter out Yordan before drawing default circles
      const filtered = data.filter(d => d.cleanName !== "Yordan Alvarez");

      svg.selectAll("circle")
        .data(filtered)
        .enter().append("circle")
        .attr("cx", d => x(d.wOBA))
        .attr("cy", d => y(d["barrel%"]))
        .attr("r", 6)
        .attr("fill", "#EB6E1F")
        .attr("opacity", 0.6)
        .on("mouseover", (event, d) => {
          tooltip.html(`
            <strong>${d.cleanName}</strong><br/>
            wOBA: ${d.wOBA.toFixed(3)}<br/>
            Barrel%: ${(d["barrel%"] * 100).toFixed(1)}<br/>
          `)
            .style("opacity", 1);
        })
        .on("mousemove", event => {
          tooltip
            .style("left", (event.clientX ) + "px")
            .style("top", (event.clientY +750) + "px");
        })        
        .on("mouseout", () => tooltip.style("opacity", 0));

        // Highlight Yordan with circular-framed image
        const t = data.find(d => d.cleanName === "Yordan Alvarez");
        if (t) {
          const xVal = x(t.wOBA);
          const yVal = y(t["barrel%"]);
          const size = 28;
        
          // Define clip path
          svg.append("defs")
            .append("clipPath")
            .attr("id", "yordanCircle")
            .append("circle")
            .attr("r", size / 2)
            .attr("cx", 0)
            .attr("cy", 0);
        
          // Wrap in a group for tooltip binding
          const yordanGroup = svg.append("g")
            .attr("transform", `translate(${xVal},${yVal})`)
            .style("cursor", "pointer")
            .style("pointer-events", "visible");

        
          // Add stroke circle
          yordanGroup.append("circle")
            .attr("r", size / 2)
            .attr("fill", "#fff")
            .attr("stroke", "#000")
            .attr("stroke-width", 1.5)
            .attr("pointer-events", "all");
        
          // Add clipped image
          yordanGroup.append("image")
            .attr("href", "files/yordan/yadro.png")
            .attr("pointer-events", "visiblePainted")
            .attr("x", -size / 2)
            .attr("y", -size / 2)
            .attr("width", size)
            .attr("height", size)
            .attr("clip-path", "url(#yordanCircle)")
            .attr("pointer-events", "all");

          // after your .append("image")…
          yordanGroup.append("circle")
          .attr("r", size/2)
          .attr("fill", "transparent")
          .attr("pointer-events", "all")
          .on("mouseover", (event, d) => {
            tooltip.html(`
              <strong>${t.cleanName}</strong><br/>
              wOBA: ${t.wOBA.toFixed(3)}<br/>
              Barrel%: ${(t["barrel%"] * 100).toFixed(1)}<br/>
            `)
              .style("opacity", 1);
          })
          .on("mousemove", event => {
            tooltip
              .style("left", (event.clientX ) + "px")
              .style("top", (event.clientY +750) + "px");
          })        
          .on("mouseout", () => tooltip.style("opacity", 0));

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
        .text("Barrel%");

      svg.append("text")
        .attr("x", width / 2)
        .attr("y", -margin.top / 2)
        .attr("text-anchor", "middle")
        .attr("font-size", "18px")
        .text("Overall: Barrel% vs wOBA");
    })
    .catch(err => console.error("JSON load error:", err));
}

// Initial draw
window.addEventListener('DOMContentLoaded', drawOverallScatter);

// Redraw on window resize
window.addEventListener('resize', drawOverallScatter);