import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

// Load data using fetch instead of d3.json to bypass potential json.js issue
fetch("files/yordan/alvarez_kde_data.json")
  .then(response => {
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  })
  .then(data => {
    const { zone, grid } = data;

    // internal drawing dimensions
    const width  = 400;
    const height = 400;
    const margin = { top: 30, right: 20, bottom: 40, left: 50 };
    const tile = 320;

    /* ─── scales ─────────────────────────────────────────── */
    const x = d3.scaleLinear()
                .domain([d3.min(grid.x), d3.max(grid.x)])
                .range([0, width]);

    const y = d3.scaleLinear()
                .domain([d3.min(grid.y), d3.max(grid.y)])
                .range([height, 0]);

    const color0 = d3.scaleSequential(d3.interpolateRdBu)
                     .domain([d3.max(grid.z0.flat()), 0]);   // reversed

    const color2 = d3.scaleSequential(d3.interpolateRdBu)
                     .domain([d3.max(grid.z2.flat()), 0]);

    /* ─── reusable heat-map drawing function ─────────────── */
    function drawHeatmap(containerId, zData, title, colorScale) {

      /* 1️⃣  create an SVG with a viewBox so it can shrink
         --------------------------------------------------- */
      const svg = d3.select(containerId)
        .append("svg")
        .attr(
          "viewBox",
          `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`
        )
        .attr("preserveAspectRatio", "xMidYMid meet") // keep it square
        .style("width",  "100%")   // parent sets final size (e.g. 240 px)
        .style("height", "auto")
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

      /* 2️⃣  draw the heat-map grid
         --------------------------------------------------- */
      const cellWidth  = width  / grid.x.length;
      const cellHeight = height / grid.y.length;

      svg.selectAll("rect")
        .data(
          zData[0].map((_, i) =>
            zData.map((row, j) => ({ x: grid.x[j], y: grid.y[i], value: row[i] }))
          ).flat()
        )
        .enter()
        .append("rect")
        .attr("x", d => x(d.x))
        .attr("y", d => y(d.y) - cellHeight)
        .attr("width",  cellWidth)
        .attr("height", cellHeight)
        .attr("fill",   d => colorScale(d.value));

      /* 3️⃣  strike-zone outline
         --------------------------------------------------- */
      svg.append("rect")
        .attr("x", x(zone.left))
        .attr("y", y(zone.top))
        .attr("width",  x(zone.right) - x(zone.left))
        .attr("height", y(zone.bottom) - y(zone.top))
        .attr("fill",  "none")
        .attr("stroke","red")
        .attr("stroke-width", 2);

      /* 4️⃣  small title above each plot
         --------------------------------------------------- */
      svg.append("text")
        .attr("x", width / 2)
        .attr("y", -10)
        .attr("text-anchor", "middle")
        .text(title);
    }

    /* ─── render both heat-maps ──────────────────────────── */
    drawHeatmap("#heatmap0", grid.z0, "0-Strike Contact Density", color0);
    drawHeatmap("#heatmap2", grid.z2, "2-Strike Contact Density", color2);
  })
  .catch(error => {
    console.error('Error loading KDE data:', error);
  });