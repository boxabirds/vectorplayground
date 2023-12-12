window.onload = function() {
    // Get the canvas and context
    var canvas = document.getElementById("myCanvas");
    var ctx = canvas.getContext("2d");

    // Define the vector coordinates
    var vectorA = { x: 1, y: 3 };
    var vectorB = { x: 4, y: 2 };

    // Function to draw a vector from the origin to a point
    function drawVector(vector, color) {
        ctx.beginPath();
        ctx.moveTo(canvas.width / 2, canvas.height / 2);
        ctx.lineTo(canvas.width / 2 + vector.x * 50, canvas.height / 2 - vector.y * 50);
        ctx.strokeStyle = color;
        ctx.stroke();
    }

    // Function to draw the grid
    function drawGrid() {
        ctx.beginPath();

        // Draw vertical lines
        for (var x = 0.5; x < canvas.width; x += 50) {
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvas.height);
        }

        // Draw horizontal lines
        for (var y = 0.5; y < canvas.height; y += 50) {
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
        }

        ctx.strokeStyle = "#ddd";
        ctx.stroke();

        // Draw the x and y axis
        ctx.beginPath();
        ctx.moveTo(canvas.width / 2, 0);
        ctx.lineTo(canvas.width / 2, canvas.height);
        ctx.moveTo(0, canvas.height / 2);
        ctx.lineTo(canvas.width, canvas.height / 2);
        ctx.strokeStyle = "#000";
        ctx.stroke();
    }

    // Function to redraw the canvas
    function redrawCanvas() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawGrid();
        drawVector(vectorA, "red");
        drawVector(vectorB, "blue");
    }

    // Redraw the canvas initially
    redrawCanvas();

    // Add a click event listener to the canvas
    canvas.addEventListener("click", function(event) {
        var rect = canvas.getBoundingClientRect();
        var x = event.clientX - rect.left - canvas.width / 2;
        var y = canvas.height / 2 - (event.clientY - rect.top);
        vectorA = { x: x / 50, y: y / 50 };
        redrawCanvas();
    });
}
