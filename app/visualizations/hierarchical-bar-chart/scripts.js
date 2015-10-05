module.exports = function(root, data) {
  data = data.Sheet1;
  var element = root.getElementsByClassName('hbc')[0]
  var heightOverWidth = 0.52083333333;

  var margin = {top: 30, right: 120, bottom: 0, left: 120},
      width = element.clientWidth - margin.left - margin.right,
      height = (element.clientWidth * heightOverWidth) - margin.top - margin.bottom;

  var x = d3.scale.linear()
      .range([0, width]);

  var barHeight = 20;

  var color = d3.scale.ordinal()
      .range(["steelblue", "#ccc"]);

  var duration = 750,
      delay = 25;

  var partition = d3.layout.partition()
      .value(function(d) { return d.size; });

  var xAxis = d3.svg.axis()
      .scale(x)
      .orient("top");

  var svg = d3.select(element).append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
    .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  svg.append("rect")
      .attr("class", "background")
      .attr("width", width)
      .attr("height", height)
      .on("click", up);

  svg.append("g")
      .attr("class", "x axis");

  svg.append("g")
      .attr("class", "y axis")
    .append("line")
      .attr("y1", "100%");

  var root = tableToHierarchy(data, 'Parent', 'Item', 'Value');
  partition.nodes(root);
  x.domain([0, root.value]).nice();
  down(root, 0);

  function down(d, i) {
    if (!d.children || this.__transition__) return;
    var end = duration + d.children.length * delay;

    // Mark any currently-displayed bars as exiting.
    var exit = svg.selectAll(".enter")
        .attr("class", "exit");

    // Entering nodes immediately obscure the clicked-on bar, so hide it.
    exit.selectAll("rect").filter(function(p) { return p === d; })
        .style("fill-opacity", 1e-6);

    // Enter the new bars for the clicked-on data.
    // Per above, entering bars are immediately visible.
    var enter = bar(d)
        .attr("transform", stack(i))
        .style("opacity", 1);

    // Have the text fade-in, even though the bars are visible.
    // Color the bars as parents; they will fade to children if appropriate.
    enter.select("text").style("fill-opacity", 1e-6);
    enter.select("rect").style("fill", color(true));

    // Update the x-scale domain.
    x.domain([0, d3.max(d.children, function(d) { return d.value; })]).nice();

    // Update the x-axis.
    svg.selectAll(".x.axis").transition()
        .duration(duration)
        .call(xAxis);

    // Transition entering bars to their new position.
    var enterTransition = enter.transition()
        .duration(duration)
        .delay(function(d, i) { return i * delay; })
        .attr("transform", function(d, i) { return "translate(0," + barHeight * i * 1.2 + ")"; });

    // Transition entering text.
    enterTransition.select("text")
        .style("fill-opacity", 1);

    // Transition entering rects to the new x-scale.
    enterTransition.select("rect")
        .attr("width", function(d) { return x(d.value); })
        .style("fill", function(d) { return color(!!d.children); });

    // Transition exiting bars to fade out.
    var exitTransition = exit.transition()
        .duration(duration)
        .style("opacity", 1e-6)
        .remove();

    // Transition exiting bars to the new x-scale.
    exitTransition.selectAll("rect")
        .attr("width", function(d) { return x(d.value); });

    // Rebind the current node to the background.
    svg.select(".background")
        .datum(d)
      .transition()
        .duration(end);

    d.index = i;
  }

  function up(d) {
    if (!d.parent || this.__transition__) return;
    var end = duration + d.children.length * delay;

    // Mark any currently-displayed bars as exiting.
    var exit = svg.selectAll(".enter")
        .attr("class", "exit");

    // Enter the new bars for the clicked-on data's parent.
    var enter = bar(d.parent)
        .attr("transform", function(d, i) { return "translate(0," + barHeight * i * 1.2 + ")"; })
        .style("opacity", 1e-6);

    // Color the bars as appropriate.
    // Exiting nodes will obscure the parent bar, so hide it.
    enter.select("rect")
        .style("fill", function(d) { return color(!!d.children); })
      .filter(function(p) { return p === d; })
        .style("fill-opacity", 1e-6);

    // Update the x-scale domain.
    x.domain([0, d3.max(d.parent.children, function(d) { return d.value; })]).nice();

    // Update the x-axis.
    svg.selectAll(".x.axis").transition()
        .duration(duration)
        .call(xAxis);

    // Transition entering bars to fade in over the full duration.
    var enterTransition = enter.transition()
        .duration(end)
        .style("opacity", 1);

    // Transition entering rects to the new x-scale.
    // When the entering parent rect is done, make it visible!
    enterTransition.select("rect")
        .attr("width", function(d) { return x(d.value); })
        .each("end", function(p) { if (p === d) d3.select(this).style("fill-opacity", null); });

    // Transition exiting bars to the parent's position.
    var exitTransition = exit.selectAll("g").transition()
        .duration(duration)
        .delay(function(d, i) { return i * delay; })
        .attr("transform", stack(d.index));

    // Transition exiting text to fade out.
    exitTransition.select("text")
        .style("fill-opacity", 1e-6);

    // Transition exiting rects to the new scale and fade to parent color.
    exitTransition.select("rect")
        .attr("width", function(d) { return x(d.value); })
        .style("fill", color(true));

    // Remove exiting nodes when the last child has finished transitioning.
    exit.transition()
        .duration(end)
        .remove();

    // Rebind the current parent to the background.
    svg.select(".background")
        .datum(d.parent)
      .transition()
        .duration(end);
  }

  // Creates a set of bars for the given data node, at the specified index.
  function bar(d) {
    var bar = svg.insert("g", ".y.axis")
        .attr("class", "enter")
        .attr("transform", "translate(0,5)")
      .selectAll("g")
        .data(d.children)
      .enter().append("g")
        .style("cursor", function(d) { return !d.children ? null : "pointer"; })
        .on("click", down);

    bar.append("text")
        .attr("x", -6)
        .attr("y", barHeight / 2)
        .attr("dy", ".35em")
        .style("text-anchor", "end")
        .text(function(d) { return d.name; });

    bar.append("rect")
        .attr("width", function(d) { return x(d.value); })
        .attr("height", barHeight);

    return bar;
  }

  // A stateful closure for stacking bars horizontally.
  function stack(i) {
    var x0 = 0;
    return function(d) {
      var tx = "translate(" + x0 + "," + barHeight * i * 1.2 + ")";
      x0 += x(d.value);
      return tx;
    };
  }
};

