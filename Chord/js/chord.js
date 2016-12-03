/*
Reference: http://jsfiddle.net/KjrGF/11/
 */


// Define parameters
var width = 700;
var height = 700;
var outerRadius = Math.min(width, height)/2 - 50;
var innerRadius = outerRadius - 20;

// Dataset for default
var dataset = '#month_trips';

// Number formatting function
var numberWithCommas = d3.format('0,f');

// Create the arc path data generator for the groups
var arc = d3.svg.arc()
    .innerRadius(innerRadius)
    .outerRadius(outerRadius);

// Create the chord path data generator for the chords
var path = d3.svg.chord()
    .radius(innerRadius);

// Define default chord layout parameters in a function so that it can be called multiple times
function getDefaultLayout(){
    return d3.layout.chord()
        .padding(0.03)
        .sortSubgroups(d3.descending)
        .sortChords(d3.ascending);
}

var last_layout; // Store layout between updates
var counties; // Store county data outside data reading function

// Initialize the visualization
var g = d3.select('#chart-area').append('svg')
    .attr('width', width)
    .attr('height', height)
    .append('g')
    .attr('id', 'circle')
    .attr('transform', 'translate(' + width/2 + ',' + height/2 + ')');

g.append('circle')
    .attr('r', outerHeight);

// Read counties (name, color) data
counties =  d3.csv.parse(d3.select('#counties').text());

// Call the update method with the default (initial data matrix) dataset
updateChords(dataset);

// Create or Update a chord layout from a data matrix
function updateChords(datasetURL){

    // Parse OD matrix
    var matrix = JSON.parse(d3.select(datasetURL).text());

    // Create a new (default) layout object
    layout = getDefaultLayout();
    layout.matrix(matrix);

    // Create or Update group elements
    var groupG = g.selectAll('g.group')
        .data(layout.groups(), function(d){
            return d.index;
        });

    groupG.exit()
        .transition(1500)
        .attr('opacity', 0)
        .remove();

    var newGroups = groupG.enter().append('g')
        .attr('class', 'group');

    // Create title tooltip for the new groups
    newGroups.append('title');

    // Update the tooltip text based on the data
    groupG.select('title')
        .text(function(d, i){
            return numberWithCommas(d.value)
                + ' trips started in '
                + counties[i].name;
        });

    // Create the arc paths and set the constant attributes
    newGroups.append('path')
        .attr('id', function(d){return 'group' + d.index;})
        .style('fill', function(d){return counties[d.index].color;});

    // Update the paths to match the layout
    groupG.select('path')
        .transition(1500)
        .attr('opacity', 0.5)
        .attr('d', arc)
        .transition()
        .duration(10)
        .attr('opacity', 1);

    // Create group labels
    newGroups.append('svg:text')
        .attr('xlink:href', function(d){return '#group' + d.index;})
        .attr('dy', '0.35em')
        .attr('color', '#fff')
        .text(function(d){return counties[d.index].name;});

    // Position group labels to match layout
    groupG.select('text')
        .transition()
        .duration(1500)
        .attr('transform', function(d){
            d.angle = (d.startAngle + d.endAngle)/2;
            return 'rotate(' + (d.angle * 180 / Math.PI - 90) + ')' +
                    ' translate(' + (innerRadius + 26) + ')' +
                (d.angle > Math.PI ? ' rotate(180)' : ' rotate(0)');
        })
        .attr('text-anchor', function(d){
            return d.angle > Math.PI ? 'end' : 'begin';
        });

    // Create or Update chord paths
    var chordPaths = g.selectAll('path.chord')
        .data(layout.chords(), chordKey);

    // Create new chord paths
    var newChords = chordPaths.enter()
        .append('path')
        .attr('class', 'chord');

    // Add title tooltip for each chord
    newChords.append('title');

    // Update all chord title texts
    chordPaths.select('title')
        .text(function(d){
            if (counties[d.target.index].name !== counties[d.source.index].name){
                return [numberWithCommas(d.source.value),
                        ' trips from ',
                        counties[d.source.index].name,
                        ' to ',
                        counties[d.target.index].name,
                        '\n',
                        numberWithCommas(d.target.value),
                        ' trips from ',
                        counties[d.target.index].name,
                        ' to ',
                        counties[d.source.index].name].join('');
            }
            else {
                return numberWithCommas(d.source.value) +
                        ' trips started and ended in ' +
                        counties[d.source.index].name;
            }
        });

    // Handle existing paths;
    chordPaths.exit().transition()
        .duration(1000)
        .attr('opacity', 0)
        .remove();

    // Update the path shape
    chordPaths.transition()
        .duration(1000)
        .attr('opacity', 0.5)
        .style('fill', function(d){
            return counties[d.source.index].color;
        })
        .attr('d', path)
        .transition()
        .duration(10)
        .attr('opacity', 1);

    // Add mouseover/fadeout behaviour to the groups (commenting this fixes non show)
    // Solution: http://stackoverflow.com/questions/26080948/d3-js-how-do-chords-become-visible-again-on-mouseout-event
    groupG.on('mouseover', function(d, i){
        chordPaths.classed('fadechord', function(p){
            //console.log('d.index: ' + d.index);
            //console.log('p.source.index: ' + p.source.index);
            //console.log('p.target.index: ' + p.target.index);
            //console.log((p.source.index != d.index) && (p.target.index != d.index));
            //console.log((p.source.index != i) && (p.target.index != i));
            return ((p.source.index != d.index) && (p.target.index != d.index));
            //return ((p.source.index != i) && (p.target.index != i));
        });
    });


    // Save previous layout for next update
    last_layout = layout;

}



