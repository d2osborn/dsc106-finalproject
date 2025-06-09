export function drawSwingPathTilt(containerSel, data, config) {
    // Create SVG container
    const svg = containerSel.append('svg')
        .attr('viewBox', '0 0 400 400')
        .attr('preserveAspectRatio', 'xMidYMid meet');
    
    // Title
    svg.append('text')
        .attr('x', 200)
        .attr('y', 50)
        .attr('text-anchor', 'middle')
        .attr('fill', '#002D62')
        .style('font-size', '2vw')
        .text(config.title);
    
    // Get player name and determine handedness
    const playerName = data[0]?.name_with_stand || '';
    const isLeftHanded = playerName.endsWith('L');
    
    // Compute average swing_path_tilt (absolute value) and convert degrees to radians
    const avg = d3.mean(data, d => +d.swing_path_tilt) || 0;
    const prevAvg = window.previousSwingPathTilt !== undefined ? window.previousSwingPathTilt : 0;
    window.previousSwingPathTilt = avg;
    const prevTheta = Math.abs(prevAvg) * Math.PI / 180;
    const theta = Math.abs(avg) * Math.PI / 180;
    
    // Set up base positioning similar to attackAngle graph
    const cx = 200, cy = 200;
    const r = 180;
    const ballX = cx + r * 0.85;
    const ballY = cy;
    const lineLength = 250;
    const zeroAngle = Math.PI;  // baseline drawn at π (to the left)
    
    // Define baseline coordinates
    const blackX = ballX + lineLength * Math.cos(zeroAngle);
    const blackY = ballY - lineLength * Math.sin(zeroAngle);
    
    // Baseline (black dashed line)
    svg.append('line')
        .attr('x1', ballX).attr('y1', ballY)
        .attr('x2', blackX).attr('y2', blackY)
        .attr('stroke', '#111')
        .attr('stroke-width', 3)
        .attr('stroke-dasharray', '8,6');

    // Compute red endpoint (for bat motion) using (zeroAngle + theta)
    // Flip the angle for left-handed batters
    const adjustedTheta = isLeftHanded ? -theta : theta;
    const redX = ballX + lineLength * Math.cos(zeroAngle + adjustedTheta);
    const redY = ballY - lineLength * Math.sin(zeroAngle + adjustedTheta);
    
    // Draw filled polygon (triangle) between baseline and red endpoint with transition
    const fillPoly = svg.append('polygon')
        .attr('points', `${ballX},${ballY} ${blackX},${blackY} ${ballX + lineLength * Math.cos(zeroAngle + prevTheta)},${ballY - lineLength * Math.sin(zeroAngle + prevTheta)}`)
        .attr('fill', "#EB6E1F")
        .attr('opacity', 0.5);

    fillPoly.transition().duration(1000).attrTween("points", function() {
        return t => {
            const initX = ballX + lineLength * Math.cos(zeroAngle + prevTheta);
            const initY = ballY - lineLength * Math.sin(zeroAngle + prevTheta);
            const finalX = ballX + lineLength * Math.cos(zeroAngle + adjustedTheta);
            const finalY = ballY - lineLength * Math.sin(zeroAngle + adjustedTheta);
            const currX = initX + (finalX - initX) * t;
            const currY = initY + (finalY - initY) * t;
            return `${ballX},${ballY} ${blackX},${blackY} ${currX},${currY}`;
        };
    });
    
    const newHeight = 20;
    const batLength = lineLength;

    // Create bat group with initial position
    const batG = svg.append('g')
        .attr('class', 'swing-bat')
        .attr('transform', `translate(${ballX},${ballY}) rotate(${isLeftHanded ? Math.abs(prevAvg) : -Math.abs(prevAvg)})`);

    // Draw the bat
    batG.append('image')
        .attr('xlink:href', 'images/bat.svg')
        .attr('width', batLength)
        .attr('height', newHeight)
        .attr('preserveAspectRatio', 'none')
        .attr('x', 0)
        .attr('y', -newHeight/2)
        .attr('transform', isLeftHanded ? 'scale(1,1)' : 'scale(-1,1)');

    // Animate the bat rotation
    batG.transition()
        .duration(1000)
        .attrTween('transform', () => {
            const startAngle = isLeftHanded ? Math.abs(prevAvg) : -Math.abs(prevAvg);
            const endAngle = isLeftHanded ? Math.abs(avg) : -Math.abs(avg);
            const interp = d3.interpolateNumber(startAngle, endAngle);
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
    
    // Update MLB Average text
    appendMLBAverage(svg, 200, 380, data, 'swing_path_tilt', "36px");
}

function appendMLBAverage(svg, cx, y, data, field, overrideFontSize) {
    // Get the strike count from the data
    const strikeCount = data[0]?.strikes || 0;
    
    // Load the appropriate stats file based on strike count
    d3.json(`files/sandbox/${strikeCount === 0 ? 'zerostr' : 'twostr'}_stats.json`)
        .then(stats => {
            if (stats && stats[0]) {
                const mlbAvg = stats[0][field];
                const fontSize = overrideFontSize || "10px";
                svg.append('text')
                   .attr('x', cx)
                   .attr('y', y)
                   .attr('text-anchor', 'middle')
                   .style('font-size', fontSize)
                   .style('fill', '#EB6E1F')
                   .text(`MLB Average: ${mlbAvg.toFixed(1)}${field==="attack_angle"?"°":""}`);
            }
        })
        .catch(err => console.error('Error loading MLB stats:', err));
}