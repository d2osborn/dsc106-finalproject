d3.json("files/yordan/alvarez_kde_data.json").then(data => {
  const { zone, grid } = data;
  const width = 400;
  const height = 400;
  const margin = { top: 30, right: 20, bottom: 40, left: 50 };

  const x = d3.scaleLinear().domain([d3.min(grid.x), d3.max(grid.x)]).range([0, width]);
  const y = d3.scaleLinear().domain([d3.min(grid.y), d3.max(grid.y)]).range([height, 0]);

  const color0 = d3.scaleSequential(d3.interpolateRdBu)
  .domain([d3.max(grid.z0.flat()), 0]); // Reverse for RdBu

  const color2 = d3.scaleSequential(d3.interpolateRdBu)
    .domain([d3.max(grid.z2.flat()), 0]);

  function drawHeatmap(containerId, zData, title, colorScale) {
    const svg = d3.select(containerId)
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const cellWidth = width / grid.x.length;
    const cellHeight = height / grid.y.length;

    svg.selectAll("rect")
      .data(zData.flatMap((row, j) =>
        row.map((val, i) => ({ x: grid.x[i], y: grid.y[j], value: val }))
      ))
      .enter()
      .append("rect")
      .attr("x", d => x(d.x))
      .attr("y", d => y(d.y) - cellHeight)
      .attr("width", cellWidth)
      .attr("height", cellHeight)
      .attr("fill", d => colorScale(d.value)); // 🔁 use colorScale here

    // Strike zone
    svg.append("rect")
      .attr("x", x(zone.left))
      .attr("y", y(zone.top))
      .attr("width", x(zone.right) - x(zone.left))
      .attr("height", y(zone.bottom) - y(zone.top))
      .attr("fill", "none")
      .attr("stroke", "red")
      .attr("stroke-width", 2);

    svg.append("text")
      .attr("x", width / 2)
      .attr("y", -10)
      .attr("text-anchor", "middle")
      .text(title);
  }

  // 🎯 Use separate color scales
  drawHeatmap("#heatmap0", grid.z0, "0-Strike Contact Density", color0);
  drawHeatmap("#heatmap2", grid.z2, "2-Strike Contact Density", color2);
});
