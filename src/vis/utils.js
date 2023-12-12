import { updateGraph } from "./net.js";
import { queueRenderPage } from "./pdfView.js";


function DisjointForceDirectedGraph(data) {
    // Specify the dimensions of the chart.
    const width = 900;
    const height = 730;

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
    let svg = d3.create("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("viewBox", [-width / 2, -height / 2, width, height])
        .attr("style", "max-width: 100%; height: auto;");

    var text = null;

    // 在 SVG 容器中定义箭头标记
    svg.append("defs").selectAll("marker")
        .data(links)
        // .data(relations)
        // .data(["end"])
        .enter().append("marker")    // This section adds in the arrows
        .attr("id", d => convertToValidId(`${d.source.id}-${d.target.id}-${d.relation}`))
        // .attr("id", d => d)
        // .attr("id", d => `end`)
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
        .attr("marker-end", d => "url(#" + convertToValidId(`${d.source.id}-${d.target.id}-${d.relation}`) + ")");
    // .attr("marker-end", d => `url(#${d.relation})`);
    // .attr("marker-end", d => `url(#end)`);

    // prevent the default right click menu
    svg.on('contextmenu', function (event) {
        event.preventDefault();
    });

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
        .on("mouseover", function (event, d) {
            // enlarge the node with a smooth transition
            d3.select(this)
                .transition()
                .duration(200)  // duration of the transition in milliseconds
                .attr("r", 24);
        })
        .on("mouseout", function (event, d) {
            // shrink the node with a smooth transition
            d3.select(this)
                .transition()
                .duration(200)  // duration of the transition in milliseconds
                .attr("r", 20);
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
        })
        .on('contextmenu', d3.contextMenu(function (d, i) {
            // prevent default right click menu
            // 根据 d.location 和 d.relation 生成菜单配置
            if (!d.root) {
                return [
                    {
                        title: 'location',
                        children: d.location.map(function (_location) {
                            const location = _location[0];
                            return {
                                title: location,
                                action: function () {
                                    // alert('location: ' + location + ' clicked');
                                    queueRenderPage(location);
                                }
                            };
                        })
                    },

                ];
            }
            else {
                return [
                    {
                        title: 'location',
                        children: d.location.map(function (_location) {
                            const location = _location[0];
                            return {
                                title: location,
                                action: function () {
                                    // alert('location: ' + location + ' clicked');
                                    queueRenderPage(location);
                                }
                            };
                        })
                    },
                    {
                        title: 'relation',
                        children: d.relation_count.map(function (r) {
                            return {
                                title: (r.checked ? '☑ ' : '☐ ') + r.relation + ` (${r.count})`,
                                action: function () {
                                    // Toggle checked state
                                    r.checked = !r.checked;
                                    // Update graph
                                    reduceOpacity(node, link, text, nodes, links);
                                }
                            };
                        }
                        )
                    }];
            }
        }));

    // Add a text for each node.
    text = svg.append("g")
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
        .text(d => {
            if (d.is_entity) {
                return d.id + "\n" + d.location.map(l => l[0]).join(", ");
            }
            else {
                return d.id;
            }
        });

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

    // Keep currentIndex+1 elements in the history
    svgHistory = svgHistory.slice(0, currentIndex + 1);

    // add the svg to the history
    svgHistory.push(svg.node());
    currentIndex++;

    return svg.node();
}

import searchResults from "./SearchResults.js";

function addSearchBox() {
    var searchBox = d3.select("body").insert("input", "graph")
        .attr("type", "text")
        .attr("placeholder", "Search...")
        .attr("id", "searchBox")
        .style("position", "absolute")
        .style("top", "32px")
        .style("left", "634px");

    searchBox.on("input", function () {
        var searchTerm = this.value;
        // fuzzy search
        var result = fuzzySearch(searchTerm);
        // update search results
        var searchResultsComponent = ReactDOM.render(React.createElement(searchResults), document.getElementById('searchResults'));
        searchResultsComponent.updateResults(result);
    });
}

function addSearchResults() {
    var searchResults = d3.select("body").insert("div", "graph")
        .attr("id", "searchResults")
        .style("position", "absolute")
        .style("top", "64px")
        .style("left", "634px")
        .style("overflow", "auto")
        .style("background-color", "#e0e0e0") // Light background color
        .style("border", "1px solid #ddd") // Border around the div
        // .style("padding", "10px") // Space between border and content
        // .style("margin-bottom", "10px") // Space between each search result
        .style("line-height", "1.5") // Space between lines of text
        .style("border-radius", "5px"); // Rounded corners
}

function fuzzySearch(searchTerm) {
    // search for the searchTerm in params.allNodeIds, which is an array of all node ids
    // keep the top 5 results
    // use fuse.js
    const allNodeIds = params.allNodeIds;
    var options = {
        shouldSort: true,
        includeScore: true,
        threshold: 0.6,
        location: 0,
        distance: 100,
        maxPatternLength: 32,
        minMatchCharLength: 1,
    };
    var fuse = new Fuse(allNodeIds, options);
    var result = fuse.search(searchTerm);

    // Keep the top 5 results
    result = result.slice(0, 5);

    return result;
}

addSearchResults();
addSearchBox();

function addForwardsAndBackwardsButtons() {
    // Add buttons for forwards and backwards
    var forwardsButton = document.createElement("button");
    forwardsButton.innerHTML = `<i id="forwardsButton" class="fas fa-arrow-right"></i>`;
    forwardsButton.onclick = function () {
        if (currentIndex < svgHistory.length - 1) {
            document.getElementById("graph").innerHTML = "";
            document.getElementById("graph").appendChild(svgHistory[++currentIndex]);
        }
        updateButtons();
    };
    document.body.appendChild(forwardsButton);

    var backwardsButton = document.createElement("button");
    backwardsButton.innerHTML = `<i id="backwardsButton" class="fas fa-arrow-left"></i>`;
    backwardsButton.onclick = function () {
        if (currentIndex > 0) {
            document.getElementById("graph").innerHTML = "";
            document.getElementById("graph").appendChild(svgHistory[--currentIndex]);
        }
        updateButtons();
    };
    document.body.appendChild(backwardsButton);

    // add style
    forwardsButton.style.position = "absolute";
    forwardsButton.style.left = "60%";
    forwardsButton.style.top = "4.7%";
    forwardsButton.firstChild.style.color = "lightgray";
    backwardsButton.style.position = "absolute";
    backwardsButton.style.left = "58%";
    backwardsButton.style.top = "4.7%";
    backwardsButton.firstChild.style.color = "lightgray";
}

addForwardsAndBackwardsButtons();

function updateButtons() {
    // Change the color of the arrow icon
    document.getElementById("forwardsButton").style.color = currentIndex < svgHistory.length - 1 ? "black" : "lightgray";
    document.getElementById("backwardsButton").style.color = currentIndex > 0 ? "black" : "lightgray";
}

function reduceOpacity(node, link, text, nodes, links) {
    // find the root node
    const root = nodes.find(d => d.root);
    // find the item "others"
    const others = root.relation_count.find(r => r.relation === "others");
    const all_relations = root.relation_count.map(r => r.relation);
    // find the checked relations
    const checked_relations = root.relation_count.filter(r => r.checked).map(r => r.relation);
    // filter links with checked relations
    const filtered_links = links.filter(l => checked_relations.includes(l.relation));
    // filter links with relation not in root.relation_count
    const filtered_links2 = links.filter(l => !root.relation_count.map(r => r.relation).includes(l.relation));
    if (root.relation_count.length > 3 && others.checked) {
        filtered_links.push(...filtered_links2);
    }
    // set opacity
    link.transition()
        .duration(200)
        .attr("stroke-opacity", d => filtered_links.includes(d) ? 0.6 : 0.1);

    // collect nodes with checked relations
    const filtered_nodes = new Set();
    filtered_links.forEach(l => {
        filtered_nodes.add(l.source);
        filtered_nodes.add(l.target);
    });

    // set opacity
    node.transition()
        .duration(200)
        .attr("opacity", d => (filtered_nodes.has(d) || d.root) ? 1 : 0.1);

    text.transition()
        .duration(200)
        .attr("opacity", d => (filtered_nodes.has(d) || d.root) ? 1 : 0.1);

    // change the opacity of markders
    d3.selectAll("marker")
        .transition()
        .duration(200)
        .attr("fill-opacity", d => {
            console.log(`${d.source.id}_${d.target.id}_${d.relation}`);
            return filtered_links.includes(d) ? 1 : 0.1
        });
}

function convertToValidId(str) {
    // Replace all non-alphanumeric characters, excluding hyphen and colon, with underscore
    return str.replace(/[^a-zA-Z0-9\-:]/g, '_');
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


export { DisjointForceDirectedGraph, turnToPage, updateButtons };