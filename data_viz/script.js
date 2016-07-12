$.ajax({
    url: "./data/results_tsne_ap_clusters_bis.csv",
    async: false,
    success: function (csvd) {
        occupations = $.csv.toObjects(csvd);
    },
    dataType: "text",
    complete: function () {
      console.log("HEHEEHE : " , occupations)

        return occupations
        // call a function on complete
    }
});
console.log("la : " , occupations)

////////////////////////////////////////////////////////////
//////////////////////// Set-up ////////////////////////////
////////////////////////////////////////////////////////////

//fisheye
var fisheye = d3.fisheye.circular()
    .radius(100)
    .distortion(2);

//Quick fix for resizing some things for mobile-ish viewers
var mobileScreen = ($( window ).innerWidth() < 500 ? true : false);

//Scatterplot
var margin = {left: 30, top: 20, right: 20, bottom: 20},
	width = Math.min($("#chart").width(), 1000) - margin.left - margin.right,
	height = width*2/3;

var svg = d3.select("#chart").append("svg")
			.attr("width", (width + margin.left + margin.right))
			.attr("height", (height + margin.top + margin.bottom));



var wrapper = svg.append("g").attr("class", "chordWrapper")
			.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

//////////////////////////////////////////////////////
///////////// Initialize Axes & Scales ///////////////
//////////////////////////////////////////////////////

var opacityCircles = 0.5;

//Set the color for each region
var color = d3.scale.ordinal()
					.range(["#EFB605", "#E58903", "#E01A25", "#C20049", "#991C71", "#66489F", "#2074A0", "#10A66E", "#7EB852", "#000000", "#666666", "#800000"])
					.domain([
                  "1",
                  "2",
                  "3",
                  "4",
                  "5",
                  "6",
                  "7",
                  "8",
                  "9",
                  "10",
                  "11",
                  "12"
                    ]);

//Set the new x axis range
var xScale = d3.scale.linear()
  .range([0, width])
  .domain([-50,50]);

//  .domain(d3.extent(occupations, function(d) { return parseFloat(d.X1); }))
  //.nice()
  //.domain([-50,50]);
  //.domain(d3.extent(occupations, function(d) { return d.X1; }))
  //.nice()

   //I prefer this exact scale over the true range and then using "nice"
	//.domain(d3.extent(countries, function(d) { return d.GDP_perCapita; }))
	//.nice();
//Set new x-axis
// var xAxis = d3.svg.axis()
// 	.orient("bottom")
// 	.ticks(2)
// 	.tickFormat(function (d) {
// 		return xScale.tickFormat((mobileScreen ? 4 : 8),function(d) {
// 			var prefix = d3.formatPrefix(d);
// 			return "$" + prefix.scale(d) + prefix.symbol;
// 		})(d);
// 	})
	// .scale(xScale);
//Append the x-axis
// wrapper.append("g")
// 	.attr("class", "x axis")
// 	.attr("transform", "translate(" + 0 + "," + height + ")")
// 	.call(xAxis);

//Set the new y axis range
var yScale = d3.scale.linear()
	.range([height,0])
  .domain(d3.extent(occupations, function(d) { return parseFloat(d.X2) ; }))
	.nice();

  //.domain([-50,50]);

  //.range([0, width])
  //.domain(d3.extent(occupations, function(d) { return parseFloat(d.X2); }))

  //.domain([-50,50]);
//   var yAxis = d3.svg.axis()
// 	.orient("left")
// 	.ticks(6)  //Set rough # of ticks
// 	.scale(yScale);
// //Append the y-axis
// wrapper.append("g")
// 		.attr("class", "y axis")
// 		.attr("transform", "translate(" + 0 + "," + 0 + ")")
// 		.call(yAxis);

var radius_scale_= 3
//Scale for the bubble size
var rScale = d3.scale.sqrt()
			.range([mobileScreen ? 1 : 2, mobileScreen ? 10 : 16])
      .domain([0,100]);
      //.domain(d3.extent(occupations, function(d) { return d.X1;}));

			//.domain(d3.extent(countries, function(d) { return d.GDP; }));

var rScaleSalary = d3.scale.linear()
			.range([mobileScreen ? 1 : 2, mobileScreen ? 10 : 16])
      .domain(d3.extent(occupations, function(d) { return parseFloat(d.Salaire_debutant);}));

