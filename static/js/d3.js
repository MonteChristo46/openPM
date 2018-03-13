function minimalForceDirectedGraph() {

    //Getting width and height of the svg

    var processSection = $("#processSection");
    var width = processSection.width();
    var height = processSection.height();

    d3.select("#discoverySection").selectAll("*").remove(); //clean svg container before new graph is created

    var svg = d3.select("#discoverySection")
        .append("svg")
        .attr("class", "forceDirectedGraph")
        .attr("width", width)
        .attr("height", height);


    d3.json("/data", function (error, json) {
        console.log("D3 script executed with following data: ");
        console.log(json);
        var nodes = json.nodes;
        var links = json.links;
        var values = []; //TODO-fixme data should be normalized!

        //Getting the maximum value/frequency and scale them
        for (var i = 0; i < links.length; i++) {
            var value = links[i].value;
            values.push(value)

        }

        var scale = d3.scaleLog()
            .domain([1, d3.max(values)])
            .range([1, 4]);


        //Setting up the Simulation
        var simulation = d3.forceSimulation().nodes(nodes);
        console.log(simulation);

        simulation
            .force("charge_force", d3.forceManyBody().strength(-700))
            .force("center_force", d3.forceCenter(width / 2, height / 2));

        //Adding a g element for zoom-functionality
        var g = svg.append("g")
            .attr("class", "forceDirectedGraph");

        //Drawing the links first --> They should be under the nodes
        var link = g.append("g")
            .attr("class", "links")
            .selectAll("line")
            .data(links)
            .enter()
            .append("line")
            .attr("stroke-width", function (d) {
                return scale(d.value);
            })
            .style("marker-end", "url(#suit)"); //Added from inserted code below

        //Draw Circles (Nodes) before Circles
        var node = g.append("g")
            .attr("class", "nodes")
            .selectAll("circle")
            .data(nodes)
            .enter();

        node.append("circle")
            .attr("r", 10)
            .attr("fill", "#ef5350");


        node.append("text")
            .attr("dx", 10)
            .attr("dy", ".35em")
            .text(function (d) {
                return d.name
            })
            .style("stroke", "gray");


        //Drawing Links - Challenge: Links doesnt have coordinates we need just targetA to targetB information
        //D3 needs to handle that for us
        //We define a function, which is called on every tick(step) of the simulation

        //start simulation
        simulation.on("tick", onTick);


        //Normally the name of the event is available under the key "id" -> Not in our case
        //We need to change that, so that d3 can read our source and targets

        var link_force = d3.forceLink(links)
            .id(function (d) {
                return d.name;
            });

        //Adding the link_force to the simulation
        simulation.force("links", link_force);


        /*Adding the zoom capability*/
        //Define zoom handler
        var zoom_handler = d3.zoom()
            .on("zoom", zoomActions);

        //Apply zoom handler on SVG
        zoom_handler(svg);


        /*Functions*/
        function onTick() {

            //Node object gets some source and target information

            d3.selectAll("circle").attr("cx", function (d) {
                return d.x;

            })
                .attr("cy", function (d) {
                    return d.y;
                });

            link
                .attr("x1", function (d) {
                    return d.source.x;
                })
                .attr("y1", function (d) {
                    return d.source.y;
                })
                .attr("x2", function (d) {
                    return d.target.x;
                })
                .attr("y2", function (d) {
                    return d.target.y;
                });

            d3.selectAll("text").attr("x", function (d) {
                return d.x;
            })
                .attr("y", function (d) {
                    return d.y;
                });

        };

        function zoomActions() {
            console.log("Zoom should be performed");
            g.attr("transform", d3.event.transform)
        };


        //Inserted from http://jsfiddle.net/simonraper/k2NL5/?utm_source=website&utm_medium=embed&utm_campaign=k2NL5
        svg.append("defs").selectAll("marker")
            .data(["suit", "licensing", "resolved"])
            .enter().append("marker")
            .attr("id", function (d) {
                return d;
            })
            .attr("viewBox", "0 -5 10 10")
            .attr("refX", 25)
            .attr("refY", 0)
            .attr("markerWidth", 6)
            .attr("markerHeight", 6)
            .attr("orient", "auto")
            .append("path")
            .attr("d", "M0,-5L10,0L0,5 L10,0 L0, -5")
            .style("stroke", "#286da8")
            .style("opacity", "0.6");

    });

}

