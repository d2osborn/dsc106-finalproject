d3.json(".files/yordan/alvarez_kde_data.json").then(data => {
  const { zone, grid } = data;
  const width = 400;
  const height = 400;
  const margin = { top: 30, right: 20, bottom: 40, left: 50 };

  const x = d3.scaleLinear().domain([d3.min(grid.x), d3.max(grid.x)]).range([0, width]);
  const y = d3.scaleLinear().domain([d3.min(grid.y), d3.max(grid.y)]).range([height, 0]);

  const color = d3.scaleSequential(d3.interpolateCool)
                  .domain([0, d3.max(grid.z0.flat().concat(grid.z2.flat()))]);

  function drawHeatmap(containerId, zData, title) {
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
      .attr("fill", d => color(d.value));

    // Strike zone rectangle
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

  drawHeatmap("#heatmap0", grid.z0, "0-Strike Contact Density");
  drawHeatmap("#heatmap2", grid.z2, "2-Strike Contact Density");
});