var rScaleStudies = d3.scale.linear()
      			.range([mobileScreen ? 1 : 2, mobileScreen ? 10 : 16])
            .domain(d3.extent(occupations, function(d) { return parseFloat(d.diplome_num);}));
function salaryCriteria(d){
  return rScaleSalary(d.Salaire_debutant);
}
function studiesCriteria(d){
  return rScaleStudies(d.diplome_num);
}
function defaultCriteria(d){
  return rScale(radius_scale_);
}
function govEmployeeFilter(d){
  return d.Statut_fonctionnaire;
}
var criterias = [
  ["Salaire débutant",salaryCriteria, "#DDDDDD"],
  ["Durée des études",studiesCriteria, "#111111"],
  ];

var filters = [
  ["Statut fonctionnaire",govEmployeeFilter, "#DD2233"],
];

////////////////////////////////////////////////////////////
/////////////////// Scatterplot Circles ////////////////////
////////////////////////////////////////////////////////////

//Initiate a group element for the circles
var circleGroup = wrapper.append("g")
	.attr("class", "circleWrapper");

//Place the country circles
circleGroup.selectAll("occupations")
	.data(occupations.sort(function(a,b) { return parseFloat(b.X1) > parseFloat(a.X1); })) //Sort so the biggest circles are below
	.enter().append("circle")
		.attr("class", function(d,i) { return "occupations " + "jobid"+d.jobs_id; })
		.style("opacity", opacityCircles)
		.style("fill", function(d) {return color(d.ap_clusters);})
    .style("stroke", "white")
		.attr("cx", function(d) {return xScale(d.X1);})
		.attr("cy", function(d) {return yScale(d.X2);})
		.attr("r", function(d) {return rScale(radius_scale_);});


  svg.on("mousemove", function() {
    fisheye.focus(d3.mouse(this));
    console.log(circleGroup)
    circleGroup.selectAll(".occupations")
    .each(function(d) { d.x = xScale(d.X1); d.y = yScale(d.X2);d.fisheye = fisheye(d); })
      .attr("cx", function(d) { return d.fisheye.x; })
      .attr("cy", function(d) { return d.fisheye.y; });


  });
//////////////////////////////////////////////////////////////
//////////////////////// Voronoi /////////////////////////////
//////////////////////////////////////////////////////////////

//Initiate the voronoi function
//Use the same variables of the data in the .x and .y as used in the cx and cy of the circle call
//The clip extent will make the boundaries end nicely along the chart area instead of splitting up the entire SVG
//(if you do not do this it would mean that you already see a tooltip when your mouse is still in the axis area, which is confusing)
var voronoi = d3.geom.voronoi()
	.x(function(d) { return xScale(d.X1); })
	.y(function(d) { return yScale(d.X2); })
	.clipExtent([[0, 0], [width, height]]);


//Initiate a group element to place the voronoi diagram in
var voronoiGroup = wrapper.append("g")
	.attr("class", "voronoiWrapper");

//Create the Voronoi diagram
voronoiGroup.selectAll("path")
	.data(voronoi(occupations)) //Use vononoi() with your dataset inside
	.enter().append("path")
	.attr("d", function(d, i) { if(d){return "M" + d.join("L") + "Z";}})
	.datum(function(d, i) { if(d){return d.point;} })
	.attr("class", function(d,i) {  if(d){return "voronoi " + "jobid" + d.jobs_id; } }) //Give each cell a unique class where the unique part corresponds to the circle classes
	//.style("stroke", "#2074A0") //I use this to look at how the cells are dispersed as a check
	.style("fill", "none")
	.style("pointer-events", "all")
	.on("mouseover", showTooltip)
	.on("mouseout",  removeTooltip)
  .on("dblclick", OpenInNewTabWinBrowser);

// NOTE DE FLORIAN : Il faut remplacer l'url ouvert dans cette fonction par la fiche onisep liée
function OpenInNewTabWinBrowser(d, i) {
  console.log(d)
  var url = "www.google.com" // Devrait être un attribut de d
  window.location.assign("http://www.onisep.fr/Ressources/Univers-Metier/Metiers/" + d.Metier, '_blank');

}
//////////////////////////////////////////////////////
///////////////// Initialize Labels //////////////////
//////////////////////////////////////////////////////

