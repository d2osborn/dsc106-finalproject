document.addEventListener("DOMContentLoaded", function() {
  // fetch data from JSON file located at files/But/league_trend.json
  fetch('files/But/league_trend.json')
    .then(response => response.json())
    .then(data => {
      // Parse and prepare chart data (adjust the keys as per your JSON schema)
      const labels = data.map(item => item.label);
      const dataset = data.map(item => item.value);

      // Use the new container inserted in index.html
      const chartContainer = document.getElementById('leagueCorrelationContainer');
      if (chartContainer) {
        chartContainer.style.display = 'flex';
        chartContainer.style.justifyContent = 'center';
        chartContainer.style.alignItems = 'center';
        chartContainer.style.minHeight = '100vh'; // Ensure the container stretches to full viewport height
      }
      
      // Assume there's a canvas element with id "leagueCorrelationChart"
      const ctx = document.getElementById('leagueCorrelationChart')?.getContext('2d');
      if (!ctx) {
         console.error("Canvas element with id 'leagueCorrelationChart' not found.");
         return;
      }

      new Chart(ctx, {
         type: 'line',
         data: {
           labels: labels,
           datasets: [{
               label: 'Explore Swing Metric Correlations',
               data: dataset,
               backgroundColor: 'rgba(75, 192, 192, 0.2)',
               borderColor: 'rgba(75, 192, 192, 1)',
               borderWidth: 2,
               fill: true
           }]
         },
         options: {
           responsive: true,
           maintainAspectRatio: false,
           layout: {
             padding: {
               left: 20,
               right: 20,
               top: 20,
               bottom: 20
             }
           },
           plugins: {
             title: {
               display: true,
               text: 'Explore Swing Metric Correlations',
               font: {
                 family: 'Montserrat, sans-serif',
                 size: 18
               },
               padding: {
                 top: 10,
                 bottom: 30
               }
             },
             legend: {
               labels: {
                 font: {
                   family: 'Montserrat, sans-serif',
                   size: 12
                 }
               }
             }
           },
           scales: {
             x: {
               ticks: {
                 font: {
                   family: 'Montserrat, sans-serif',
                   size: 12
                 }
               }
             },
             y: {
               ticks: {
                 font: {
                   family: 'Montserrat, sans-serif',
                   size: 12
                 }
               }
             }
           }
         }
      });
    })
    .catch(err => console.error('Error loading league trend data:', err));
});