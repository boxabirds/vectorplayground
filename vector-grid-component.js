class VectorGridComponent extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.vectors = [{ x: 3, y: 3 }, { x: 1, y: 4 }];
        this.gridSize = 10; // Grid range from -10 to 10
    }

    connectedCallback() {
        this.render();
        this.setupDrag();
    }

    render() {
        const svgns = "http://www.w3.org/2000/svg";
        const width = 800; // Width of SVG
        const height = 800; // Height of SVG
        const unit = width / (2 * this.gridSize); // Unit size

        // Create SVG element
        const svg = document.createElementNS(svgns, "svg");
        svg.setAttribute("width", width);
        svg.setAttribute("height", height);
        svg.style.border = "1px solid black"; // For visibility

        // Draw grid lines
        for (let i = -this.gridSize; i <= this.gridSize; i++) {
            const x = width / 2 + i * unit;
            const y = height / 2 + i * unit;

            // Horizontal line
            const hLine = document.createElementNS(svgns, "line");
            hLine.setAttribute("x1", 0);
            hLine.setAttribute("y1", y);
            hLine.setAttribute("x2", width);
            hLine.setAttribute("y2", y);
            hLine.setAttribute("stroke", "#ddd");
            svg.appendChild(hLine);

            // Vertical line
            const vLine = document.createElementNS(svgns, "line");
            vLine.setAttribute("x1", x);
            vLine.setAttribute("y1", 0);
            vLine.setAttribute("x2", x);
            vLine.setAttribute("y2", height);
            vLine.setAttribute("stroke", "#ddd");
            svg.appendChild(vLine);
        }

        // Draw vectors
        this.vectors.forEach(vector => {
            const line = document.createElementNS(svgns, "line");
            line.setAttribute("x1", width / 2);
            line.setAttribute("y1", height / 2);
            line.setAttribute("x2", width / 2 + vector.x * unit);
            line.setAttribute("y2", height / 2 - vector.y * unit);
            line.setAttribute("stroke", "red");
            line.setAttribute("stroke-width", 2);
            svg.appendChild(line);

            const circle = document.createElementNS(svgns, "circle");
            circle.setAttribute("cx", width / 2 + vector.x * unit);
            circle.setAttribute("cy", height / 2 - vector.y * unit);
            circle.setAttribute("r", 5);
            circle.setAttribute("fill", "blue");
            circle.classList.add("draggable");
            svg.appendChild(circle);
        });

        this.shadowRoot.appendChild(svg);
    }

    setupDrag() {
        // Implement draggable functionality
    }
}

customElements.define('vector-grid', VectorGridComponent);