//Set up X axis label
// wrapper.append("g")
// 	.append("text")
// 	.attr("class", "x title")
// 	.attr("text-anchor", "end")
// 	.style("font-size", (mobileScreen ? 8 : 12) + "px")
// 	.attr("transform", "translate(" + width + "," + (height - 10) + ")")

//Set up y axis label
// wrapper.append("g")
// 	.append("text")
// 	.attr("class", "y title")
// 	.attr("text-anchor", "end")
// 	.style("font-size", (mobileScreen ? 8 : 12) + "px")
// 	.attr("transform", "translate(18, 0) rotate(-90)")

///////////////////////////////////////////////////////////////////////////
///////////////////////// Create the Legend////////////////////////////////
///////////////////////////////////////////////////////////////////////////

if (!mobileScreen) {
	//Legend
	var	legendMargin = {left: 5, top: 10, right: 5, bottom: 10},
		legendWidth = 145,
		legendHeight = 270;

	var svgLegend = d3.select("#legend").append("svg")
				.attr("width", (legendWidth + legendMargin.left + legendMargin.right))
				.attr("height", (legendHeight + legendMargin.top + legendMargin.bottom));

	var legendWrapper = svgLegend.append("g").attr("class", "legendWrapper")
					.attr("transform", "translate(" + legendMargin.left + "," + legendMargin.top +")");

	var rectSize = 15, //dimensions of the colored square
		rowHeight = 20, //height of a row in the legend
		maxWidth = 144; //widht of each row

	//Create container per rect/text pair
	var legend = legendWrapper.selectAll('.legendSquare')
			  .data(color.range())
			  .enter().append('g')
			  .attr('class', 'legendSquare')
			  .attr("transform", function(d,i) { return "translate(" + 0 + "," + (i * rowHeight) + ")"; })
			  .style("cursor", "pointer")
			  .on("mouseover", selectLegend(0.10))
			  .on("mouseout", selectLegend(opacityCircles))
			  .on("click", clickLegend);

	//Non visible white rectangle behind square and text for better hover
	legend.append('rect')
		  .attr('width', maxWidth)
		  .attr('height', rowHeight)
		  .style('fill', "white");
	//Append small squares to Legend
	legend.append('rect')
		  .attr('width', rectSize)
		  .attr('height', rectSize)
		  .style('fill', function(d) {return d;});
	//Append text to Legend
	legend.append('text')
		  .attr('transform', 'translate(' + 22 + ',' + (rectSize/2) + ')')
		  .attr("class", "legendText")
		  .style("font-size", "10px")
		  .attr("dy", ".35em")
		  .text(function(d,i) { return color.domain()[i]; });

	//Create g element for bubble size legend
	// var bubbleSizeLegend = legendWrapper.append("g")
	// 						.attr("transform", "translate(" + (legendWidth/2 - 30) + "," + (color.domain().length*rowHeight + 20) +")");
	// //Draw the bubble size legend
	// bubbleLegend(bubbleSizeLegend, rScale, legendSizes = [1e11,3e12,1e13], legendName = "GDP (Billion $)");
}//if !mobileScreen
else {
	d3.select("#legend").style("display","none");
}