function drawProcessFlow(json_dict) {
    d3.select("#discoverySection").selectAll("*").remove(); //clean svg container before new graph is created

    d3.json(json_dict, function (json) {
        var nodes = json.nodes;
        var links = json.links;

        //Creating Graph Object
        var graph = new dagreD3.graphlib.Graph().setGraph({});

        //Parsing json into graph object
        nodes.forEach(function (node) {
            graph.setNode(node.name, {label: node.name});
        });
        links.forEach(function (link) {
            //Set edge and interpolate it
            graph.setEdge(link.source, link.target, {curve: d3.curveBasis})
        });

        var svg = d3.select("#discoverySection")
            .append("svg")
            .attr("class", "processFlow")
            .attr("width", function () {
                return ($("#discoverySection").width()-50)
            })
            .attr("height", function(){
                 return ($("#discoverySection").height()-50)
            });
        var svgGroup = svg.append('g');

        // Create the renderer
        var render = new dagreD3.render();

        // Run the renderer. This is what draws the final graph.
        // After Rendering Graph gets width and height (graph.graph() -> Returns width and height and)
        // and nodes are getting x and y coordinates
        render(svgGroup, graph);

        // Get Dagre Graph dimensions
        var graphWidth = graph.graph().width + 80;
        var graphHeight = graph.graph().height + 0;

        // Get SVG dimensions
        var width = parseInt(svg.attr("width"));
        var height = parseInt(svg.attr("height"));

        // Calculate applicable scale for zoom
        //TODO check the mathematical background behind this
        var zoomScale = Math.max(Math.min(width / graphWidth, height / graphHeight));

        //Calculate yCenter
        //Graph height needs first to be scaled. Imagine the graph has mor height then the svg
        var xCenterOffset = (svg.attr('width') - (graph.graph().width) * zoomScale) / 2;
        var yCenterOffset = (svg.attr('height') - (graph.graph().height) * zoomScale) / 2;
        svgGroup.attr('transform', 'translate('+xCenterOffset+', ' + yCenterOffset + ')' + ' scale(' + zoomScale + ')');

        //Zoom Handler
        var zoom_handler = d3.zoom()
            .on("zoom", zoom_actions);

        //Give zoom_handler standard values from which he can translater/scale (zoom)
        svg.call(zoom_handler.transform, d3.zoomIdentity.translate(xCenterOffset, yCenterOffset).scale(zoomScale));

        //Call zoom handler on svg
        zoom_handler(svg);

        /*Functions*/
        function zoom_actions() {
            svgGroup.attr("transform", d3.event.transform)
        }
    });
}

