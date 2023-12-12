window.onload = function() {
    var canvas = document.getElementById("myCanvas");
    var ctx = canvas.getContext("2d");

    // Vectors a and b
    const ORIGIN_X = 250;
    const ORIGIN_Y = 250;
    const LINE_WIDTH = 1;
    const GRID_COLOR = "#ddd";
    const AXIS_COLOR = "#000";
    const MULTIPLIER = 10;
    const PROJECTION_COLOR = "black";
    const STARTING_LINE_WIDTH = 4;
    const LINE_FROM_START_COLOR = "green";
    const HANDLE_RADIUS = 10;
    const VECTOR_A = { x: 1, y: 3, color: "red" };
    const VECTOR_B = { x: 4, y: 2, color: "blue" };

    window.onload = function() {
        const canvas = document.getElementById("myCanvas");
        const ctx = canvas.getContext("2d");

        let selectedVector = null;

        function drawVector(vector) {
            ctx.beginPath();
            ctx.moveTo(ORIGIN_X, ORIGIN_Y);
            ctx.lineTo(ORIGIN_X + vector.x * MULTIPLIER, ORIGIN_Y - vector.y * MULTIPLIER);
            ctx.strokeStyle = vector.color;
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(ORIGIN_X + vector.x * MULTIPLIER, ORIGIN_Y - vector.y * MULTIPLIER, HANDLE_RADIUS, 0, 2 * Math.PI);
            ctx.fillStyle = vector.color;
            ctx.fill();
        }

        function drawGrid() {
            ctx.beginPath();
            for (let x = 0.5; x < 500; x += MULTIPLIER) {
                ctx.moveTo(x, 0);
                ctx.lineTo(x, 500);
            }

            for (let y = 0.5; y < 500; y += MULTIPLIER) {
                ctx.moveTo(0, y);
                ctx.lineTo(500, y);
            }

            ctx.strokeStyle = GRID_COLOR;
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(0, ORIGIN_Y);
            ctx.lineTo(500, ORIGIN_Y);
            ctx.moveTo(ORIGIN_X, 0);
            ctx.lineTo(ORIGIN_X, 500);
            ctx.strokeStyle = AXIS_COLOR;
            ctx.stroke();
        }

        function dotProduct(vector1, vector2) {
            return vector1.x * vector2.x + vector1.y * vector2.y;
        }

        function projection(vector1, vector2) {
            const dotProductAB = dotProduct(vector1, vector2);
            const dotProductBB = dotProduct(vector2, vector2);
            const scalar = dotProductAB / dotProductBB;
            return { x: scalar * vector2.x, y: scalar * vector2.y };
        }

        function redrawCanvas() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            drawGrid();

            const projVector = projection(VECTOR_A, VECTOR_B);
            ctx.beginPath();
            ctx.moveTo(ORIGIN_X, ORIGIN_Y);
            ctx.lineTo(ORIGIN_X + projVector.x * MULTIPLIER, ORIGIN_Y - projVector.y * MULTIPLIER);
            ctx.strokeStyle = PROJECTION_COLOR;
            ctx.lineWidth = STARTING_LINE_WIDTH;
            ctx.stroke();
            ctx.lineWidth = LINE_WIDTH;

            ctx.beginPath();
            ctx.moveTo(ORIGIN_X + VECTOR_A.x * MULTIPLIER, ORIGIN_Y - VECTOR_A.y * MULTIPLIER);
            ctx.lineTo(ORIGIN_X + projVector.x * MULTIPLIER, ORIGIN_Y - projVector.y * MULTIPLIER);
            ctx.strokeStyle = LINE_FROM_START_COLOR;
            ctx.stroke();

            ctx.lineWidth = 2;
            drawVector(VECTOR_A);
            drawVector(VECTOR_B);
            ctx.lineWidth = LINE_WIDTH;
        }

        function isWithinHandle(point, vector) {
            const dx = point.x - (ORIGIN_X + vector.x * MULTIPLIER);
            const dy = point.y - (ORIGIN_Y - vector.y * MULTIPLIER);
            return Math.sqrt(dx * dx + dy * dy) < HANDLE_RADIUS;
        }

        canvas.addEventListener("mousedown", function(event) {
            const rect = canvas.getBoundingClientRect();
            const point = { x: event.clientX - rect.left, y: event.clientY - rect.top };

            if (isWithinHandle(point, VECTOR_A)) {
                selectedVector = VECTOR_A;
            } else if (isWithinHandle(point, VECTOR_B)) {
                selectedVector = VECTOR_B;
            }
        });

        canvas.addEventListener("mousemove", function(event) {
            if (selectedVector) {
                const rect = canvas.getBoundingClientRect();
                selectedVector.x = (event.clientX - rect.left - ORIGIN_X) / MULTIPLIER;
                selectedVector.y = (ORIGIN_Y - (event.clientY - rect.top)) / MULTIPLIER;
                redrawCanvas();
            }
        });

        canvas.addEventListener("mouseup", function(event) {
            selectedVector = null;
        });

        redrawCanvas();
    }
    var vectorA = { x: 1, y: 3, color: "red" };
    var vectorB = { x: 4, y: 2, color: "blue" };

    // The currently selected vector
    var selectedVector = null;

    // Function to draw a vector from the origin to a point
    function drawVector(vector) {
        ctx.beginPath();
        ctx.moveTo(250, 250);
        ctx.lineTo(250 + vector.x * 10, 250 - vector.y * 10);
        ctx.strokeStyle = vector.color;
        ctx.stroke();

        // Draw the control handle
        ctx.beginPath();
        ctx.arc(250 + vector.x * 10, 250 - vector.y * 10, 10, 0, 2 * Math.PI);
        ctx.fillStyle = vector.color;
        ctx.fill();
    }

    // Function to draw the grid
    function drawGrid() {
        ctx.beginPath();

        // Draw vertical lines
        for (var x = 0.5; x < 500; x += 10) {
            ctx.moveTo(x, 0);
            ctx.lineTo(x, 500);
        }

        // Draw horizontal lines
        for (var y = 0.5; y < 500; y += 10) {
            ctx.moveTo(0, y);
            ctx.lineTo(500, y);
        }

        ctx.strokeStyle = "#ddd";
        ctx.stroke();

        // Draw the x and y axis
        ctx.beginPath();
        ctx.moveTo(0, 250);
        ctx.lineTo(500, 250);
        ctx.moveTo(250, 0);
        ctx.lineTo(250, 500);
        ctx.strokeStyle = "#000";
        ctx.stroke();
    }
    function dotProduct(vector1, vector2) {
        return vector1.x * vector2.x + vector1.y * vector2.y;
    }
    
    function projection(vectorA, vectorB) {
        var dotProductAB = dotProduct(vectorA, vectorB);
        var dotProductBB = dotProduct(vectorB, vectorB);
        var scalar = dotProductAB / dotProductBB;
        return { x: scalar * vectorB.x, y: scalar * vectorB.y };
    }

    
            
