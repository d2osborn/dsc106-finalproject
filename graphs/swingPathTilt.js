export function drawSwingPathTilt(containerSel, data, config) {
    // Create SVG container
    const svg = containerSel.append('svg')
        .attr('viewBox', '0 0 300 300') // Reduced from 350x350 to zoom in more
        .attr('preserveAspectRatio', 'xMidYMid meet');
    
    // Title
    svg.append('text')
        .attr('x', 150) // Adjusted for new viewBox
        .attr('y', 25) // Adjusted position
        .attr('text-anchor', 'middle')
        .attr('fill', '#002D62')
        .style('font-size', '24px') // Increased from 20px
        .text(config.title);
    
    // Always use right-handed logic for all players
    // (no isLeftHanded, no isRightHanded, always flip as if R)
    const avg = d3.mean(data, d => +d.swing_path_tilt) || 0;
    const prevAvg = window.previousSwingPathTilt !== undefined ? window.previousSwingPathTilt : 0;
    window.previousSwingPathTilt = avg;
    const prevTheta = Math.abs(prevAvg) * Math.PI / 180;
    const theta = Math.abs(avg) * Math.PI / 180;
    
    const cx = 150, cy = 150; // Adjusted center
    const r = 120; // Adjusted radius
    const ballX = cx + r * 0.85;
    const ballY = cy;
    const lineLength = 180; // Adjusted line length
    const zeroAngle = Math.PI;
    
    const blackX = ballX + lineLength * Math.cos(zeroAngle);
    const blackY = ballY - lineLength * Math.sin(zeroAngle);
    
    svg.append('line')
        .attr('x1', ballX).attr('y1', ballY)
        .attr('x2', blackX).attr('y2', blackY)
        .attr('stroke', '#111')
        .attr('stroke-width', 3)
        .attr('stroke-dasharray', '8,6');

    // Always use right-handed logic: angle is +theta
    const adjustedTheta = theta;
    const prevAdjustedTheta = prevTheta;
    const redX = ballX + lineLength * Math.cos(zeroAngle + adjustedTheta);
    const redY = ballY - lineLength * Math.sin(zeroAngle + adjustedTheta);
    
    const fillPoly = svg.append('polygon')
        .attr('points', `${ballX},${ballY} ${blackX},${blackY} ${ballX + lineLength * Math.cos(zeroAngle + prevAdjustedTheta)},${ballY - lineLength * Math.sin(zeroAngle + prevAdjustedTheta)}`)
        .attr('fill', "#EB6E1F")
        .attr('opacity', 0.5);

    fillPoly.transition().duration(1000).attrTween("points", function() {
        return t => {
            const initX = ballX + lineLength * Math.cos(zeroAngle + prevAdjustedTheta);
            const initY = ballY - lineLength * Math.sin(zeroAngle + prevAdjustedTheta);
            const finalX = ballX + lineLength * Math.cos(zeroAngle + adjustedTheta);
            const finalY = ballY - lineLength * Math.sin(zeroAngle + adjustedTheta);
            const currX = initX + (finalX - initX) * t;
            const currY = initY + (finalY - initY) * t;
            return `${ballX},${ballY} ${blackX},${blackY} ${currX},${currY}`;
        };
    });
    
    const newHeight = 20;
    const batLength = lineLength;

    // Always use right-handed logic for bat (scale(-1,1) and negative rotation)
    const batG = svg.append('g')
        .attr('class', 'swing-bat')
        .attr('transform', `translate(${ballX},${ballY}) rotate(${-Math.abs(prevAvg)})`);

    batG.append('image')
        .attr('xlink:href', 'images/bat.svg')
        .attr('width', batLength)
        .attr('height', newHeight)
        .attr('preserveAspectRatio', 'none')
        .attr('x', 0)
        .attr('y', -newHeight/2)
        .attr('transform', 'scale(-1,1)');

    batG.transition()
        .duration(1000)
        .attrTween('transform', () => {
            const startAngle = -Math.abs(prevAvg);
            const endAngle = -Math.abs(avg);
            const interp = d3.interpolateNumber(startAngle, endAngle);
            return t => `translate(${ballX},${ballY}) rotate(${interp(t)})`;
        });
    
    const centroidX = (ballX + blackX + redX) / 3;
    const centroidY = (ballY + blackY + redY) / 3;
    svg.append('text')
        .attr('x', centroidX)
        .attr('y', centroidY)
        .attr('text-anchor', 'middle')
        .attr('fill', "#000")
        .style('font-size', '24px') // Increased from 22px
        .text(avg.toFixed(1) + "°");
    
    appendMLBAverage(svg, 150, 280, data, 'swing_path_tilt', "32px"); // Increased font size
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