function drawProcessFlow_old() {

    //Getting width and height of the svg adding inner margin
    var svg = d3.select("#discoverySection")
        .append("svg")
        .attr("class", "processFlow")
        .attr("width", width)
        .attr("height", height);

    svg.selectAll("*").remove(); //clean svg container before new graph is created

    d3.json("/data", function (error, json) {
        console.log("D3 process flow script executed with following data: ");
        console.log(json);

        var startNodes = json.startNodes;
        var endNodes = json.endNodes;
        var nodes = json.nodes;
        var links = json.links;
        var values = []; //TODO-fixme data should be normalized!

        var nodeWidth = 80;
        var nodeHeight = 50;

        /*PREPROCESSING*/
        //Assign Layer 1 to all start events
        startNodes.forEach(function (sNode) {
            nodes.forEach(function (node) {
                if (node.name === sNode.name) {
                    node.layer = 1; // All nodes, which follow the start event
                }
            })
        });

        function checkLayers() {
            var returnValue = true;
            nodes.forEach(function (node) {
                if (!node.layer) {
                    returnValue = false
                }
            });
            return returnValue;
        }

        //Assign other layers to following events
        function addLayers() {
            nodes.forEach(function (node) {
                //only do this when no layer is already defined
                if (!node.layer) {
                    links.forEach(function (link) {
                        if (node.name === link.target) {
                            var sourceName = link.source;
                            nodes.forEach(function (_node) {
                                if (_node.name === sourceName) {
                                    if (_node.layer) {
                                        node.layer = _node.layer + 1;
                                    }
                                }
                            });
                        }
                    });
                }
            });
        }

        while (!checkLayers()) {
            addLayers()
        }


        function createNodeCoordinates() {

            //Adding Layer into set and convert set to array for sorting --> Ugly to remove duplicates in javascript
            //TODO-fixme common don't be so lazy!
            var layersSet = new Set();
            nodes.forEach(function (node) {
                layersSet.add(node.layer)
            });
            var layers = Array.from(layersSet).sort();

            layers.forEach(function (layer) {
                var i = 0;
                nodes.forEach(function (node) {
                    if (node.layer === layer) {
                        node.X = (svgWidth / 4) * i;
                        node.Y = 100 * layer;
                        i++;
                    }
                });
            });

        }

        function getCoordinates(nodeSource, nodeTarget) {

            var coordinates = new Map();

            //TODO-fixme for loop would be much more efficient because break statement can be used. Imagine you have a lot of nodes.
            nodes.forEach(function (node) {
                if (nodeSource === node.name) {
                    coordinates.set("source", node)
                }
                if (nodeTarget === node.name) {
                    coordinates.set("target", node)
                }
            });

            coordinates.set("sameLayer", false);
            if (coordinates.get("source").layer === coordinates.get("target").layer) {
                coordinates.set("sameLayer", true)
            }
            return coordinates;
        }

        createNodeCoordinates();
        console.log(nodes);
        /*SVG Elements*/

        /*Define new line generator*/
        var lineGenerator = d3.line()
            .curve(d3.curveCardinal);


        //Nodes
        var g = svg.append("g")
            .attr("class", "processFlow");

        var paths = g.append("g")
            .attr("class", "links");

        paths.selectAll("path")
            .data(links)
            .enter()
            .append("path")
            .attr("d", function (d) {
                var coordinates = getCoordinates(d.source, d.target);
                console.log(coordinates);
                var sourceX = coordinates.get("source").X;
                var sourceY = coordinates.get("source").Y;
                var targetX = coordinates.get("target").X;
                var targetY = coordinates.get("target").Y;
                var sourceCoordinates = [sourceX + (nodeWidth / 2), sourceY + (nodeHeight / 2)];

                if (coordinates.get("sameLayer")) {
                    if (targetX < sourceX) {
                        var targetCoordinates = [targetX + nodeWidth, targetY + (nodeHeight / 2)]; //--> sameLayer
                    } else {
                        var targetCoordinates = [targetX, targetY + (nodeHeight / 2)]; //--> sameLayer
                    }
                } else {
                    var targetCoordinates = [targetX + (nodeWidth / 2), targetY]; //--> DifferentLayer
                }

                var pathData = [sourceCoordinates, targetCoordinates];
                console.log(pathData);
                return lineGenerator(pathData);
            })
            .style("marker-end", "url(#suit)");

        var events = g.append("g")
            .attr("class", "nodes");

        var event = events.selectAll("g")
            .data(nodes)
            .enter()
            .append("g")
            .attr("class", function (d) {
                return "layer_" + d.layer;
            });

        event.append("rect")
            .attr("id", function (d) {
                return d.name
            })
            .attr("x", function (d) {
                return d.X
            })
            .attr("y", function (d) {
                return d.Y
            })
            .attr("height", nodeHeight)
            .attr("width", nodeWidth);


        event.append("text")
            .attr("x", function (d) {
                return (d.X + 8)

            })
            .attr("y", function (d) {
                return d.Y + (nodeHeight / 1.8)
            })
            .text(function (d) {
                return d.name
            });


        /*Adding the zoom capability*/
        //Define zoom handler
        var zoom_handler = d3.zoom()
            .on("zoom", zoomActions);

        //Apply zoom handler on SVG
        zoom_handler(svg);

        function zoomActions() {
            g.attr("transform", d3.event.transform)
        };

        svg.append("defs").selectAll("marker")
            .data(["suit", "licensing", "resolved"])
            .enter().append("marker")
            .attr("id", function (d) {
                return d;
            })
            .attr("viewBox", "0 -5 10 10")
            .attr("refX", 10)
            .attr("refY", 0)
            .attr("markerWidth", 6)
            .attr("markerHeight", 6)
            .attr("orient", "auto")
            .append("path")
            .attr("d", "M0,-5L10,0L0,5 L10,0 L0, -5")
            .style("stroke", "#286da8")
            .style("opacity", "0.6");

    });
}

