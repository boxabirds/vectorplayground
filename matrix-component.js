class MatrixComponent extends HTMLElement {
    static get observedAttributes() {
        return ['readonly']; // Observe the readonly attribute
    }

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this._matrix = [[1, 0], [0, 1]]; // Default identity matrix
        this._readonly = false; // default if not specified
    }

    connectedCallback() {
        this._readonly = this.hasAttribute('readonly'); // Set readonly based on the attribute
        this.render();
        if (!this._readonly) {
            this.setupListeners();
        }
    }
    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'readonly') {
            this.readonly = this.hasAttribute('readonly');
        }
    }

    render() {
        if (this._matrix && Array.isArray(this._matrix) && this._matrix.every(row => Array.isArray(row))) {
            let content = this._matrix.map((row, i) => row.map((val, j) =>
                `<div class="matrix-cell">
                    ${this._readonly ? `<input id="m${i}${j}" value="${val}" readonly>` : `<input id="m${i}${j}" value="${val}">`}
                </div>`
            ).join('')).join('');

            this.shadowRoot.innerHTML = `
                <style>

                .matrix-container {
                    display: inline-flex;
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
        
                .matrix-cell {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                }
        
                </style>
                <div class="matrix-container">
                    <div class="bracket">(</div>
                    <div class="matrix">${content}</div>
                    <div class="bracket">)</div>
                </div>`;
        } else {
            console.error('Invalid matrix structure:', this._matrix);
        }
    }

    setupListeners() {
        if (!this._readonly && this._matrix && Array.isArray(this._matrix) && this._matrix.every(row => Array.isArray(row))) {
            for (let i = 0; i < this._matrix.length; i++) {
                for (let j = 0; j < this._matrix[i].length; j++) {
                    this.shadowRoot.getElementById(`m${i}${j}`).addEventListener('input', (event) => {
                        this._matrix[i][j] = parseFloat(event.target.value);
                        this.dispatchEvent(new CustomEvent('change', { detail: { matrix: this._matrix } }));
                    });
                }
            }
        }
    }

    get matrix() {
        return this._matrix;
    }

    set matrix(newMatrix) {
        if (newMatrix && Array.isArray(newMatrix) && newMatrix.every(row => Array.isArray(row))) {
            this._matrix = newMatrix;
            this.render();
        } else {
            console.error('Invalid matrix provided:', newMatrix);
        }
    }

    get readonly() {
        return this._readonly;
    }

    set readonly(value) {
        this._readonly = Boolean(value);
        if (this._readonly) {
            this.setAttribute('readonly', '');
        } else {
            this.removeAttribute('readonly');
        }
        this.render();
    }
}

customElements.define('matrix-component', MatrixComponent);