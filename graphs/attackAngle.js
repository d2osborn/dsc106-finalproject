export function drawAttackAngle(containerSel, data, config) {
    const svg = containerSel.append('svg')
        .attr('viewBox', '0 0 400 400') // Matches container aspect ratio
        .attr('preserveAspectRatio', 'xMidYMid meet');
    // Title
    svg.append('text')
        .attr('x', 200)
        .attr('y', 50)
        .attr('text-anchor', 'middle')
        .attr('fill', '#002D62')
        .style('font-size', '2vw')
        .text(config.title);
    const angleScale = d3.scaleLinear().domain([0, config.max]).range([0, Math.PI/3]);
    const avg = d3.mean(data, d => +d.attack_angle) || 0;
    const prevAvg = window.previousAttackAngle !== undefined ? window.previousAttackAngle : 0;
    window.previousAttackAngle = avg;
    const theta = angleScale(avg);
    const r = 180, cx = 200, cy = 200;
    const ballX = cx + r * 0.85, ballY = cy;
    svg.append('image')
        .attr('href', 'images/ball.png')   // updated image path
        .attr('x', ballX - 18)
        .attr('y', ballY - 18)
        .attr('width', 36)
        .attr('height', 36);
    const lineLength = 250, zeroAngle = Math.PI;
    const blackX = ballX + lineLength * Math.cos(zeroAngle);
    const blackY = ballY - lineLength * Math.sin(zeroAngle);
    svg.append('line').attr('x1', ballX).attr('y1', ballY)
        .attr('x2', blackX).attr('y2', blackY)
        .attr('stroke', '#111')
        .attr('stroke-width', 3)
        .attr('stroke-dasharray', '8,6');
    const prevTheta = angleScale(prevAvg);
    const initialRedX = ballX + lineLength * Math.cos(zeroAngle - prevTheta);
    const initialRedY = ballY - lineLength * Math.sin(zeroAngle - prevTheta);
    const redX = ballX + lineLength * Math.cos(zeroAngle - theta);
    const redY = ballY - lineLength * Math.sin(zeroAngle - theta);
    const fillPoly = svg.append('polygon')
        .attr('points', `${ballX},${ballY} ${blackX},${blackY} ${initialRedX},${initialRedY}`)
        .attr('fill', "#EB6E1F")
        .attr('opacity', 0.5);
    fillPoly.transition().duration(1000).attrTween("points", function() {
        return t => {
            const currX = initialRedX + (redX - initialRedX) * t;
            const currY = initialRedY + (redY - initialRedY) * t;
            return `${ballX},${ballY} ${blackX},${blackY} ${currX},${currY}`;
        };
    });
    const redLine = svg.append('line')
        .attr('x1', ballX).attr('y1', ballY)
        // Set initial red endpoint from previous value
        .attr('x2', ballX + lineLength * Math.cos(zeroAngle - angleScale(prevAvg)))
        .attr('y2', ballY - lineLength * Math.sin(zeroAngle - angleScale(prevAvg)))
        .attr('stroke', '#ff0000') // changed from blue to red
        .attr('stroke-width', 4);
    redLine.transition().duration(1000)
        .attrTween("x2", () => {
             const interp = d3.interpolateNumber(angleScale(prevAvg), angleScale(avg));
             return t => ballX + lineLength * Math.cos(zeroAngle - interp(t));
        })
        .attrTween("y2", () => {
             const interp = d3.interpolateNumber(angleScale(prevAvg), angleScale(avg));
             return t => ballY - lineLength * Math.sin(zeroAngle - interp(t));
        });
    svg.append('text')
        .attr('x', 210)
        .attr('y', 190)
        .attr('text-anchor', 'start')
        .attr('fill', "#000")
        .style('font-size', '22px')
        .text(avg.toFixed(1) + "°");
    
    // Enlarge MLB Average text: change override font size from "28px" to "32px"
    appendMLBAverage(svg, 200, 380, data, 'attack_angle', "32px");
}

// Append the MLB Average utility function at the bottom:
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