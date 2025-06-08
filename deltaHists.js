// Add annotation for Alvarez
const alvarezAnnotation = {
    x: 242.5,
    y: 0,
    text: 'Yordan Alvarez<br>Δ=242.50<br>Pct=2.0th',
    showarrow: false,
    font: {
        size: 12,
        color: 'black'
    },
    xanchor: 'center',
    yanchor: 'bottom',
    yshift: 10
};

// Add annotation for 0.0065
const valueAnnotation = {
    x: 0.0065,
    y: 0,
    text: '0.0065',
    showarrow: false,
    font: {
        size: 12,
        color: 'black'
    },
    xanchor: 'center',
    yanchor: 'bottom',
    yshift: 10
};

const layout = {
    title: {
        text: title,
        font: {
            size: 14
        }
    },
    xaxis: {
        title: 'Delta Angle (degrees)',
        showgrid: true,
        gridcolor: '#f0f0f0'
    },
    yaxis: {
        title: 'Density',
        showgrid: true,
        gridcolor: '#f0f0f0'
    },
    annotations: [alvarezAnnotation, valueAnnotation],
    margin: {
        l: 50,
        r: 20,
        t: 40,
        b: 50
    },
    plot_bgcolor: 'white',
    paper_bgcolor: 'white',
    showlegend: false
}; 