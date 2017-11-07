
//we made use of https://www.w3schools.com/graphics/game_intro.asp and http://blog.sklambert.com/galaxian-html5-game/

var myGamePiece; 

var lastLoopTime = 0;
var canvas;

var gameArea = {
    canvas: document.getElementById("background"),
    start: function () {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.context = this.canvas.getContext("2d");
    }
}

function init() {
    var loop = function (time = 0) {
        var deltaTime = time - lastLoopTime;
        lastLoopTime = time;
        update(deltaTime);
        render();
        window.requestAnimationFrame(loop, gameArea.canvas);
    }
    window.requestAnimationFrame(loop, gameArea.canvas);
    startGame();
}

function startGame() {
    gameArea.start();
    myGamePiece = new component(30, 30, "red", 10, 120);
}

function component(width, height, color, x, y) {
    this.width = width;
    this.height = height;
    this.x = x;
    this.y = y;
    var ctx = gameArea.context;
    ctx.fillStyle = color;
    ctx.fillRect(this.x, this.y, this.width, this.height);
}

function update(deltaTime) {

}

function render() {

}