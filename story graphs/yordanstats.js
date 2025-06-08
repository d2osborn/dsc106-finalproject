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

const WIDTH         = 800;
const HEIGHT        = 400;
const PADDING       = 20;
const HEADER_HEIGHT = 40;   // reserve space at top for the name

const svg = d3.select("#stats")
  .append("svg")
    .attr("width",  WIDTH)
    .attr("height", HEIGHT);

d3.json("files/yordan/yordansummary.json").then(data => {
  const y = data.find(d => d.name_with_stand === "Yordan AlvarezL");
  if (!y) return console.error("Yordan not found");

  // 3) Build stats array
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
      label:      "Barrel %",
      format:     d => (d.actual * 100).toFixed(1) + "%"
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

  // 4) One big, centered outer box
  const BOX_WIDTH  = 450;
  const BOX_HEIGHT = HEIGHT - 2*PADDING - HEADER_HEIGHT;
  const BOX_X      = (WIDTH - BOX_WIDTH) / 2;
  const BOX_Y      = PADDING;

  svg.append("rect")
    .attr("class", "outer-box")
    .attr("x",      BOX_X)
    .attr("y",      BOX_Y)
    .attr("width",  BOX_WIDTH)
    .attr("height", BOX_HEIGHT + HEADER_HEIGHT)
    .attr("rx",     8);

  // 5) Name inside the box, vertically centered in header
  svg.append("text")
    .attr("class",       "player-name")
    .attr("x",           BOX_X + BOX_WIDTH/2)
    .attr("y",           BOX_Y + HEADER_HEIGHT/2 + 6)  // +6 to adjust for baseline
    .attr("text-anchor", "middle")
    .text("Yordan's 2024 Statistics");

  // 6) 2×2 grid inside the box, below header
  const GUTTER = 10;
  const cols   = 2, rows = 2;
  const cellW  = (BOX_WIDTH  - GUTTER) / cols;
  const cellH  = (BOX_HEIGHT - GUTTER) / rows;

  const blocks = svg.selectAll("g.block")
    .data(stats)
    .join("g")
      .attr("class", "block")
      .attr("transform", (d,i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const x   = BOX_X + col*(cellW + GUTTER);
        const y   = BOX_Y + HEADER_HEIGHT + row*(cellH + GUTTER);
        return `translate(${x},${y})`;
      });

  // 7) Draw each circle + texts
  blocks.each(function(d) {
    const g  = d3.select(this);
    const cx = cellW/2;
    const cy = cellH/2 - 10;
    const r  = Math.min(cellW, cellH)*0.42;

    g.append("circle")
      .attr("class", "card-circle")
      .attr("cx", cx)
      .attr("cy", cy)
      .attr("r",  r);

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
