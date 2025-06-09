import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7/+esm';

// Define stat fields (using sandbox columns)
const fields = [
  { label: "chase%", key: "chase%" },
  { label: "contact%", key: "contact%" },
  { label: "whiff%", key: "whiff%" },
  { label: "oppo%", key: "oppo%" },
  { label: "gb%", key: "gb%" },
  { label: "barrel%", key: "barrel%" }
];

let previousStats = null;

function updateStatsTable() {
  const playerInput = document.getElementById("player-input");
  const radios = document.getElementsByName("count");
  const playerName = playerInput.value.trim();
  const count = Array.from(radios).find(r => r.checked).value;

  // Use a timestamp to prevent caching
  const timestamp = new Date().getTime();
  // Always fetch fresh data for each query
  const playerFile = `files/sandbox/player_average_rates_${count}str.json?_=${timestamp}`;
  const leagueFile = `files/sandbox/league_average_rates_${count}str.json?_=${timestamp}`;

  d3.json(playerFile).then(data => {
    let match = null;
    if (playerName) {
      match = (Array.isArray(data) ? data : [data]).find(d => d.name_with_stand === playerName);
    }
    if (match) {
      renderStats(match);
    } else {
      d3.json(leagueFile).then(ldata => {
        const league = Array.isArray(ldata) ? ldata[0] : ldata;
        renderStats(Object.assign({ name_with_stand: "League Average" }, league));
      }).catch(err => console.error("Error fetching league data:", err));
    }
  }).catch(err => console.error("Error fetching player data:", err));
}

function renderStats(stats) {
  const container = d3.select(".small-rectangle");

  // Clear the existing table
  container.selectAll("*").remove();

  // Create a new table
  const table = container.append("table")
    .style("width", "100%")
    .style("height", "100%")
    .style("table-layout", "fixed")
    .style("border-collapse", "collapse")
    .style("color", "orange");

  // Build the table rows and cells
  for (let i = 0; i < fields.length; i += 2) {
    const row = table.append("tr").style("height", "33.33%");
    row.append("td")
       .attr("class", "metric-cell")
       .style("border", "1px solid #fff")
       .style("padding", "5px")
       .style("text-align", "center")
       .style("vertical-align", "middle");
    if (i + 1 < fields.length) {
      row.append("td")
         .attr("class", "metric-cell")
         .style("border", "1px solid #fff")
         .style("padding", "5px")
         .style("text-align", "center")
         .style("vertical-align", "middle");
    } else {
      row.append("td");
    }
  }

  // Update each cell’s displayed value with a transition
  table.selectAll("td.metric-cell").data(fields).transition()
    .duration(500)
    .tween("text", function(d) {
      const cell = d3.select(this);
      let prevVal = 0;
      if (previousStats && previousStats[d.key] != null) {
        prevVal = previousStats[d.key] * 100;
      }
      const newVal = stats[d.key] != null ? stats[d.key] * 100 : 0;
      const iVal = d3.interpolateNumber(prevVal, newVal);
      return function(t) {
        cell.text(`${d.label}: ${iVal(t).toFixed(1)}%`);
      };
    });

  // Store current stats for next transition
  previousStats = stats;
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById("player-input")
    .addEventListener("change", updateStatsTable);
  document.getElementById("player-input")
    .addEventListener("keyup", e => { if (e.key === "Enter") updateStatsTable(); });
  Array.from(document.getElementsByName("count"))
    .forEach(radio => radio.addEventListener("change", updateStatsTable));
  updateStatsTable();
});
