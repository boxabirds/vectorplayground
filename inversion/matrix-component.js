// Note: this code has been substantially coded by ChatGPT
// under my software engineering design guidance.
// Unfortunately the early decision to work directly with innerHTML has created
// a local maxima that is not easy to refactor as of Dec 2023: certain animations will
// fail due to the constant rewriting of the shadow DOM. 
// I have tried to refactor the code to work with incremental
// changes to the DOM, but it requires detailed knowledge of CSS and the DOM
// beyond what I know personally. No AI I've tried (phind, perplexity, claude, chatgpt)
// can take this file and refactor it to work with incremental changes to the DOM as of Dec 2023.


class MatrixComponent extends HTMLElement {
    static get observedAttributes() {
        return ['readonly', 'rows', 'cols', 'max-selections']; // Add 'max-selection' to observed attributes
    }
  
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this._matrix = this.initializeMatrix();
        this.tolerance = 0.0001;
        this._readonly = false;
        this.selectionOrder = []; // FIFO queue to manage selection state
        this._maxSelection = 1; // Default max selection is 1
        this.inversionAchieved = false;
    }
  
  
    // updateRowStyles() {
    //     const rows = this.shadowRoot.querySelectorAll('.matrix-row');
    //     rows.forEach((row, index) => {
    //         if (this.selectionOrder.includes(index)) {
    //             row.classList.add('selected-row');
    //         } else {
    //             //console.log("deselecting row " + index);
    //             row.classList.remove('selected-row');
    //         }
    //     });
    // }
  
    applyGlowEffect(element) {
        if(element.classList.contains('glow-effect')) {
            element.classList.remove('glow-effect');
            // Hack to trigger reflow/repaint to restart the animation
            void element.offsetWidth;
        }
        element.classList.add('glow-effect');

        // Remove the class after animation ends to allow it to be reapplied
        element.addEventListener('animationend', () => {
            element.classList.remove('glow-effect');
        }, {once: true});
    }

    applyGlowToCells(cellIds) {
        console.log("applying glow to cells: " + cellIds);
        cellIds.forEach(id => {
            const cell = this.shadowRoot.getElementById(id);
            console.log("cell: " + cell);
            if (cell) {
                console.log("cell actually exists: " + cell);
                this.applyGlowEffect(cell);
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
        if (isUserAction) {
            this.dispatchRowSelectionEvent(rowIndex, true);
            this.dispatchSelectionChanged();
        }
        this.render();
    }
          
    deselectRow(rowIndex, isUserAction = true) {
        this.selectionOrder = this.selectionOrder.filter(index => index !== rowIndex); // Remove the deselected row
        if (isUserAction) {
            this.dispatchRowSelectionEvent(rowIndex, false);
            this.dispatchSelectionChanged();
        }
        this.render();
    }
          
    dispatchSelectionChanged() {
        const selectedRowsData = this.selectionOrder.map(rowIndex => ({
            rowIndex: rowIndex,
            values: this._matrix[rowIndex]
        }));
        this.dispatchEvent(new CustomEvent('selectionchanged', { detail: selectedRowsData }));
    }
  
  
    getUnicodeNumber(number) {
        const unicodeNumbers = ['①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨', '⑩', '⑪', '⑫', '⑬', '⑭', '⑮', '⑯', '⑰', '⑱', '⑲', '⑳'];
        return unicodeNumbers[number - 1] || number.toString();
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
        this.maxSelections = this.getAttribute('max-selections') || 1; // Add this line
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
    convertDecimalToFraction(floatValue, tolerance = 0.0001, improper = true) {
        let isNegative = false;
        if (floatValue < 0) {
          isNegative = true;
          floatValue = Math.abs(floatValue);
        }
      
        // Define variables outside the if-else scope for later use
        let wholePart = 0;
        let fractionalPart = floatValue;
      
        // When improper is false, separate the number into whole and fractional parts
        if (!improper) {
          wholePart = Math.floor(floatValue);
          fractionalPart = floatValue - wholePart;
        }
      
        if (Math.abs(fractionalPart) < tolerance || Math.abs(fractionalPart - 1) < tolerance) {
          if (Math.abs(fractionalPart - 1) < tolerance && !improper) {
            wholePart++;
          }
          wholePart = isNegative ? -wholePart : wholePart;
          return [wholePart, 0, 1];
        }
      
        let numerator = 1;
        let h1 = 0;
        let denominator = 0;
        let h2 = 1;
        let b = fractionalPart;
      
        do {
          const a = Math.floor(b);
          let aux = numerator;
          numerator = a * numerator + h1;
          h1 = aux;
          aux = denominator;
          denominator = a * denominator + h2;
          h2 = aux;
          b = 1 / (b - a);
        } while (Math.abs(fractionalPart - numerator / denominator) > fractionalPart * tolerance);
      
        let commonDivisor = this.gcd(Math.abs(numerator), denominator);
        numerator /= commonDivisor;
        denominator /= commonDivisor;
      
        if (improper || Math.abs(fractionalPart - 1) < tolerance) {
          wholePart = 0; // For improper fractions, the whole part is always 0
        } else if (Math.abs(fractionalPart - 1) < tolerance) {
          wholePart += (isNegative ? -1 : 1);
          numerator = 0;
        }
      
        if (isNegative) {
          numerator = -numerator;
        }
      
        if (Math.abs(floatValue) < tolerance && numerator !== 0) {
          return [0, isNegative ? -numerator : numerator, denominator];
        }
      
        return [wholePart, numerator, denominator];
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
            let content = this._matrix.map((row, i) => {
                const isSelected = this.selectionOrder.includes(i);
                const selectionClass = isSelected ? 'selected-row' : '';
                const selectionOrderNumber = isSelected && this.selectionOrder.length > 1 ? `<span class="selection-order">${this.getUnicodeNumber(this.selectionOrder.indexOf(i) + 1)}</span>` : '';
    
                return `<div class="matrix-row ${selectionClass}" id="row-${i}">${selectionOrderNumber}${row.map((val, j) => {
                    const [wholePart, numerator, denominator] = this.convertDecimalToFraction(val);
                    const isNegative = numerator < 0;
                    const absNumerator = Math.abs(numerator);
    
                    const displayValue = denominator !== 1 ?
                        `${wholePart !== 0 ? `<span class="whole-part">${Math.round(wholePart)}</span>` : ''}` +
                        `<span class="fraction">` +
                            `${isNegative ? `<span class="sign">-</span>` : ''}` +
                            `<span class="numerator-content">${absNumerator}</span>` +
                            `<span class="fraction-separator"></span>` +
                            `<span class="denominator">${denominator}</span>` +
                        `</span>` :
                        Math.round(val).toString();
    
                    return `<div class="matrix-cell">
                                <div class="content-wrapper">
                                    ${this._readonly ? 
                                        `<div class="readonly-cell" id="m${i}${j}">${displayValue}</div>` : 
                                        `<input class="cell-input" id="m${i}${j}" value="${val}">`}
                                </div>
                            </div>`;
                }).join('')}</div>`;
            }).join('');
    
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
                        margin-top: 20px;
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
                        padding: 0.3em;
                        border: 3px solid transparent;
                        border-radius: 5px;
                        box-sizing: border-box;
                        transition: border-color 0.3s;
                        position: relative;
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
                        // margin-top: -0.1em
                        box-sizing: border-box;
                    }
    
                    .readonly-cell {
                        display: inline-block;
                        width: 40px; /* Adjust to match your input field size */
                        height: 20px; /* Adjust to match your input field size */
                        text-align: center;
                        position: relative;
                        // margin-top: -0.1em
                        font-size: 1.2em;
                    }
    
                    .whole-part {
                        display: inline-block;
                        margin-right: 0.1em;
                        vertical-align: top;
                    }
    
                    .fraction {
                        display: inline-flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: flex-start;
                        position: relative;
                        top: -0.7em;
                        font-size: 0.7em;
                    }
    
                    .numerator-content, .denominator {
                        display: block;
                        line-height: 1;
                        text-align: center;
                    }
    
                    .fraction-separator {
                        height: 1px;
                        background-color: black;
                        width: 100%;
                        align-self: center;
                    }
    
                    .sign {
                        display: inline-block;
                        width: 0;
                        overflow: visible;
                        position: absolute;
                        left: -0.6em;
                        text-align: left;
                    }
    
                    .glow-effect {
                        animation: goldenGlowFade 1s forwards;
                    }
    
                    @keyframes goldenGlowFade {
                        0% {
                            box-shadow: 0 0 10px 5px rgba(255, 215, 0, 1);
                        }
                        100% {
                            box-shadow: 0 0 20px 10px rgba(255, 215, 0, 0);
                        }
                    }
    
                    .selection-order {
                        position: absolute;
                        left: -22px; /* Adjust as needed */
                        top: 50%;
                        transform: translateY(-50%);
                        font-size: 1em; /* Adjust as needed */
                        /*width: 20px; /* Adjust as needed */
                        text-align: center;
                        user-select: none;
                        z-index: 1;
                    }
                </style>
                <div class="matrix-container">
                    <div class="bracket">\u005B</div>
                    <div class="matrix">${content}</div>
                    <div class="bracket">\u005D</div>
                </div>`;
                const rows = this._matrix.length;
                const bracketSize = `${rows * 3.1}em`; // adjust multiplier as needed
            
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
  
    approxEqual(a, b, tolerance) {
        return Math.abs(a - b) <= tolerance;
    }

    findFirstPivotElementNormalizedTo1() {
        let elements = [];
        for (let i = 0; i < this._matrix[0].length; i++) {
            if (Math.abs(this._matrix[0][i] - 1) <= this.tolerance) {
                elements.push(`m0${i}`);
                return elements;
            }
        }
        return []; // Return empty array if condition is not met
    }

    findEchelonFormCells() {
        let lastNonZeroRow = -1;
        let elements = [];
        for (let i = 0; i < this._matrix.length; i++) {
            let firstNonZeroIndex = this._matrix[i].findIndex(value => Math.abs(value) > this.tolerance);
            if (firstNonZeroIndex === -1) continue; // Skip all-zero rows
            if (firstNonZeroIndex <= lastNonZeroRow) {
                return []; // Return empty array as it's not in echelon form
            }
            elements.push(`m${i}${firstNonZeroIndex}`);
            lastNonZeroRow = firstNonZeroIndex;
        }
        return elements; // Return collected element IDs
    }

    findReducedRowEchelonFormCells() {
        if (!this.findEchelonFormCells().length) return [];
        let elements = [];
        for (let i = 0; i < this._matrix.length; i++) {
            let firstNonZeroIndex = this._matrix[i].findIndex(value => Math.abs(value) > this.tolerance);
            if (firstNonZeroIndex !== -1) {
                if (!this.approxEqual(this._matrix[i][firstNonZeroIndex], 1, this.tolerance)) return []; // Not reduced form
                elements.push(`m${i}${firstNonZeroIndex}`);
                for (let j = i + 1; j < this._matrix.length; j++) {
                    if (Math.abs(this._matrix[j][firstNonZeroIndex]) > this.tolerance) return []; // Not reduced form
                }
            }
        }
        return elements;
    }

    findIdentityCells() {
        if (!this._matrix || this._matrix.length === 0 || this._matrix.length !== this._matrix[0].length) {
            return []; // Not a square matrix, hence not identity
        }
        let elements = [];
        for (let i = 0; i < this._matrix.length; i++) {
            for (let j = 0; j < this._matrix[i].length; j++) {
                if ((i === j && !this.approxEqual(this._matrix[i][j], 1, this.tolerance)) || (i !== j && Math.abs(this._matrix[i][j]) > this.tolerance)) {
                    return []; // Not an identity matrix
                }
                if (i === j) elements.push(`m${i}${j}`); // Collect diagonal elements
            }
        }
        return elements;
    }

    firstPivotNormalizedTo1() {
        for (let i = 0; i < this._matrix[0].length; i++) {
            if (Math.abs(this._matrix[0][i] - 1) <= this.tolerance) {
                console.log("Matrix has first pivot normalized to 1? t/f: " + true + " matrix:", this._matrix);
                return true;
            }
        }
        return false; // No non-zero element found in the first row
    }


    isInRowEchelonForm() {
        let lastNonZeroRow = -1;
        for (let i = 0; i < this._matrix.length; i++) {
            let firstNonZeroIndex = this._matrix[i].findIndex(value => Math.abs(value) > this.tolerance);
            if (firstNonZeroIndex === -1) continue; // Skip all-zero rows
            if (firstNonZeroIndex <= lastNonZeroRow) {
                console.log("Matrix is in row echelon form? t/f: " + false + " matrix:", this._matrix);
                return false; // A leading entry is not to the right of the one above it
            }
            lastNonZeroRow = firstNonZeroIndex;
        }
        console.log("Matrix is in row echelon form? t/f: " + true + " matrix:", this._matrix);
        return true;
    }

    isInReducedRowEchelonForm() {
        if (!this.isInRowEchelonForm()) return false;
        for (let i = 0; i < this._matrix.length; i++) {
            let firstNonZeroIndex = this._matrix[i].findIndex(value => Math.abs(value) > this.tolerance);
            if (firstNonZeroIndex !== -1 && !this.approxEqual(this._matrix[i][firstNonZeroIndex], 1, this.tolerance)) return false; // Leading entry is not 1
            for (let j = i + 1; j < this._matrix.length; j++) {
                if (Math.abs(this._matrix[j][firstNonZeroIndex]) > this.tolerance) return false; // Entries above and below the leading 1 are not 0
            }
        }
        return true;
    }

    isIdentity() {
        if (!this._matrix || this._matrix.length === 0 || this._matrix.length !== this._matrix[0].length) {
            console.log("Matrix is identity? t/f: " + false + " matrix:", this._matrix);
            return false; // Ensure the matrix is square
        }
        for (let i = 0; i < this._matrix.length; i++) {
            for (let j = 0; j < this._matrix[i].length; j++) {
                if ((i === j && !this.approxEqual(this._matrix[i][j], 1, this.tolerance)) || (i !== j && Math.abs(this._matrix[i][j]) > this.tolerance)) {
                    console.log("Matrix is identity? t/f: " + false + " matrix:", this._matrix);
                    return false; // Check for 1s on the diagonal and 0s elsewhere
                }
            }
        }
        console.log("Matrix is identity? t/f: " + true + " matrix:", this._matrix);
        return true;
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
    get maxSelections() {
        return this._maxSelection;
    }
  
    set maxSelections(value) {
        const val = parseInt(value, 10) || 1;
        if (this._maxSelection !== val) {
            this._maxSelection = val;
            this.setAttribute('max-selections', val.toString());
            while (this.selectionOrder.length > this._maxSelection) {
                const rowIndex = this.selectionOrder.shift();
                this.deselectRow(rowIndex, false);
            }
            this.render();
        }
    }
      
    getSelectedRows() {
        return this.selectionOrder.slice(); // return a copy of the selectionOrder array
    }
  
    clearSelection(isUserAction = true) {
        let oldSelections = this.selectionOrder;
        this.selectionOrder = [];
        if (isUserAction) {
            oldSelections.forEach(rowIndex => this.dispatchRowSelectionEvent(rowIndex, false));
            this.dispatchSelectionChanged();
        }
        this.render();
    }
        

    subtractRows(rowIndex1, rowIndex2, factor) {
        if (rowIndex1 < this._matrix.length && rowIndex2 < this._matrix.length) {
            // Loop through each column in the row
            for (let i = 0; i < this._matrix[rowIndex1].length; i++) {
                // Multiply the value of the first row by the factor and then subtract it from the second row
                this._matrix[rowIndex2][i] -= this._matrix[rowIndex1][i] * factor;
            }
    
            this.render(); // Re-render to update the UI
            this.clearSelection();
            // Dispatch an event to notify of the row subtraction
            this.dispatchEvent(new CustomEvent('rowsubtracted', { detail: { subtractedFrom: rowIndex2, subtracted: rowIndex1, factor: factor } }));
        } else {
            console.error('Invalid row indices for subtraction:', rowIndex1, rowIndex2);
        }
    }
  
    multiplyRow(rowIndex, factor) {
        if (rowIndex < this._matrix.length) {
            // Get the row from the matrix
            const row = this._matrix[rowIndex];
  
            // Update each element in the row
            for (let i = 0; i < row.length; i++) {
                row[i] *= factor;
            }
  
            this.render();
            this.clearSelection();
            // Dispatch an event to notify of the change
            this.dispatchEvent(new CustomEvent('rowmultiplied', { detail: { rowIndex, factor } }));
        } else {
            console.error('Invalid row index for multiplication:', rowIndex);
        }
    }
  
    swapRows(rowIndex1, rowIndex2) {
        if (rowIndex1 < this._matrix.length && rowIndex2 < this._matrix.length) {
            const row1 = this.shadowRoot.querySelector(`#row-${rowIndex1}`);
            const row2 = this.shadowRoot.querySelector(`#row-${rowIndex2}`);
  
            // Calculate the distance to move
            const distance = rowIndex2 - rowIndex1;
            row1.style.setProperty('--move-distance', distance);
            row2.style.setProperty('--move-distance', -distance);
  
            // Apply the animation
            row1.classList.add('moving');
            row2.classList.add('moving');
  
            // Listen for when the animation ends and then complete the swap
            const onAnimationEnd = () => {
                // Remove the listener and animation class
                row1.removeEventListener('animationend', onAnimationEnd);
                row2.removeEventListener('animationend', onAnimationEnd);
                row1.classList.remove('moving');
                row2.classList.remove('moving');
  
                // Perform the actual row swap in the matrix data
                [this._matrix[rowIndex1], this._matrix[rowIndex2]] = [this._matrix[rowIndex2], this._matrix[rowIndex1]];
  
                // Update the selection order and re-render to reflect changes
                this.selectionOrder = this.selectionOrder.map(index => {
                    if (index === rowIndex1) {
                        return rowIndex2;
                    } else if (index === rowIndex2) {
                        return rowIndex1;
                    }
                    return index;
                });
  
                this.render();
                this.clearSelection();
                this.dispatchEvent(new CustomEvent('rowswapped', { detail: { rowIndex1, rowIndex2 } }));
            };
  
            // Add the event listener for the end of the animation
            row1.addEventListener('animationend', onAnimationEnd);
            row2.addEventListener('animationend', onAnimationEnd);
        } else {
            console.error('Invalid row indices for swap:', rowIndex1, rowIndex2);
        }
    }
  
  
    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'max-selections' && oldValue !== newValue) {
            this.maxSelections = newValue; // Update the property when the attribute changes
        }
    }
  
  }
  
  customElements.define('matrix-component', MatrixComponent);
  