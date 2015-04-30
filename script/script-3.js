//set up screen parameters
var margin = {t:270,r:100,b:200,l:150},
    width = $('.canvas').width() - margin.l - margin.r,
    height = $('.canvas').height() - margin.t - margin.b;

//set up SVG drawing elements
var svg = d3.select('.canvas')
    .append('svg')
    .attr('width', width + margin.l + margin.r)
    .attr('height', height + margin.t + margin.b)
    .append('g')
    .attr('transform','translate('+margin.l+','+margin.t+')');

//Create an azimuthal equal area (polar) projection
var projection = d3.geo.azimuthalEqualArea()
    .scale(500)
    .rotate([0, 90])          //([0, -90]) for north pole
    .clipAngle(33 - 1e-3)      //first # clips to longitude
    .translate([width/2,height/2])
    .precision(.1);            //what is this?

//Create a 2nd azimuthal equal area (polar) projection
var projection2 = d3.geo.azimuthalEqualArea()
    .scale(1990)
    .rotate([61, 65])          //([0, -90]) for north pole
    .clipAngle(5 - 1e-3)      //first # clips to longitude
    .translate([width/2+340,-height+240])
    .precision(.1);            //what is this?

var scaleSize = d3.scale.sqrt().range([0,40]); //for population

//pre-select .custom-tooltip
var customTooltip = d3.select('.custom-tooltip');

var path = d3.geo.path()
    .projection(projection);

var path2 = d3.geo.path()
    .projection(projection2);

var graticule = d3.geo.graticule();

//Start mapping the larger continent ---------------------------------------

svg.append("defs").append("path")       //sphere
    .datum({type: "Sphere"})
    .attr("id", "sphere")
    .attr("d", path);

//svg.append("use")                   //stroke of sphere
//    .attr("class", "stroke")
//    .attr("xlink:href", "#sphere");

svg.append("use")                   //fill of sphere
    .attr("class", "fill")
    .attr("xlink:href", "#sphere");

svg.append("path")                  //geo-coordinates
    .datum(graticule)
    .attr("class", "graticule")
    .attr("d", path);

//use .json file in folder (from mbstock)
d3.json('data/world-50m.json', function(error, world) {
    svg.insert("path", ".graticule")
        .datum(topojson.feature(world, world.objects.land))
        .attr("class", "land")
        .attr("d", path);

    svg.insert("path", ".graticule")
        .datum(topojson.mesh(world, world.objects.countries, function(a, b) { return a !== b; }))
        .attr("class", "boundary")
        .attr("d", path);
});

d3.select(self.frameElement)                //what does this do?
    .style("height", height + "px");

//End  larger continent mapping---------------------------------------------

//Start mapping the smaller continent ---------------------------------------

svg.append("defs").append("path")       //sphere
    .datum({type: "Sphere"})
    .attr("id", "sphere2")
    .attr("d", path2);

//svg.append("use")                   //stroke of sphere
//    .attr("class", "stroke")
//    .attr("xlink:href", "#sphere2");

svg.append("use")                   //fill of sphere
    .attr("class", "fill")
    .attr("xlink:href", "#sphere2");    //WHY is this drawing on top of peninsula??

svg.append("path")                  //geo-coordinates
    .datum(graticule)
    .attr("class", "graticule")
    .attr("d", path2);

d3.json('data/world-50m.json', function(error, world) {
    svg.insert("path", ".graticule")
        .datum(topojson.feature(world, world.objects.land))
        .attr("class", "land")
        .attr("d", path2);

    svg.insert("path", ".graticule")
        .datum(topojson.mesh(world, world.objects.countries, function(a, b) { return a !== b; }))
        .attr("class", "boundary")
        .attr("d", path2);
});

d3.select(self.frameElement)                //what does this do?
    .style("height", height + "px");

//End continent mapping---------------------------------------------


//Load Antarctic Facilities data
d3.csv('data/antarcticfacilities.csv',parse,data);

