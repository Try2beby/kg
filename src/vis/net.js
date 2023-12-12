import { DisjointForceDirectedGraph, turnToPage, updateButtons } from "./utils.js";


async function loadData() {
    params.graph = await d3.json(graphDir + graphFile);
    params.semanticGraph = await d3.json(graphDir + semanticGraphFile);
    params.toc = await d3.json(dataDir + tocFile);
    params.location = await d3.json(relationDir + locationFile);
    let allNodeIds = params.graph.nodes.map(d => d.id);
    allNodeIds = allNodeIds.concat(params.semanticGraph.nodes.map(d => d.id));
    params.allNodeIds = [...new Set(allNodeIds)];

    return;
}

function sortLocation(raw_location) {
    let location = [];
    // sort the location by page number
    if (raw_location) {
        location = [...new Set(raw_location)];
        location.sort((a, b) => {
            return a[0] - b[0];
        });
    }
    return location;
}


function createNewGraph(root, links, is_chapter = true, is_entity = false, result = {}, relation_count = {}) {
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
            node.relation_count = relation_count;
            console.log(relation_count);
            node.is_entity = is_entity;
            if (is_entity) {
                node.location = sortLocation(result[node.id]);
            }
        } else {
            node.root = false;
            // add location info
            if (!is_chapter) {
                node.location = sortLocation(result[node.id]);
                node.is_entity = true;
            }
        }
    });
    return newGraph;
}

function initialPlot(root_id = "Deep Learning", is_chapter = true, is_entity = false, section_info = {}) {
    const graph = params.graph;
    // find the node with id "Deep Learning"
    const root = graph.nodes.find(d => d.id === root_id);
    // find the links that connect to this node and with relation "parent_content"
    // const links = graph.links.filter(l => (l.source === root.id || l.target === root.id) && (l.relation === "parent_content" || l.relation === "prerequisites"));
    if (is_chapter) {
        var links = graph.links.filter(l => (l.source === root.id) && (l.relation === "parent_content" || l.relation === "prerequisites"));
    }
    else {
        var links = graph.links.filter(l => (l.source === root.id) && (l.relation === "include"));
        var result = findEntityInSection(section_info);
    }

    const newGraph = createNewGraph(root, links, is_chapter, is_entity, result);
    DisjointForceDirectedGraph(newGraph);
}

function entityPlot(root_id) {
    console.log(root_id)
    const semanticGraph = params.semanticGraph;
    const graph = params.graph;
    const location = params.location;

    // find the node with id root_id
    let root = graph.nodes.find(d => d.id === root_id);
    try {
        const ans = semanticGraph.nodes.find(d => d.id === root_id);
        if (ans) {
            root = ans;
        }
    }
    catch (e) {
        console.log(e)
    }

    // filter links
    // filter links in graph
    let links = graph.links.filter(l => (l.source === root.id) && (l.relation === "co_presence"));
    // Add links from semantic graph
    links = links.concat(semanticGraph.links.filter(l => (l.source === root.id || l.target === root.id)));

    // count the type of realtions
    const relation_count = {};
    links.forEach(link => {
        if (relation_count[link.relation]) {
            relation_count[link.relation] += 1;
        } else {
            relation_count[link.relation] = 1;
        }
    }
    );
    // 将 relation_count 对象转换为数组
    let relation_array = Object.keys(relation_count).map(key => {
        return { relation: key, count: relation_count[key] };
    });

    // 对数组进行排序
    relation_array.sort((a, b) => b.count - a.count);

    // 取前三个元素
    let top_three = relation_array.slice(0, 3);

    // 计算剩余元素的总数
    let others_count = relation_array.slice(3).reduce((total, item) => total + item.count, 0);

    // 将剩余元素合并为 "others"
    if (others_count > 0) {
        top_three.push({ relation: 'others', count: others_count });
    }
    top_three.forEach(item => {
        item.checked = true;
    });

    const nodes = new Set();
    links.forEach(link => {
        nodes.add(link.source);
        nodes.add(link.target);
    });

    let result = {};
    nodes.forEach(node => {
        result[node] = location[node];
    });
    // let result = nodes.reduce((acc, node) => ({ ...acc, [node]: location[node] }), {});

    const newGraph = createNewGraph(root, links, false, true, result, top_three);
    DisjointForceDirectedGraph(newGraph);
}

function findEntityInSection(section_info) {
    // each element in location is k,v pair, k is entity id, v is a list of locations
    const location = params.location;

    console.log(section_info);
    const { page, end_page } = section_info;

    // filter entities that are in this section
    let result = {};
    for (let entity in location) {
        let occurrences = location[entity];
        let filteredOccurrences = occurrences.filter(([_page, _]) => _page >= page && _page <= end_page);
        if (filteredOccurrences.length > 0) {
            result[entity] = filteredOccurrences;
        }
    }
    return result;
}


function updateGraph(root_id, is_entity = false) {
    if (is_entity) {
        entityPlot(root_id);
    }
    else {
        const { is_chapter, info } = turnToPage(root_id);
        initialPlot(root_id, is_chapter, is_entity, info);
    }
    updateButtons();
}

async function main() {
    await loadData();
    initialPlot();
}

export { initialPlot, updateGraph }

main();