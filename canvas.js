window.onload = function() {
    var canvas = document.getElementById("myCanvas");
    var ctx = canvas.getContext("2d");

    // Vectors a and b
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

    // Function to redraw the canvas
    function redrawCanvas() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawGrid();
        drawVector(vectorA);
        drawVector(vectorB);

        // Draw the projection of vectorA onto vectorB
        var dotProduct = vectorA.x * vectorB.x + vectorA.y * vectorB.y;
        var lenA = Math.sqrt(vectorA.x * vectorA.x + vectorA.y * vectorA.y);
        var proj = dotProduct / (lenA * lenA);
        var projVector = { x: proj * vectorA.x, y: proj * vectorA.y };

        ctx.beginPath();
        ctx.moveTo(250, 250);
        ctx.lineTo(250 + projVector.x * 10, 250 - projVector.y * 10);
        ctx.strokeStyle = "black";
        ctx.lineWidth = 2;
        ctx.stroke();
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
