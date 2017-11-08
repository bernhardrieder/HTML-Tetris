// (c) Bernhard Rieder, Viktor Was
// we made use of https://www.w3schools.com/graphics/game_intro.asp and http://blog.sklambert.com/galaxian-html5-game/

/* ~~~~~~ TODO SECTION ~~~~~~ */
//todo: create onscreen buttons or touch input? -> https://www.w3schools.com/graphics/game_controllers.asp
//todo: use images of tetris blocks instead of drawing a rectangle? -> https://www.w3schools.com/graphics/game_images.asp

/* ~~~~~~ actual game ~~~~~~ */
var myGamePiece;

var lastLoopTime = 0;
var canvas;

var gameArea = {
    canvas: document.getElementById("background"),
    start: function() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.context = this.canvas.getContext("2d");
    }
}

function init() {
    start();

    //setup game loop
    var loop = function(time = 0) {
        var deltaTime = time - lastLoopTime;
        lastLoopTime = time;
        update(deltaTime);
        render();
        window.requestAnimationFrame(loop, gameArea.canvas);
    }
    //activate game loop
    window.requestAnimationFrame(loop, gameArea.canvas);
}

function start() {
    gameArea.start();
    myGamePiece = new component(30, 30, "red", 10, 10);
}

function update(deltaTime) {
    // todo: update with dirty rectangles
    myGamePiece.update();


    //key mapping - the held shit doesn't work -> our update method deltatime is too fast -> consider other method!
    if (KEY_STATUS.left.pressed && !KEY_STATUS.left.held) {
        moveLeft();
    } else if (KEY_STATUS.right.pressed && !KEY_STATUS.right.held) {
        moveRight();
    } else if (KEY_STATUS.up.pressed && !KEY_STATUS.up.held) {
        rotate();
    } else if (KEY_STATUS.down.pressed && !KEY_STATUS.down.held) {
        moveDown();
    }
    
}

function render() {
    // todo: render just dirty rectangles
}


function component(width, height, color, x, y) {
    this.width = width;
    this.height = height;
    this.x = x;
    this.y = y;

    this.update = function() {
        var ctx = gameArea.context;
        ctx.fillStyle = color;
        ctx.fillRect(this.x, this.y, this.width, this.height);

    }

}

function rotate() {
    // todo
    console.log("rotate action clicked/pressed");
}

function moveDown() {
    // todo
    console.log("moveDown action clicked/pressed");
}

function moveLeft() {
    // todo
    console.log("moveLeft action clicked/pressed");
}

function moveRight() {
    // todo
    console.log("moveRight action clicked/pressed");
}


/* ~~~~~~ controller code from galaxian game ~~~~~~ */
// The keycodes that will be mapped when a user presses a button.
// Original code by Doug McInnes
KEY_CODES = {
    37: "left",
    38: "up",
    39: "right",
    40: "down"
}

// Creates the array to hold the KEY_CODES and sets all their values
// to false. Checking true/flase is the quickest way to check status
// of a key press and which one was pressed when determining
// when to move and which direction.
KEY_STATUS = {
    pressed : false,
    held : false
};
for (code in KEY_CODES) {
    KEY_STATUS[KEY_CODES[code]] = [ false, false ];
}
/**
 * Sets up the document to listen to onkeydown events (fired when
 * any key on the keyboard is pressed down). When a key is pressed,
 * it sets the appropriate direction to true to let us know which
 * key it was.
 */
document.onkeydown = function(e) {
    // Firefox and opera use charCode instead of keyCode to
    // return which key was pressed.
    var keyCode = (e.keyCode) ? e.keyCode : e.charCode;
    if (KEY_CODES[keyCode]) {
        e.preventDefault();

        KEY_STATUS[KEY_CODES[keyCode]].held = KEY_STATUS[KEY_CODES[keyCode]].pressed;
        KEY_STATUS[KEY_CODES[keyCode]].pressed = true;

        //console.log()
    }
}
/**
 * Sets up the document to listen to ownkeyup events (fired when
 * any key on the keyboard is released). When a key is released,
 * it sets teh appropriate direction to false to let us know which
 * key it was.
 */
document.onkeyup = function(e) {
    var keyCode = (e.keyCode) ? e.keyCode : e.charCode;
    if (KEY_CODES[keyCode]) {
        e.preventDefault();
        KEY_STATUS[KEY_CODES[keyCode]].pressed = false;
        KEY_STATUS[KEY_CODES[keyCode]].held = false;
    }
}