// Function to redraw the canvas
function redrawCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawGrid();
    
    // Draw the projection of vectorA onto vectorB
    var projVector = projection(vectorA, vectorB);
    ctx.beginPath();
    ctx.moveTo(250, 250);
    ctx.lineTo(250 + projVector.x * 10, 250 - projVector.y * 10);
    ctx.strokeStyle = "black";
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.lineWidth = 1;

    

    // Draw the green line from the top of vectorA to the projection
    ctx.beginPath();
    ctx.moveTo(250 + vectorA.x * 10, 250 - vectorA.y * 10);
    ctx.lineTo(250 + projVector.x * 10, 250 - projVector.y * 10);
    ctx.strokeStyle = "green";
    ctx.stroke();

    ctx.lineWidth = 2;
    drawVector(vectorA);
    drawVector(vectorB);
    ctx.lineWidth = 1;
}


    // Function to check if a point is within the control handle of a vector
    function isWithinHandle(point, vector) {
        var dx = point.x - (250 + vector.x * 10);
        var dy = point.y - (250 - vector.y * 10);
        return Math.sqrt(dx * dx + dy * dy) < 10;
    }

    // Mouse down event listener
    canvas.addEventListener("mousedown", function(event) {
        var rect = canvas.getBoundingClientRect();
        var point = { x: event.clientX - rect.left, y: event.clientY - rect.top };

        if (isWithinHandle(point, vectorA)) {
            selectedVector = vectorA;
        } else if (isWithinHandle(point, vectorB)) {
            selectedVector = vectorB;
        }
    });

    // Mouse move event listener
    canvas.addEventListener("mousemove", function(event) {
        if (selectedVector) {
            var rect = canvas.getBoundingClientRect();
            selectedVector.x = (event.clientX - rect.left - 250) / 10;
            selectedVector.y = (250 - (event.clientY - rect.top)) / 10;
            redrawCanvas();
        }
    });

    // Mouse up event listener
    canvas.addEventListener("mouseup", function(event) {
        selectedVector = null;
    });

    // Initial draw
    redrawCanvas();
}