///////////////////////////////////////////////////////////////////////////
///////////////////////// Create the Criterias//////////////////////////////
///////////////////////////////////////////////////////////////////////////
if (!mobileScreen) {

  //Legend
	var	legendMargin = {left: 5, top: 10, right: 5, bottom: 10},
		legendWidth = 145,
		legendHeight = 270;

	var svgLegend = d3.select("#criterias").append("svg")
				.attr("width", (legendWidth + legendMargin.left + legendMargin.right))
				.attr("height", (legendHeight + legendMargin.top + legendMargin.bottom));

	var legendWrapper = svgLegend.append("g").attr("class", "legendWrapper")
					.attr("transform", "translate(" + legendMargin.left + "," + legendMargin.top +")");

	var circleSize = 6, //dimensions of the colored square
		rowHeight = 20, //height of a row in the legend
		maxWidth = 144; //widht of each row

	//Create container per rect/text pair
	var legend = legendWrapper.selectAll('.legendCircleCr')
			  .data(criterias)
			  .enter().append('g')
			  .attr('class', 'legendCircleCr')
			  .attr("transform", function(d,i) { return "translate(" + 0 + "," + (i * rowHeight) + ")"; })
			  .style("cursor", "pointer")
			  .on("mouseover", selectCriteria(10, null))
			  .on("mouseout", selectCriteria(radius_scale_, defaultCriteria))
			  .on("click", clickCriteria);

	//Non visible white rectangle behind square and text for better hover
	legend.append('rect')
		  .attr('width', maxWidth)
		  .attr('height', rowHeight)
		  .style('fill', "white");

  //Append small squares to Legend
	legend.append('circle')
      .attr('cx', 5)
      .attr('r', circleSize)
      // .attr('height', rectSize)
      // .style('fill', "white")
      .style('fill', function(d) {console.log("that : ", d); return d[2];});

  //Append text to Legend
	legend.append('text')
		  .attr('transform', 'translate(' + 22 + ',' + (0) + ')')
		  .attr("class", "legendText")
		  .style("font-size", "10px")
		  .attr("dy", ".35em")
		  .text(function(d,i) { console.log("this : ", d, i ); return d[0]; });

	//Create g element for bubble size legend
	// var bubbleSizeLegend = legendWrapper.append("g")
	// 						.attr("transform", "translate(" + (legendWidth/2 - 30) + "," + (color.domain().length*rowHeight + 20) +")");
	// //Draw the bubble size legend
	// bubbleLegend(bubbleSizeLegend, rScale, legendSizes = [1e11,3e12,1e13], legendName = "GDP (Billion $)");
}//if !mobileScreen
else {
	d3.select("#criterias").style("display","none");
}
///////////////////////////////////////////////////////////////////////////
//////////////////// Hover function for the criterias ////////////////////////
///////////////////////////////////////////////////////////////////////////

//Decrease opacity of non selected circles when hovering in the legend
function selectCriteria(radius, customRScale) {
	return function(d, i) {
		//var chosen = color.domain()[i];
    if (customRScale == null){
      scaleToApply = d[1]
    }
    else{
      scaleToApply = customRScale
    }
		wrapper.selectAll(".occupations")
			.transition()
			.attr("r", function(d){ return scaleToApply(d)});
	  };
}
//function selectCriteria


///////////////////////////////////////////////////////////////////////////
///////////////////// Click functions for filter //////////////////////////
///////////////////////////////////////////////////////////////////////////

//Function to show only the circles for the clicked sector in the legend
function clickCriteria(d,i) {

	event.stopPropagation();

	//deactivate the mouse over and mouse out events
	d3.selectAll(".legendCircleCr")
		.on("mouseover", null)
		.on("mouseout", null);

  scaleToApply = d[1]
	//Only show the circles of the chosen sector
	wrapper.selectAll(".occupations")
    .transition()
    .attr("r", function(d){ return scaleToApply(d)});
}

///////////////////////////////////////////////////////////////////////////
///////////////////////// Create the Filters//////////////////////////////
///////////////////////////////////////////////////////////////////////////
if (!mobileScreen) {

  //Legend
	var	legendMargin = {left: 5, top: 10, right: 5, bottom: 10},
		legendWidth = 145,
		legendHeight = 27;

	var svgLegend = d3.select("#filters").append("svg")
				.attr("width", (legendWidth + legendMargin.left + legendMargin.right))
				.attr("height", (legendHeight + legendMargin.top + legendMargin.bottom));

	var legendWrapper = svgLegend.append("g").attr("class", "legendWrapper")
					.attr("transform", "translate(" + legendMargin.left + "," + legendMargin.top +")");

	var rectSize = 15, //dimensions of the colored square
		rowHeight = 20, //height of a row in the legend
		maxWidth = 144; //widht of each row

	//Create container per rect/text pair
	var legend = legendWrapper.selectAll('.legendFilters')
			  .data(filters)
			  .enter().append('g')
			  .attr('class', 'legendFilters')
			  .attr("transform", function(d,i) { return "translate(" + 0 + "," + (i * rowHeight) + ")"; })
			  .style("cursor", "pointer")
			  .on("mouseover", selectFilter(0.10))
			  .on("mouseout", selectFilter(opacityCircles))
			  .on("click", clickFilter);

	//Non visible white rectangle behind square and text for better hover
	legend.append('rect')
		  .attr('width', maxWidth)
		  .attr('height', rowHeight)
		  .style('fill', "white");

  //Append small squares to Legend
	legend.append('rect')
		  .attr('width', rectSize)
		  .attr('height', rectSize)
      //.attr('cx', 5)
		  //.attr('r', circleSize)
		  // .style('fill', "white")
      .style('fill', function(d) {console.log("that : ", d); return d[2];});

  //Append text to Legend
	legend.append('text')
      .attr('transform', 'translate(' + 22 + ',' + (rectSize/2) + ')')
      .attr("class", "legendText")
      .style("font-size", "10px")
      .attr("dy", ".35em")
		  .text(function(d,i) { console.log("this : ", d, i ); return d[0]; });

	//Create g element for bubble size legend
	// var bubbleSizeLegend = legendWrapper.append("g")
	// 						.attr("transform", "translate(" + (legendWidth/2 - 30) + "," + (color.domain().length*rowHeight + 20) +")");
	// //Draw the bubble size legend
	// bubbleLegend(bubbleSizeLegend, rScale, legendSizes = [1e11,3e12,1e13], legendName = "GDP (Billion $)");
}//if !mobileScreen
else {
	d3.select("#filters").style("display","none");
}
///////////////////////////////////////////////////////////////////////////
//////////////////// Hover function for the criterias ////////////////////////
///////////////////////////////////////////////////////////////////////////

