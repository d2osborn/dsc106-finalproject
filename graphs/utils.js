// Ensure d3 is available
if (typeof d3 === 'undefined') {
    console.error('D3.js is required but not loaded');
}

export function appendMLBAverage(svg, data, field) {
    if (!svg || !data || !field) {
        console.error('Missing required parameters for appendMLBAverage');
        return;
    }

    const mlbAvg = d3.mean(data, d => +d[field]);
    if (mlbAvg !== null && !isNaN(mlbAvg)) {
        // Get the viewBox dimensions
        const viewBox = svg.attr('viewBox') ? svg.attr('viewBox').split(' ').map(Number) : [0, 0, 200, 200];
        const width = viewBox[2];
        const height = viewBox[3];

        // Create a group for the MLB Average text
        const mlbGroup = svg.append('g')
            .attr('transform', `translate(${width/2}, ${height - 20})`);

        // Add the text with appropriate units for each field
        let unit = '';
        let fontSize = '20px';  // Default font size
        
        switch(field) {
            case 'attack_angle':
                unit = '°';
                fontSize = '2vw';  // Match the title's font size style
                break;
            case 'bat_speed':
                unit = ' mph';
                break;
            case 'swing_path_tilt':
                unit = '°';
                break;
        }

        mlbGroup.append('text')
            .attr('text-anchor', 'middle')
            .attr('class', 'mlb-average')
            .style('font-size', fontSize)
            .style('font-weight', 'bold')
            .style('fill', '#b8860b')  // Match the gold color used in other text
            .text(`MLB Average: ${mlbAvg.toFixed(1)}${unit}`);
    }
} 