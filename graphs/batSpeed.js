export function drawBatSpeed(containerSel, data, config) {
    const svg = containerSel.append('svg')
        .attr('viewBox', '0 0 100 100')  // was 200x200
        .attr('preserveAspectRatio', 'xMidYMid meet');
    svg.append('text')
        .attr('x', 50)    // was 100
        .attr('y', 10)    // was 20
        .attr('text-anchor', 'middle')
        .attr('fill', "#000080")
        .style('font-size', '7px')  // roughly half of 14px
        .text(config.title);
    const bgArc = d3.arc()
        .innerRadius(30)  // was 60
        .outerRadius(34)  // was 68
        .startAngle(-3 * Math.PI/4)
        .endAngle(3 * Math.PI/4);
    svg.append('path')
        .attr('d', bgArc())
        .attr('transform', `translate(50,50)`)  // was translate(100,100)
        .attr('fill', '#222');
    const scale = d3.scaleLinear()
        .domain([0, 100])
        .range([-3 * Math.PI/4, 3 * Math.PI/4]);
    const avg = d3.mean(data, d => +d.bat_speed) || 0;
    const fgArc = d3.arc()
        .innerRadius(30)
        .outerRadius(34)
        .startAngle(-3 * Math.PI/4);
    const fgPath = svg.append('path')
        .attr('transform', `translate(50,50)`)
        .attr('fill', "#000080");
    fgPath.transition().duration(1000)
        .attrTween('d', function() {
            const interp = d3.interpolate(-3 * Math.PI/4, scale(avg));
            return t => fgArc.endAngle(interp(t))();
        });
    const needle = svg.append('line')
        .attr('x1', 50)   // was 100
        .attr('y1', 50)   // was 100
        .attr('x2', 50 + 34 * Math.cos(scale(0) - Math.PI/2))  // 68 halved is 34
        .attr('y2', 50 + 34 * Math.sin(scale(0) - Math.PI/2))
        .attr('stroke', '#EE3311')
        .attr('stroke-width', 2);  // was 4
    needle.transition().duration(1000)
        .attrTween("x2", function() {
            return function(t) {
                const currentAngle = scale(0) + (scale(avg) - scale(0)) * t;
                return 50 + 34 * Math.cos(currentAngle - Math.PI/2);
            };
        })
        .attrTween("y2", function() {
            return function(t) {
                const currentAngle = scale(0) + (scale(avg) - scale(0)) * t;
                return 50 + 34 * Math.sin(currentAngle - Math.PI/2);
            };
        });
    const textVal = svg.append('text')
        .attr('x', 50)   // was 100
        .attr('y', 60)   // was 120
        .attr('text-anchor', 'middle')
        .attr('fill', "#000080")
        .style('font-size', '10px')  // was 20px
        .text('0');
    textVal.transition().delay(200).duration(1000)
        .tween('text', function() {
            const i = d3.interpolateNumber(0, avg);
            return t => d3.select(this).text(i(t).toFixed(1));
        });
    
    // Update MLB Average call to match dashboard usage:
    appendMLBAverage(svg, 50, 95, data, 'bat_speed', "5px");
    
    const tickGroup = svg.append('g');
    d3.range(0, 101, 20).forEach(tick => {
        const angle = scale(tick);
        const lineStart = 26;      // was (60 - 8) = 52, then half = 26
        const lineEnd = 37.5;      // was (60 + 15) = 75, then half = 37.5
        const x1 = 50 + lineStart * Math.cos(angle - Math.PI/2);
        const y1 = 50 + lineStart * Math.sin(angle - Math.PI/2);
        const x2 = 50 + lineEnd * Math.cos(angle - Math.PI/2);
        const y2 = 50 + lineEnd * Math.sin(angle - Math.PI/2);
        tickGroup.append("line")
            .attr("x1", x1)
            .attr("y1", y1)
            .attr("x2", x2)
            .attr("y2", y2)
            .attr("stroke", "#fff")
            .attr("stroke-width", 1);  // was 2
        const labelRadius = 20;      // originally (60-20)=40, half becomes 20
        const lx = 50 + labelRadius * Math.cos(angle - Math.PI/2);
        const ly = 50 + labelRadius * Math.sin(angle - Math.PI/2) + 2; // half of 4 offset
        tickGroup.append("text")
            .attr("x", lx)
            .attr("y", ly)
            .attr("text-anchor", "middle")
            .attr("fill", "#000080")
            .style("font-size", "5px")  // was 10px
            .text(tick);
    });
}

// Append the utility function directly:
function appendMLBAverage(svg, cx, y, data, field, overrideFontSize) {
    let mlbAvg = null;
    if (window.__statcast_full_data__ && Array.isArray(window.__statcast_full_data__)) {
        mlbAvg = d3.mean(window.__statcast_full_data__, d => +d[field]);
    } else if (data && data.length > 0) {
        mlbAvg = d3.mean(data, d => +d[field]);
    }
    const fontSize = overrideFontSize || "10px";
    svg.append('text')
       .attr('x', cx)
       .attr('y', y)
       .attr('text-anchor', 'middle')
       .style('font-size', fontSize)
       .style('fill', '#E63946')
       .text(mlbAvg !== null && !isNaN(mlbAvg) ?
             `MLB Average: ${mlbAvg.toFixed(1)}${field==="attack_angle"?"°":""}` : '');
}
