// stats.js
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

// helper to turn 1 → "1st", 2 → "2nd", ...
function ordinalSuffix(i) {
  const j = i % 10, k = i % 100;
  if (j === 1 && k !== 11) return "st";
  if (j === 2 && k !== 12) return "nd";
  if (j === 3 && k !== 13) return "rd";
  return "th";
}

// Use dynamic sizing by reading container dimensions; fallback defaults used if necessary
const containerNode = d3.select("#stats").node();
const rect = containerNode.getBoundingClientRect();
const WIDTH  = rect.width || 300;
const HEIGHT = rect.height || 300;
const PADDING = 10;
const HEADER_HEIGHT = 30;

const svg = d3.select("#stats")
  .append("svg")
    .attr("width", "100%")
    .attr("height", "100%")
    .attr("viewBox", `0 0 ${WIDTH} ${HEIGHT}`)
    .attr("preserveAspectRatio", "xMidYMid meet");

d3.json("files/yordan/yordansummary.json").then(data => {
  const y = data.find(d => d.name_with_stand === "Yordan AlvarezL");
  if (!y) return console.error("Yordan not found");

  // Build stats array
  const raw = [
    {
      keyPct:     "wOBA_percentile",
      actualKey:  "wOBA",
      label:      "wOBA",
      format:     d => d.actual.toFixed(3)
    },
    {
      keyPct:     "barrel%_percentile",
      actualKey:  "barrel%",
      label:      "Barrel%",
      format:     d => (d.actual * 100).toFixed(1)
    },
    {
      keyPct:     "HRs_percentile",
      actualKey:  "HRs",
      label:      "HRs",
      format:     d => d.actual
    },
    {
      keyPct:     "EV90_percentile",
      actualKey:  "EV90",
      label:      "EV90",
      format:     d => d.actual.toFixed(0) + " mph"
    },
  ];

  const stats = raw.map(r => ({
    label:   r.label,
    value:   Math.round(y[r.keyPct]),
    actual:  +y[r.actualKey],
    format:  r.format
  }));

  const title = svg.append("text")
    .attr("class", "player-name")
    .attr("x", WIDTH / 2)
    .attr("y", HEADER_HEIGHT / 2 + 6)
    .attr("text-anchor", "middle");

  // Add "Yordan's"
  title.append("tspan")
    .style("fill", "#002D62")
    .text("Yordan's ");

  // Add "2024"
  title.append("tspan")
    .style("fill", "#EB6E1F")
    .text("2024 ");

  // Add "Percentiles"
  title.append("tspan")
    .style("fill", "#002D62")
    .text("Percentiles");

  // Create a grid that fills the remaining space
  const gridX = 0;
  const gridY = HEADER_HEIGHT + PADDING;
  const gridWidth = WIDTH;
  const gridHeight = HEIGHT - HEADER_HEIGHT - 2 * PADDING;

  const GUTTER = 10,
        cols = 2,
        rows = 2,
        cellW = (gridWidth - GUTTER) / cols,
        cellH = (gridHeight - GUTTER) / rows;

  const blocks = svg.selectAll("g.block")
    .data(stats)
    .join("g")
      .attr("class", "block")
      .attr("transform", (d, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const x = gridX + col * (cellW + GUTTER);
        const y = gridY + row * (cellH + GUTTER);
        return `translate(${x},${y})`;
      });

  // Draw circles and texts in each grid cell
  blocks.each(function(d) {
    const g  = d3.select(this);
    const cx = cellW / 2;
    const cy = cellH / 2 - 8;
    const r  = Math.min(cellW, cellH) * 0.42;
    g.append("circle")
      .attr("class", "card-circle")
      .attr("cx", cx)
      .attr("cy", cy)
      .attr("r", r);
    g.append("text")
      .attr("class", "circle-value")
      .classed("highlight", d.value >= 90)
      .attr("x", cx)
      .attr("y", cy - 8)
      .text(d.value + ordinalSuffix(d.value));
    g.append("text")
      .attr("class", "circle-actual")
      .attr("x", cx)
      .attr("y", cy + 16)
      .text(`${d.label} : ${d.format(d)}`);
  });
})
.catch(console.error);
