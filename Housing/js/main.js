
// Plot area
var margin = {top: 20, right: 60, bottom: 80, left: 100};
var width = 1100 - margin.left - margin.right;
var height = 600 - margin.top - margin.bottom;

// Axis scale
var x = d3.scale.linear()
    .range([0, width]);
var y = d3.scale.linear()
    .range([height, 0]);

// Color scale (Hardcoded values and color)
var color = d3.scale.ordinal()
    .range(['#e31a1c', '#377eb8', '#4daf4a', '#984ea3'])
    .domain(["Private", "None", "Community", "Both Private & Community"]);

// Axis
var xAxis = d3.svg.axis()
    .scale(x)
    .orient('bottom')
    .ticks(12);

var yAxis = d3.svg.axis()
    .scale(y)
    .orient('left');


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
    return "<b> Price ($): " + d['ListPrice'] + "</b><br/>Living Area (Sq.Feet): " + d['LivingArea'] + "<br/>Pool: " + d['Pool'] +
    "<br/># of Bedrooms: " + d['NumBedrooms'];

});

svg.append('text')
    .attr('class', 'instructions')
    .attr('transform', 'translate(0,' + (height + 45) + ')')
    .text('Note: Hover over the points to see details. Legend shows Pool availability and point size is based on # of Bedrooms')
    .attr('fill', '#3090C7');

// load data and plot
d3.csv('data/housing.csv', function(error, data){
    if (error) throw error;

    // format data: str to date, float, int, etc.
    data.forEach(function(d){
        d['ListPrice'] = parseFloat(d['ListPrice']);
        d['LivingArea'] = parseFloat(d['LivingArea']);
        d['NumBedrooms'] = parseInt(d['NumBedrooms']);
    });

    //console.log(data);

    // Initial render
    renderPlot(data);

    // Filter direction
    d3.select('#dwelling')
        .on('change', function(){
            var selectBox = document.getElementById('dwelling');
            var selectedValue = selectBox.options[selectBox.selectedIndex].value;
            var filtered = data.filter(function(value){return value['DwellingType'] === selectedValue;});

            //console.log(filtered);

            if ((selectedValue === 'Single Family - Detached')
                || (selectedValue === 'Patio Home')
                || (selectedValue === 'Mfg/Mobile Housing')
                || (selectedValue === 'Townhouse')
                || (selectedValue === 'Apartment Style/Flat')
                || (selectedValue === 'Gemini/Twin Home')
                || (selectedValue === 'Loft Style')
                || (selectedValue === 'Modular/Pre-Fab')){renderPlot(filtered)}
            else {renderPlot(data)}

        })

})

// Function to render plot
function renderPlot(filteredData){

    // set x axis domain
    x.domain(d3.extent(filteredData, function(d){return d['ListPrice'];}));

    // set y axis domain
    y.domain(d3.extent(filteredData, function(d){return d['LivingArea'];}));

    // draw x axes
    xAxisGroup = svg.select('.x-axis')
        .attr('transform', 'translate(0' + ',' + height + ')')
        .call(xAxis);

    // x axis label
    svg.append('text')
        .attr('text-anchor', 'end')
        .attr('x', width)
        .attr('y', height - 6)
        .text("List Price in $'s");

    // draw y axis
    yAxisGroup = svg.select('.y-axis')
        .call(yAxis)
        .append('text')
        .attr('transform', 'rotate(-90)')
        .attr('y', 6)
        .attr('dy', '0.5em')
        .style('text-anchor', 'end')
        .text('Area (Sq. Feet)')

    // Draw circles
    var circle = svg.selectAll('circle')
        .data(filteredData)

    // Add
    circle.enter()
        .append('circle');

    // Update
    circle.attr('r', function(d){return d['NumBedrooms'] + 2})
        .attr('cx', function(d){return x(d['ListPrice'])})
        .attr('cy', function(d){return y(d['LivingArea'])})
        .style('fill', function(d){if(d['Pool'] === 'None'){return '#e31a1c'}
        else if (d['Pool'] === 'Community'){return '#377eb8'}
        else if (d['Pool'] === 'Private'){return '#4daf4a'}
        else {return '#984ea3'}})
        .style('opacity', 0.25)
        .on('mouseover', tip.show)
        .on('mouseout', tip.hide);

    // Remove
    circle.exit().remove();

    // Invoke tooltip
    svg.call(tip)


    // Draw legend (Hardcoded values) Ref: http://tietyk.github.io/D3/
    var legendRectSize = 20;

    var legend = svg.selectAll('.legend')
        .data(color.domain())
        .enter()
        .append('g')
        .attr('class', 'legend')
        .attr('transform', function(d, i){
            var height = legendRectSize;
            var x = 0;
            var y =  i * height;
            return 'translate(' + x + ',' + y + ')'})

    legend.append('rect')
        .attr('x', width - 135)
        .attr('y', height - 145)
        .attr('width', 20)
        .attr('height', 20)
        .style('fill', color)
        .style('opacity', 0.5);

    legend.append('text')
        .attr('x', width - 110)
        .attr('y', height - 130)
        .text(function(d){return d})


}

/*
 // Draw legend Ref: http://tietyk.github.io/D3/
 var legendRectSize = 20;
 var legendSpacing = 5;

 var legend = d3.select('svg')
 .append('g')
 .selectAll('g')
 .data(color.domain())
 .enter()
 .append('g')
 .attr('class', 'legend')
 .attr('transform', function(d, i){
 var height = legendRectSize;
 var x = 0;
 var y =  i * height;
 return 'translate(' + x + ',' + y + ')'})

 legend.append('rect')
 .attr('width', 20)
 .attr('height', 20)
 .style('fill', color)
 .style('opacity', 0.5);

 legend.append('text')
 .attr('x', legendRectSize + legendSpacing)
 .attr('y', legendRectSize - legendSpacing)
 .text(function(d){return d})
 */