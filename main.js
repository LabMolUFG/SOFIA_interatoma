// Carregar dados JSON
d3.json("dados_biologicos.json").then(function (data) {

    // Converter dados para hierarquia
    function convertDataToHierarchy(data) {
        let hierarchy = {
            name: "Proteinas",
            children: []
        };

        // Usar um mapa para rastrear SMILES únicos
        let smilesMap = {};
        let proteins = []; // Variável para armazenar todas as proteínas
        let smilesList = []; // Variável para armazenar todos os SMILES

        // Criar hierarquia de proteínas para SMILES
        for (let protein in data) {
            proteins.push(protein); // Armazenar a proteína na lista de proteínas
            let proteinNode = {
                name: protein,
                children: []
            };

            data[protein].forEach(smiles => {
                if (!smilesMap[smiles]) {
                    // Criar o nó SMILES se não existir e adicionar à lista de SMILES
                    smilesMap[smiles] = { name: smiles };
                    smilesList.push(smiles); // Armazenar o SMILE na lista de SMILES
                }
            });

            hierarchy.children.push(proteinNode); // Adicionar a proteína à hierarquia
        }

        // Adicionar SMILES únicos aos nós de proteínas correspondentes
        for (let smiles in smilesMap) {
            let smilesNode = { name: smiles };

            // Adicionar os SMILES às proteínas corretas
            for (let proteinNode of hierarchy.children) {
                if (data[proteinNode.name].includes(smiles)) {
                    proteinNode.children.push(smilesNode);
                }
            }
        }

        let smilesToProteins = {}; // Mapa reverso de SMILES para proteínas

        // Preencher o mapa reverso
        for (let protein in data) {
            data[protein].forEach(smiles => {
                if (!smilesToProteins[smiles]) {
                    smilesToProteins[smiles] = [];
                }
                smilesToProteins[smiles].push(protein); // Adicionar a proteína associada ao SMILES
            });
        }

        //console.log("Proteins:", proteins);
        //console.log("SMILES:", smilesList);
        //console.log("Hierarchy:", hierarchy);
        return { hierarchy, proteins, smilesList, smilesToProteins }; // Retornar a hierarquia e as listas de proteínas e SMILES
    }

    function sanitizeSmiles(smiles) {
        smiles = smiles.replace(/[\\*?:"<>|]/g, '_');
        smiles = smiles.replace(/[\\/]/g, '-');
        console.log(smiles)
        return smiles;
    }


    // Função para destacar conexões ao passar o mouse
    function highlightConnections(d, type, event) {
        //console.log("Highlighting connections for:", d, "Type:", type);

        if (type === "protein") {
            let connectedLinks = links.filter(link => link.source.name === d);

            d3.selectAll(".link")
                .style("stroke", function (l) {
                    return l.source.name === d ? "blue" : "#ccc";
                })
                .style("stroke-width", function (l) {
                    return l.source.name === d ? 4 : 1.5;
                })
                .style("stroke-opacity", function (l) {
                    return l.source.name === d ? 0.7 : 0.1;
                });

            d3.selectAll(".protein-node circle")
                .style("fill", function (protein) {
                    return connectedLinks.some(link => link.source.name === protein) ? "yellow" : "blue";
                });

            d3.selectAll(".smiles-node circle")
                .style("fill", function (smiles) {
                    return connectedLinks.some(link => link.target.name === smiles) ? "yellow" : "red";
                });

        } else if (type === "smiles") {
            let connectedLinks = links.filter(link => link.target.name === d);

            d3.selectAll(".link")
                .style("stroke", function (l) {
                    return l.target.name === d ? "darkred" : "#ccc";
                })
                .style("stroke-width", function (l) {
                    return l.target.name === d ? 4 : 1.5;
                })
                .style("stroke-opacity", function (l) {
                    return l.target.name === d ? 0.7 : 0.2;
                });

            d3.selectAll(".smiles-node circle")
                .style("fill", function (smiles) {
                    return connectedLinks.some(link => link.target.name === smiles) ? "yellow" : "red";
                });

            d3.selectAll(".protein-node circle")
                .style("fill", function (protein) {
                    return connectedLinks.some(link => link.source.name === protein) ? "yellow" : "blue";
                });
        }
    }

    // Função para exibir a imagem ao clicar
    function showImageOnClick(d) {
        //console.log("Click on SMILES:", d); // Log ao clicar no SMILES

        let smileSanitizado = sanitizeSmiles(d)
        //console.log(smileSanitizado)

        // Exibir a imagem do SMILES
        const imagePath = `imagens/${smileSanitizado}.png`;  // Caminho da imagem com o nome do SMILES
        const imageContainer = document.getElementById("smiles-image-container");
        const imageElement = document.getElementById("smiles-image");

        imageElement.src = imagePath;
        imageContainer.style.display = "block";

        // Ajustar a posição do container centralizado no topo da tela
        d3.select("#smiles-image-container")
            .style("left", "50%")  // Centraliza horizontalmente
            .style("top", "10px")  // Define a distância do topo da tela
            .style("transform", "translateX(-50%)");  // Garante que a centralização seja exata

        // Ajustar a imagem dentro do container
        d3.select("#smiles-image")
            .style("border", "0.1rem solid black")  // Adiciona uma borda preta à imagem
            .style("width", "8rem")  // Define a largura da imagem
            .style("height", "auto");  // Mantém a proporção original da altura



    }

    // Função para remover o destaque ao sair do nó
    function removeHighlight() {
        //console.log("Mouse out");

        d3.selectAll(".link")
            .style("stroke-opacity", 0.4)
            .style("stroke", "green")
            .style("stroke-width", 1.5);

        d3.selectAll(".smiles-node circle")
            .style("fill", "red");

        d3.selectAll(".protein-node circle")
            .style("fill", "blue");

        // Esconder a imagem
        const imageContainer = document.getElementById("smiles-image-container");
        imageContainer.style.display = "none";
    }

    // Configuração do gráfico
    const width = 3000;
    const height = 3000;
    const radius = Math.min(width, height) / 2.2;

    const svg = d3.select("#wheel")
        .attr("viewBox", `0 0 ${width} ${height}`)
        .attr("width", "100%")
        .attr("height", "100%")
        .call(d3.zoom().on("zoom", function (event) {
            svgGroup.attr("transform", event.transform);  // Aplicar as transformações de zoom
        }));

    // Grupo principal onde os nós e links serão desenhados
    const svgGroup = svg.append("g")
        .attr("transform", `translate(${width / 2},${height / 2})`);

    // Criar o cluster de hierarquia
    const cluster = d3.cluster()
        .size([360, radius - 500]);

    // Converter dados e extrair as variáveis necessárias
    const { hierarchy, proteins, smilesList, smilesToProteins } = convertDataToHierarchy(data);

    const root = d3.hierarchy(hierarchy);
    cluster(root);

    // Criar os links e armazenar os dados na variável global `links`
    links = createLinksData(hierarchy);
    //console.log(links)
    // Função para criar os nós das proteínas
    function createProteinNodes() {
        const proteinGroup = svgGroup.append("g")
            .classed("proteins", true);

        const proteinNodes = proteinGroup.selectAll(".protein-node")
            .data(proteins)
            .enter().append("g")
            .attr("class", "protein-node")
            .attr("transform", (d, i) => {
                const [x, y] = project(i * (360 / proteins.length), radius - 300);
                return `translate(${x},${y})`;
            })
            .on("mouseover", function (event, d) {
                //console.log("Mouse over protein:", d); // Log ao passar o mouse sobre a proteína
                highlightConnections(d, "protein"); // Destacar as conexões para a proteína
            })
            .on("mouseout", removeHighlight);  // Remover o destaque ao sair do nó

        proteinNodes.append("circle")
            .attr("r", 5)
            .attr("fill", "blue");

        proteinNodes.append("text")
            .attr("dy", "0.31em")
            .attr("transform", (d, i) => {
                const angle = i * (360 / proteins.length);
                return `rotate(${angle - 90}) translate(10,0) ${angle > 180 ? "rotate(180)" : ""}`;
            })
            .style("text-anchor", d => {
                const angle = proteins.indexOf(d) * (360 / proteins.length);
                return angle > 180 ? "end" : "start";
            })
            .style("font-size", "10px")
            .style("font-weight", "bold")
            .style("fill", "#000080")
            .text(d => d);
    }

    // Função para criar os nós de SMILES
    function createSmilesNodes() {
        const smilesGroup = svgGroup.append("g")
            .classed("smiles", true);

        const smilesNodes = smilesGroup.selectAll(".smiles-node")
            .data(smilesList)
            .enter().append("g")
            .attr("class", "smiles-node")
            .attr("transform", (d, i) => {
                const [x, y] = project(i * (360 / smilesList.length), radius - 50);
                return `translate(${x},${y})`;
            })
            .on("mouseover", function (event, d) {
                //console.log("Mouse over SMILES:", d); // Log ao passar o mouse sobre o SMILES
                highlightConnections(d, "smiles", event); // Destacar as conexões para o SMILE
            })
            .on("click", function (event, d) {
                showImageOnClick(d); // Exibir a imagem ao clicar no SMILE
            })
            .on("mouseout", removeHighlight);  // Remover o destaque ao sair do nó

        smilesNodes.append("circle")
            .attr("r", 5)
            .attr("fill", "red");

        smilesNodes.append("text")
            .attr("dy", "0.31em")
            .attr("transform", (d, i) => {
                const angle = i * (360 / smilesList.length);
                return `rotate(${angle - 90}) translate(10,0) ${angle > 180 ? "rotate(180)" : ""}`;
            })
            .style("text-anchor", d => {
                const angle = smilesList.indexOf(d) * (360 / smilesList.length);
                return angle > 180 ? "end" : "start";
            })
            .style("font-size", "10px")
            .style("font-weight", "bold")
            .style("fill", "#800000")
            .text(d => d);
    }

    // Função para criar os dados dos links entre os nós
    function createLinksData(hierarchy) {
        var links = [];

        // Percorrer todas as proteínas na hierarquia
        hierarchy.children.forEach(proteinNode => {
            // Para cada SMILES dentro da proteína, adicionar um link
            proteinNode.children.forEach(smilesNode => {
                let proteinIndex = proteins.indexOf(proteinNode.name);
                let smilesIndex = smilesList.indexOf(smilesNode.name);

                if (proteinIndex !== -1 && smilesIndex !== -1) {
                    // Adicionar o link com a posição das proteínas e SMILES
                    links.push({
                        source: {
                            name: proteinNode.name,
                            index: proteinIndex,  // Índice da proteína
                        },
                        target: {
                            name: smilesNode.name,
                            index: smilesIndex,  // Índice do SMILES
                        }
                    });
                }
            });
        });
        
        return links;
    }
    
    // Função para definir o formato das ligações com curvas mais suaves
    function linkFunction() {
        return function (d) {
            const sourceIndex = d.source.index;
            const targetIndex = d.target.index;

            // Pegar as coordenadas dos nós baseados nos índices
            const [sx, sy] = project(sourceIndex * (360 / proteins.length), radius - 300);
            const [tx, ty] = project(targetIndex * (360 / smilesList.length), radius - 50);

            const pathData = `M${sx},${sy}L${tx},${ty}`;
            return pathData;
        };
    }

    // Função para criar os links entre os nós
    function createLinks() {
        const linksData = createLinksData(hierarchy);  // Gerar os dados dos links com a hierarquia

        svgGroup.append("g")
            .classed("links", true)
            .selectAll("path")
            .data(linksData)  // Usar os dados de links gerados
            .enter().append("path")
            .attr("class", "link")
            .attr("d", linkFunction())  // Aplicar a função de links
            .style("fill", "none")
            .style("stroke-opacity", 0.4)
            .style("stroke", "green")  // Cor padrão para os links
            .style("stroke-width", 1.5);
    }

    // Função para converter um ângulo em coordenadas x e y
    function project(angle, radius) {
        const radians = (angle - 90) * (Math.PI / 180);
        return [radius * Math.cos(radians), radius * Math.sin(radians)];
    }

    // Criar os links, nós de proteínas e nós de SMILES
    createLinks();
    createProteinNodes();
    createSmilesNodes();
});
