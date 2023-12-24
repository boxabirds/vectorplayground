class MatrixComponent extends HTMLElement {
    static get observedAttributes() {
        return ['readonly', 'rows', 'cols', 'max-selection']; // Add 'max-selection' to observed attributes
    }
 
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this._matrix = this.initializeMatrix();
        this._readonly = false;
        this.selectionOrder = []; // FIFO queue to manage selection state
        this._maxSelection = 1; // Default max selection is 1
    }


    updateRowStyles() {
        const rows = this.shadowRoot.querySelectorAll('.matrix-row');
        rows.forEach((row, index) => {
            if (this.selectionOrder.includes(index)) {
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
    
    selectRow(rowIndex, isUserAction = true) {
        if (this.selectionOrder.includes(rowIndex)) {
            this.deselectRow(rowIndex, isUserAction);
            return;
        }

        if (this.selectionOrder.length >= this._maxSelection) {
            const toDeselectIndex = this.selectionOrder.shift(); // Remove the first (oldest) selected row
            this.deselectRow(toDeselectIndex, false);
        }

        this.selectionOrder.push(rowIndex); // Add the new row to the selection queue
        this.updateRowStyles();
        if (isUserAction) {
            this.dispatchRowSelectionEvent(rowIndex, true);
            this.dispatchSelectionChanged();
        }
    }

    deselectRow(rowIndex, isUserAction = true) {
        this.selectionOrder = this.selectionOrder.filter(index => index !== rowIndex); // Remove the deselected row
        this.updateRowStyles();
        if (isUserAction) {
            this.dispatchRowSelectionEvent(rowIndex, false);
            this.dispatchSelectionChanged();
        }
    }

    dispatchSelectionChanged() {
        const selectedRowsData = this.selectionOrder.map(rowIndex => ({
            rowIndex: rowIndex,
            values: this._matrix[rowIndex]
        }));
        this.dispatchEvent(new CustomEvent('selectionchanged', { detail: selectedRowsData }));
    }




    onCellClick(event) {
        const cell = event.target.closest('.matrix-cell');
        if (cell) {
            const row = event.target.closest('.matrix-row');
            const rowIndex = Array.from(this.shadowRoot.querySelectorAll('.matrix-row')).indexOf(row);
            if (rowIndex !== -1) {
                if (this.selectionOrder.includes(rowIndex)) {
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
      
    gcd(a, b) {
        // Euclidean algorithm to find the greatest common divisor
        while (b !== 0) {
            let t = b;
            b = a % b;
            a = t;
        }
        return a;
    }
    
    
    convertDecimalToFraction(decimal) {
        const decimalStr = decimal.toString();
        // Check if it's a repeating decimal
        const match = decimalStr.match(/(-?\d*)\.(\d*?)(\d+)\2+/);
        let numerator, denominator;
    
        if (match) {
            // Repeating decimal
            const [_, wholePart, nonRepeating, repeating] = match;
            const lenNonRepeating = nonRepeating.length;
            const lenRepeating = repeating.length;
    
            // Create the fraction
            numerator = parseInt(wholePart + nonRepeating + repeating) - parseInt(wholePart + nonRepeating);
            denominator = Math.pow(10, lenNonRepeating + lenRepeating) - Math.pow(10, lenNonRepeating);
        } else {
            // Finite decimal
            if (decimalStr.includes('.')) {
                const parts = decimalStr.split('.');
                const wholePart = parts[0];
                const fractionalPart = parts[1];
                numerator = parseInt(wholePart) * Math.pow(10, fractionalPart.length) + parseInt(fractionalPart);
                denominator = Math.pow(10, fractionalPart.length);
            } else {
                // It's an integer
                return [decimal, 1];
            }
        }
    
        // Simplify the fraction
        const divisor = gcd(numerator, denominator);
        numerator /= divisor;
        denominator /= divisor;
    
        return [numerator, denominator];
    }

      
    generateRandomInvertibleMatrix(n) {
        // we could generate a matrix using compositions but the numbers might end up being very large (hundreds or thousands)
        // so we rely on the fact that "most matrices are invertible" (citation needed)
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
                    <div class="content-wrapper">
                        ${this._readonly ? `<input class="cell-input" id="m${i}${j}" value="" readonly>` : `<input class="cell-input" id="m${i}${j}" value="${val}">`}
                        <div class="overlay-content" id="overlay${i}${j}">
                        ${val}
                        </div>
                    </div>
                </div>`
            ).join('')}</div>`
        ).join('');

            const cols = this._matrix[0].length;
            this.shadowRoot.innerHTML = `
                <style>
                .matrix-container {
                    display: grid;
                    grid-template-columns: auto 1fr auto;
                    grid-template-areas: "left-bracket matrix right-bracket";
                    align-items: center;
                    justify-items: center;
                    gap: 5px;
                    padding: 5px;
                    border-radius: 5px;
                    box-sizing: border-box;
                    --bracket-size: 1em;
                }
                
                .matrix {
                    width: 100%;
                    display: grid;
                    grid-template-rows: repeat(auto-fill, minmax(min-content, max-content));
                    gap: 2px;
                    grid-area: matrix;
                }
                
                .bracket {
                    margin-top: -20px;
                    font-size: var(--bracket-size);
                    font-family: "Arial Narrow", Arial, Helvetica, sans-serif;
                    font-weight: lighter;
                    user-select: none;
                    grid-area: left-bracket; /* For the left bracket */
                }
                
                .bracket:last-child {
                    grid-area: right-bracket; /* For the right bracket */
                }
                
                .matrix-row {
                    display: flex;
                    gap: 2px;
                    padding: 1px;
                    border: 3px solid transparent;
                    border-radius: 5px;
                    box-sizing: border-box;
                    transition: border-color 0.2s;
                }
                
                .selected-row {
                    background: rgba(255, 255, 0, 0.2);
                    border-color: goldenrod;
                }
                
                .matrix-cell {
                    flex: 1;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    position: relative;
                }
                
                .content-wrapper {
                    display: inline-flex;
                    position: relative;
                }
                
                .cell-input {
                    width: 40px; /* Adjust to match your input field size */
                    height: 20px; /* Adjust to match your input field size */
                    text-align: center;
                    border: none;
                    background-color: transparent;
                    font-size: 1.2em;
                    outline: none;
                    padding: 0;
                    box-sizing: border-box;
                }
                
                .overlay-content {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%; /* Match parent size */
                    height: 100%; /* Match parent size */
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    pointer-events: none;
                    overflow: hidden;
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
        this._maxSelection = parseInt(value, 10) || 1;
        this.setAttribute('max-selection', this._maxSelection.toString());
        while (this.selectionOrder.length > this._maxSelection) {
            const rowIndex = this.selectionOrder.shift();
            this.deselectRow(rowIndex, false);
        }
        this.updateRowStyles();
    }

}

customElements.define('matrix-component', MatrixComponent);
