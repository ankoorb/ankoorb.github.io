
// Plot area
var margin = {top: 20, right: 20, bottom: 80, left: 100};
var width = 1100 - margin.left - margin.right;
var height = 600 - margin.top - margin.bottom;

// Function to parse date and time
var parseDate = d3.time.format('%Y%m%d').parse;
var parseTime = d3.time.format('%0H%M').parse;

// Function to format date
var formatDate = d3.time.format('%m-%d-%Y')
var formatTime = d3.time.format('%a %H:%M')

// Axis scale
var x = d3.time.scale().range([0, width]);
var y = d3.time.scale().range([height, 0]);

// Axis
var xAxis = d3.svg.axis()
    .scale(x)
    .orient('bottom')
    .ticks(12);

var yAxis = d3.svg.axis()
    .scale(y)
    .orient('left')
    .ticks(24);

// svg canvas
var svg = d3.select('body')
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

// Axis group
var xAxisGroup = svg.append('g')
    .attr('class', 'x-axis axis')

var yAxisGroup = svg.append('g')
    .attr('class', 'y-axis axis')

// Initialize tooltip
var tip = d3.tip().attr('class', 'd3-tip').html(function(d) {
    return "<b>" + formatDate(d['Date']) + "</b><br/>" + formatTime(d['Time']) + "<br/>Severity: " + d['Severity'];
});

svg.append('text')
    .attr('class', 'instructions')
    .attr('transform', 'translate(0,' + (height + 45) + ')')
    .text('Note: Red points indicate Truck involved accidents. Hover over the points to see details.')
    .attr('fill', '#3090C7');

// load data and plot
d3.tsv('data/accident.tsv', function(error, data){
    if (error) throw error;

    // format data: str to date, float, int, etc.
    data.forEach(function(d){
        d['Date'] = parseDate(d['Date']);
        d['Time'] = parseTime(d['Time']);
    })

    // Initial render
    renderPlot(data);

    // Filter direction
    d3.select('#direction')
        .on('change', function(){
            var selectBox = document.getElementById('direction');
            var selectedValue = selectBox.options[selectBox.selectedIndex].value;
            var filtered = data.filter(function(value){return value['Direction'] === selectedValue;});

            if ((selectedValue === 'N') || (selectedValue === 'S')){renderPlot(filtered)}
            else {renderPlot(data)}

        })

})

// Function to render plot
function renderPlot(filteredData){

    // set x axis domain
    x.domain(d3.extent(filteredData, function(d){return d['Date'];}));

    // set y axis domain
    y.domain(d3.extent(filteredData, function(d){return d['Time'];}));

    // draw x axes
    xAxisGroup = svg.select('.x-axis')
        .attr('transform', 'translate(0' + ',' + height + ')')
        .call(xAxis)

    // draw y axis
    yAxisGroup = svg.select('.y-axis')
        .call(yAxis)
        .append('text')
        .attr('transform', 'rotate(-90)')
        .attr('y', 6)
        .attr('dy', '0.5em')
        .style('text-anchor', 'end')
        .text('Hour')

    // Draw circles
    var circle = svg.selectAll('circle')
        .data(filteredData)

    // Add
    circle.enter()
        .append('circle');

    // Update
    circle.attr('r', function(d){if(d['Truck'] === 'TRUE'){return 5} else{return 3}})
        .attr('cx', function(d){return x(d['Date'])})
        .attr('cy', function(d){return y(d['Time'])})
        .style('fill', function(d){if(d['Truck'] === 'TRUE'){return '#e31a1c'} else{return '#1f78b4'}})
        .style('opacity', 0.15)
        .on('mouseover', tip.show)
        .on('mouseout', tip.hide);

    // Remove
    circle.exit().remove();

    // Invoke tooltip
    svg.call(tip)

}
