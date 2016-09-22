// Interactive Calendar View Prototype
// Author: Ankoor Bhagat
// Date: 04/20/2016

var width = 900;
var height = 600;
var cellSize = 50;
var year = 2016; // Hardcoded: year

// Function to format string to date
var format = d3.time.format('%Y-%m-%d');

// Color scale: Quantize
var colorQuantize = d3.scale.quantize()
    .domain([0, 60000])// Hardcoded: Min and Max of feb data
    .range(d3.range(9).map(function(d){return 'q' + d + '-9'}));
    //.range(d3.range(11).map(function(d){return 'q' + d + '-11'}));


// SVG
var svg = d3.select('body')
    .append('svg')
    .attr('width', width)
    .attr('height', height)
    .attr('class', 'BuGn') // Color
    .append('g')
    .attr('transform', 'translate(' + ((width - cellSize * 20)/2) + ',' + (height - cellSize * 11 - 1) + ')');

svg.append('text')
    .attr('transform', 'translate(-6,' + cellSize * 3.5 + ')rotate(-90)')
    .style('text-anchor', 'middle')
    .text(function(d){return d});


var rect = svg.selectAll('.day')
    .data(function(d){return d3.time.days(new Date(2016, 1, 1), new Date(2016, 2, 1))}) // Hardcoded
    .enter()
    .append('rect')
    .attr('class', 'day')
    .attr('width', cellSize)
    .attr('height', cellSize)
    .attr('x', function(d){return d3.time.weekOfYear(d) * cellSize})
    .attr('y', function(d){return d.getDay() * cellSize})
    .datum(format);

//rect.append('title').text(function(d){return d});

svg.selectAll('.month')
    .data(function(){return d3.time.months(new Date(2016, 1, 1), new Date(2016, 2, 1))})
    .enter()
    .append('path')
    .attr('class', 'month')
    .attr('d', monthPath);

d3.tsv("data/calendar.tsv", function(error, calendar){
    if (error) throw error;

    // Convert string to int
    calendar.forEach(function(d){
        d['Care Continuum'] = parseInt(d['Care Continuum']);
        d['Chronic Disease Management'] = parseInt(d['Chronic Disease Management']);
        d['KP Education'] = parseInt(d['KP Education']);
        d['MNP'] = parseInt(d['MNP']);
        d['Visit X'] = parseInt(d['Visit X']);
        d['Total'] = parseInt(d['Total']);
    });

    // Nest data: Good explanation here: http://learnjsdata.com/group_data.html
    var data = d3.nest()
        .key(function(d){return d['date']})
        .map(calendar);

    // Mouseout event function
    var mouseout = function(){
        var info = d3.select(this);
        info.attr('cursor', 'pointer');

        // Remove infobox div on mouseout event
        d3.select('.infobox')
            .style('display', 'none');
    };


    // Function to get mouse position coordinates
    var mousePosition = function(){
        // Save selection of infobox for updating its position
        var infobox = d3.select('.infobox');

        // Get coordinates (using 'this') of the mouse in relation to svg canvas
        var coord = d3.mouse(this);

        // Update infobox position
        infobox.style('left', coord[0] + 10 + 'px');
        infobox.style('top', coord[1] + 'px');
    };


    // Color the cells + hover
    rect.filter(function(d){return d in data})
        .attr('class', function(d){return 'day ' + colorQuantize(data[d][0]['Total'])})
        .on('mouseover', function(d){
            var info = d3.select(this);
            info.attr('cursor', 'pointer');
            // Show infobox div on mouseover event
            d3.select('.infobox')
                .style('display', 'block');

            // Add text to p tag in the infobox div
            d3.select('span#info')
                .text('Campaign Type Counts on ' + data[d][0]['date']);
            d3.select('span#icon-1')
                .text(" KP Education " + data[d][0]['KP Education'])
            d3.select('span#icon-2')
                .text(" Care Continuum " + data[d][0]['Care Continuum']);
            d3.select('span#icon-3')
                .text(" MNP " + data[d][0]['MNP']);
            d3.select('span#icon-4')
                .text(" Chronic Disease Mgmt " + data[d][0]['Chronic Disease Management']);
            d3.select('span#icon-5')
                .text(' Visit X ' + data[d][0]['Visit X']);
        })
        .on('mouseout', mouseout)
        .on('mousemove', mousePosition);


    // --------- Console logs -----------//

    //console.log(calendar);
    //console.log(d3.range(11));
    //console.log((width - cellSize * 7)/2);
    //console.log((height - cellSize * 7 - 1));

    // new Date(YYYY, m, d) and month starts with 0
    //console.log(d3.time.days(new Date(2016, 1, 1), new Date(2016, 2, 1)));
    //console.log(d3.time.months(new Date(2016, 1, 1), new Date(2016, 2, 1)));
    //console.log(JSON.parse(JSON.stringify(data)));
    //console.log(rect.filter(function(d){return d in data}))

    //console.log(data["2016-02-01"][0]['Total']);
    //console.log(data["2016-02-01"][0])
    //console.log(data, count_max);
    //console.log('day ' + colorQuantize(data["2016-02-11"]));
    //console.log(mean, std);
    //console.log(data);
    //console.log(rect);

});


function monthPath(t0) {
    var t1 = new Date(t0.getFullYear(), t0.getMonth() + 1, 0),
        d0 = t0.getDay(), w0 = d3.time.weekOfYear(t0),
        d1 = t1.getDay(), w1 = d3.time.weekOfYear(t1);
    return "M" + (w0 + 1) * cellSize + "," + d0 * cellSize
        + "H" + w0 * cellSize + "V" + 7 * cellSize
        + "H" + w1 * cellSize + "V" + (d1 + 1) * cellSize
        + "H" + (w1 + 1) * cellSize + "V" + 0
        + "H" + (w0 + 1) * cellSize + "Z";
};
