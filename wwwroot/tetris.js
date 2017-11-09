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

var grid = {
    size: { x: 10, y: 20 },
    matrix: [],
    blocksOnField: [],
    spawnX: 0,

    init: function () {
        this.spawnX = this.size.x / 2;
        for (var x = 0; x < this.size.x; ++x) {
            this.matrix[x] = [];
            for (var y = 0; y < this.size.y; ++y)
                this.matrix[x][y] = undefined;
        }
    },

    getCanvasPositionFromGridPosition: function(x, y) {
        return {
            x: blockSize /*wall*/+ x * blockSize,
            y: y * blockSize
        }
    },

    spawnBlock: function(block = FieldBlock) {
        this.blocksOnField.push(block);

        //handle spawn
        if (grid.matrix[this.spawnX][0]) {
            gameOver();
            return;
        }
        block.init(this.getCanvasPositionFromGridPosition(this.spawnX, 0));
        grid.matrix[this.spawnX][0] = block;
        block.fieldPosition = { x: this.spawnX, y: 0 };
    },

    moveBlockDown : function(block) {
        //check if block can move
        if (block.fieldPosition.y + 1 >= grid.size.y ||
            grid.matrix[block.fieldPosition.x][block.fieldPosition.y + 1]) {
            return false;
        }

        grid.matrix[block.fieldPosition.x][block.fieldPosition.y] = undefined;
        grid.matrix[block.fieldPosition.x][++block.fieldPosition.y] = block;

        block.moveDown();
        return true;
    }
}

var dirtyRectangles = [];
var backgroundCanvas = document.getElementById("background");
var backgroundContext = backgroundCanvas.getContext("2d");
var fieldCanvas = document.getElementById("main");
var fieldCanvasContext = fieldCanvas.getContext("2d");
var lastLoopTime = 0;
var isGameOver = false;

