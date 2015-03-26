var api_key = 'YB0MY3VMHyllzPqEf5alVj5bUvGpvDVi';
var candidates_data = [];
var width;

var margin = {top: 20, right: 30, bottom: 30, left: 80},
	height = 500 - margin.top - margin.bottom;

var svg;
var g;
var path;

var cons_data;
var active = d3.select(null);

var get_cons_colour = function(id) {
	return cons_data.get(id)[0].colour;
}


function handle_zoom() {
	g.attr("transform","translate(" + d3.event.translate.join(",") + ")scale(" + d3.event.scale + ")");
};

var zoom = d3.behavior.zoom()
	.scaleExtent([1, 100])
	.on("zoom", handle_zoom);

function clicked(d) {
	if(active.node() === this) {
		reset();
	} else {
		active = d3.select(this);

		var b = path.bounds(d);
		var dx = b[1][0] - b[0][0];
		var dy = b[1][1] - b[0][1];
		var x = (b[0][0] + b[1][0]) / 2;
		var y = (b[0][1] + b[1][1]) / 2;
		var s = 0.95 / Math.max(dx/width, dy/height);
		var t = [width/2 - s * x, height/2 - s * y];

		svg.transition()
			.duration(750)
			.call(zoom.translate(t).scale(s).event);
	}
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

var mouseover = function(d) {

	d3.selectAll('#tooltip .articles')
	    .remove();

	var candidates = [];

	var curr = 0;

	var addItem = function(item) {
		console.log('hello3');
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

	      	url: "http://data.test.bbc.co.uk/bbcrd-juicer/articles?q=%22" + first + "%20" + last + "%22&apikey=" + api_key,
	      	type : "GET",
	      	dataType: "json",
	      	success: function(data) {
	            data.hits.forEach(addItem);
	      	} // closing success
	    }); //closing ajax
	}) //closing candidates forEach

  	d3.select("#tooltip")
    	.style("left", "10px")
    	.style("top", "50px");
  	d3.select("#tooltip #constituency")
    	.text(cons_data.get(d.id)[0].constituency);
  	d3.select("#tooltip #mp")
    	.text("MP : " + cons_data.get(d.id)[0].mp);
  	d3.select("#tooltip #party")
    	.text("Party : " + cons_data.get(d.id)[0].party);

  	d3.select("#tooltip").classed("hidden", false);
};

var mouseout = function() {
  d3.select("#tooltip").classed("hidden", true);

  d3.selectAll('#tooltip .articles')
  	.remove();
};

function draw(boundaries) {

	projection
		.scale(1)
		.translate([0,0]);
	var b = path.bounds(topojson.feature(boundaries, boundaries.objects["wpc"]));
	var s = 0.95 / Math.max((b[1][0]-b[0][0])/width, (b[1][1]-b[0][1])/height);
	var t = [(width - s * (b[1][0] + b[0][0]))/2, (height - s * (b[1][1] + b[0][1]))/2];

	projection
		.scale(s)
		.translate(t);

	var areas = g.selectAll(".area")
		.data(topojson.feature(boundaries, boundaries.objects["wpc"]).features);

	areas
		.enter()
		.append("path")
		.attr("class", "area")
		.attr("fill", function(d){return get_cons_colour(d.id);})
		.attr("id", function(d){return d.id;})
		.attr("d", path)
		.on("mouseover", mouseover)
        .on("mouseout", mouseout)
		.on("click", clicked);

	areas.call(zoom);
};

function init() {
	width =  document.getElementById("vis").clientWidth;
	
	var margin = {top: 20, right: 30, bottom: 30, left: 80},
		height = 500 - margin.top - margin.bottom;

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

			draw(wpc);
		});
};

init();