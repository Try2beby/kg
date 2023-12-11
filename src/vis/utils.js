import { updateGraph } from "./net.js";
import { queueRenderPage } from "./pdfView.js";

function DisjointForceDirectedGraph(data) {
    // Specify the dimensions of the chart.
    const width = 900;
    const height = 880;

    // Specify the color scale.
    const color = d3.scaleOrdinal(d3.schemeCategory10);

    // The force simulation mutates links and nodes, so create a copy
    // so that re-evaluating this cell produces the same result.
    const links = data.links.map(d => ({ ...d }));
    const nodes = data.nodes.map(d => ({ ...d }));

    // Create a simulation with several forces.
    const simulation = d3.forceSimulation(nodes)
        .force("link", d3.forceLink(links).id(d => d.id).distance(250))
        .force("charge", d3.forceManyBody().strength(-550))
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
        .attr("refX", 28)  // Increase this value to move the arrow away from the node
        .attr("refY", 0)
        .attr("markerWidth", 2)
        .attr("markerHeight", 2)
        .attr("orient", "auto")
        .append("path")
        .attr("d", "M0,-5L10,0L0,5");

    // Add a line for each link, and a circle for each node.
    const link = svg.append("g")
        .attr("stroke", "#999")
        .attr("stroke-opacity", 0.6)
        .attr("stroke-width", 5)
        .selectAll("line")
        .data(links)
        .join("line")
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

        })
        .on("click", function (event, d) {

            if (!d.is_entity) {
                // update graph
                updateGraph(d.id);
            }
            else {
                if (d.root) {
                    // initialize click count if it doesn't exist
                    if (!d.clickCount) {
                        d.clickCount = 0;
                    }
                    // get the location based on the click count
                    let locationIndex = d.clickCount % d.location.length;
                    let location = d.location[locationIndex];

                    // update pdf
                    queueRenderPage(location[0]);

                    // increment click count
                    d.clickCount++;
                }
                else {
                    // update graph
                    updateGraph(d.id, d.is_entity);
                }
            }
        });

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

    link.append("title")
        .text(function (d) { return d.relation; });

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

    // clear the svg
    document.getElementById("graph").innerHTML = "";
    document.getElementById("graph").appendChild(svg.node());

    return svg.node();
}

function turnToPage(title) {
    const toc = params.toc;

    let is_chapter = false;
    let info = {};
    // extract chapter number or section number
    // there are 2 cases: 
    // 1 Introduction
    // 2.1 Linear Regression
    const temp = title.split(" ")[0];
    let page = 0;
    if (temp.includes(".")) {
        // section
        const chapter = temp.split(".")[0];
        const section = temp.split(".")[1];
        page = parseInt(toc[chapter]["sections"][parseInt(section) - 1]["page"]) + params.pageOffset;
        const end_page = parseInt(toc[chapter]["sections"][parseInt(section) - 1]["end_page"]) + params.pageOffset;
        info.page = page;
        info.end_page = end_page;
    } else {
        // chapter
        page = parseInt(toc[temp]["page"]) + params.pageOffset;
        is_chapter = true;
    }
    queueRenderPage(page);

    return { is_chapter, info };
}

export { DisjointForceDirectedGraph, turnToPage };