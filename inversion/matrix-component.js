class MatrixComponent extends HTMLElement {
    static get observedAttributes() {
        return ['readonly', 'rows', 'cols', 'max-selection']; // Add 'max-selection' to observed attributes
    }
 
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this._matrix = this.initializeMatrix();
        this._readonly = false;
        this.selectedRows = new Set(); // Keep track of selected rows
        this._maxSelection = 1; // Default max selection is 1
        this.rowSelectionStates = []; 
    }

    clearSelections() {
        this.selectedRows.forEach(rowIndex => {
            this.selectedRows.delete(rowIndex);
            this.dispatchRowSelectionEvent(rowIndex, false);
        });
        this.updateRowStyles();
    }

    connectedCallback() {
        this._readonly = this.hasAttribute('readonly');
        this._matrix = this.initializeMatrix();
        this.render();
        if (!this._readonly) {
            this.setupListeners();
        }
        this.shadowRoot.addEventListener('click', this.onCellClick.bind(this));
        this.rowSelectionStates = new Array(this._matrix.length).fill(false);
    }



    updateRowStyles() {
        const rows = this.shadowRoot.querySelectorAll('.matrix-row');
        rows.forEach((row, index) => {
            if (this.rowSelectionStates[index]) {
                row.classList.add('selected-row');
            } else {
                row.classList.remove('selected-row');
            }
        });
    }
            // Dispatch custom events for row selection/deselection
    dispatchRowSelectionEvent(rowIndex, isSelected) {
        const eventName = isSelected ? 'rowselected' : 'rowdeselected';
        this.dispatchEvent(new CustomEvent(eventName, { detail: { rowIndex } }));
    }
    
    // Method to externally select/deselect rows
    selectRow(rowIndex, isUserAction = true) {
        // Check if the row is already selected, if so, deselect
        if (this.rowSelectionStates[rowIndex]) {
            this.deselectRow(rowIndex, isUserAction);
            return;
        }

        // Enforce max selection limit
        const currentSelectionCount = this.rowSelectionStates.filter(Boolean).length;
        if (currentSelectionCount >= this._maxSelection) {
            const toDeselectIndex = this.rowSelectionStates.findIndex(state => state); // Find the first selected row
            this.deselectRow(toDeselectIndex, false); // Deselect it programmatically
        }

        // Select the new row and update styles
        this.rowSelectionStates[rowIndex] = true;
        this.updateRowStyles();
        if (isUserAction) {
            this.dispatchRowSelectionEvent(rowIndex, true);
            this.dispatchSelectionChanged();
        }
    }

    deselectRow(rowIndex, isUserAction = true) {
        this.rowSelectionStates[rowIndex] = false;
        this.updateRowStyles();
        if (isUserAction) {
            this.dispatchRowSelectionEvent(rowIndex, false);
            this.dispatchSelectionChanged();
        }
    }

    dispatchSelectionChanged() {
        const selectedRowsData = this.rowSelectionStates
            .map((isSelected, rowIndex) => isSelected ? {
                rowIndex: rowIndex,
                values: this._matrix[rowIndex]
            } : null)
            .filter(row => row !== null); // Filter out null values
        this.dispatchEvent(new CustomEvent('selectionchanged', { detail: selectedRowsData }));
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
 
    
    connectedCallback() {
        // Extract attributes
        this._readonly = this.hasAttribute('readonly');
        const size = Math.max(1, parseInt(this.getAttribute('rows')) || 2); // Assuming square matrices
        const valuesType = this.getAttribute('values') || 'identity';  // Default to 'identity' if not specified

        // Set the matrix based on the 'values' attribute
        if (valuesType === 'identity') {
            this._matrix = this.initializeMatrix(size);
        } else if (valuesType === 'random invertible') {
            this._matrix = this.generateRandomInvertibleMatrix(size);
        }

        // Render and set up component based on readonly status
        this.render();
        if (!this._readonly) {
            this.setupListeners();
        }
        this.shadowRoot.addEventListener('click', this.onCellClick.bind(this));
        this.rowSelectionStates = new Array(size).fill(false);
    }

    initializeMatrix(size) {
        return Array.from({ length: size }, (_, i) =>
            Array.from({ length: size }, (_, j) => i === j ? 1 : 0)
        );
    }

    determinant(m) {
        // If the matrix is 1x1, the determinant is the single element in the matrix
        if (m.length == 1) {
          return m[0][0];
        }
        // If the matrix is 2x2, the determinant is ad - bc
        else if (m.length == 2) {
          return m[0][0]*m[1][1] - m[0][1]*m[1][0];
        }
        // If the matrix is larger, we need to recurse
        else {
          let result = 0;
          for (let i = 0; i < m[0].length; i++) {
            // Generate the smaller matrix for the minor
            let smaller = m.slice(1).map(row => row.filter((_, j) => i != j));
            // Add or subtract (based on i) the product of the current element and the determinant of the smaller matrix
            result += Math.pow(-1, i) * m[0][i] * this.determinant(smaller);
          }
          return result;
        }
      }
      
          
    generateRandomInvertibleMatrix(n) {
        // TODO while(true) is not a good idea
      while (true) {
        // Generate a matrix with entries between -9 and 9
        let matrix = Array.from({length: n}, () => Array.from({length: n}, () => Math.floor(Math.random() * 19) - 9));
        // If the determinant is not zero, the matrix is invertible
        if (this.determinant(matrix) !== 0) {
          return matrix;
        }
      }
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
                    // border: 1px solid lightgrey;
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
                    margin-top: -20px;
                    font-size: var(--bracket-size);
                    font-family: "Arial Narrow", Arial, Helvetica, sans-serif;
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
                    display: flex;
                    gap: 2px;
                    padding: 1px; /* Adjust padding to offset the border width if needed */
                    border: 3px solid transparent; /* Transparent border */
                    border-radius: 5px;
                    box-sizing: border-box; /* Include padding and border in the element's size */
                    transition: border-color 0.2s; /* Optional: for a smooth transition effect */
                }
                .selected-row {
                    background: rgba(255, 255, 0, 0.2); /* Light yellow background */
                    border-color: goldenrod; /* Only change the color, the border size is already defined */
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
                const bracketSize = `${rows * 2.0}em`; // adjust multiplier as needed
            
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
    get maxSelection() {
        return this._maxSelection;
    }

    set maxSelection(value) {
        this._maxSelection = parseInt(value, 10) || 1; // Default to 1 if NaN
        this.setAttribute('max-selection', this._maxSelection.toString());
        // If the new max selection is less than the current selection count, clear excess selections
        while (this.selectedRows.size > this._maxSelection) {
            const rowIndex = this.selectionOrder.shift();
            this.selectedRows.delete(rowIndex);
            this.dispatchRowSelectionEvent(rowIndex, false);
        }
        this.updateRowStyles();
    }

}

customElements.define('matrix-component', MatrixComponent);