function init() {
    grid.init();

    //setup background canvas
    backgroundCanvas.width = window.innerWidth;
    backgroundCanvas.height = window.innerHeight;

    //setup main canvas
    fieldCanvas.width = window.innerWidth;
    fieldCanvas.height = window.innerHeight;

    //setup game loop
    var loop = function(time = 0) {
        var deltaTime = time - lastLoopTime;
        lastLoopTime = time;
        update(deltaTime);
        render();
        window.requestAnimationFrame(loop, backgroundCanvas);
    }
    //activate game loop
    window.requestAnimationFrame(loop, backgroundCanvas);

    //setup walls
    for (var x = 0; x <= grid.size.x + 1; ++x) {
        for (var y = 0; y <= grid.size.y; ++y) {
            if (x === 0 || x === grid.size.x + 1 || y === grid.size.y) {
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

    this.draw = function(canvasContext) {
        canvasContext.fillStyle = color;
        canvasContext.fillRect(this.x, this.y, this.width, this.height);
        this.dirty = false;
    }

    this.destroy = function() {
        dirtyRectangles.push({
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height
        });
    }
}

function FieldBlock(color) {
    this.fieldPosition = { x: 0, y: 0 };

    this.init = function(canvas = {x, y}) {
        Block.call(this, color, canvas.x, canvas.y);
    }
    this.moveDown = function() {
        var originalX = this.x;
        var originalY = this.y;
        
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

var blockParams = {
    rotationPivot: { x: 0, y: 0 },
    blockMatrix : [
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0]
    ],
    rotationBlockMatrix: [[
            [0, 0, 0, 0],
            [0, 0, 0, 0],
            [0, 0, 0, 0],
            [0, 0, 0, 0]
        ],
        [
            [0, 0, 0, 0],
            [0, 0, 0, 0],
            [0, 0, 0, 0],
            [0, 0, 0, 0]
        ],
        [
            [0, 0, 0, 0],
            [0, 0, 0, 0],
            [0, 0, 0, 0],
            [0, 0, 0, 0]
        ],
        [
            [0, 0, 0, 0],
            [0, 0, 0, 0],
            [0, 0, 0, 0],
            [0, 0, 0, 0]
        ]
    ]
}
var blockItems = {
    quadratic: blockParams,
    normalL: blockParams,
    reversedL: blockParams,
    I: blockParams,
    normalS: blockParams,
    reversedS: blockParams,
    T: blockParams
};
//blockItems.quadratic.blockMatrix = [
//    [0, 1, 1, 0],
//    [0, 1, 1, 0],
//    [0, 0, 0, 0],
//    [0, 0, 0, 0]
//];
blockItems.normalL.blockMatrix = [
    [0, 1, 0, 0],
    [0, 1, 0, 0],
    [0, 1, 1, 0],
    [0, 0, 0, 0]
];

blockItems.normalL.rotationBlockMatrix = [[
        [0, 0, 1, 0],
        [1, 1, 1, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0]
    ],
    [
        [0, 1, 0, 0],
        [0, 1, 0, 0],
        [0, 1, 1, 0],
        [0, 0, 0, 0]
    ],
    [
        [0, 0, 0, 0],
        [1, 1, 1, 0],
        [1, 0, 0, 0],
        [0, 0, 0, 0]
    ],
    [
        [1, 1, 0, 0],
        [0, 1, 0, 0],
        [0, 1, 0, 0],
        [0, 0, 0, 0]
    ]
]
//blockItems.reversedL.blockMatrix = [
//    [0, 0, 1, 0],
//    [0, 0, 1, 0],
//    [0, 1, 1, 0],
//    [0, 0, 0, 0]
//];
//blockItems.I.blockMatrix = [
//    [1, 1, 1, 1],
//    [0, 0, 0, 0],
//    [0, 0, 0, 0],
//    [0, 0, 0, 0]
//];
//blockItems.normalS.blockMatrix = [
//    [0, 1, 1, 0],
//    [1, 1, 0, 0],
//    [0, 0, 0, 0],
//    [0, 0, 0, 0]
//];
//blockItems.reversedS.blockMatrix = [
//    [1, 1, 0, 0],
//    [0, 1, 1, 0],
//    [0, 0, 0, 0],
//    [0, 0, 0, 0]
//];
function start() {

}

var automaticMoveDownTimespan = 300; // I HAVE NO FUCKING CLUE HOW MUCH TIME THIS IS?! ->> cause a value of 300 is approx. around one second???
var elapsedTimeForAutomaticMoveDown = 0;

var test_spawnBlockEvery = automaticMoveDownTimespan*2;
var test_elapsedTimeForSpawn = 0;
var test_x = 0;
var test_xIncrementMultiplier = 1;

var clearRowActivated = false;
var clearRows = [];
var timeToClearRow = automaticMoveDownTimespan;
var elapsedTimeForClearRow = 0;

function update(deltaTime) {
    if (isGameOver) {
        return;
    }

    //should clear some rows?
    if (clearRowActivated) {
        elapsedTimeForClearRow += deltaTime;
        if (elapsedTimeForClearRow >= timeToClearRow) {
            while (clearRows.length > 0) {
                var y = clearRows.pop();
                for (var x = 0; x < grid.size.x; ++x) {
                    grid.matrix[x][y] = undefined;
                }
                var i = grid.blocksOnField.length;
                while (i--) {
                    if (grid.blocksOnField[i] && grid.blocksOnField[i].fieldPosition.y === y) {
                        grid.blocksOnField[i].destroy();
                        grid.blocksOnField[i] = undefined;
                        grid.blocksOnField.splice(i, 1);
                    }
                }
            }
            clearRowActivated = false;
            elapsedTimeForClearRow = 0;
        }
    }
    //check if there is a full row and destroy it!
    for (var y = 0; y < grid.size.y; ++y) {
        var count = 0;
        //count === x -> we can stop counting because there is a hole!
        for (var x = 0; x < grid.size.x && count === x; ++x) {
            count += grid.matrix[x][y] ? 1 : 0;
        }
        //did we find a full row?
        if (count === grid.size.x) {
            if ($.inArray(y, clearRows) === -1) {
                //clear this row
                clearRows.push(y);
            }
            clearRowActivated = true;
        }
    }

    //automatic move down
    elapsedTimeForAutomaticMoveDown += deltaTime;
    if (elapsedTimeForAutomaticMoveDown >= automaticMoveDownTimespan) {
        grid.blocksOnField.forEach(function (item) {
            grid.moveBlockDown(item);
            //item.moveDown();
        });
        elapsedTimeForAutomaticMoveDown = 0;
    }

    //automatic spawn for testing purposes
    test_elapsedTimeForSpawn += deltaTime;
    if (test_elapsedTimeForSpawn >= test_spawnBlockEvery) {
        grid.spawnBlock(new FieldBlock("red"));
        if (test_x + 1 * test_xIncrementMultiplier >= grid.size.x || test_x + 1 * test_xIncrementMultiplier < 0) {
            test_xIncrementMultiplier *= -1;
        }
        test_x += test_xIncrementMultiplier * 1;
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
    while (dirtyRectangles.length > 0) {
        var rect = dirtyRectangles.pop();

        // clear this rectangle from the canvas
        fieldCanvasContext.clearRect(rect.x, rect.y, rect.width, rect.height);
    }

    //render dirty blocks delete
    grid.blocksOnField.forEach(function(block) {
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