function drawExample() {

    var processSection = $("#processSection");
    var width = processSection.width();
    var height = processSection.height();

    var svg = d3.select("#discoverySection")
        .append("svg")
        .attr("class", "forceDirectedGraph")
        .attr("width", width)
        .attr("height", height);

    /*
    var svg = d3.select("#discoverySection"),
        width = +svg.attr(width),
        height = +svg.attr(height);
        */

    var data = {
        "nodes": [
            {
                "name": "b"
            },
            {
                "name": "d"
            },
            {
                "name": "e"
            },
            {
                "name": "a"
            },
            {
                "name": "c"
            },
            {
                "name": "f"
            }
        ],
        "links": [
            {
                "source": "b",
                "target": "d",
                "frequency": 2
            },
            {
                "source": "f",
                "target": "b",
                "frequency": 2
            },
            {
                "source": "c",
                "target": "d",
                "frequency": 2
            },
            {
                "source": "b",
                "target": "c",
                "frequency": 2
            },
            {
                "source": "a",
                "target": "c",
                "frequency": 2
            },
            {
                "source": "a",
                "target": "b",
                "frequency": 2
            },
            {
                "source": "f",
                "target": "c",
                "frequency": 2
            },
            {
                "source": "b",
                "target": "e",
                "frequency": 2
            },
            {
                "source": "c",
                "target": "e",
                "frequency": 2
            },
            {
                "source": "c",
                "target": "b",
                "frequency": 2
            },
            {
                "source": "e",
                "target": "f",
                "frequency": 2
            }
        ]
    };
    var nodes = data.nodes;
    var links = data.links;


    //Getting the nodes and links of json file

    //Setting up the Simulation
    var simulation = d3.forceSimulation().nodes(nodes);

    simulation
        .force("charge_force", d3.forceManyBody().strength(-1950))
        .force("center_force", d3.forceCenter(width / 2, height / 2));

    //Drawing the links first --> They should be under the nodes
    var link = svg.append("g")
        .attr("class", "links")
        .selectAll("line")
        .data(links)
        .enter()
        .append("line")
        .attr("stroke-width", 2)
        .style("marker-end", "url(#suit)"); //Added from inserted code below

    //Draw Circles (Nodes) before Circles
    var node = svg.append("g")
        .attr("class", "nodes")
        .selectAll("circle")
        .data(nodes)
        .enter();

    node.append("circle")
        .attr("r", 10)
        .attr("fill", "#ef5350");


    node.append("text")
        .attr("dx", 10)
        .attr("dy", ".35em")
        .text(function (d) {
            return d.name
        })
        .style("stroke", "gray");


    //Drawing Links - Challenge: Links doesnt have coordinates we need just targetA to targetB information
    //D3 needs to handle that for us
    //We define a function, which is called on every tick(step) of the simulation

    //start simulation
    simulation.on("tick", onTick);


    //Normally the name of the event is available under the key "id" -> Not in our case
    //We need to change that, so that d3 can read our source and targets

    var link_force = d3.forceLink(links)
        .id(function (d) {
            return d.name;
        });

    //Adding the link_force to the simulation
    simulation.force("links", link_force);


    function onTick() {

        //Node object gets some source and target information

        d3.selectAll("circle").attr("cx", function (d) {
            return d.x;

        })
            .attr("cy", function (d) {
                return d.y;
            });

        link
            .attr("x1", function (d) {
                return d.source.x;
            })
            .attr("y1", function (d) {
                return d.source.y;
            })
            .attr("x2", function (d) {
                return d.target.x;
            })
            .attr("y2", function (d) {
                return d.target.y;
            });

        d3.selectAll("text").attr("x", function (d) {
            return d.x;
        })
            .attr("y", function (d) {
                return d.y;
            });

    };

    //Inserted from http://jsfiddle.net/simonraper/k2NL5/?utm_source=website&utm_medium=embed&utm_campaign=k2NL5
    svg.append("defs").selectAll("marker")
        .data(["suit", "licensing", "resolved"])
        .enter().append("marker")
        .attr("id", function (d) {
            return d;
        })
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", 25)
        .attr("refY", 0)
        .attr("markerWidth", 6)
        .attr("markerHeight", 6)
        .attr("orient", "auto")
        .append("path")
        .attr("d", "M0,-5L10,0L0,5 L10,0 L0, -5")
        .style("stroke", "#286da8")
        .style("opacity", "0.6");

}