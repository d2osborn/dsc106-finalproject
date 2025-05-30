import { appendMLBAverage } from './utils.js';

export function drawBatSpeed(containerSel, data, config) {
    const svg = containerSel.append('svg')
        .attr('viewBox', '0 0 200 200')
        .attr('preserveAspectRatio', 'xMidYMid meet');
    svg.append('text')
        .attr('x', 100)
        .attr('y', 20)
        .attr('text-anchor', 'middle')
        .attr('fill', "#b8860b")
        .style('font-size', '14px')
        .text(config.title);
    const bgArc = d3.arc()
        .innerRadius(60)
        .outerRadius(68)
        .startAngle(-3 * Math.PI/4)
        .endAngle(3 * Math.PI/4);
    svg.append('path')
        .attr('d', bgArc())
        .attr('transform', `translate(100,100)`)
        .attr('fill', '#222');
    const scale = d3.scaleLinear()
        .domain([0, 100])
        .range([-3 * Math.PI/4, 3 * Math.PI/4]);
    const avg = d3.mean(data, d => +d.bat_speed) || 0;
    const fgArc = d3.arc()
        .innerRadius(60)
        .outerRadius(68)
        .startAngle(-3 * Math.PI/4);
    const fgPath = svg.append('path')
        .attr('transform', `translate(100,100)`)
        .attr('fill', "#b8860b");
    fgPath.transition().duration(1000)
        .attrTween('d', function() {
            const interp = d3.interpolate(-3 * Math.PI/4, scale(avg));
            return t => fgArc.endAngle(interp(t))();
        });
    const needle = svg.append('line')
        .attr('x1', 100)
        .attr('y1', 100)
        .attr('x2', 100 + (68) * Math.cos(scale(0) - Math.PI/2))
        .attr('y2', 100 + (68) * Math.sin(scale(0) - Math.PI/2))
        .attr('stroke', '#EE3311')
        .attr('stroke-width', 4);
    needle.transition().duration(1000)
        .attrTween("x2", function() {
            return function(t) {
                const currentAngle = scale(0) + (scale(avg) - scale(0)) * t;
                return 100 + (68) * Math.cos(currentAngle - Math.PI/2);
            };
        })
        .attrTween("y2", function() {
            return function(t) {
                const currentAngle = scale(0) + (scale(avg) - scale(0)) * t;
                return 100 + (68) * Math.sin(currentAngle - Math.PI/2);
            };
        });
    const textVal = svg.append('text')
        .attr('x', 100)
        .attr('y', 120)
        .attr('text-anchor', 'middle')
        .attr('fill', "#b8860b")
        .style('font-size', '20px')
        .text('0');
    textVal.transition().delay(200).duration(1000)
        .tween('text', function() {
            const i = d3.interpolateNumber(0, avg);
            return t => d3.select(this).text(i(t).toFixed(1));
        });
    
    // Add MLB Average using the utility function
    appendMLBAverage(svg, data, 'bat_speed');
    
    const tickGroup = svg.append('g');
    d3.range(0, 101, 20).forEach(tick => {
        const angle = scale(tick);
        const lineStart = 60 - 8;
        const lineEnd = 60 + 15;
        const x1 = 100 + lineStart * Math.cos(angle - Math.PI/2);
        const y1 = 100 + lineStart * Math.sin(angle - Math.PI/2);
        const x2 = 100 + lineEnd * Math.cos(angle - Math.PI/2);
        const y2 = 100 + lineEnd * Math.sin(angle - Math.PI/2);
        tickGroup.append("line")
            .attr("x1", x1)
            .attr("y1", y1)
            .attr("x2", x2)
            .attr("y2", y2)
            .attr("stroke", "#fff")
            .attr("stroke-width", 2);
        const labelRadius = 60 - 20;
        const lx = 100 + labelRadius * Math.cos(angle - Math.PI/2);
        const ly = 100 + labelRadius * Math.sin(angle - Math.PI/2) + 4;
        tickGroup.append("text")
            .attr("x", lx)
            .attr("y", ly)
            .attr("text-anchor", "middle")
            .attr("fill", "#b8860b")
            .style("font-size", "10px")
            .text(tick);
    });
}
