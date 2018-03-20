// (c) Bernhard Rieder, Viktor Was

/**
 * we made use of:
 * https://www.w3schools.com/graphics/game_intro.asp
 * http://blog.sklambert.com/galaxian-html5-game/
 * http://code.bytespider.eu/post/21438674255/dirty-rectangles
 */

var dirtyRectangles = [];
var backgroundCanvas = document.getElementById("background");
var backgroundContext = backgroundCanvas.getContext("2d");
var gridCanvas = document.getElementById("main");
var gridCanvasContext = gridCanvas.getContext("2d");
var lastLoopTime = 0;
var isGameOver = false;
var gameOverDIV = document.getElementById("gameOver");

function onPressed(evt) {

	// get event position
	var mx = evt.offsetX, my = evt.offsetY;

	if (mx == null || my == null) {
		mx = evt.touches[0].clientX;
		my = evt.touches[0].clientY;
	}

	var leftSideX = gridCanvas.width * 0.25;
	var rightSideX = gridCanvas.width * 0.75;
	var centerY = gridCanvas.height *0.5;

	if (isGameOver === true) {
		KEY_STATUS["enter"].pressed = true;
	}
	else {
		// check if within
		if (mx <= leftSideX) {
			// move left
			KEY_STATUS["left"].pressed = true;
		}
		else if (mx >= rightSideX) {
			// move right
			KEY_STATUS["right"].pressed = true;
		}
		else if (mx > leftSideX && mx < rightSideX) {
			if (my < centerY) {
				// rotate
			KEY_STATUS["up"].pressed = true;
			}
			else if (my >= centerY) {
				// move down
			KEY_STATUS["down"].pressed = true;
			}
		}
	}
}

function onReleased(evt) {

	KEY_STATUS["left"].pressed = false;
	KEY_STATUS["right"].pressed = false;
	KEY_STATUS["up"].pressed = false;
	KEY_STATUS["down"].pressed = false;
	KEY_STATUS["enter"].pressed = false;
}

var blockSize;

//initialises the whole game
function init() {
    //setup background canvas
    backgroundCanvas.width = window.innerWidth;
    backgroundCanvas.height = window.innerHeight;

    //setup main canvas
    gridCanvas.width = window.innerWidth;
    gridCanvas.height = window.innerHeight;

    // dynamic block scaling
    blockSize = gridCanvas.width / 12.0;
    var blockHeight = gridCanvas.height / 21.0;

    if(blockHeight < blockSize)
    {
    	blockSize = blockHeight;
    }
    // console.log("blockSize: " + blockSize);

    //setup touch input
	var evt1 = "touchstart";
	var evt2 = "touchend";
    if (gridCanvas.width >= 500) {
		// stylesheet = document.styleSheets[0];
		// stylesheet.cssRules[0]

		// viewport.style.border = "1px solid #000";
		// canvas.style.border = "1px solid #000";
		evt1 = "mousedown";
		evt2 = "mouseup";
	}

    document.addEventListener(evt1, onPressed);
    document.addEventListener(evt2, onReleased);

    //setup game loop like in course slide
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
                var block = new Block(y % 2 === 0 ? "grey" : "black");
                block.setCanvasPosition({ x: x * blockSize, y: y * blockSize });
                block.draw(backgroundContext);
            }
        }
    }

    //start actual game
    startGame();
}

//this is an standard random function - there is nothing to say
function randomIntFromInterval(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}

