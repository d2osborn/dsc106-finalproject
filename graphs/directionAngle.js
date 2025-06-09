export function drawDirectionAngle(containerSel, data, config) {
    const svg = containerSel.append('svg')
        .attr('viewBox', '0 0 300 300') // Reduced from 350x350 to zoom in more
        .attr('preserveAspectRatio', 'xMidYMid meet');

    svg.append('text')
        .attr('x', 150) // Adjusted for new viewBox
        .attr('y', 25) // Adjusted position
        .attr('text-anchor', 'middle')
        .attr('fill', '#002D62')
        .style('font-size', '24px') // Increased from 20px
        .text(config.title);

    const angleScale = d3.scaleLinear().domain([0, config.max]).range([0, Math.PI/3]);
    const avg = d3.mean(data, d => +d.attack_direction) || 0;
    const prevAvg = window.previousDirectionAngle !== undefined ? window.previousDirectionAngle : avg;
    window.previousDirectionAngle = avg;
    const prevTheta = angleScale(prevAvg);
    const theta = angleScale(avg);

    const r = 120, cx = 150, cy = 150; // Adjusted for new viewBox
    const ballX = cx, ballY = cy + r * 0.85;

    svg.append('image')
        .attr('href', 'images/ball.png')
        .attr('x', ballX - 18)
        .attr('y', ballY - 18)
        .attr('width', 36)
        .attr('height', 36);

    const lineLength = 250, zeroAngle = -Math.PI/2;
    const blackX = ballX + lineLength * Math.cos(zeroAngle);
    const blackY = ballY + lineLength * Math.sin(zeroAngle);

    svg.append('line')
        .attr('x1', ballX).attr('y1', ballY)
        .attr('x2', blackX).attr('y2', blackY)
        .attr('stroke', '#111')
        .attr('stroke-width', 3)
        .attr('stroke-dasharray', '8,6');

    const redX = ballX + lineLength * Math.cos(zeroAngle + theta);
    const redY = ballY + lineLength * Math.sin(zeroAngle + theta);
    const initialRedX = ballX + lineLength * Math.cos(zeroAngle + prevTheta);
    const initialRedY = ballY + lineLength * Math.sin(zeroAngle + prevTheta);

    const fillPoly = svg.append('polygon')
        .attr('class', 'orangeFill')
        .attr('points', `${ballX},${ballY} ${blackX},${blackY} ${initialRedX},${initialRedY}`)
        .attr('fill', "orange")
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
        .attr('x2', initialRedX).attr('y2', initialRedY)
        .attr('stroke', '#00ff00')
        .attr('stroke-width', 4);

    redLine.transition().duration(1000)
        .attrTween("x2", () => {
             const interp = d3.interpolateNumber(initialRedX, redX);
             return t => interp(t);
        })
        .attrTween("y2", () => {
             const interp = d3.interpolateNumber(initialRedY, redY);
             return t => interp(t);
        });

    svg.append('text')
        .attr('x', 165) // Adjusted for new layout
        .attr('y', 145)
        .attr('text-anchor', 'start')
        .attr('fill', "#000")
        .style('font-size', '24px') // Increased from 22px
        .text(avg.toFixed(1) + "°");

    appendMLBAverage(svg, 150, 285, data, 'attack_direction', "32px"); // Increased font size
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