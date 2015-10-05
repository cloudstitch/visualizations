module.exports = function(root, rawdata) {

  rawdata = rawdata.Sheet1;
  var element = root.getElementsByClassName('ztm')[0]
  var heightOverWidth = 0.52083333333;

  var margin = {top: 30, right: 120, bottom: 0, left: 120},
      w = element.clientWidth - margin.left - margin.right,
      h = (element.clientWidth * heightOverWidth) - margin.top - margin.bottom,
      x = d3.scale.linear().range([0, w]),
      y = d3.scale.linear().range([0, h]),
      color = d3.scale.category10(),
      root,
      node;

  var treemap = d3.layout.treemap()
      .round(false)
      .size([w, h])
      .sticky(true)
      .value(function(d) { return d.size; });

  var svg = d3.select(element).append("div")
      .attr("class", "chart")
      .style("width", w + "px")
      .style("height", h + "px")
    .append("svg:svg")
      .attr("width", w)
      .attr("height", h)
    .append("svg:g")
      .attr("transform", "translate(.5,.5)");

  var data = tableToHierarchy(rawdata, 'Parent', 'Item', 'Value');
  node = root = data; 
  var nodes = treemap.nodes(root)
    .filter(function(d) { return !d.children; });

  var cell = svg.selectAll("g")
      .data(nodes)
    .enter().append("svg:g")
      .attr("class", "cell")
      .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; })
      .on("click", function(d) { return zoom(node == d.parent ? root : d.parent); });

  cell.append("svg:rect")
      .attr("width", function(d) { return d.dx - 1; })
      .attr("height", function(d) { return d.dy - 1; })
      .style("fill", function(d) { return color(d.parent.name); });

  cell.append("svg:text")
      .attr("x", function(d) { return d.dx / 2; })
      .attr("y", function(d) { return d.dy / 2; })
      .attr("dy", ".35em")
      .attr("text-anchor", "middle")
      .text(function(d) { return d.name; })
      .style("opacity", function(d) { d.w = this.getComputedTextLength(); return d.dx > d.w ? 1 : 0; });

  d3.select(window).on("click", function() { zoom(root); });

  treemap.value(size).nodes(root);
  zoom(node);

  // d3.select("select").on("change", function() {
  //   treemap.value(this.value == "size" ? size : count).nodes(root);
  //   zoom(node);
  // });

  function size(d) {
    return d.size;
  }

  function count(d) {
    return 1;
  }

  function zoom(d) {
    var kx = w / d.dx, ky = h / d.dy;
    x.domain([d.x, d.x + d.dx]);
    y.domain([d.y, d.y + d.dy]);

    var t = svg.selectAll("g.cell").transition()
        .duration(d3.event.altKey ? 7500 : 750)
        .attr("transform", function(d) { return "translate(" + x(d.x) + "," + y(d.y) + ")"; });

    t.select("rect")
        .attr("width", function(d) { return kx * d.dx - 1; })
        .attr("height", function(d) { return ky * d.dy - 1; })

    t.select("text")
        .attr("x", function(d) { return kx * d.dx / 2; })
        .attr("y", function(d) { return ky * d.dy / 2; })
        .style("opacity", function(d) { return kx * d.dx > d.w ? 1 : 0; });

    node = d;
    d3.event.stopPropagation();
  }
}

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

  function setTotal(node) {
    if (node.children) {
      var t = 0;
      for (var child in node.children) {
        child = node.children[child];
        setTotal(child);
        t += child.zize;
      }
      node.size = t;
    }
  }
  setTotal(ret);
  return ret;
}