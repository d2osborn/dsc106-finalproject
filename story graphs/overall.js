import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

const margin = { top: 60, right: 30, bottom: 60, left: 80 }; // minimal adjustments
const width = 900 - margin.left - margin.right;
const height = 600 - margin.top - margin.bottom;

const svg = d3.select("#scatter-barrel-woba")
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform", `translate(${margin.left},${margin.top})`);

d3.json("files/yordan/overall_wOBA_vs_barrel_percent.json")
  .then(data => {
    data.forEach(d => {
      d.wOBA = +d.wOBA;
      d["barrel%"] = +d["barrel%"];
    });

    const x = d3.scaleLinear()
      .domain(d3.extent(data, d => d.wOBA)).nice()
      .range([0, width]);

    const y = d3.scaleLinear()
      .domain(d3.extent(data, d => d["barrel%"])).nice()
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
      .attr("cy", d => y(d["barrel%"]))
      .attr("r", 4)
      .attr("fill", "steelblue")
      .attr("opacity", 0.6);

    const target = data.find(d => d.name_with_stand === "Yordan AlvarezL");
    if (target) {
      const xVal = x(target.wOBA);
      const yVal = y(target["barrel%"]);

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
      .attr("y", height + 45)
      .attr("text-anchor", "middle")
      .text("wOBA");

    svg.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", -65) // was -50
      .attr("x", -height / 2)
      .attr("text-anchor", "middle")
      .text("Barrel %");

    svg.append("text")
      .attr("x", width / 2)
      .attr("y", -30) // was -20
      .attr("text-anchor", "middle")
      .attr("font-size", 18)
      .text("Player Barrel % vs wOBA");
  })
  .catch(error => {
    console.error("Failed to load JSON data:", error);
  });
