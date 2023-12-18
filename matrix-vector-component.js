class MatrixVectorComponent extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this._matrix = [[1, 2], [3, 4]];
        this._vector = [5, 6];
    }

    connectedCallback() {
        this.render();
        this.setupListeners();
    }

    render() {
        this.shadowRoot.innerHTML = `
        <style>
            .matrix-vector-container {
                display: flex;
                align-items: center;
                font-family: 'Times New Roman', Times, serif;
            }

            .matrix-container, .vector-container {
                display: flex;
                align-items: center;
            }

            .matrix {
                display: grid;
                grid-template-columns: repeat(2, auto);
            }

            .bracket {
                font-size: 2em;
                user-select: none;
            }

            input {
                font-family: inherit;
                width: 40px;
                text-align: center;
                border: none;
                background-color: transparent;
                font-size: 1.2em;
                outline: none;
                padding: 0;
            }

            .matrix-cell, .vector-cell {
                display: flex;
                justify-content: center;
                align-items: center;
            }
        </style>
        <div class="matrix-vector-container">
            <div class="matrix-container">
                <div class="bracket">(</div>
                <div class="matrix">
                    ${this._matrix.map((row, i) => row.map((val, j) => 
                        `<div class="matrix-cell">
                            <input id="m${i}${j}" type="number" value="${val}">
                        </div>`
                    ).join('')).join('')}
                </div>
                <div class="bracket">)</div>
            </div>
            <div class="vector-container">
                <div class="bracket">[</div>
                <div class="vector">
                    ${this._vector.map((val, i) => 
                        `<div class="vector-cell">
                            <input id="v${i}" type="number" value="${val}">
                        </div>`
                    ).join('')}
                </div>
                <div class="bracket">]</div>
            </div>
        </div>`;
    }

    setupListeners() {
        for (let i = 0; i < this._matrix.length; i++) {
            for (let j = 0; j < this._matrix[i].length; j++) {
                this.shadowRoot.getElementById(`m${i}${j}`).addEventListener('input', (event) => {
                    this._matrix[i][j] = parseFloat(event.target.value);
                    this.dispatchEvent(new CustomEvent('change', { detail: { matrix: this._matrix, vector: this._vector } }));
                });
            }
        }

        for (let i = 0; i < this._vector.length; i++) {
            this.shadowRoot.getElementById(`v${i}`).addEventListener('input', (event) => {
                this._vector[i] = parseFloat(event.target.value);
                this.dispatchEvent(new CustomEvent('change', { detail: { matrix: this._matrix, vector: this._vector } }));
            });
        }
    }

    get matrix() {
        return this._matrix;
    }

    set matrix(newMatrix) {
        this._matrix = newMatrix;
        this.render();
    }

    get vector() {
        return this._vector;
    }

    set vector(newVector) {
        this._vector = newVector;
        this.render();
    }
}

customElements.define('matrix-vector', MatrixVectorComponent);