// Create a key: value version of old layout's groups array
function arcTween(oldLayout){
    var oldGroups = {};
    if (oldLayout){
        oldLayout.groups().forEach(function(groupData){
            oldGroups[groupData.index] = groupData;
        });
    }
    return function(d, i){
        var tween;
        var old = oldGroups[d.index];
        if (old){
            tween = d3.interpolate(old, d);
        }
        else {
            var emptyArc = {startAngle:d.startAngle,
                            endAngle:d.startAngle};
            tween = d3.interpolate(emptyArc, d);
        }
        return function(t){
            return arc(tween(t));
        };
    };
}

//
function chordKey(data){
    return (data.source.index < data.target.index) ?
            data.source.index + '-' + data.target.index:
            data.target.index + '-' + data.source.index;
}

//
function chordTween(oldLayout){
    var oldChords = {};
    if (oldLayout){
        oldLayout.chords().forEach(function(chordData){
            oldChords[chordKey(chordData)] = cordData;
        });
    }
    return function(d, i){
        var tween;
        var old = oldChords[chordKey(d)];
        if (old){
            if (d.source.index != old.source.index){
                old = {
                    source: old.target,
                    target: old.source
                };
            }
            tween = d3.interpolate(old, d);
        }
        else {
            var emptyChord = {
                source: {startAngle: d.source.startAngle,
                         endAngle: d.source.startAngle},
                target: {startAngle: d.target.startAngle,
                         endAngle: d.target.startAngle}
            };
            tween = d3.interpolate(emptyChord, d);
        }
        return function(t){
            return path(tween(t));
        };
    };

}


// Activate buttons and link the datasets
d3.select('#month_button').on('click', function(){
    updateChords('#month_trips');
    disableButton(this);
});

d3.select('#mon_button').on('click', function(){
    updateChords('#mon_trips');
    disableButton(this);
});

d3.select('#tue_button').on('click', function(){
    updateChords('#tue_trips');
    disableButton(this);
});

d3.select('#wed_button').on('click', function(){
    updateChords('#wed_trips');
    disableButton(this);
});

d3.select('#thu_button').on('click', function(){
    updateChords('#thu_trips');
    disableButton(this);
});

d3.select('#fri_button').on('click', function(){
    updateChords('#fri_trips');
    disableButton(this);
});

d3.select('#sat_button').on('click', function(){
    updateChords('#sat_trips');
    disableButton(this);
});

d3.select('#sun_button').on('click', function(){
    updateChords('#sun_trips');
    disableButton(this);
});

d3.select('#home_worker_button').on('click', function(){
    updateChords('#home_worker_trips');
    disableButton(this);
});

d3.select('#short_visitor_button').on('click', function(){
    updateChords('#short_visitor_trips');
    disableButton(this);
});

d3.select('#long_visitor_button').on('click', function(){
    updateChords('#long_visitor_trips');
    disableButton(this);
});

d3.select('#resident_button').on('click', function(){
    updateChords('#resident_trips');
    disableButton(this);
});

d3.select('#inbound_button').on('click', function(){
    updateChords('#inbound_trips');
    disableButton(this);
});

d3.select('#outbound_button').on('click', function(){
    updateChords('#outbound_trips');
    disableButton(this);
});


d3.select('#ho_button').on('click', function(){
    updateChords('#ho_trips');
    disableButton(this);
});

d3.select('#oo_button').on('click', function(){
    updateChords('#oo_trips');
    disableButton(this);
});

d3.select('#oh_button').on('click', function(){
    updateChords('#oh_trips');
    disableButton(this);
});

d3.select('#ww_button').on('click', function(){
    updateChords('#ww_trips');
    disableButton(this);
});

d3.select('#ow_button').on('click', function(){
    updateChords('#ow_trips');
    disableButton(this);
});

d3.select('#wo_button').on('click', function(){
    updateChords('#wo_trips');
    disableButton(this);
});

d3.select('#hh_button').on('click', function(){
    updateChords('#hh_trips');
    disableButton(this);
});

d3.select('#hw_button').on('click', function(){
    updateChords('#hw_trips');
    disableButton(this);
});

d3.select('#wh_button').on('click', function(){
    updateChords('#wh_trips');
    disableButton(this);
});

// Function to disable button
function disableButton(buttonNode){
    d3.selectAll('button')
        .attr('disabled', function(){
            return this === buttonNode? 'true': null;
        });
}

/* ----------- End -----------*/