//Decrease opacity of non selected circles when hovering in the legend
function selectCriteria(radius, customRScale) {
	return function(d, i) {
		//var chosen = color.domain()[i];
    if (customRScale == null){
      scaleToApply = d[1]
    }
    else{
      scaleToApply = customRScale
    }
		wrapper.selectAll(".occupations")
			.transition()
			.attr("r", function(d){ return scaleToApply(d)});
	  };
}
//function selectCriteria


///////////////////////////////////////////////////////////////////////////
///////////////////// Click functions for filter //////////////////////////
///////////////////////////////////////////////////////////////////////////

//Function to show only the circles for the clicked sector in the legend
function clickFilter(d,i) {
  console.log(d);
	event.stopPropagation();


	//deactivate the mouse over and mouse out events
	d3.selectAll(".legendFilters")
		.on("mouseover", null)
		.on("mouseout", null);

  var scaleToApply = d[1]

  //Only show the circles of the chosen sector
  wrapper.selectAll(".occupations")
    .style("opacity", function(d) {
      if (scaleToApply(d) != 1) return 0.1;
      else return opacityCircles;
    });

  //Make sure the pop-ups are only shown for the clicked on legend item
  wrapper.selectAll(".voronoi")
    .on("mouseover", function(d,i) {
      if(scaleToApply(d) != 1) return null;
      else return showTooltip.call(this, d, i);
    })
    .on("mouseout",  function(d,i) {
      if(scaleToApply(d) != 1) return null;
      else return removeTooltip.call(this, d, i);
    });

  }//sectorClick




///////////////////////////////////////////////////////////////////////////
//////////////////// Hover function for the filter ////////////////////////
///////////////////////////////////////////////////////////////////////////

//Decrease opacity of non selected circles when hovering in the legend
function selectFilter(opacity) {
  // console.log(opacity)
	return function(d, i) {
		// var chosen = color.domain()[i];
    var scaleToApply = d[1]
    console.log("D : ", d)
		wrapper.selectAll(".occupations")
			.filter(function(d) {
        console.log(d); return scaleToApply(d) != 1; })
			.transition()
			.style("opacity", opacity);
	  };
}
//function selectLegend

///////////////////////////////////////////////////////////////////////////
//////////////////// Hover function for the legend ////////////////////////
///////////////////////////////////////////////////////////////////////////

//Decrease opacity of non selected circles when hovering in the legend
function selectLegend(opacity) {
	return function(d, i) {
		var chosen = color.domain()[i];

		wrapper.selectAll(".occupations")
			.filter(function(d) { return d.ap_clusters != chosen; })
			.transition()
			.style("opacity", opacity);
	  };
}
//function selectLegend


///////////////////////////////////////////////////////////////////////////
///////////////////// Click functions for legend //////////////////////////
///////////////////////////////////////////////////////////////////////////

