export function drawSwingPathTilt(containerSel, data, config) {
    console.log('drawSwingPathTilt called with data:', data, 'and config:', config);

    // Create SVG container
    const svg = containerSel.append('svg')
        .attr('viewBox', '0 0 400 400')
        .attr('preserveAspectRatio', 'xMidYMid meet')
        .style('background-color', '#f0f0f0'); // Temporary background for debugging
    
    // Title
    svg.append('text')
        .attr('x', 200)
        .attr('y', 50)
        .attr('text-anchor', 'middle')
        .attr('fill', '#000080')
        .style('font-size', '2vw')
        .text(config.title);
    
    // Compute average swing_path_tilt (absolute value) and convert degrees to radians
    const avg = d3.mean(data, d => +d.swing_path_tilt) || 0;
    const theta = Math.abs(avg) * Math.PI / 180;
    
    // Set up base positioning
    const cx = 200, cy = 200;
    const r = 180;
    const ballX = cx + r * 0.85;
    const ballY = cy;
    const lineLength = 250;
    const zeroAngle = Math.PI;

    // Define baseline coordinates
    const blackX = ballX + lineLength * Math.cos(zeroAngle);
    const blackY = ballY - lineLength * Math.sin(zeroAngle);

    // Get previous angle if it exists
    const prevAngle = window.__prev_swing_path_tilt__ || 0;
    const prevTheta = Math.abs(prevAngle) * Math.PI / 180;
    const prevRedX = ballX + lineLength * Math.cos(zeroAngle + prevTheta);
    const prevRedY = ballY - lineLength * Math.sin(zeroAngle + prevTheta);

    // Store current angle for next transition
    window.__prev_swing_path_tilt__ = avg;

    // Baseline (black dashed line)
    svg.append('line')
        .attr('x1', ballX).attr('y1', ballY)
        .attr('x2', blackX).attr('y2', blackY)
        .attr('stroke', '#111')
        .attr('stroke-width', 3)
        .attr('stroke-dasharray', '8,6');

    // Compute red endpoint (for bat motion)
    const redX = ballX + lineLength * Math.cos(zeroAngle + theta);
    const redY = ballY - lineLength * Math.sin(zeroAngle + theta);
    
    // Draw filled polygon (triangle) between baseline and red endpoint with transition
    const fillPoly = svg.append('polygon')
        .attr('points', `${ballX},${ballY} ${blackX},${blackY} ${ballX},${ballY}`)
        .attr('fill', "#000080")
        .attr('opacity', 0.5);

    fillPoly.transition().duration(1000).attrTween("points", function() {
        return t => {
            const currX = prevRedX + (redX - prevRedX) * t;
            const currY = prevRedY + (redY - prevRedY) * t;
            return `${ballX},${ballY} ${blackX},${blackY} ${currX},${currY}`;
        };
    });
    
    const newHeight = 20;
    const batLength = lineLength;

    const batG = svg.append('g')
        .attr('class', 'swing-bat')
        .attr('transform', `translate(${ballX},${ballY})`);

    // Draw the bat
    batG.append('image')
        .attr('xlink:href', 'images/bat.svg')
        .attr('width', batLength)
        .attr('height', newHeight)
        .attr('preserveAspectRatio', 'none')
        .attr('x', 0)
        .attr('y', -newHeight/2)
        .attr('transform', 'scale(-1,1)');

    // Tween the bat rotation
    batG.transition()
        .duration(1000)
        .attrTween('transform', () => {
            const interp = d3.interpolateNumber(-prevAngle, -avg);
            return t => `translate(${ballX},${ballY}) rotate(${interp(t)})`;
        });
    
    // Compute centroid to place the average angle text inside the triangle
    const centroidX = (ballX + blackX + redX) / 3;
    const centroidY = (ballY + blackY + redY) / 3;
    svg.append('text')
        .attr('x', centroidX)
        .attr('y', centroidY)
        .attr('text-anchor', 'middle')
        .attr('fill', "#000")
        .style('font-size', '22px')
        .text(avg.toFixed(1) + "°");
    
    // MLB Average with larger font
    appendMLBAverage(svg, 200, 380, data, 'swing_path_tilt', "24px");
}

function appendMLBAverage(svg, cx, y, data, field, overrideFontSize) {
    let mlbAvg = null;
    if (window.__statcast_full_data__ && Array.isArray(window.__statcast_full_data__)) {
        mlbAvg = d3.mean(window.__statcast_full_data__, d => +d[field]);
    } else if (data && data.length > 0) {
        mlbAvg = d3.mean(data, d => +d[field]);
    }
    const fontSize = overrideFontSize || "24px";
    svg.append('text')
       .attr('x', cx)
       .attr('y', y)
       .attr('text-anchor', 'middle')
       .style('font-size', fontSize)
       .style('fill', '#E63946')
       .text(mlbAvg !== null && !isNaN(mlbAvg) ?
             `MLB Average: ${mlbAvg.toFixed(1)}${field==="swing_path_tilt"?"°":""}` : '');
}