function tableToHierarchy(table, parentCol, nameCol, valueCol) {
  var root = [];
  var byName = {};
  var unnamed = 1;

  for (var i = 0; i < table.length; i++) {
    var parent = table[i][parentCol] || null;
    var name = table[i][nameCol];
    if (!name) {
      name = ('unnamed-node-' + unnamed);
      unnamed += 1;
    }
    var size = table[i][valueCol] || 0;
    
    try {
      size = parseFloat(size);
    } catch(e) {
      size = 0;
    }

    var node = {
      parent: parent,
      name: name,
      size: size
    };

    root.push(node);
    byName[node.name] = node;
  }

  // Now we add all parents that weren't nodes.
  var root2 = [];

  for (var i = 0; i < root.length; i++) {
    var node = root[i];
    root2.push(node);
    if ((node.parent) && (! (node.parent in byName))) {
      var newNode = {
        name: node.parent,
        value: 0,
        parent: null
      }
      root2.push(newNode);
      byName[newNode.name] = newNode;
    }
  }

  // OK. Now we've got every node. We can start wiring up children to parents.
  var root3 = [];
  for (var i = 0; i < root2.length; i++) {
    var node = root2[i];
    if (node.parent) {
      if (! byName[node.parent].children) {
        byName[node.parent].children = [];
      }
      byName[node.parent].children.push(node);
    } else {
      // It's a true root!
      root3.push(node);
    }
  }

  // Now we consolidate into one top node.
  var ret;
  if (root3.length == 1) {
    ret = root3[0];
  } else {
    ret = {
      name: "All Nodes",
      children: root3
    }
  }
  
  ret.totalNodeCount = root.length;

  return ret;
}