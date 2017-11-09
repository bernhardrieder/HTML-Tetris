// (c) Bernhard Rieder, Viktor Was

/**
 * we made use of:
 * https://www.w3schools.com/graphics/game_intro.asp
 * http://blog.sklambert.com/galaxian-html5-game/
 * http://code.bytespider.eu/post/21438674255/dirty-rectangles
 */

/* ~~~~~~ TODO SECTION ~~~~~~ */
//todo: create onscreen buttons or touch input? -> https://www.w3schools.com/graphics/game_controllers.asp
//todo: use images of tetris blocks instead of drawing a rectangle? -> https://www.w3schools.com/graphics/game_images.asp

/* ~~~~~~ actual game ~~~~~~ */

var fieldSize = {
    x: 10,
    y: 20
}
var field = [fieldSize.x, fieldSize.y];
for (x = 0; x < fieldSize.x; ++x) {
    for (y = 0; y < fieldSize.y; ++y) {
        field[x, y] = 0; //no block on it
    }
}

var dirtyRectangles = [];
var blocksOnField = [];
var backgroundCanvas = document.getElementById("background");
var backgroundContext = backgroundCanvas.getContext("2d");
var fieldCanvas = document.getElementById("main"); 
var fieldCanvasContext = fieldCanvas.getContext("2d");
var lastLoopTime = 0;
var isGameOver = false;

function init() {
    //setup background canvas
    backgroundCanvas.width = window.innerWidth;
    backgroundCanvas.height = window.innerHeight;
   
    //setup main canvas
    fieldCanvas.width = window.innerWidth;
    fieldCanvas.height = window.innerHeight;

    //setup game loop
    var loop = function (time = 0) {
        var deltaTime = time - lastLoopTime;
        lastLoopTime = time;
        update(deltaTime);
        render();
        window.requestAnimationFrame(loop, backgroundCanvas);
    }
    //activate game loop
    window.requestAnimationFrame(loop, backgroundCanvas);

    //setup walls
    for (var x = 0; x <= fieldSize.x + 1; ++x) {
        for (var y = 0; y <= fieldSize.y; ++y) {
            if (x === 0 || x === fieldSize.x + 1 || y === fieldSize.y) {
                new Block(y % 2 === 0 ? "grey" : "black", x * blockSize, y * blockSize).draw(backgroundContext);
            }
        }
    }

    //start actual game
    start();
}

var blockSize = 30;

function Block(color, x, y) {
    this.width = blockSize;
    this.height = blockSize;
    this.x = x;
    this.y = y;
    this.dirty = true;

    this.draw = function (canvasContext) {
        canvasContext.fillStyle = color;
        canvasContext.fillRect(this.x, this.y, this.width, this.height);
        this.dirty = false;
    }
}

function FieldBlock(color, fieldX, fieldY) {
    if (field[fieldX, fieldY] === 1) {
        gameOver();
        return;
    }

    this.getCanvasPositionFromFieldPosition = function (x, y) {
        return {
            x: blockSize + x * blockSize,
            y: y * blockSize
        }
    }

    var pos = this.getCanvasPositionFromFieldPosition(fieldX, fieldY);
    Block.call(this, color, pos.x, pos.y);

    this.fieldPosition = { x: fieldX, y: fieldY}; 
    field[fieldX, fieldY] = 1;

    this.moveDown = function () {
        //check if block can move
        if (this.fieldPosition.y + 1 >= fieldSize.y || field[this.fieldPosition.x, this.fieldPosition.y + 1] === 1) {
            return;
        }

        var originalX = this.x;
        var originalY = this.y;

        field[this.fieldPosition.x, this.fieldPosition.y++] = 0;
        field[this.fieldPosition.x, this.fieldPosition.y] = 1;

        this.y += blockSize;

        if (originalX !== this.x || originalY !== this.y) {
            this.dirty = true;

            // add this rectangle to the dirty rectangles array
            // note: it's the rectangle before the movement was made
            dirtyRectangles.push({
                x: originalX,
                y: originalY,
                width: this.width,
                height: this.height
            });
        }
    }

   
}
FieldBlock.prototype = Block;

function start() {
    blocksOnField.push(new FieldBlock("red", 0, 0));
}

var automaticMoveDownTimespan = 300; // I HAVE NO FUCKING CLUE WHAT DELTATIME IS?! ->> 300 is approx. around 1 second???
var elapsedTimeForAutomaticMoveDown = 0;

var test_spawnBlockEvery = 1000;
var test_elapsedTimeForSpawn = 0;
function update(deltaTime) {
    if (isGameOver) {
        return;
    }
    elapsedTimeForAutomaticMoveDown += deltaTime;
    if (elapsedTimeForAutomaticMoveDown >= automaticMoveDownTimespan) {
        blocksOnField.forEach(function(item) {
            item.moveDown();
        });
        elapsedTimeForAutomaticMoveDown = 0;
    }

    test_elapsedTimeForSpawn += deltaTime;
    if (test_elapsedTimeForSpawn >= test_spawnBlockEvery) {
        blocksOnField.push(new FieldBlock("red", 0, 0));
        test_elapsedTimeForSpawn = 0;
    }

    //key mapping - the held shit doesn't work -> our update method deltatime is too fast -> consider other method!
    if (KEY_STATUS.left.pressed && !KEY_STATUS.left.held) {
        moveLeft();
    } else if (KEY_STATUS.right.pressed && !KEY_STATUS.right.held) {
        moveRight();
    } else if (KEY_STATUS.up.pressed && !KEY_STATUS.up.held) {
        rotate();
    } else if (KEY_STATUS.down.pressed && !KEY_STATUS.down.held) {
        drop();
    }
}

function render() {
    var i, dirtyRectangleCount = dirtyRectangles.length;
    for (i = 0; i < dirtyRectangleCount; i += 1) {
        var rect = dirtyRectangles.pop();

        // clear this rectangle from the canvas
        fieldCanvasContext.clearRect(rect.x, rect.y, rect.width, rect.height);
    }

    //render dirty blocks
    blocksOnField.forEach(function(block) {
        if (block.dirty) {
            block.draw(fieldCanvasContext);
        }
    });
}

function rotate() {
    // todo
    console.log("rotate action clicked/pressed");
}

function drop() {
    // todo
    console.log("drop action clicked/pressed");
}

function moveLeft() {
    // todo
    console.log("moveLeft action clicked/pressed");
}

function moveRight() {
    // todo
    console.log("moveRight action clicked/pressed");
}

function gameOver() {
    console.log("GAME OVER!");
    isGameOver = true;
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
    pressed: false,
    held: false
};
for (code in KEY_CODES) {
    KEY_STATUS[KEY_CODES[code]] = [false, false];
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