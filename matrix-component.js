class MatrixComponent extends HTMLElement {
    static get observedAttributes() {
        return ['readonly', 'rows', 'cols']; // Observe readonly, rows, and cols attributes
    }

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this._matrix = this.initializeMatrix();
        this._readonly = false;
    }

    connectedCallback() {
        this._readonly = this.hasAttribute('readonly');
        this._matrix = this.initializeMatrix();
        this.render();
        if (!this._readonly) {
            this.setupListeners();
        }
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'readonly') {
            this.readonly = this.hasAttribute('readonly');
        } else if (name === 'rows' || name === 'cols') {
            this._matrix = this.initializeMatrix();
            this.render();
        }
    }

    initializeMatrix() {
        const rows = Math.max(1, parseInt(this.getAttribute('rows')) || 2);
        const cols = Math.max(1, parseInt(this.getAttribute('cols')) || 2);
        return Array.from({ length: rows }, (_, i) =>
            Array.from({ length: cols }, (_, j) => i === j ? 1 : 0)
        );
    }

    render() {
        if (this._matrix && Array.isArray(this._matrix) && this._matrix.every(row => Array.isArray(row))) {
            
            let content = this._matrix.map((row, i) => row.map((val, j) =>
                `<div class="matrix-cell">
                    ${this._readonly ? `<input id="m${i}${j}" value="${val}" readonly>` : `<input id="m${i}${j}" value="${val}">`}
                </div>`
            ).join('')).join('');

            const cols = this._matrix[0].length;
            this.shadowRoot.innerHTML = `
                <style>
                .matrix-container {
                    display: inline-flex;
                    align-items: center;
                    flex-wrap: nowrap;
                    overflow: hidden;
                    padding: 5px;
                    border: 1px solid lightgrey;
                    border-radius: 5px;
                    box-sizing: border-box;
                    --bracket-size: 1em;
                }
                .matrix {
                    display: grid;
                    grid-template-columns: repeat(${cols}, auto);
                    padding: 5px;
                    gap: 2px
                    box-sizing: border-box;
                    margin-left: -15px;
                    margin-right: -15px;
                }
                .bracket {
                    font-size: var(--bracket-size);
                    font-weight: lighter
                    user-select: none;
                    padding: 0 2px;
                    margin-top: -15px;
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
                    box-sizing: border-box;
                }
                .matrix-cell {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    margin: 0 2px;
                }
                </style>
                <div class="matrix-container">
                    <div class="bracket">\u005B</div>
                    <div class="matrix">${content}</div>
                    <div class="bracket">\u005D</div>
                </div>`;
                const rows = this._matrix.length;
                const bracketSize = `${rows * 1.7}em`; // adjust multiplier as needed
            
                // ensure the bracket size is same height as number of rows
                this.shadowRoot.querySelector('.matrix-container').style.setProperty('--bracket-size', bracketSize);
        } else {
            console.error('Invalid matrix structure:', this._matrix);
        }
    }

    setupListeners() {
        this.shadowRoot.querySelectorAll('input').forEach(input => {
            input.removeEventListener('input', this.handleInput);
            input.addEventListener('input', this.handleInput.bind(this));
        });
    }

    handleInput(event) {
        const id = event.target.id;
        const [_, i, j] = id.match(/m(\d+)(\d+)/).map(Number);
        this._matrix[i][j] = parseFloat(event.target.value) || 0;
        this.dispatchEvent(new CustomEvent('change', { detail: { matrix: this._matrix } }));
    }

    get matrix() {
        return this._matrix;
    }

    set matrix(newMatrix) {
        if (Array.isArray(newMatrix) && newMatrix.every(row => Array.isArray(row))) {
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
        const isReadOnly = Boolean(value);
    
        // Check if the current state is already what we want
        if (this._readonly !== isReadOnly) {
            this._readonly = isReadOnly;
    
            if (this._readonly) {
                this.setAttribute('readonly', '');
            } else {
                this.removeAttribute('readonly');
            }
        }
    
        this.render();
    }


    get rows() {
        return this._matrix.length;
    }

    set rows(value) {
        const numRows = Math.max(1, Number(value));
        this.setAttribute('rows', numRows);
    }

    get cols() {
        return this._matrix[0].length;
    }

    set cols(value) {
        const numCols = Math.max(1, Number(value));
        this.setAttribute('cols', numCols);
    }
}

customElements.define('matrix-component', MatrixComponent);
