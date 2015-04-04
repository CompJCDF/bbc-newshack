var api_key = 'YB0MY3VMHyllzPqEf5alVj5bUvGpvDVi';
var candidates_data = [];
var width;

var margin = {top: 20, right: 30, bottom: 30, left: 80},
	height = 600 - margin.top - margin.bottom;

var svg;
var g;
var path;

var cons_data;
var active = d3.select(null);

var get_cons_colour = function(id) {
	return id;
}

var get_uk_colour = function(id) {
	return cons_data.get(id)[0].colour;
}


function handle_zoom() {
	g.attr("transform","translate(" + d3.event.translate.join(",") + ")scale(" + d3.event.scale + ")");
};

var zoom = d3.behavior.zoom()
	.scaleExtent([1, 50])
	.on("zoom", handle_zoom);

function clicked(d) {

	console.log(d);

	d3.selectAll('#tooltip .articles')
	    .remove();

	var addItem = function(item) {
		d3.selectAll('#tooltip')
			.append('a')
			.attr('class', 'articles')
			.attr('href', item.url)
			.text(item.title)
	    }

	// request articles
	candidates_data.get(d.id).forEach(function(d){
			
		first = d.name.split(' ')[0];
		last = d.name.split(' ')[1];
		
		$.ajax({
		    url: "http://data.test.bbc.co.uk/bbcrd-juicer/articles?q=%22" + first + "%20" + last + "%22&size=5&recent_first=yes&apikey=" + api_key,
		    type : "GET",
		    dataType: "json",
		    success: function(data) {
		       	data.hits.forEach(addItem);
		    } // closing success
		}); //closing ajax
	}) //closing candidates forEach

	d3.select("#tooltip")
	    .style("left", "10px")
	    .style("top", "25px");
	d3.select("#tooltip #constituency")
	    .text(cons_data.get(d.id)[0].constituency);
	d3.select("#tooltip #mp")
	    .text("MP : " + cons_data.get(d.id)[0].mp);
	d3.select("#tooltip #party")
	    .text("Party : " + cons_data.get(d.id)[0].party);

	d3.select("#tooltip").classed("hidden", false);
}

function reset() {
	svg.transition()
		.duration(750)
		.call(zoom.translate([0,0]).scale(1).event);

	active = d3.select(null);
}

function stopped() {
	if(d3.event.defaultPrevented) {
		d3.event.stopPropagation();
	}
};

function draw(boudaries) {

	console.log(boundaries);
	console.log(wpCons);

	var geoJSON = {
	    "type": "FeatureCollection",
	    "features":[

	    ]
	}

	var desiredId = [];
	var desiredColour = [];

	$.each(cons_data, function(key, value) {
  							if ($.inArray(value[0].mapitid, wpCons) != -1) {
  					    	   	desiredId.push(key)
  					    	   	desiredColour.push(this[0].colour)
  					    	}
  					    })

	i = 0


	boundaries.forEach(function(boundary){
			geoJSON.features.push({
            "type":"Feature",
            "geometry": boundary,
            "id": desiredId[i],
            "colour": desiredColour[i]
        })
			i++
	})

	projection
		.scale(1)
		.translate([0,0]);
	var b = path.bounds(geoJSON);
	var s = 0.95 / Math.max((b[1][0]-b[0][0])/width, (b[1][1]-b[0][1])/height);
	var t = [(width - s * (b[1][0] + b[0][0]))/2, (height - s * (b[1][1] + b[0][1]))/2];

	projection
		.scale(s)
		.translate(t);

	var areas = g.selectAll(".area")
	    .data(geoJSON.features)

	areas
		.enter()
		.append("path")
		.attr("class", "area")
		.attr("fill", function(d){return get_cons_colour(d.colour);})
		.attr("id", function(d){return d.id;})
		.attr("d", path)
		.on("click", clicked);

	svg.call(zoom);
}

function drawUK(boundaries) {

	projection
		.scale(1)
		.translate([0,0]);
	var b = path.bounds(topojson.feature(boundaries, boundaries.objects["wpc"]));
	var s = 0.95 / Math.max((b[1][0]-b[0][0])/width, (b[1][1]-b[0][1])/height);
	var t = [(width - s * (b[1][0] + b[0][0]))/2, (height - s * (b[1][1] + b[0][1]))/2];

	projection
		.scale(s)
		.translate(t);

	var areas = g.selectAll(".areaUK")
		.data(topojson.feature(boundaries, boundaries.objects["wpc"]).features);

	areas
		.enter()
		.append("path")
		.attr("class", "areaUK")
		.attr("fill", function(d){return get_uk_colour(d.id);})
		.attr("id", function(d){return d.id;})
		.attr("d", path)
		.on("click", clicked);

	svg.call(zoom);
};

function init() {
	width =  document.getElementById("vis").clientWidth;
	
	var margin = {top: 20, right: 30, bottom: 30, left: 80},
		height = 600 - margin.top - margin.bottom;

	svg = d3.select("#vis")
			.append("svg")
			.attr("width", width)
			.attr("height", height)
			.on("click", stopped, true);

	g = svg.append("g");

	projection =d3.geo.albers()
		.rotate([0,0]);

	path = d3.geo.path()
		.projection(projection);

	// CARDIFF
	var lon = -3.1833;
	var lat = 51.4833;

	// SWANSEA
	// var lon = -3.9500;
	// var lat = 51.6167;

	boundaries = [];

	var getBoundaries = function(id) {
		$.ajax({
		    url: "http://mapit.mysociety.org/area/" + id + ".geojson",
		    type : "GET",
		    dataType: "json",
		    success: function(data) {
		    	boundaries.push(data);
		    } // closing success
		}); //closing ajax
	}

	$.ajax({
	    url: "http://mapit.mysociety.org/point/4326/" + lon + "," + lat ,
	    type : "GET",
	    dataType: "json",
	    success: function(data) {
	    	$.each(data, function(key, value){
	    		if (value.type_name === "Unitary Authority") {
	    	       localAuth = value.id
	    	     }
	    	})
	    	$.ajax({
	    	    url: "http://mapit.mysociety.org/area/" + localAuth + "/coverlaps?type=WMC",
	    	    type : "GET",
	    	    dataType: "json",
	    	    success: function(data) {
	    	    	wpCons = (Object.keys(data));
	    	    	wpCons.forEach(getBoundaries);
	    	    } // closing success
	    	}); //closing ajax
	    	queue()
	    		.defer(d3.json, "wpc.json")
	    		.defer(d3.csv, "data.csv")
	    		.defer(d3.csv, "candidates.csv")
	    		.await(function(error, wpc, data, candidates){
	    			
	    			cons_data = d3.nest()
	    				.key(function(d){return d.pcon13cd;})
	    				.map(data, d3.map);

	    			candidates_data = d3.nest()
	    				.key(function(d){return d.gss_code;})
	    				.map(candidates, d3.map);

	    			draw(boundaries);
	    		});
	    } // closing success
	}); //closing ajax

};

init();