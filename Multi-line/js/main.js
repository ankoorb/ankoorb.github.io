/*
Ref[1]: http://bl.ocks.org/mbostock/3902569
Ref[2]: http://bl.ocks.org/DStruths/9c042e3a6b66048b5bd4
Ref[3]: http://www.d3noob.org/2014/07/my-favourite-tooltip-method-for-line.html
 */


// plot area
var margin = {top: 20, right: 100, bottom: 50, left: 50};
var width = 1000 - margin.left - margin.right;
var height = 500 - margin.top - margin.bottom;

// axis: scale
var x = d3.time.scale()
    .range([0, width]);

var y = d3.scale.linear()
    .range([height, 0]);

// axis
var xAxis = d3.svg.axis()
    .scale(x)
    .orient('bottom');

var yAxis = d3.svg.axis()
    .scale(y)
    .orient('left');

// multi-line color scale
var color = d3.scale.category10();

// line
var line = d3.svg.line()
    .interpolate('basis')
    .x(function(d){return x(d.date);})
    .y(function(d){return y(d.price);})

// svg canvas
var svg = d3.select('body')
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

// function to parse date
//var parseDate = d3.time.format('%x').parse; // when date format is: mm/dd/yy
//var parseDate = d3.time.format('%Y-%m-%d').parse; // when date format is: yyyy-mm-dd
var parseDate = d3.time.format('%Y-%m').parse


// load data
d3.csv('data/data.csv', function(error, data){
    if (error) throw error;

    // set color domain by filtering out string "date"
    console.log(d3.keys(data[0])) // returns the data keys (i.e. header)
    color.domain(d3.keys(data[0]).filter(function(k){return k !== 'date';}));

    // format data: strings to date, float, int, etc.
    console.log(data)
    data.forEach(function(d){
        d['date'] = parseDate(d['date']);
        d['Lower Quartile'] = parseFloat(d['Lower Quartile']);
        d['Median'] = parseFloat(d['Median']);
        d['Upper Quartile'] = parseFloat(d['Upper Quartile']);
    });
    console.log(data);

    /* Nesting data by quartile: [['key': 'q1', 'val': [...]], ['key': 'q2', 'val': [...]]]
       and mapping it to color domain
     */
    var quartiles = color.domain().map(function(name){
        return {
            name: name,
            values: data.map(function(d){
                return {date: d['date'], price: d[name]};
            })
        };
    });
    console.log(quartiles);

    // set x axis domain
    x.domain(d3.extent(data, function(d){return d['date'];}));

    // Find min quartile values for setting y domain
    var qMin = d3.min(quartiles, function(q){
        return d3.min(q.values, function(v){
            return v.price;
        })
    });
    console.log('Min Price: ', qMin);

    // Find min quartile values for setting y domain
    var qMax = d3.max(quartiles, function(q){
        return d3.max(q.values, function(v){
            return v.price;
        })
    });
    console.log('Max Price: ', qMax);

    // set y domain
    y.domain([qMin, qMax]);

    // draw line plot
    var quartile = svg.selectAll('.quartile')
        .data(quartiles)
        .enter()
        .append('g')
        .attr('class', 'quartile');

    quartile.append('path')
        .attr('class', 'quartile')
        .attr('d', function(d){return line(d.values);}) // values is an array in nested data
        .attr('stroke', function(d){return color(d.name);}) // name of quartile in nested data
        .attr('fill', 'none')
        .attr('stroke-width', '1.5px');

    // line legend at the end of each line
    quartile.append('text')
        .datum(function(d){return {name: d.name, value: d.values[d.values.length - 1]};})
        .attr('transform', function(d){
            return 'translate(' + x(d.value['date']) + ',' + y(d.value['price']) + ')'})
        .attr('x', 5)
        .attr('dy', '0.5em')
        .text(function(d){return d.name});


    // adding x axis
    svg.append('g')
        .attr('class', 'x axis')
        .attr('transform', 'translate(0,' + height + ')')
        .call(xAxis);

    // adding y axis
    svg.append('g')
        .attr('class', 'y axis')
        .call(yAxis)
        .append('text')
        .attr('transform', 'rotate(-90)')
        .attr('y', 6)
        .attr('dy', '0.5em')
        .style('text-anchor', 'end')
        .text('Monthly Quartile Price');


    // function that returns the date on the left of mouse cursor
    var bisectDate = d3.bisector(function(d){return d.date}).left;
    var bisect = d3.bisector(function(d){return d.price}).left;

    var focus = svg.append('g')
        .attr('class', 'focus')
        .style('display', 'none')

    // circle at the intersection
    focus.append('circle')
        .attr('r', '5')
        .attr('fill', 'none')
        .attr('stroke', '#9467bd')
        .attr('opacity', 0.85);

    // horizontal line at intersection
    focus.append('line')
        .attr('class', 'x')
        .attr('stroke', '#9467bd')
        .attr('stroke-dasharray', '2, 2')
        .style('opacity', 0.85)
        .attr('x1', 0)
        .attr('x2', width)

    // vertical line at intersection
    focus.append('line')
        .attr('class', 'y')
        .attr('stroke', '#9467bd')
        .attr('stroke-dasharray', '2, 2')
        .style('opacity', 0.85)
        .attr('y1', 0)
        .attr('y2', height)

    svg.append('rect')
        .attr('width', width)
        .attr('height', height)
        .style('fill', 'none')
        .style('pointer-events', 'all')
        .on('mouseover', function(){focus.style('display', null);})
        .on('mouseout', function(){focus.style('display', 'none');})
        .on('mousemove', mousemove);

    function mousemove(){
        var x0 = x.invert(d3.mouse(this)[0]); // x value of mouse pointer
        var y0 = y.invert(d3.mouse(this)[1]); // y value of mouse pointer
        //console.log('('+ x0 + ',' + y0 + ')');

        var i = bisectDate(data, x0, 1);
        var d0 = data[i-1];
        var d1 = data[i];
        var d = x0 - d0.date > d1.date - x0 ? d1 : d0;
        // console.log(d0, d1) // data point values
        console.log(d)

        focus.select('line.y')
            .attr('y2', height - y(y0))
            .attr('transform', 'translate(' + x(d['date']) + ',' + y(y0) + ')');

        focus.select('line.x')
            .attr('x2', x(d['date']))
            .attr('transform', 'translate(0,' +  y(y0) + ')')

        focus.select('circle')
            .attr('transform', 'translate(' + x(d['date']) + ',' + y(y0) + ')')


    }


        });







































