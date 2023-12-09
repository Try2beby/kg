function DisjointForceDirectedGraph(data) {
    // Specify the dimensions of the chart.
    const width = 800;
    const height = 750;

    // Specify the color scale.
    const color = d3.scaleOrdinal(d3.schemeCategory10);

    // The force simulation mutates links and nodes, so create a copy
    // so that re-evaluating this cell produces the same result.
    const links = data.links.map(d => ({ ...d }));
    const nodes = data.nodes.map(d => ({ ...d }));

    // Create a simulation with several forces.
    const simulation = d3.forceSimulation(nodes)
        .force("link", d3.forceLink(links).id(d => d.id).distance(200))
        .force("charge", d3.forceManyBody().strength(-450))
        .force("x", d3.forceX())
        .force("y", d3.forceY());

    // Create the SVG container.
    const svg = d3.create("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("viewBox", [-width / 2, -height / 2, width, height])
        .attr("style", "max-width: 100%; height: auto;");

    // 在 SVG 容器中定义箭头标记
    svg.append("defs").selectAll("marker")
        .data(["end"])      // Different link/path types can be defined here
        .enter().append("marker")    // This section adds in the arrows
        .attr("id", String)
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", 25)  // Increase this value to move the arrow away from the node
        .attr("refY", -1.5)
        .attr("markerWidth", 14)
        .attr("markerHeight", 14)
        .attr("orient", "auto")
        .append("path")
        .attr("d", "M0,-5L10,0L0,5");

    // Add a line for each link, and a circle for each node.
    const link = svg.append("g")
        .attr("stroke", "#999")
        .attr("stroke-opacity", 10)
        .selectAll("line")
        .data(links)
        .join("line")
        .attr("stroke-width", d => Math.sqrt(d.value))
        .attr("marker-end", "url(#end)");  // Add this line

    const node = svg.append("g")
        .attr("stroke", "#fff")
        .attr("stroke-width", 1.5)
        .selectAll("circle")
        .data(nodes)
        .join("circle")
        .attr("r", 20)
        .attr("fill", d => {
            if (d.root) {
                return "#3532af";
            } else {
                return "#2b9999";
            }

        });
    // add color according to root or not

    // Add a text for each node.
    const text = svg.append("g")
        .attr("stroke", "#333")
        .attr("stroke-width", 0.5)
        .selectAll("text")
        .data(nodes)
        .join("text")
        .attr("dx", 22)
        .attr("dy", ".35em")
        .text(d => {
            const maxLength = 15;  // Set your desired maximum length here
            if (d.id.length > maxLength) {
                return `${d.id.substring(0, maxLength)}...`;
            } else {
                return d.id;
            }
        });

    node.append("title")
        .text(d => d.id);

    // Add a drag behavior.
    node.call(d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended));

    // Set the position attributes of links and nodes each time the simulation ticks.
    simulation.on("tick", () => {
        link
            .attr("x1", d => d.source.x)
            .attr("y1", d => d.source.y)
            .attr("x2", d => d.target.x)
            .attr("y2", d => d.target.y);

        node
            .attr("cx", d => d.x)
            .attr("cy", d => d.y);
        text
            .attr("x", d => d.x)
            .attr("y", d => d.y);
    });

    // Reheat the simulation when drag starts, and fix the subject position.
    function dragstarted(event) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        event.subject.fx = event.subject.x;
        event.subject.fy = event.subject.y;
    }

    // Update the subject (dragged node) position during drag.
    function dragged(event) {
        event.subject.fx = event.x;
        event.subject.fy = event.y;
    }

    // Restore the target alpha so the simulation cools after dragging ends.
    // Unfix the subject position now that it’s no longer being dragged.
    function dragended(event) {
        if (!event.active) simulation.alphaTarget(0);
        event.subject.fx = null;
        event.subject.fy = null;
    }

    // When this cell is re-run, stop the previous simulation. (This doesn’t
    // really matter since the target alpha is zero and the simulation will
    // stop naturally, but it’s a good practice.)
    // invalidation.then(() => simulation.stop());

    return svg.node();
}