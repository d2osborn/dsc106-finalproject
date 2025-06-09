// Define stat fields (using sandbox columns)
const fields = [
  { label: "chase%", key: "chase%" },
  { label: "contact%", key: "contact%" },
  { label: "whiff%", key: "whiff%" },
  { label: "oppo%", key: "oppo%" },
  { label: "gb%", key: "gb%" },
  { label: "barrel%", key: "barrel%" }
];

// Global lookups for preloaded data per strike count.
const playerLookup = {};  // keys "0" and "2"
const leagueLookup = {};  // keys "0" and "2"

// Preload JSON files (similar to other graphs' logic)
Promise.all([
  d3.json('files/sandbox/player_average_rates_0str.json'),
  d3.json('files/sandbox/player_average_rates_2str.json'),
  d3.json('files/sandbox/league_average_rates_0str.json'),
  d3.json('files/sandbox/league_average_rates_2str.json')
]).then(([p0, p2, l0, l2]) => {
  playerLookup['0'] = p0;
  playerLookup['2'] = p2;
  leagueLookup['0'] = Array.isArray(l0) ? l0[0] : l0;
  leagueLookup['2'] = Array.isArray(l2) ? l2[0] : l2;
  // Initial table update once data is loaded.
  updateStatsTable();
}).catch(err => console.error("Error preloading stats data:", err));

function updateStatsTable() {
  const playerInput = document.getElementById("player-input");
  const radios = document.getElementsByName("count");
  const playerName = playerInput.value.trim();
  const count = Array.from(radios).find(r => r.checked).value;
  
  // Look for a matching player entry in the preloaded dataset.
  let stats;
  if(playerName && playerLookup[count]) {
    stats = playerLookup[count].find(d => d.name_with_stand === playerName);
  }
  // If no player match found, use league average.
  if(!stats) {
    stats = Object.assign({ name_with_stand: "League Average" }, leagueLookup[count]);
  }
  
  // Debug log to verify stats selection.
  console.log("Updating stats table with:", stats);
  
  // Build a grid table with 3 rows and 2 columns (each cell centered).
  let tableHtml = '<table style="width:100%; height:100%; table-layout: fixed; border-collapse: collapse; color: orange;">';
  for (let i = 0; i < fields.length; i += 2) {
    tableHtml += '<tr style="height:33.33%;">';
    // First cell
    const field1 = fields[i];
    const value1 = stats[field1.key] != null ? (stats[field1.key] * 100).toFixed(1) + "%" : "-";
    tableHtml += `<td style="border:1px solid #fff; padding:5px; text-align:center; vertical-align:middle;">
                    ${field1.label}: ${value1}
                  </td>`;
    // Second cell (if exists)
    if(i + 1 < fields.length) {
      const field2 = fields[i + 1];
      const value2 = stats[field2.key] != null ? (stats[field2.key] * 100).toFixed(1) + "%" : "-";
      tableHtml += `<td style="border:1px solid #fff; padding:5px; text-align:center; vertical-align:middle;">
                      ${field2.label}: ${value2}
                    </td>`;
    } else {
      tableHtml += '<td></td>';
    }
    tableHtml += '</tr>';
  }
  tableHtml += '</table>';
  d3.select(".small-rectangle").html(tableHtml);
}

document.addEventListener('DOMContentLoaded', () => {
  // Attach event listeners as in the other graphs
  document.getElementById("player-input")
    .addEventListener("change", updateStatsTable);
  document.getElementById("player-input")
    .addEventListener("keyup", e => { if(e.key === "Enter") updateStatsTable(); });
  Array.from(document.getElementsByName("count"))
    .forEach(radio => radio.addEventListener("change", updateStatsTable));
  // Initial call
  updateStatsTable();
});
