module.exports = function(root, data) {
  data = data.Sheet1;
  var element = root.getElementsByClassName('nsbc')[0]
  var heightOverWidth = 0.52083333333;
  var GROUP_COLUMN = 'State';

  var margin = {top: 20, right: 100, bottom: 30, left: 40},
      width = element.clientWidth - margin.left - margin.right,
      height = (element.clientWidth * heightOverWidth) - margin.top - margin.bottom;

  var x = d3.scale.ordinal()
      .rangeRoundBands([0, width], .1);

  var y = d3.scale.linear()
      .rangeRound([height, 0]);

  var color = d3.scale.ordinal()
      .range(["#98abc5", "#8a89a6", "#7b6888", "#6b486b", "#a05d56", "#d0743c", "#ff8c00"]);

  var xAxis = d3.svg.axis()
      .scale(x)
      .orient("bottom");

  var yAxis = d3.svg.axis()
      .scale(y)
      .orient("left")
      .tickFormat(d3.format(".0%"));

  var svg = d3.select(element).append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
    .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  if (!data) {
    console.log("No Data");
    return;
  }

  color.domain(d3.keys(data[0]).filter(function(key) { return ((key !== GROUP_COLUMN) && (key != 'ages')); }));

  data.forEach(function(d) {
    var y0 = 0;
    d.ages = color.domain().map(function(name) { return {name: name, y0: y0, y1: y0 += +d[name]}; });
    d.ages.forEach(function(d) { d.y0 /= y0; d.y1 /= y0; });
  });

  data.sort(function(a, b) { return b.ages[0].y1 - a.ages[0].y1; });

  x.domain(data.map(function(d) { return d[GROUP_COLUMN]; }));

  svg.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + height + ")")
      .call(xAxis);

  svg.append("g")
      .attr("class", "y axis")
      .call(yAxis);

  var state = svg.selectAll(".state")
      .data(data)
    .enter().append("g")
      .attr("class", "state")
      .attr("transform", function(d) { return "translate(" + x(d[GROUP_COLUMN]) + ",0)"; });

  state.selectAll("rect")
      .data(function(d) { return d.ages; })
    .enter().append("rect")
      .attr("width", x.rangeBand())
      .attr("y", function(d) { return y(d.y1); })
      .attr("height", function(d) { return y(d.y0) - y(d.y1); })
      .style("fill", function(d) { return color(d.name); });

  var legend = svg.select(".state:last-child").selectAll(".legend")
      .data(function(d) { return d.ages; })
    .enter().append("g")
      .attr("class", "legend")
      .attr("transform", function(d) { return "translate(" + x.rangeBand() / 2 + "," + y((d.y0 + d.y1) / 2) + ")"; });

  legend.append("line")
      .attr("x2", 10);

  legend.append("text")
      .attr("x", 13)
      .attr("dy", ".35em")
      .text(function(d) { return d.name; });
};
