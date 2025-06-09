export function drawBatSpeed(containerSel, data, config) {
    const svg = containerSel.append('svg')
        .attr('viewBox', '0 0 100 100')
        .attr('preserveAspectRatio', 'xMidYMid meet');

    svg.append('text')
        .attr('x', 50)
        .attr('y', 10)
        .attr('text-anchor', 'middle')
        .attr('fill', "#002D62")
        .style('font-size', '7px')
        .text(config.title);

    const bgArc = d3.arc()
        .innerRadius(30)
        .outerRadius(34)
        .startAngle(-3 * Math.PI/4)
        .endAngle(3 * Math.PI/4);

    svg.append('path')
        .attr('d', bgArc())
        .attr('transform', `translate(50,50)`)
        .attr('fill', '#222');

    const scale = d3.scaleLinear()
        .domain([0, config.max || 100])
        .range([-3 * Math.PI/4, 3 * Math.PI/4]);

    const avg = d3.mean(data, d => +d.bat_speed) || 0;
    const prevAvg = window.previousBatSpeed !== undefined ? window.previousBatSpeed : 0;
    window.previousBatSpeed = avg;

    const fgArc = d3.arc()
        .innerRadius(30)
        .outerRadius(34)
        .startAngle(-3 * Math.PI/4);

    const fgPath = svg.append('path')
        .attr('transform', `translate(50,50)`)
        .attr('fill', "#0066CC")
        .attr('d', fgArc.endAngle(scale(prevAvg))());

    fgPath.transition().duration(1000)
        .attrTween('d', function() {
            const interp = d3.interpolateNumber(scale(prevAvg), scale(avg));
            return t => fgArc.endAngle(interp(t))();
        });

    const needle = svg.append('line')
        .attr('x1', 50)
        .attr('y1', 50)
        .attr('x2', 50 + 34 * Math.cos(scale(prevAvg) - Math.PI/2))
        .attr('y2', 50 + 34 * Math.sin(scale(prevAvg) - Math.PI/2))
        .attr('stroke', '#EE3311')
        .attr('stroke-width', 2);

    needle.transition().duration(1000)
        .attrTween("x2", function() {
             const interp = d3.interpolateNumber(scale(prevAvg), scale(avg));
             return t => 50 + 34 * Math.cos(interp(t) - Math.PI/2);
        })
        .attrTween("y2", function() {
             const interp = d3.interpolateNumber(scale(prevAvg), scale(avg));
             return t => 50 + 34 * Math.sin(interp(t) - Math.PI/2);
        });

    const textVal = svg.append('text')
        .attr('x', 50)
        .attr('y', 60)
        .attr('text-anchor', 'middle')
        .attr('fill', "#002D62")
        .style('font-size', '10px')
        .text(prevAvg.toFixed(1));

    textVal.transition().delay(200).duration(1000)
        .tween('text', function() {
            const i = d3.interpolateNumber(prevAvg, avg);
            return t => d3.select(this).text(i(t).toFixed(1));
        });

    appendMLBAverage(svg, 50, 95, data, 'bat_speed', "10px");

    const tickGroup = svg.append('g');
    d3.range(0, config.max + 1, config.max/5).forEach(tick => {
        const angle = scale(tick);
        const lineStart = 26;
        const lineEnd = 37.5;
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
            .attr("stroke-width", 1);

        const labelRadius = 20;
        const lx = 50 + labelRadius * Math.cos(angle - Math.PI/2);
        const ly = 50 + labelRadius * Math.sin(angle - Math.PI/2) + 2;

        tickGroup.append("text")
            .attr("x", lx)
            .attr("y", ly)
            .attr("text-anchor", "middle")
            .attr("fill", "#002D62")
            .style("font-size", "5px")
            .text(tick);
    });
}

function appendMLBAverage(svg, cx, y, data, field, overrideFontSize) {
    const strikeCount = data[0]?.strikes || 0;
    
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
