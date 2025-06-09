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

// Global lookups for preloaded data per strike count.
const playerLookup = {};  // keys "0" and "2"
const leagueLookup = {};  // keys "0" and "2"
let dataLoaded = false;

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
  dataLoaded = true;
  console.log("Data preloaded successfully:", { playerLookup, leagueLookup });
  // Initial table update once data is loaded
  setTimeout(updateStatsTable, 100); // Small delay to ensure DOM is ready
}).catch(err => console.error("Error preloading stats data:", err));

function updateStatsTable() {
  console.log("updateStatsTable called, dataLoaded:", dataLoaded);
  
  if (!dataLoaded) {
    console.log("Data not loaded yet, skipping update");
    return;
  }
  
  const playerInput = document.getElementById("player-input");
  const radios = document.getElementsByName("count");
  
  if (!playerInput || !radios.length) {
    console.log("Player input or radios not found yet, waiting...");
    setTimeout(updateStatsTable, 200); // Try again in 200ms
    return;
  }
  
  const playerName = playerInput.value.trim();
  const count = Array.from(radios).find(r => r.checked)?.value;
  
  console.log("Current inputs:", { playerName, count });
  
  // Look for a matching player entry in the preloaded dataset.
  let stats;
  if(playerName && playerLookup[count]) {
    stats = playerLookup[count].find(d => d.name_with_stand === playerName);
    console.log("Player found:", stats);
  }
  // If no player match found, use league average.
  if(!stats) {
    stats = Object.assign({ name_with_stand: "League Average" }, leagueLookup[count]);
    console.log("Using league average:", stats);
  }
  
  // Debug log to verify stats selection.
  console.log("Final stats for table:", stats);
  
  const container = d3.select(".small-rectangle");
  
  // Add loading indicator
  container.html('<div style="color: orange; text-align: center; padding: 20px;">Updating...</div>');
  
  // Build a grid table with 3 rows and 2 columns (each cell centered).
  let tableHtml = `<div style="color: white; font-size: 12px; margin-bottom: 5px; text-align: center;">
                     ${stats.name_with_stand} - ${count} Strikes
                   </div>`;
  tableHtml += '<table style="width:100%; height:90%; table-layout: fixed; border-collapse: collapse; color: orange;">';
  
  for (let i = 0; i < fields.length; i += 2) {
    tableHtml += '<tr style="height:33.33%;">';
    // First cell
    const field1 = fields[i];
    const value1 = stats[field1.key] != null ? (stats[field1.key] * 100).toFixed(1) + "%" : "-";
    tableHtml += `<td style="border:1px solid #fff; padding:5px; text-align:center; vertical-align:middle; font-weight: bold;">
                    ${field1.label}: ${value1}
                  </td>`;
    // Second cell (if exists)
    if(i + 1 < fields.length) {
      const field2 = fields[i + 1];
      const value2 = stats[field2.key] != null ? (stats[field2.key] * 100).toFixed(1) + "%" : "-";
      tableHtml += `<td style="border:1px solid #fff; padding:5px; text-align:center; vertical-align:middle; font-weight: bold;">
                      ${field2.label}: ${value2}
                    </td>`;
    } else {
      tableHtml += '<td></td>';
    }
    tableHtml += '</tr>';
  }
  tableHtml += '</table>';
  
  console.log("Setting table HTML:", tableHtml);
  
  // Add transition effect
  setTimeout(() => {
    container.html(tableHtml);
    // Flash effect to show update
    container.transition()
      .duration(200)
      .style("background-color", "rgba(235, 110, 31, 0.2)")
      .transition()
      .duration(300)
      .style("background-color", null);
  }, 50);
}

// Make function globally accessible
window.updateStatsTable = updateStatsTable;

// Add back event listeners to ensure the table updates
document.addEventListener('DOMContentLoaded', () => {
  console.log("DOM loaded, setting up stats table event listeners");
  
  // Wait a bit for elements to be created by the main script
  setTimeout(() => {
    const playerInput = document.getElementById("player-input");
    const radios = document.getElementsByName("count");
    
    if (playerInput) {
      playerInput.addEventListener("change", () => {
        console.log("Player input changed (statsTable)");
        updateStatsTable();
      });
      playerInput.addEventListener("keyup", e => { 
        if(e.key === "Enter") {
          console.log("Enter pressed (statsTable)");
          updateStatsTable();
        }
      });
    }
    
    Array.from(radios).forEach(radio => radio.addEventListener("change", () => {
      console.log("Radio changed (statsTable)");
      updateStatsTable();
    }));
    
    // Initial update
    updateStatsTable();
  }, 500);
});