function data (err,antarcticfacilities) {
    console.log(antarcticfacilities);

    var extent = d3.extent(antarcticfacilities, function (d) {
        return d.pop;
    });
    scaleSize
        .domain(extent);

    draw(antarcticfacilities);
    //draw2(antarcticfacilities);
}

function draw(antarcticfacilities){
    //First, use array.map to transform the original dataset --> "antarcticfacilities"
    var nodesArray = antarcticfacilities.map(function(c){
        //argument c is an element in the world array, which is a facility?
        var xy = projection(c.lngLat);
        return{
            x:xy[0],
            y:xy[1],
            x0:xy[0],
            y0:xy[1],
            r: scaleSize(c.pop),
            winPop: c.winPop,
            pop: c.pop,
            id: c.id,
            name: c.name,
            country: c.country,
            alt: c.alt,
            station: c.station,
            year: c.year
        }
    })
    /*function draw2(antarcticfacilities){
        //First, use array.map to transform the original dataset --> "antarcticfacilities"
        var nodesArray2 = antarcticfacilities.map(function(c){
                //argument c is an element in the world array, which is a facility?
                var xy = projection2(c.lngLat);
                return{
                    x:xy[0],
                    y:xy[1],
                    x0:xy[0],
                    y0:xy[1],
                    r: scaleSize(c.pop),
                    winPop: c.winPop,
                    pop: c.pop,
                    id: c.id,
                    name: c.name,
                    country: c.country,
                    alt: c.alt,
                    station: c.station,
                    year: c.year
                }
            })
            ;*/

    var facilities = svg.selectAll('.facility')
        .data(nodesArray, function(d){
            return d.id;
            //change this
        })
        .enter()
        .append('g')
        .attr('class','facility')
        .sort(function(a,b){
            return b.pop - a.pop;
        });

    facilities
        .attr('transform',function(d){
            return 'translate('+ d.x+','+ d.y+')';
        })
        .on('mouseover',function(d){
            var table = customTooltip.select('.data-table');
            table.append('dt')
                .html('NATIONAL PROGRAM')
            table.append('dd')
                .html(d.country);
            table.append('dt')
                .html('SUMMER / WINTER POPULATION');
            table.append('dd')
                .html(d.pop + ' / ' + d.winPop);
            table.append('dt')
                .html('ALTITUDE');
            table.append('dd')
                .html(d.alt + ' m');
            table.append('dt')
                .html('YEAR OPENED');
            table.append('dd')
                .html(d.year);

            customTooltip               //write more like this one instead of table above?
                .select("h2")
                .html(d.station);
        })
        .on('mouseleave', function(d){
            console.log("Leave)");
            //hide the tool tip
            //d3.select('.custom-tooltip')
            //    .style('visibility','hidden');
            tooltip = customTooltip.selectAll('dd').remove();
            tooltip = customTooltip.selectAll('dt').remove();
            //tooltip.selectAll('dd').html("");
            //tooltip..selectAll('dt').html("")

        });

    //summer (peak) population
    facilities
        .append('circle')
        .transition().delay(750).attr('r',function(d){
            return scaleSize(d.pop);
        })
        .style('fill','#00bfff')
        .style('opacity',.5);

    //winter population
    facilities
        .append('circle')
        .transition().delay(500).attr('r',function(d){
            return scaleSize(d.winPop);
        })
        .style('fill','#00008b')
        .style('opacity',.5);

    //any station
    facilities
        .append('rect')
        .attr('width',3)
        .attr('height',3)
        .style('fill','#ff4500')
        .transition().attr("transform", "translate(-1.5,-1.5)")
    ;
}

//Parse data
    function parse(d){
        if(+d.lon_dd && +d.lat_dd){
            return {
                id: d.my_id,
                name: d.national_program,
                pop: +d.peak_population?+d.peak_population:0,
                winPop: +d.winter_population?+d.winter_population:0,
                alt: +d.altitude_m,
                lngLat: [+d.lon_dd, +d.lat_dd],
                station: d.facility_name,
                country: d.national_program,
                year: +d.first_opened?+d.first_opened:NaN
            };
        }
    }