//Function to show only the circles for the clicked sector in the legend
function clickLegend(d,i) {

	event.stopPropagation();

	//deactivate the mouse over and mouse out events
	d3.selectAll(".legendSquare")
		.on("mouseover", null)
		.on("mouseout", null);

	//Chosen legend item
	var chosen = color.domain()[i];

	//Only show the circles of the chosen sector
	wrapper.selectAll(".occupations")
		.style("opacity", function(d) {
			if (d.ap_clusters != chosen) return 0.1;
			else return opacityCircles;
		});

	//Make sure the pop-ups are only shown for the clicked on legend item
	wrapper.selectAll(".voronoi")
		.on("mouseover", function(d,i) {
			if(d.ap_clusters != chosen) return null;
			else return showTooltip.call(this, d, i);
		})
		.on("mouseout",  function(d,i) {
			if(d.ap_clusters != chosen) return null;
			else return removeTooltip.call(this, d, i);
		});

}//sectorClick

//Show all the cirkels again when clicked outside legend
function resetClick() {

	//Activate the mouse over and mouse out events of the legend
	d3.selectAll(".legendSquare")
		.on("mouseover", selectLegend(0.10))
		.on("mouseout", selectLegend(opacityCircles));

  d3.selectAll(".legendCircleCr")
  		.on("mouseover", selectCriteria(10, null))
  		.on("mouseout", selectCriteria(radius_scale_, defaultCriteria));

  d3.selectAll(".legendFilters")
          .on("mouseover", selectFilter(0.10))
          .on("mouseout", selectFilter(opacityCircles));

	//Show all circles and restore initial size
	wrapper.selectAll(".occupations")
    .transition().duration(500)
    .attr('r', defaultCriteria)
		.style("opacity", opacityCircles)
		.style("visibility", "visible");

	//Activate all pop-over events
	wrapper.selectAll(".voronoi")
		.on("mouseover", showTooltip)
		.on("mouseout",  function (d,i) { removeTooltip.call(this, d, i); });

}//resetClick

//Reset the click event when the user clicks anywhere but the legend
d3.select("body").on("click", resetClick);

///////////////////////////////////////////////////////////////////////////
/////////////////// Hover functions of the circles ////////////////////////
///////////////////////////////////////////////////////////////////////////

//Hide the tooltip when the mouse moves away
function removeTooltip (d, i) {

	//Save the chosen circle (so not the voronoi)
	var element = d3.selectAll(".occupations."+"jobid" + d.jobs_id);

	//Fade out the bubble again
	element.style("opacity", opacityCircles);

	//Hide tooltip
	$('.popover').each(function() {
		$(this).remove();
	});

	//Fade out guide lines, then remove them
	d3.selectAll(".guide")
		.transition().duration(200)
		.style("opacity",  0)
		.remove();

}//function removeTooltip

//Show the tooltip on the hovered over slice
function showTooltip (d, i) {

	//Save the chosen circle (so not the voronoi)
	var element = d3.selectAll(".occupations."+"jobid"+d.jobs_id);

	//Define and show the tooltip
	$(element).popover({
		placement: 'auto top',
		container: '#chart',
		trigger: 'manual',
		html : true,
		content: function() {
			return "<span style='font-size: 11px; text-align: center;'> <b>" + d.Metier + "</b>"
       + "<br/> Salaire débutant : " +d.Salaire_debutant
       + "<br/> Années études : " +d.diplome + "</span>"; }
	});
	$(element).popover('show');

	//Make chosen circle more visible
  console.log(d)
	element.style("opacity", 1);

	//Append lines to bubbles that will be used to show the precise data points
	//vertical line
	wrapper.append("g")
		.attr("class", "guide")
		.append("line")
			.attr("x1", element.attr("cx"))
			.attr("x2", element.attr("cx"))
			.attr("y1", 0) //+element.attr("cy"))
			.attr("y2", (height))
			.style("stroke", element.style("fill"))
			.style("opacity",  0)
			.style("pointer-events", "none")
			.transition().duration(200)
			.style("opacity", 0.5);
	//horizontal line
	wrapper.append("g")
		.attr("class", "guide")
		.append("line")
			.attr("x1", (width))//+element.attr("cx"))
			.attr("x2", 0)
			.attr("y1", element.attr("cy"))
			.attr("y2", element.attr("cy"))
			.style("stroke", element.style("fill"))
			.style("opacity",  0)
			.style("pointer-events", "none")
			.transition().duration(200)
			.style("opacity", 0.5);
}//function showTooltip

//iFrame handler
var pymChild = new pym.Child();
pymChild.sendHeight()
setTimeout(function() { pymChild.sendHeight(); },5000);
