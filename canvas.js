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

    var vectorA = { x: 1, y: 3, color: "red" };
    var vectorB = { x: 4, y: 2, color: "blue" };

    // The currently selected vector
    var selectedVector = null;

    // Function to draw a vector from the origin to a point

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

    // Calculate the angle between vectorA and vectorB
    var dotProduct = dotProduct(vectorA,vectorB);
    var magnitudeA = Math.sqrt(dotProduct(vectorA,vectorA));
    var magnitudeB = Math.sqrt(dotProduct(vectorB, vectorB));
    var angle = Math.acos(dotProduct / (magnitudeA * magnitudeB));

    // Draw the angle arc
    var startAngle = Math.atan2(vectorA.y, vectorA.x);
    var endAngle = startAngle + angle;

    ctx.beginPath();
    ctx.arc(250, 250, 50, 90, 180);
    ctx.strokeStyle = "red";
    ctx.stroke();
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

    function drawVector(vector) {
        const vectorLabelOffset = 15;

        // Draw vector
        ctx.beginPath();
        ctx.moveTo(ORIGIN_X, ORIGIN_Y);
        ctx.lineTo(ORIGIN_X + vector.x * MULTIPLIER, ORIGIN_Y - vector.y * MULTIPLIER);
        ctx.strokeStyle = vector.color;
        ctx.stroke();

        // Draw handle
        ctx.beginPath();
        ctx.arc(ORIGIN_X + vector.x * MULTIPLIER, ORIGIN_Y - vector.y * MULTIPLIER, HANDLE_RADIUS, 0, 2 * Math.PI);
        ctx.fillStyle = vector.color;
        ctx.fill();

        // Add vector label
        ctx.font = "16px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(
            `(${vector.x}, ${vector.y})`,
            ORIGIN_X + vector.x * MULTIPLIER,
            ORIGIN_Y - vector.y * MULTIPLIER - vectorLabelOffset
        );
    }
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
