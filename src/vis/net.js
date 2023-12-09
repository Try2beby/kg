const dataDir = "../../data/";
const relationDir = "../../data/relation/";
const graphDir = "../../data/graph/";
const graphFile = "structure_graph.json";

async function loadGraph() {
    let graph = await d3.json(graphDir + graphFile);
    return graph;
}


function initialPlot(graph) {
    // find the node with id "Deep Learning"
    const root = graph.nodes.find(d => d.id === "Deep Learning");
    // find the links that connect to this node and with relation "parent_content"
    const links = graph.links.filter(l => (l.source === root.id || l.target === root.id) && l.relation === "parent_content");

    // create a new graph with these nodes and links
    const newGraph = {};
    newGraph.links = links;
    // get all the unique nodes in the links
    const nodes = new Set();
    links.forEach(link => {
        nodes.add(link.source);
        nodes.add(link.target);
    });
    newGraph.nodes = [...nodes].map(d => ({ id: d }));
    // set root property for each node
    newGraph.nodes.forEach(node => {
        if (node.id === root.id) {
            node.root = true;
        } else {
            node.root = false;
        }
    });

    // // get two links from the graph for testing
    // const newGraph = {};
    // newGraph.links = graph.links.slice(0, 100);
    // // get all the unique nodes in the links
    // const nodes = new Set();
    // newGraph.links.forEach(link => {
    //     nodes.add(link.source);
    //     nodes.add(link.target);
    // });
    // newGraph.nodes = [...nodes].map(d => ({ id: d }));

    // plot the graph
    let svg = DisjointForceDirectedGraph(newGraph);
    document.getElementById("graph").appendChild(svg);
}

async function main() {
    const graph = await loadGraph();
    initialPlot(graph);
}

main();