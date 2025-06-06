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
        .attr('fill', '#000080')
        .style('font-size', '2vw')
        .text(config.title);
    
    // Compute average swing_path_tilt (absolute value) and convert degrees to radians
    const avg = d3.mean(data, d => +d.swing_path_tilt) || 0;
    const theta = Math.abs(avg) * Math.PI / 180;
    
    // Set up base positioning similar to attackAngle graph
    const cx = 200, cy = 200;
    const r = 180;
    const ballX = cx + r * 0.85; // reference point (as in attack angle)
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
    const redX = ballX + lineLength * Math.cos(zeroAngle + theta);
    const redY = ballY - lineLength * Math.sin(zeroAngle + theta);
    
    // Draw filled polygon (triangle) between baseline and red endpoint with transition
    const fillPoly = svg.append('polygon')
        .attr('points', `${ballX},${ballY} ${blackX},${blackY} ${ballX},${ballY}`)
        .attr('fill', "#000080")
        .attr('opacity', 0.5);
    fillPoly.transition().duration(1000).attrTween("points", function() {
        return t => {
            const currX = blackX + (redX - blackX) * t;
            const currY = blackY + (redY - blackY) * t;
            return `${ballX},${ballY} ${blackX},${blackY} ${currX},${currY}`;
        };
    });
    
    const newHeight = 20;
    const batLength = lineLength;  // 250px


    const batG = svg.append('g')
      .attr('class', 'swing-bat')
      .attr('transform', `translate(${ballX},${ballY})`);

    // 2) In that group, draw the bat flipped horizontally so its RIGHT edge sits at x=0:
    batG.append('image')
      .attr('xlink:href', 'images/bat.svg')  // updated image path
      .attr('width', batLength)
      .attr('height', newHeight)
      .attr('preserveAspectRatio', 'none')
      .attr('x', 0)            // right edge at pivot (x=0)
      .attr('y', -newHeight/2) // vertically centered
      .attr('transform', 'scale(-1,1)');

    // 3) Tween the ROTATION on the GROUP from 0 → –(avg in degrees) (for a CCW swing):
    batG.transition()
      .duration(1000)
      .attrTween('transform', () => {
          const interp = d3.interpolateNumber(0, - (Math.abs(avg) || 0));
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
    
    // Update MLB Average call to use uniform placement for 400x400 svg:
    appendMLBAverage(svg, 200, 380, data, 'swing_path_tilt', "20px");
}

// Append the utility function directly:
function appendMLBAverage(svg, cx, y, data, field, overrideFontSize) {
    let mlbAvg = null;
    if (window.__statcast_full_data__ && Array.isArray(window.__statcast_full_data__)) {
        mlbAvg = d3.mean(window.__statcast_full_data__, d => +d[field]);
    } else if (data && data.length > 0) {
        mlbAvg = d3.mean(data, d => +d[field]);
    }
    const fontSize = overrideFontSize || "20px";
    svg.append('text')
       .attr('x', cx)
       .attr('y', y)
       .attr('text-anchor', 'middle')
       .style('font-size', fontSize)
       .style('fill', '#E63946')
       .text(mlbAvg !== null && !isNaN(mlbAvg) ?
             `MLB Average: ${mlbAvg.toFixed(1)}${field==="attack_angle"?"°":""}` : '');
}