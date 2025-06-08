// radar.js (or your scatter script)
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
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  const tooltip = d3.select("#tooltip");

  d3.json("files/yordan/overall_wOBA_vs_barrel_percent.json")
    .then(data => {
      // parse numerics
      data.forEach(d => {
        d.wOBA = +d.wOBA;
        d["barrel%"] = +d["barrel%"];
        // make sure all %‐fields exist as numbers!
        d["swing%"] = +d["swing%"];
        d["zone_swing%"] = +d["zone_swing%"];
        d["chase%"] = +d["chase%"];
        d["contact%"] = +d["contact%"];
        d["whiff%"] = +d["whiff%"];
        d["foul%"] = +d["foul%"];
        d["in_play%"] = +d["in_play%"];
        d["oppo%"] = +d["oppo%"];
        d["gb%"] = +d["gb%"];
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
        .attr("r", 4)
        .attr("fill", "steelblue")
        .attr("opacity", 0.6)
        .on("mouseover", (event, d) => {
          tooltip.html(`
            <strong>${d.name_with_stand}</strong><br/>
            wOBA: ${d.wOBA.toFixed(3)}<br/>
            Barrel %: ${(d["barrel%"] * 100).toFixed(1)}%<br/>
            Swing %: ${(d["swing%"] * 100).toFixed(1)}%<br/>
            Zone swing %: ${(d["zone_swing%"] * 100).toFixed(1)}%<br/>
            Chase %: ${(d["chase%"] * 100).toFixed(1)}%<br/>
            Contact %: ${(d["contact%"] * 100).toFixed(1)}%<br/>
            Whiff %: ${(d["whiff%"] * 100).toFixed(1)}%<br/>
            Foul %: ${(d["foul%"] * 100).toFixed(1)}%<br/>
            In‐play %: ${(d["in_play%"] * 100).toFixed(1)}%<br/>
            Oppo %: ${(d["oppo%"] * 100).toFixed(1)}%<br/>
            GB %: ${(d["gb%"] * 100).toFixed(1)}%<br/>
            Barrel hits: ${d.is_barrel}<br/>
            Pitches seen: ${d.pitches_seen}
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

      // highlight Yordan
      const t = data.find(d => d.name_with_stand === "Yordan AlvarezL");
      if (t) {
        const xVal = x(t.wOBA), yVal = y(t["barrel%"]);
        svg.append("circle")
          .attr("cx", xVal).attr("cy", yVal)
          .attr("r", 8).attr("stroke", "black").attr("fill", "none");
        svg.append("text")
          .attr("x", xVal + 6).attr("y", yVal - 10)
          .text(t.name_with_stand)
          .attr("font-weight", "bold").attr("font-size", "12px");
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
        .attr("text-anchor", "middle").attr("font-size", "18px")
        .text("Overall: Barrel % vs wOBA");
    })
    .catch(err => console.error("JSON load error:", err));
}

// Initial draw
drawOverallScatter();

// Redraw on window resize
window.addEventListener('resize', drawOverallScatter);
