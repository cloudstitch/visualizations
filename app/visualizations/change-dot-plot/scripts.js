module.exports = function(root, data) {
  data = data.Sheet1;
  var VALUE1_LABEL_PREFIX = " Before";
  var VALUE2_LABEL_PREFIX = " After";
  var CALL_ATTENTION_TO = "The World";
  var X_AXIS_LABEL = "Percent";

  var element = root.getElementsByClassName('change-dot-plot')[0];

  var heightOverWidth = 0.5;
  var margin = {top: 20, right: 20, bottom: 30, left: 40},
      width = element.clientWidth - margin.left - margin.right,
      height = (element.clientWidth * heightOverWidth) - margin.top - margin.bottom;

  var widthScale = d3.scale.linear()
            .range([ 0, width]);

  var heightScale = d3.scale.ordinal()
            .rangeRoundBands([ margin.top, height], 0.2);

  var xAxis = d3.svg.axis()
          .scale(widthScale)
          .orient("bottom");

  var yAxis = d3.svg.axis()
          .scale(heightScale)
          .orient("left")
          .innerTickSize([0]);

  var svg = d3.select(element).append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
    .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  data.sort(function(a, b) {
    return d3.descending(+a.Value2, +b.Value2);
  });

  // in this case, i know it's out of 100 because it's percents.
  widthScale.domain([0, 100]);

  // js map: will make a new array out of all the d.Name fields
  heightScale.domain(data.map(function(d) { return d.Name; } ));

  // Make the faint lines from y labels to highest dot
  var linesGrid = svg.selectAll("lines.grid")
    .data(data)
    .enter()
    .append("line");

  linesGrid.attr("class", "grid")
    .attr("x1", margin.left)
    .attr("y1", function(d) {
      return heightScale(d.Name) + heightScale.rangeBand()/2;
    })
    .attr("x2", function(d) {
      return margin.left + widthScale(+d.Value2);

    })
    .attr("y2", function(d) {
      return heightScale(d.Name) + heightScale.rangeBand()/2;
    });

  // Make the dotted lines between the dots

  var linesBetween = svg.selectAll("lines.between")
    .data(data)
    .enter()
    .append("line");

  linesBetween.attr("class", "between")
    .attr("x1", function(d) {
      return margin.left + widthScale(+d.Value1);
    })
    .attr("y1", function(d) {
      return heightScale(d.Name) + heightScale.rangeBand()/2;
    })
    .attr("x2", function(d) {
      return margin.left + widthScale(d.Value2);
    })
    .attr("y2", function(d) {
      return heightScale(d.Name) + heightScale.rangeBand()/2;
    })
    .attr("stroke-dasharray", "5,5")
    .attr("stroke-width", function(d, i) {
      if (i == 7) {
        return "1";
      } else {
        return "0.5";
      }
    });

  // Make the dots for 1990

  var dots1 = svg.selectAll("circle.Value1")
      .data(data)
      .enter()
      .append("circle");

  dots1
    .attr("class", "Value1")
    .attr("cx", function(d) {
      return margin.left + widthScale(+d.Value1);
    })
    .attr("r", heightScale.rangeBand()/2)
    .attr("cy", function(d) {
      return heightScale(d.Name) + heightScale.rangeBand()/2;
    })
    .style("stroke", function(d){
      if (d.Name === CALL_ATTENTION_TO) {
        return "black";
      }
    })
    .style("fill", function(d){
      if (d.Name === CALL_ATTENTION_TO) {
        return "darkorange";
      }
    })
    .append("title")
    .text(function(d) {
      return d.Name + VALUE1_LABEL_PREFIX + ": " + d.Value1;
    });

  var dots2 = svg.selectAll("circle.Value2")
    .data(data)
    .enter()
    .append("circle");

  dots2
    .attr("class", "Value2")
    .attr("cx", function(d) {
      return margin.left + widthScale(+d.Value2);
    })
    .attr("r", heightScale.rangeBand()/2)
    .attr("cy", function(d) {
      return heightScale(d.Name) + heightScale.rangeBand()/2;
    })
    .style("stroke", function(d){
      if (d.Name === "The World") {
        return "black";
      }
    })
    .style("fill", function(d){
      if (d.Name === "The World") {
        return "#476BB2";
      }
    })
    .append("title")
    .text(function(d) {
      return d.Name + VALUE2_LABEL_PREFIX + ": " + d.Value2;
    });

  // add the axes
  svg.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(" + margin.left + "," + height + ")")
    .call(xAxis);

  svg.append("g")
    .attr("class", "y axis")
    .attr("transform", "translate(" + margin.left + ",0)")
    .call(yAxis);

  svg.append("text")
    .attr("class", "xlabel")
    .attr("transform", "translate(" + (margin.left + width / 2) + " ," +
      (height + margin.bottom) + ")")
    .style("text-anchor", "middle")
    .attr("dy", "12")
    .text(X_AXIS_LABEL);

  // Style one of the Y labels bold:

  // a hack that works if you can unravel the selections - to style "The World" bold in the axis label, which is the 8th element:
  var allYAxisLabels = d3.selectAll("g.y.axis g.tick text")[0]; // un-nest array
  d3.select(allYAxisLabels[7]).style("font-weight", "bold");
    // You could also use tick formatting to get a % sign on each axis tick
}