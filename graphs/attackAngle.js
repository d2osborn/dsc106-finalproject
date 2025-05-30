import { appendMLBAverage } from './utils.js';

export function drawAttackAngle(containerSel, data, config) {
	// ...existing logic from the "if (field==='attack_angle')" block...
	// Use config.title, config.max, etc.
    const svg = containerSel.append('svg')
        .attr('viewBox', '0 0 400 400')
        .attr('preserveAspectRatio', 'xMidYMid meet');
    // Title
    svg.append('text')
        .attr('x', 200)
        .attr('y', 50)
        .attr('text-anchor', 'middle')
        .attr('fill', '#b8860b')
        .style('font-size', '2vw')
        .text(config.title);
    const angleScale = d3.scaleLinear().domain([0, config.max]).range([0, Math.PI/3]);
    const avg = d3.mean(data, d => +d.attack_angle) || 0;
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
    const redX = ballX + lineLength * Math.cos(zeroAngle - theta);
    const redY = ballY - lineLength * Math.sin(zeroAngle - theta);
    const fillPoly = svg.append('polygon')
        .attr('points', `${ballX},${ballY} ${blackX},${blackY} ${ballX},${ballY}`)
        .attr('fill', "#b8860b")
        .attr('opacity', 0.5);
    fillPoly.transition().duration(1000).attrTween("points", function() {
        return t => {
            const currX = blackX + (redX - blackX) * t;
            const currY = blackY + (redY - blackY) * t;
            return `${ballX},${ballY} ${blackX},${blackY} ${currX},${currY}`;
        };
    });
    const redLine = svg.append('line')
        .attr('x1', ballX).attr('y1', ballY)
        .attr('x2', blackX).attr('y2', blackY)
        .attr('stroke', '#EE3311')
        .attr('stroke-width', 4);
    redLine.transition().duration(1000)
        .attrTween("x2", () => {
            const interp = d3.interpolate(blackX, redX);
            return t => interp(t);
        })
        .attrTween("y2", () => {
            const interp = d3.interpolate(blackY, redY);
            return t => interp(t);
        });
    svg.append('text')
        .attr('x', 210)
        .attr('y', 190)
        .attr('text-anchor', 'start')
        .attr('fill', "#000")
        .style('font-size', '22px')
        .text(avg.toFixed(1) + "°");
    
    // Add MLB Average using the utility function
    appendMLBAverage(svg, data, 'attack_angle');
}