//https://stackoverflow.com/questions/1484506/random-color-generator
function getRandomColor() {
    var letters = '0123456789ABCDEF';
    var color = '#';
    for (var i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

//holds and interacts with every block in the game
var grid = {
    size: { x: 10, y: 20 },
    matrix: [],
    blocksOnField: [],
    activeBlockContainer: 0,

    init: function() {
        for (var x = 0; x < this.size.x; ++x) {
            this.matrix[x] = [];
            for (var y = 0; y < this.size.y; ++y)
                this.matrix[x][y] = undefined;
        }
    },

    getCanvasPositionFromGridPosition: function(x, y) {
        return {
            x: blockSize /* this is the wall*/ + x * blockSize,
            y: y * blockSize
        }
    },

    spawnNewBlockContainer: function () {
        grid.spawnBlockContainer(new BlockContainer(getRandomColor(), blockContainerLUTs[randomIntFromInterval(0, blockContainerLUTs.length - 1)]));
    },

    spawnBlockContainer: function(container = BlockContainer) {
        this.activeBlockContainer = container;
        container.init();

        var triggerGameOver = false;
        var spawnX = (this.size.x - container.blockMatrixLUT.length) / 2;
        this.activeBlockContainer.upperLeftGridCornerPosition = { x: spawnX, y: 0 };
        for (var y = 0; y < container.blockMatrixLUT[0].length; ++y) {
            for (var x = 0; x < container.blockMatrixLUT.length; ++x) {

                if (container.blockMatrixLUT[container.currentRotation][x][y]) {
                    var block = new Block(container.color);
                    block.container = container;
                    container.blocks.push(block);
                    this.blocksOnField.push(block);

                    block.setCanvasPosition(this.getCanvasPositionFromGridPosition(spawnX + x, y));

                    //is there on this position already something?
                    if (this.matrix[spawnX + x][y]) {
                        triggerGameOver = true;
                    }
                    this.matrix[spawnX + x][y] = block;
                    block.gridPosition = { x: spawnX + x, y: y };
                }

            }
        }

        if (triggerGameOver) {
            gameOver();
        }

    },

    isMoveBlockDownPossible: function(block = Block) {
        //check if block can move
        if (block.gridPosition.y + 1 >= this.size.y) {
            return false;
        }

        var neighbor = this.matrix[block.gridPosition.x][block.gridPosition.y + 1];
        if (neighbor && neighbor.container !== block.container) {
            return false;
        }
        return true;
    },

    isMoveBlockSidewaysPossible: function (block = Block, toTheRight = false) {
        //check if block can move

        if (toTheRight && block.gridPosition.x + 1 >= this.size.x || !toTheRight && block.gridPosition.x - 1 < 0) {
            return false;
        }
        var posX = block.gridPosition.x + toTheRight ? 1 : -1;
        var neighbor = this.matrix[posX][block.gridPosition.y];
        if (neighbor && neighbor.container !== block.container) {
            return false;
        }
        return true;
    },


    isBlockContainerRotationPossible: function (rotation) {
        var matrixNew = this.activeBlockContainer.blockMatrixLUT[rotation];

        //get all current blocks and try to fit them into the other
        var testGridPositions = [];
        for (var x = this.activeBlockContainer.upperLeftGridCornerPosition.x, xTest = 0;
            x < this.activeBlockContainer.upperLeftGridCornerPosition.x + matrixNew.length;
            ++x, ++xTest) {
            for (var y = this.activeBlockContainer.upperLeftGridCornerPosition.y, yTest = 0;
                y < this.activeBlockContainer.upperLeftGridCornerPosition.y + matrixNew[0].length;
                ++y, ++yTest) {
                if (matrixNew[xTest][yTest] === 1) {
                    testGridPositions.push({ x: x, y: y });
                }
            }
        }

        var isPossible = true;
        testGridPositions.forEach(function(pos = { x, y }) {
            if (pos.x >= grid.size.x || pos.x < 0 || pos.y >= grid.size.y || pos.y < 0 || grid.matrix[pos.x][pos.y] && grid.matrix[pos.x][pos.y].container !== grid.activeBlockContainer) {
                isPossible &= false;
                return;
            }
        });

        return { isRotationPossible: isPossible, newGridPositions: testGridPositions };
    },

    moveActiveBlockContainerDown: function() {
        var canMove = true;
        this.activeBlockContainer.blocks.forEach(function(block = Block) {
            canMove &= grid.isMoveBlockDownPossible(block);
        });
        if (canMove) {
            ++this.activeBlockContainer.upperLeftGridCornerPosition.y;
            this.activeBlockContainer.blocks.forEach(function(block = Block) {
                grid.matrix[block.gridPosition.x][block.gridPosition.y] = undefined;
            });
            this.activeBlockContainer.blocks.forEach(function(block = Block) {
                block.move(true, false, false);
            });
            this.activeBlockContainer.blocks.forEach(function(block = Block) {
                grid.matrix[block.gridPosition.x][++block.gridPosition.y] = block;
            });
        } else {
            //the block is on the ground or another block!
            this.activeBlockContainer.blocks.forEach(function(block = Block) {
                block.container = undefined;
            });
            this.activeBlockContainer = undefined;
            checkForFullRow = true;
        }
    },

    moveActiveBlockContainerSideways: function(toTheRight = false) {
        var canMove = true;
        this.activeBlockContainer.blocks.forEach(function (block = Block) {
            canMove &= grid.isMoveBlockSidewaysPossible(block, toTheRight);
        });
        if (canMove) {
            if (toTheRight) {
                ++this.activeBlockContainer.upperLeftGridCornerPosition.x;
            } else {
                --this.activeBlockContainer.upperLeftGridCornerPosition.x;
            }
            this.activeBlockContainer.blocks.forEach(function (block = Block) {
                grid.matrix[block.gridPosition.x][block.gridPosition.y] = undefined;
            });
            this.activeBlockContainer.blocks.forEach(function (block = Block) {
                block.move(false, toTheRight, !toTheRight);
            });
            this.activeBlockContainer.blocks.forEach(function (block = Block) {
                block.gridPosition.x += toTheRight ? 1 : -1;
                grid.matrix[block.gridPosition.x][block.gridPosition.y] = block;
            });
        }
    },

    rotateActiveBlockContainer: function () {
        var rotation = (this.activeBlockContainer.currentRotation +1)% 4; // there are just 4 rotations possible
        var rotationPossibleAndGridPositions = grid.isBlockContainerRotationPossible(rotation);
        if (rotationPossibleAndGridPositions.isRotationPossible) {
            this.activeBlockContainer.currentRotation = rotation;
            this.activeBlockContainer.blocks.forEach(function (block = Block) {
                grid.matrix[block.gridPosition.x][block.gridPosition.y] = undefined;
            });
            var positions = rotationPossibleAndGridPositions.newGridPositions;
            for (var i = 0; i < positions.length; ++i) {
                grid.activeBlockContainer.blocks[i].setCanvasPosition(grid.getCanvasPositionFromGridPosition(positions[i].x, positions[i].y));
                grid.matrix[positions[i].x][positions[i].y] = grid.activeBlockContainer.blocks[i];
                grid.activeBlockContainer.blocks[i].gridPosition = { x: positions[i].x, y: positions[i].y };
            }
        }
    },

    //this is used for all blocks if a row will be cleared
    moveBlockDown: function(block, yDelta = 1) {
        //check if block can move
        if (!block || block.container ||
            block.gridPosition.y + 1 >= this.size.y ||
            this.matrix[block.gridPosition.x][block.gridPosition.y + 1]) {
            return;
        }

        this.matrix[block.gridPosition.x][block.gridPosition.y] = undefined;
        this.matrix[block.gridPosition.x][block.gridPosition.y + yDelta] = block;

        block.move(true, false,false);
    },

    debug: function () {
        var string = "";
        for (var y = 0; y < grid.size.y; ++y) {
            for (var x = 0; x < grid.size.x; ++x) {
                string += this.matrix[x][y] ? 1 : 0;
            }
            string += "\n";
        }
        console.log(string);
    }

}

function Block(color) {
    this.width = blockSize;
    this.height = blockSize;
    this.canvasPosition = { x: 100, y: 100 };
    this.dirty = true;
    this.container = undefined;
    this.gridPosition = { x: 0, y: 0 };
    this.color = color;

    this.setCanvasPosition = function ({ x, y }) {
        var originalX = this.canvasPosition.x;
        var originalY = this.canvasPosition.y;

        this.canvasPosition.x = x;
        this.canvasPosition.y = y;

        if (originalX !== this.canvasPosition.x || originalY !== this.canvasPosition.y) {
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
    this.draw = function(canvasContext) {
        canvasContext.fillStyle = this.color;
        canvasContext.fillRect(this.canvasPosition.x, this.canvasPosition.y, this.width, this.height);
        this.dirty = false;
    }

    this.destroy = function() {
        dirtyRectangles.push({
            x: this.canvasPosition.x,
            y: this.canvasPosition.y,
            width: this.width,
            height: this.height
        });
    }

    this.move = function(down = false, right = false, left = false) {
        var x = this.canvasPosition.x;
        var y = this.canvasPosition.y;

        if (down) {
            y += blockSize;
        }
        if (right) {
            x += blockSize;
        } else if (left) {
            x -= blockSize;
        }

        this.setCanvasPosition({x,y});
    }
}

function BlockContainer(color, params = rotationMatrixLUT) {
    this.currentRotation = 0;
    this.color = color;
    this.blocks = [];
    this.blockMatrixLUT = [];
    this.upperLeftGridCornerPosition = { x: 0, y: 0 };

    this.init = function() {
        for (var i = 0; i < params.length; ++i) {
            this.blockMatrixLUT[i] = [];
            for (var y = 0; y < params[0].length; ++y) {
                this.blockMatrixLUT[i][y] = [];
                for (var x = 0; x < params[0][0].length; ++x)
                    this.blockMatrixLUT[i][y][x] = undefined;
            }
        }

        //swap x and y! -> swapped axis makes it easier in container LUT definition!
        for (var i = 0; i < params.length; ++i) {
            for (var y = 0; y < params[0].length; ++y) {
                for (var x = 0; x < params[0][0].length; ++x) {
                    this.blockMatrixLUT[i][y][x] = params[i][x][y];
                }
            }
        }
    }
}

function startGame() {
    //clear grid;
    grid.blocksOnField.forEach(function (block) {
        block.destroy();
    });
    grid.blocksOnField = [];
    grid.init();

    //reset game over
    isGameOver = false;
    gameOverDIV.style.visibility = "hidden";

    //spawn first stone
    grid.spawnNewBlockContainer();
}

var automaticMoveDownTimespan = 300; // I HAVE NO FUCKING CLUE HOW MUCH TIME THIS IS?! ->> cause a value of 300 is approx. around one second???
var elapsedTimeForAutomaticMoveDown = 0;

var clearRowActivated = false;
var rowsToClear = [];
var checkForFullRow = false;
var lowestRowToClear = 0;
function update(deltaTime) {
    if (isGameOver) {
        if (KEY_STATUS.enter.pressed) {
            startGame();
        }
        return;
    }

    if (checkForFullRow) {
        //check if there is a full row and destroy it!
        for (var y = 0; y < grid.size.y; ++y) {
            var count = 0;
            //count === x -> we can stop counting because there is a hole!
            for (var x = 0; x < grid.size.x && count === x; ++x) {
                count += grid.matrix[x][y] ? 1 : 0;
            }
            //did we find a full row?
            if (count === grid.size.x) {
                //this checks if y is already in the rowsToClear array!
                //if ($.inArray(y, rowsToClear) === -1) {
                    //clear this row
                    rowsToClear.push(y);
                //}
                clearRowActivated = true;
            }
        }
        checkForFullRow = false;
    }

    //should clear some rows?
    if (clearRowActivated) {
        var lowestRowToClear = 0;
        var rowsToClearTmp = rowsToClear.length;
        while (rowsToClear.length > 0) {
            var rowToClear = rowsToClear.pop();
            if (lowestRowToClear < rowToClear) {
                lowestRowToClear = rowToClear;
            }
            //clears the row in the grid.matrix
            for (var x = 0; x < grid.size.x; ++x) {
                grid.matrix[x][rowToClear] = undefined;
            }

            //destroys the row
            var i = grid.blocksOnField.length;
            while (i--) {
                if (grid.blocksOnField[i] && grid.blocksOnField[i].gridPosition.y === rowToClear) {
                    grid.blocksOnField[i].destroy();
                    grid.blocksOnField[i] = undefined;
                    grid.blocksOnField.splice(i, 1);
                }
            }
        }
        //move all blocks down
        for (var y = lowestRowToClear; y >= 0; --y) {
            for (var x = 0; x < grid.size.x; ++x) {
                if (grid.matrix[x][y]) {
                    grid.moveBlockDown(grid.matrix[x][y]);
                }
            }
        }
        clearRowActivated = false;

    }

    //automatic move down
    elapsedTimeForAutomaticMoveDown += deltaTime;
    if (elapsedTimeForAutomaticMoveDown >= automaticMoveDownTimespan) {
        grid.moveActiveBlockContainerDown();
        elapsedTimeForAutomaticMoveDown = 0;
    }

    //key mapping
    if (KEY_STATUS.left.pressed && !inputLock.left) {
        moveLeft();
    } else if (KEY_STATUS.right.pressed && !inputLock.right) {
        moveRight();
    } else if (KEY_STATUS.up.pressed && !inputLock.rotate) {
        rotate();
    } else if (KEY_STATUS.down.pressed && !inputLock.drop) {
        drop();
    }

    inputLock.left = KEY_STATUS.left.pressed;
    inputLock.right = KEY_STATUS.right.pressed;
    inputLock.rotate = KEY_STATUS.up.pressed;

    //grid.debug();

    if (!grid.activeBlockContainer) {
        grid.spawnNewBlockContainer();
    }
}

var inputLock = {
    left: false,
    right: false,
    drop: false,
    rotate: false
}

function render() {
    //clear dirty rectangles
    while (dirtyRectangles.length > 0) {
        var rect = dirtyRectangles.pop();

        // clear this rectangle from the canvas
        gridCanvasContext.clearRect(rect.x, rect.y, rect.width, rect.height);
    }

    //render dirty blocks
    grid.blocksOnField.forEach(function(block) {
        if (block.dirty) {
            block.draw(gridCanvasContext);
        }
    });
}

function rotate() {
    grid.rotateActiveBlockContainer();
}

function drop() {
    grid.moveActiveBlockContainerDown();
    elapsedTimeForAutomaticMoveDown = 0;
}

function moveLeft() {
    grid.moveActiveBlockContainerSideways(false);
}

function moveRight() {
    grid.moveActiveBlockContainerSideways(true);
}

function gameOver() {
    console.log("GAME OVER!");
    isGameOver = true;
    gameOverDIV.style.visibility = "visible";
}

/* ~~~~~~ controller code from galaxian game ~~~~~~ */
// The keycodes that will be mapped when a user presses a button.
// Original code by Doug McInnes
KEY_CODES = {
    13: "enter",
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
    pressed: false
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
    }
}

/* ~~~~~~ look up tables for block containers ~~~~~~ */
//LUT template
var rotationMatrixLUT = [
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
    ],
    [
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0]
    ]
];

var blockContainerList = {
    normalL : rotationMatrixLUT,
    reversedL: rotationMatrixLUT,
    I: rotationMatrixLUT,
    cube: rotationMatrixLUT,
    normalS: rotationMatrixLUT,
    reversedS: rotationMatrixLUT,
    T: rotationMatrixLUT
};

var blockContainerLUTs = [];

for (var i = 0; i <= 6; i++) {
    blockContainerLUTs[i] = rotationMatrixLUT;
}
//from https://i.stack.imgur.com/JLRFu.png
// normal L
blockContainerLUTs[0] = [
    [
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
];
// reversed L
blockContainerLUTs[1] = [
    [
        [1, 0, 0, 0],
        [1, 1, 1, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0]
    ],
    [
        [0, 1, 1, 0],
        [0, 1, 0, 0],
        [0, 1, 0, 0],
        [0, 0, 0, 0]
    ],
    [
        [0, 0, 0, 0],
        [1, 1, 1, 0],
        [0, 0, 1, 0],
        [0, 0, 0, 0]
    ],
    [
        [0, 1, 0, 0],
        [0, 1, 0, 0],
        [1, 1, 0, 0],
        [0, 0, 0, 0]
    ]
];
// I
blockContainerLUTs[2] = [
    [
        [0, 0, 0, 0],
        [1, 1, 1, 1],
        [0, 0, 0, 0],
        [0, 0, 0, 0]
    ],
    [
        [0, 0, 1, 0],
        [0, 0, 1, 0],
        [0, 0, 1, 0],
        [0, 0, 1, 0]
    ],
    [
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [1, 1, 1, 1],
        [0, 0, 0, 0]
    ],
    [
        [0, 1, 0, 0],
        [0, 1, 0, 0],
        [0, 1, 0, 0],
        [0, 1, 0, 0]
    ]
];
// cube
blockContainerLUTs[3] = [
    [
        [0, 1, 1, 0],
        [0, 1, 1, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0]
    ],
    [
        [0, 1, 1, 0],
        [0, 1, 1, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0]
    ],
    [
        [0, 1, 1, 0],
        [0, 1, 1, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0]
    ],
    [
        [0, 1, 1, 0],
        [0, 1, 1, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0]
    ]
];
// normal S
blockContainerLUTs[4] = [
    [
        [0, 1, 1, 0],
        [1, 1, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0]
    ],
    [
        [0, 1, 0, 0],
        [0, 1, 1, 0],
        [0, 0, 1, 0],
        [0, 0, 0, 0]
    ],
    [
        [0, 0, 0, 0],
        [0, 1, 1, 0],
        [1, 1, 0, 0],
        [0, 0, 0, 0]
    ],
    [
        [1, 0, 0, 0],
        [1, 1, 0, 0],
        [0, 1, 0, 0],
        [0, 0, 0, 0]
    ]
];
// reversed S
blockContainerLUTs[5] = [
    [
        [1, 1, 0, 0],
        [0, 1, 1, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0]
    ],
    [
        [0, 0, 1, 0],
        [0, 1, 1, 0],
        [0, 1, 0, 0],
        [0, 0, 0, 0]
    ],
    [
        [0, 0, 0, 0],
        [1, 1, 0, 0],
        [0, 1, 1, 0],
        [0, 0, 0, 0]
    ],
    [
        [0, 1, 0, 0],
        [1, 1, 0, 0],
        [1, 0, 0, 0],
        [0, 0, 0, 0]
    ]
];
// T
blockContainerLUTs[6] = [
    [
        [0, 1, 0, 0],
        [1, 1, 1, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0]
    ],
    [
        [0, 1, 0, 0],
        [0, 1, 1, 0],
        [0, 1, 0, 0],
        [0, 0, 0, 0]
    ],
    [
        [0, 0, 0, 0],
        [1, 1, 1, 0],
        [0, 1, 0, 0],
        [0, 0, 0, 0]
    ],
    [
        [0, 1, 0, 0],
        [1, 1, 0, 0],
        [0, 1, 0, 0],
        [0, 0, 0, 0]
    ]
];
