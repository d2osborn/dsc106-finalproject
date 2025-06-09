import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7/+esm';

// Updated stat field order and labels
const fields = [
  { label: "barrel%", key: "barrel%" },
  { label: "chase%", key: "chase%" },
  { label: "contact%", key: "contact%" },
  { label: "whiff%", key: "whiff%" },
  { label: "oppo%", key: "oppo%" },
  { label: "gb%", key: "gb%" }
];

const playerLookup = {};
const leagueLookup = {};
let dataLoaded = false;

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
  dataLoaded = true;
  setTimeout(updateStatsTable, 100);
}).catch(err => console.error("Error preloading stats data:", err));

function updateStatsTable() {
  if (!dataLoaded) return;

  const playerInput = document.getElementById("player-input");
  const radios = document.getElementsByName("count");

  if (!playerInput || !radios.length) {
    setTimeout(updateStatsTable, 200);
    return;
  }

  const playerName = playerInput.value.trim();
  const count = Array.from(radios).find(r => r.checked)?.value;

  let stats;
  if (playerName && playerLookup[count]) {
    stats = playerLookup[count].find(d => d.name_with_stand === playerName);
  }
  if (!stats) {
    stats = Object.assign({ name_with_stand: "League Average" }, leagueLookup[count]);
  }

  const container = d3.select(".small-rectangle");
  container.html('<div style="color: orange; text-align: center; padding: 20px;">Updating...</div>');

  let tableHtml = `<div style="color: white; font-size: 12px; margin-bottom: 5px; text-align: center;">
                     ${stats.name_with_stand} - ${count} Strikes
                   </div>`;
  tableHtml += '<table style="width:100%; height:90%; table-layout: fixed; border-collapse: collapse; color: #ffffff;">';

  for (let i = 0; i < fields.length; i += 2) {
    tableHtml += '<tr style="height:33.33%;">';

    const field1 = fields[i];
    const value1 = stats[field1.key] != null ? (stats[field1.key] * 100).toFixed(1) : "-";
    tableHtml += `<td style="border:1px solid #fff; padding:5px; text-align:center; vertical-align:middle; font-weight: bold;">
                    ${field1.label}:<br/>${value1}
                  </td>`;

    if (i + 1 < fields.length) {
      const field2 = fields[i + 1];
      const value2 = stats[field2.key] != null ? (stats[field2.key] * 100).toFixed(1) : "-";
      tableHtml += `<td style="border:1px solid #fff; padding:5px; text-align:center; vertical-align:middle; font-weight: bold;">
                      ${field2.label}:<br/>${value2}
                    </td>`;
    } else {
      tableHtml += '<td></td>';
    }

    tableHtml += '</tr>';
  }

  tableHtml += '</table>';

  setTimeout(() => {
    container.html(tableHtml);
    container.transition()
      .duration(200)
      .style("background-color", "rgba(235, 110, 31, 0.2)")
      .transition()
      .duration(300)
      .style("background-color", null);
  }, 50);
}

window.updateStatsTable = updateStatsTable;

document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    const playerInput = document.getElementById("player-input");
    const radios = document.getElementsByName("count");

    if (playerInput) {
      playerInput.addEventListener("change", updateStatsTable);
      playerInput.addEventListener("keyup", e => {
        if (e.key === "Enter") updateStatsTable();
      });
    }

    Array.from(radios).forEach(r => r.addEventListener("change", updateStatsTable));
    updateStatsTable();
  }, 500);
});
