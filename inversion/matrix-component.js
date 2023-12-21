class MatrixComponent extends HTMLElement {
    static get observedAttributes() {
        return ['readonly', 'rows', 'cols']; // Observe readonly, rows, and cols attributes
    }
 
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this._matrix = this.initializeMatrix();
        this._readonly = false;
        this.selectedRows = new Set(); // Keep track of selected rows
    }

    connectedCallback() {
        this._readonly = this.hasAttribute('readonly');
        this._matrix = this.initializeMatrix();
        this.render();
        if (!this._readonly) {
            this.setupListeners();
        }
        this.shadowRoot.addEventListener('click', this.onCellClick.bind(this));
    }

    // Toggle row selection
    toggleRowSelection(rowIndex) {
        if (this.selectedRows.has(rowIndex)) {
            this.selectedRows.delete(rowIndex);
        } else {
            this.selectedRows.add(rowIndex);
        }
        this.updateRowStyles();
    }

    updateRowStyles() {
        const rows = this.shadowRoot.querySelectorAll('.matrix-row');
        rows.forEach((row, index) => {
            row.style.background = this.selectedRows.has(index) ? 'rgba(255, 255, 0, 0.2)' : 'none';
        });
    }
    // Dispatch custom events for row selection/deselection
    dispatchRowSelectionEvent(rowIndex, isSelected) {
        const eventName = isSelected ? 'rowselected' : 'rowdeselected';
        this.dispatchEvent(new CustomEvent(eventName, { detail: { rowIndex } }));
    }
    
    // Method to externally select/deselect rows
    selectRow(rowIndex, isUserAction = true) {
        this.selectedRows.add(rowIndex);
        this.updateRowStyles();
        if (isUserAction) {
            this.dispatchRowSelectionEvent(rowIndex, true);
        }
    }

    deselectRow(rowIndex, isUserAction = true) {
        this.selectedRows.delete(rowIndex);
        this.updateRowStyles();
        if (isUserAction) {
            this.dispatchRowSelectionEvent(rowIndex, false);
        }
    }
    


    onCellClick(event) {
        const cell = event.target.closest('.matrix-cell');
        if (cell) {
            const row = event.target.closest('.matrix-row');
            const rowIndex = Array.from(this.shadowRoot.querySelectorAll('.matrix-row')).indexOf(row);
            if (rowIndex !== -1) {
                if (this.selectedRows.has(rowIndex)) {
                    this.deselectRow(rowIndex); // isUserAction is true by default
                } else {
                    this.selectRow(rowIndex); // isUserAction is true by default
                }
            }
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
            
        let content = this._matrix.map((row, i) =>
            `<div class="matrix-row">${row.map((val, j) =>
                `<div class="matrix-cell">
                    ${this._readonly ? `<input id="m${i}${j}" value="${val}" readonly>` : `<input id="m${i}${j}" value="${val}">`}
                </div>`
            ).join('')}</div>`
        ).join('');


            const cols = this._matrix[0].length;
            this.shadowRoot.innerHTML = `
                <style>
                .matrix-container {
                    display: grid; /* Changed to grid for better control */
                    grid-template-columns: auto 1fr auto; /* Brackets and matrix columns */
                    grid-template-areas: "left-bracket matrix right-bracket";
                    align-items: center; /* Center-align the children vertically */
                    justify-items: center; /* Center-align the children horizontally */
                    gap: 5px; /* Space between elements */
                    padding: 5px;
                    border: 1px solid lightgrey;
                    border-radius: 5px;
                    box-sizing: border-box;
                    --bracket-size: 1em; /* Maintain the bracket size variable */
                }
                .matrix {
                    width: 100%; /* Set matrix width to fill the container */
                    display: grid;
                    grid-template-rows: repeat(auto-fill, minmax(min-content, max-content)); /* Create a new row for each .matrix-row */
                    gap: 2px; /* Space between cells */
                    grid-area: matrix; /* Assign to the center area */
                }
                .bracket {
                    margin-top: -15px;
                    font-size: var(--bracket-size);
                    font-weight: lighter;
                    user-select: none;
                    /* Removed padding to ensure brackets fit snugly */
                    grid-area: left-bracket; /* Assign to the left area */
                }
                .bracket:last-child {
                    grid-area: right-bracket; /* Assign to the right area */
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
                .matrix-row {
                    display: flex; /* Use flexbox for rows to layout cells horizontally */
                    gap: 2px; /* Gap between cells */
                }
                
                .matrix-cell {
                    flex: 1;
                    display: flex; /* Flex to center the content of each cell */
                    justify-content: center;
                    align-items: center;
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
