module.exports = function(root, data) {
  data = data.Sheet1;
  var element = root.getElementsByClassName('cit')[0]
  var heightOverWidth = 0.52083333333;

  var margin = {top: 30, right: 20, bottom: 30, left: 20},
      width = element.clientWidth - margin.left - margin.right,
      barHeight = 20,
      barWidth = width * .8;

  var i = 0,
      duration = 400,
      root;

  var tree = d3.layout.tree()
      .nodeSize([0, 20]);

  var diagonal = d3.svg.diagonal()
      .projection(function(d) { return [d.y, d.x]; });

  var svg = d3.select(element).append("svg")
      .attr("width", width + margin.left + margin.right)
    .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  var flare = tableToHierarchy(data, 'Parent', 'Item', 'Value');
  flare.x0 = 0;
  flare.y0 = 0;
  update(root = flare);

  function update(source) {

    // Compute the flattened node list. TODO use d3.layout.hierarchy.
    var nodes = tree.nodes(root);

    var height = Math.max(500, nodes.length * barHeight + margin.top + margin.bottom);

    d3.select("svg").transition()
        .duration(duration)
        .attr("height", height);

    d3.select(self.frameElement).transition()
        .duration(duration)
        .style("height", height + "px");

    // Compute the "layout".
    nodes.forEach(function(n, i) {
      n.x = i * barHeight;
    });

    // Update the nodes…
    var node = svg.selectAll("g.node")
        .data(nodes, function(d) { return d.id || (d.id = ++i); });

    var nodeEnter = node.enter().append("g")
        .attr("class", "node")
        .attr("transform", function(d) { return "translate(" + source.y0 + "," + source.x0 + ")"; })
        .style("opacity", 1e-6);

    // Enter any new nodes at the parent's previous position.
    nodeEnter.append("rect")
        .attr("y", -barHeight / 2)
        .attr("height", barHeight)
        .attr("width", barWidth)
        .style("fill", color)
        .on("click", click);

    nodeEnter.append("text")
        .attr("dy", 3.5)
        .attr("dx", 5.5)
        .text(function(d) { return d.name; });

    // Transition nodes to their new position.
    nodeEnter.transition()
        .duration(duration)
        .attr("transform", function(d) { return "translate(" + d.y + "," + d.x + ")"; })
        .style("opacity", 1);

    node.transition()
        .duration(duration)
        .attr("transform", function(d) { return "translate(" + d.y + "," + d.x + ")"; })
        .style("opacity", 1)
      .select("rect")
        .style("fill", color);

    // Transition exiting nodes to the parent's new position.
    node.exit().transition()
        .duration(duration)
        .attr("transform", function(d) { return "translate(" + source.y + "," + source.x + ")"; })
        .style("opacity", 1e-6)
        .remove();

    // Update the links…
    var link = svg.selectAll("path.link")
        .data(tree.links(nodes), function(d) { return d.target.id; });

    // Enter any new links at the parent's previous position.
    link.enter().insert("path", "g")
        .attr("class", "link")
        .attr("d", function(d) {
          var o = {x: source.x0, y: source.y0};
          return diagonal({source: o, target: o});
        })
      .transition()
        .duration(duration)
        .attr("d", diagonal);

    // Transition links to their new position.
    link.transition()
        .duration(duration)
        .attr("d", diagonal);

    // Transition exiting nodes to the parent's new position.
    link.exit().transition()
        .duration(duration)
        .attr("d", function(d) {
          var o = {x: source.x, y: source.y};
          return diagonal({source: o, target: o});
        })
        .remove();

    // Stash the old positions for transition.
    nodes.forEach(function(d) {
      d.x0 = d.x;
      d.y0 = d.y;
    });
  }

  // Toggle children on click.
  function click(d) {
    if (d.children) {
      d._children = d.children;
      d.children = null;
    } else {
      d.children = d._children;
      d._children = null;
    }
    update(d);
  }

  function color(d) {
    return d._children ? "#3182bd" : d.children ? "#c6dbef" : "#fd8d3c";
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