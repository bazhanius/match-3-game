// ------------------------------------------------------------------------
// Based on http://rembound.com/articles/how-to-make-a-match3-game-with-html5-canvas
// Copyright (c) 2015 Rembound.com
// Copyright (c) 2025 Alexander Bazhanov
// ------------------------------------------------------------------------

let userLang = (navigator.language || navigator.userLanguage) === 'ru' ? 'ru' : 'en';

const l10n = {
    "match3Game": {
        "ru": "ТРИ В РЯД!",
        "en": "Match 3 Game"
    },
    "newGame": {
        "ru": "Новая игра",
        "en": "New game"
    },
    "aiBot": {
        "ru": "ИИ-бот",
        "en": "AI-bot"
    },
    "showMoves": {
        "ru": "Возможные ходы",
        "en": "Possible moves"
    },
    "gameOver": {
        "ru": "Конец игры",
        "en": "Game over"
    },
}

document.title = l10n.match3Game[userLang];

// The function gets called when the window is fully loaded
window.onload = function () {
    let newGameButton = document.getElementById("new-game-button");
    let autoPlayButton = document.getElementById("auto-play-button");
    let showMovesButton = document.getElementById("show-move-button");
    let scoreCounter = document.querySelector('.score-counter');
    let bestScoreSpan = document.querySelector('.best-score > span');
    let statistics = document.querySelector('.statistics');

    // Translate buttons
    newGameButton.innerHTML = l10n.newGame[userLang];
    autoPlayButton.innerHTML = l10n.aiBot[userLang];
    showMovesButton.innerHTML = l10n.showMoves[userLang];

    // Get the canvas and context
    let canvas = document.getElementById("viewport");
    let context = canvas.getContext("2d");

    // Timing and frames per second
    let lastFrame = 0;
    let fpsTime = 0;
    let frameCount = 0;
    let fps = 0;

    // Mouse dragging
    let drag = false;

    // Level object
    let level = {
        x: 5,         // X position
        y: 5,         // Y position
        columns: 8,     // Number of tile columns
        rows: 8,        // Number of tile rows
        tileWidth: 80,  // Visual width of a tile
        tileHeight: 80, // Visual height of a tile
        //tileRadius: 40,
        tiles: [],      // The two-dimensional tile array
        selectedTile: {selected: false, column: 0, row: 0}
    };

    // All the different tile colors in RGB
    let tileColors = [
        {color: "#FF4E40", radii: [0, 36, 36, 36]},
        {color: "#BF61D6", radii: [36, 0, 36, 36]},
        {color: "#139DF5", radii: [36, 36, 0, 36]},
        {color: "#4ECC2C", radii: [36, 36, 36, 0]},
        {color: "#FED204", radii: [36, 36, 36, 36]},
        {color: "#FDA811", radii: [36, 0, 36, 0]},
        //{color: "#AEADAB", radii: [18, 18, 18, 18]}
    ]
    let bgColor = {color: "rgb(245, 245, 247)", radii: [0, 0, 0, 0]}
    let selectColor = {color: "rgb(0, 119, 237)", radii: [0, 0, 0, 0]}

    // Clusters and moves that were found
    let clusters = [];  // { column, row, length, horizontal }
    let moves = [];     // { column1, row1, column2, row2 }

    // Current move
    let currentMove = {column1: 0, row1: 0, column2: 0, row2: 0};

    // Game states
    let gameStates = {init: 0, ready: 1, resolve: 2};
    let gameState = gameStates.init;

    // Score
    let score = {
        previous: 0,
        current: 0
    };

    // Animation variables
    let animationState = 0;
    let animationTime = 0;
    let animationTimeTotal = 0.3;

    // Show available moves
    let showMoves = false;
    let showMovesCount = 1;

    // The AI bot
    let aiBot = false;

    // Game Over
    let gameOver = false;

    // Gui buttons
    let buttons = [{x: 30, y: 240, width: 150, height: 50, text: "New Game"},
        {x: 30, y: 300, width: 150, height: 50, text: "Show Moves"},
        {x: 30, y: 360, width: 150, height: 50, text: "Enable AI Bot"}];


    const clickType = (('ontouchstart' in window) || (navigator.MaxTouchPoints > 0) || (navigator.msMaxTouchPoints > 0))
        ? 'touch'
        : 'click';

    // Initialize the game
    function init() {
        // Add mouse and touch events
        if (clickType === 'click') {
            canvas.addEventListener("mousemove", onMouseMove);
            canvas.addEventListener("mousedown", onMouseDown);
            canvas.addEventListener("mouseup", onMouseUp);
            canvas.addEventListener("mouseout", onMouseOut);
        } else {
            canvas.addEventListener("touchmove", onMouseMove);
            canvas.addEventListener("touchstart", onMouseDown);
            canvas.addEventListener("touchend", onMouseUp);
            canvas.addEventListener("touchcancel", onMouseOut);
        }

        // Initialize the two-dimensional tile array
        for (let i = 0; i < level.columns; i++) {
            level.tiles[i] = [];
            for (let j = 0; j < level.rows; j++) {
                // Define a tile type and a shift parameter for animation
                level.tiles[i][j] = {type: 0, shift: 0}
            }
        }

        // New game
        newGame();

        // Enter main loop
        main(0);
    }

    // Main loop
    function main(tframe) {
        // Request animation frames
        window.requestAnimationFrame(main);

        // Update and render the game
        update(tframe);
        render();
    }

    // Update the game state
    function update(tframe) {
        let dt = (tframe - lastFrame) / 1000;
        lastFrame = tframe;

        // Update the fps counter
        updateFps(dt);

        if (gameState === gameStates.ready) {
            // Game is ready for player input

            // Check for game over
            if (moves.length <= 0) {
                gameOver = true;
            }

            // Let the AI bot make a move, if enabled
            if (aiBot) {
                animationTime += dt;
                if (animationTime > animationTimeTotal) {
                    // Check if there are moves available
                    findMoves();

                    if (moves.length > 0) {
                        // Get a random valid move
                        let move = moves[Math.floor(Math.random() * moves.length)];

                        // Simulate a player using the mouse to swap two tiles
                        mouseSwap(move.column1, move.row1, move.column2, move.row2);
                    } else {
                        // No moves left, Game Over. We could start a new game.
                        // newGame();
                    }
                    animationTime = 0;
                }
            }
        } else if (gameState === gameStates.resolve) {
            // Game is busy resolving and animating clusters
            animationTime += dt;

            if (animationState === 0) {
                // Clusters need to be found and removed
                if (animationTime > animationTimeTotal) {
                    // Find clusters
                    findClusters();

                    if (clusters.length > 0) {
                        // Add points to the score
                        for (let i = 0; i < clusters.length; i++) {
                            // Add extra points for longer clusters
                            score.previous = score.current;
                            score.current = score.current + clusters[i].length;
                        }

                        // Clusters found, remove them
                        removeClusters();

                        // Tiles need to be shifted
                        animationState = 1;
                    } else {
                        // No clusters found, animation complete
                        gameState = gameStates.ready;
                    }
                    animationTime = 0;
                }
            } else if (animationState === 1) {
                // Tiles need to be shifted
                if (animationTime > animationTimeTotal) {
                    // Shift tiles
                    shiftTiles();

                    // New clusters need to be found
                    animationState = 0;
                    animationTime = 0;

                    // Check if there are new clusters
                    findClusters();
                    if (clusters.length <= 0) {
                        // Animation complete
                        gameState = gameStates.ready;
                    }
                }
            } else if (animationState === 2) {
                // Swapping tiles animation
                if (animationTime > animationTimeTotal) {
                    // Swap the tiles
                    swap(currentMove.column1, currentMove.row1, currentMove.column2, currentMove.row2);

                    // Check if the swap made a cluster
                    findClusters();
                    if (clusters.length > 0) {
                        // Valid swap, found one or more clusters
                        // Prepare animation states
                        animationState = 0;
                        animationTime = 0;
                        gameState = gameStates.resolve;
                    } else {
                        // Invalid swap, Rewind swapping animation
                        animationState = 3;
                        animationTime = 0;
                    }

                    // Update moves and clusters
                    findMoves();
                    findClusters();
                }
            } else if (animationState === 3) {
                // Rewind swapping animation
                if (animationTime > animationTimeTotal) {
                    // Invalid swap, swap back
                    swap(currentMove.column1, currentMove.row1, currentMove.column2, currentMove.row2);

                    // Animation complete
                    gameState = gameStates.ready;
                }
            }

            // Update moves and clusters
            findMoves();
            findClusters();
        }
    }

    function updateFps(dt) {
        if (fpsTime > 0.25) {
            // Calculate fps
            fps = Math.round(frameCount / fpsTime);

            // Reset time and frameCount
            fpsTime = 0;
            frameCount = 0;
        }

        // Increase time and frameCount
        fpsTime += dt;
        frameCount++;
    }

    // Draw text that is centered
    function drawCenterText(text, x, y, width) {
        let textdim = context.measureText(text);
        context.fillText(text, x + (width - textdim.width) / 2, y);
    }

    // Update score
    function updateScore() {
        scoreCounter.innerHTML = score.current;
        score.previous = score.current;
        if (score.current !== 0) {
            scoreCounter.classList.add('score-counter__bounce');
            setTimeout(() => {
                scoreCounter.classList.remove('score-counter__bounce');
            }, 100)
        }
    }

    // Update stats
    function updateStats() {
        let statsCounter = {};
        for (let i = 0; i < level.columns; i++) {
            for (let j = 0; j < level.rows; j++) {
                if (level.tiles[i][j].type >= 0) {
                    if (level.tiles[i][j].type in statsCounter) {
                        statsCounter[level.tiles[i][j].type] = statsCounter[level.tiles[i][j].type] + 1;
                    } else {
                        statsCounter[level.tiles[i][j].type] = 1;
                    }
                }
            }
        }

        if (statistics.childNodes.length === 0) { // Or just `if (element.childNodes.length)`
            for (let key in statsCounter) {
                let item = document.createElement("div");
                item.style.backgroundColor = tileColors[key].color;
                item.style.width = `calc(${100 * statsCounter[key] / 64}%)`
                statistics.appendChild(item);
            }
        }

        for (let key in statsCounter) {
            statistics.childNodes[key].style.width = `calc(${100 * statsCounter[key] / 64}%)`;
            statistics.childNodes[key].innerHTML = statsCounter[key];
        }
    }

    // Update moves
    function updateAiBot() {
        autoPlayButton.innerHTML = l10n.aiBot[userLang];
        if (aiBot) {
            autoPlayButton.classList.add('controllers-item__enabled');
        } else {
            autoPlayButton.classList.remove('controllers-item__enabled');
        }
    }

    // Update moves
    function updateMoves() {
        if (gameState === 1) {
            showMovesButton.innerHTML = l10n.showMoves[userLang] + ' (' + moves.length + ')';
            updateStats();
        }
        if (showMoves) {
            showMovesButton.classList.add('controllers-item__enabled');
        } else {
            showMovesButton.classList.remove('controllers-item__enabled');
        }
    }

    // Render the game
    function render() {
        // Draw the frame
        drawFrame();

        // Draw score
        //context.fillStyle = "#000000";
        //context.font = "24px Verdana";
        //drawCenterText("Score:", 30, level.y + 40, 150);
        //drawCenterText(score.current, 30, level.y + 70, 150);
        if (score.current !== score.previous) {
            updateScore();
        }

        // Draw buttons
        //drawButtons();

        // Draw level background
        let levelWidth = level.columns * level.tileWidth;
        let levelHeight = level.rows * level.tileHeight;
        context.fillStyle = bgColor.color;
        context.fillRect(level.x - 4, level.y - 4, levelWidth + 8, levelHeight + 8);
        //context.beginPath();
        //context.roundRect(level.x - 4, level.y - 4, levelWidth + 8, levelHeight + 8, level.tileRadius);
        //context.fill();

        // Render tiles
        renderTiles();

        // Render clusters
        renderClusters();

        // Render moves, when there are no clusters
        if (showMoves && clusters.length <= 0 && gameState === gameStates.ready) {
            renderMoves();
        }

        // Game Over overlay
        if (gameOver) {
            context.fillStyle = "rgba(0, 0, 0, 0.8)";
            context.fillRect(level.x, level.y, levelWidth, levelHeight);

            context.fillStyle = "#ffffff";
            context.font = "24px Verdana";
            drawCenterText("Конец игры!", level.x, level.y + levelHeight / 2 + 10, levelWidth);
            localStorage.setItem('bestScore', score.current);
        }
    }

    // Draw a frame with a border
    function drawFrame() {
        // Draw background and a border
        //context.fillStyle = "#d0d0d0";
        //context.fillRect(0, 0, canvas.width, canvas.height);
        //context.fillStyle = "#e8eaec";
        //context.fillRect(1, 1, canvas.width - 2, canvas.height - 2);

        // Draw header
        //context.fillStyle = "#303030";
        //context.fillRect(0, 0, canvas.width, 65);

        // Draw title
        //context.fillStyle = "#ffffff";
        //context.font = "24px Verdana";
        //context.fillText("Match3 Example - Rembound.com", 10, 30);

        // Display fps
        //context.fillStyle = "#ffffff";
        //context.font = "12px Verdana";
        //context.fillText("Fps: " + fps, 13, 50);
    }

    // Draw buttons
    function drawButtons() {
        for (let i = 0; i < buttons.length; i++) {
            // Draw button shape
            context.fillStyle = "#000000";
            context.fillRect(buttons[i].x, buttons[i].y, buttons[i].width, buttons[i].height);

            // Draw button text
            context.fillStyle = "#ffffff";
            context.font = "18px Verdana";
            let textdim = context.measureText(buttons[i].text);
            context.fillText(buttons[i].text, buttons[i].x + (buttons[i].width - textdim.width) / 2, buttons[i].y + 30);
        }
    }

    // Render tiles
    function renderTiles() {
        for (let i = 0; i < level.columns; i++) {
            for (let j = 0; j < level.rows; j++) {
                // Get the shift of the tile for animation
                let shift = level.tiles[i][j].shift;

                // Calculate the tile coordinates
                let coord = getTileCoordinate(i, j, 0, (animationTime / animationTimeTotal) * shift);

                // Check if there is a tile present
                if (level.tiles[i][j].type >= 0) {
                    // Get the color of the tile
                    let col = tileColors[level.tiles[i][j].type];

                    // Draw the tile using the color
                    drawTile(coord.tileX, coord.tileY, col, 'tile');
                } else {
                    // do smth with empty tiles:
                    // coord.tileX + level.tileWidth / 2, coord.tileY + level.tileWidth / 2));
                }

                // Draw the selected tile
                if (level.selectedTile.selected) {
                    if (level.selectedTile.column === i && level.selectedTile.row === j) {
                        // Draw a red tile
                        drawTile(coord.tileX, coord.tileY, selectColor, 'select');
                        //showMoves = false;
                    }
                }
            }
        }

        // Render the swap animation
        if (gameState === gameStates.resolve && (animationState === 2 || animationState === 3)) {
            // Calculate the x and y shift
            let shiftx = currentMove.column2 - currentMove.column1;
            let shifty = currentMove.row2 - currentMove.row1;

            // First tile
            let coord1 = getTileCoordinate(currentMove.column1, currentMove.row1, 0, 0);
            let coord1shift = getTileCoordinate(currentMove.column1, currentMove.row1, (animationTime / animationTimeTotal) * shiftx, (animationTime / animationTimeTotal) * shifty);
            let col1 = tileColors[level.tiles[currentMove.column1][currentMove.row1].type];

            // Second tile
            let coord2 = getTileCoordinate(currentMove.column2, currentMove.row2, 0, 0);
            let coord2shift = getTileCoordinate(currentMove.column2, currentMove.row2, (animationTime / animationTimeTotal) * -shiftx, (animationTime / animationTimeTotal) * -shifty);
            let col2 = tileColors[level.tiles[currentMove.column2][currentMove.row2].type];

            // Draw background
            drawTile(coord1.tileX, coord1.tileY, bgColor, 'tileBg');
            drawTile(coord2.tileX, coord2.tileY, bgColor, 'tileBg');

            // Change the order, depending on the animation state
            if (animationState === 2) {
                // Draw the tiles
                drawTile(coord1shift.tileX, coord1shift.tileY, col1, 'tile');
                drawTile(coord2shift.tileX, coord2shift.tileY, col2, 'tile');
            } else {
                // Draw the tiles
                drawTile(coord2shift.tileX, coord2shift.tileY, col2, 'tile');
                drawTile(coord1shift.tileX, coord1shift.tileY, col1, 'tile');
            }
        }
    }

    // Get the tile coordinate
    function getTileCoordinate(column, row, columnOffset, rowOffset) {
        let tileX = level.x + (column + columnOffset) * level.tileWidth;
        let tileY = level.y + (row + rowOffset) * level.tileHeight;
        return {tileX: tileX, tileY: tileY};
    }

    // Draw a tile with a color
    function drawTile(x, y, c, type = 'tile') {
        //console.log(level.tiles);
        //context.fillStyle = "rgb(" + r + "," + g + "," + b + ")";
        //context.fillRect(x + 2, y + 2, level.tileWidth - 4, level.tileHeight - 4);

        //context.fillStyle = "rgba(" + r + "," + g + "," + b + ")";
        //const gradient = context.createRadialGradient(x * 0.8, y * 0.8, level.tileWidth / 20, x / 2, y / 2, level.tileWidth * 1.5);

        let w = level.tileWidth;
        let t = type || 'tile';
        if (t === 'tile') {
            context.save()
            //const gradient = context.createRadialGradient(x + w * 0.35, y + w * 0.35, w * 0.01, x + w * 0.5, y + w * 0.5, w);
            //gradient.addColorStop(0, "white");
            //gradient.addColorStop(0.3, "rgba(" + r + "," + g + "," + b + ")");
            //gradient.addColorStop(1, "black");

            //context.shadowOffsetX = 15;
            //context.shadowOffsetY = 15;
            //context.shadowBlur = 15;
            //context.shadowColor = 'rgba(21, 24, 50, 0.3)';
            //context.fillStyle = gradient;


            context.beginPath();
            context.fillStyle = '#ccc';
            context.roundRect(x + 5, y + 5, w - 8, w - 8, c.radii);
            context.fill();

            context.beginPath();
            context.fillStyle = c.color;
            //context.strokeStyle = 'rgb(0, 0, 0, 1)';
            //context.arc(x + level.tileWidth / 2, y + level.tileWidth / 2, level.tileWidth / 2 - 4, 0, 360)

            //context.stroke();
            context.roundRect(x + 3, y + 3, w - 8, w - 8, c.radii);
            context.fill();
            context.restore();
        }
        if (t === 'tileBg') {
            context.save()
            context.beginPath();
            context.fillStyle = c.color;
            //context.arc(x + level.tileWidth / 2 - 1, y + level.tileWidth / 2, level.tileWidth / 2, 0, 360)
            context.roundRect(x, y, w, w, c.radii);
            context.fill();
            context.restore();
        }
        if (t === 'select') {
            context.save()
            context.strokeStyle = c.color;
            context.setLineDash([level.tileWidth / 2, level.tileWidth / 2]);
            context.beginPath();
            context.lineDashOffset = level.tileWidth * 0.25;
            context.lineWidth = 5;
            context.lineCap = "square";
            context.strokeRect(x, y, level.tileWidth, level.tileHeight);
            context.stroke();
            context.restore();
        }
    }

    // Render clusters
    let clusterZoom = []

    function renderClusters() {
        //console.log(animationTime , animationTimeTotal);
        for (let i = 0; i < clusters.length; i++) {
            // Calculate the tile coordinates
            let id = animationTime;
            let coord = getTileCoordinate(clusters[i].column, clusters[i].row, 0, 0);

            let x = coord.tileX;
            let y = coord.tileY;
            let w = clusters[i].horizontal
                ? clusters[i].length * level.tileWidth
                : level.tileWidth;
            let h = clusters[i].horizontal
                ? level.tileWidth
                : clusters[i].length * level.tileWidth;
            let centerX = clusters[i].horizontal
                ? coord.tileX + level.tileWidth * clusters[i].length / 2
                : coord.tileX + level.tileWidth / 2;
            let centerY = clusters[i].horizontal
                ? coord.tileY + level.tileWidth / 2
                : coord.tileY + level.tileWidth * clusters[i].length / 2;
            let maxW = clusters[i].horizontal
                ? clusters[i].length * level.tileWidth
                : level.tileWidth;

            const draw = () => {
                context.save()
                // Draw border around
                context.strokeStyle = "white";
                context.fillStyle = `rgba(255, 255, 255, 0.5)`;
                context.beginPath();
                context.lineWidth = 5;
                context.roundRect(x, y, w, h, [0]);
                context.fill();
                //context.stroke();
                // Draw text
                context.font = `${64 * ((animationTime < 0.05 ? 0.05 : animationTime) / animationTimeTotal)}px 'Arial', sans-serif`;
                context.strokeStyle = "white";
                context.fillStyle = "black";
                context.textAlign = "center";
                context.textBaseline = "middle";
                context.strokeText('' + clusters[i].length, centerX, centerY, maxW);
                context.fillText('' + clusters[i].length, centerX, centerY, maxW);
                context.restore();
            }

            draw();
        }
    }

    // Render moves
    function renderMoves() {
        let length = showMovesCount > 0 ? showMovesCount : moves.length;
        for (let i = 0; i < moves.length; i++) {
            // Calculate coordinates of tile 1 and 2
            let coord1 = getTileCoordinate(moves[i].column1, moves[i].row1, 0, 0);
            let coord2 = getTileCoordinate(moves[i].column2, moves[i].row2, 0, 0);

            // Draw a line from tile 1 to tile 2
            context.strokeStyle = selectColor.color;
            context.lineWidth = 3;
            context.lineCap = "round";
            context.beginPath();
            context.moveTo(coord1.tileX + level.tileWidth / 2, coord1.tileY + level.tileHeight / 2);
            context.lineTo(coord2.tileX + level.tileWidth / 2, coord2.tileY + level.tileHeight / 2);
            context.stroke();
            context.beginPath();
            context.arc(coord1.tileX + level.tileWidth / 2, coord1.tileY + level.tileHeight / 2, 8, 0, 360)
            context.fill()
            context.beginPath();
            context.arc(coord2.tileX + level.tileWidth / 2, coord2.tileY + level.tileHeight / 2, 8, 0, 360)
            context.fill()

        }
    }

    // Start a new game
    function newGame() {
        // Get best score
        bestScoreSpan.innerHTML = localStorage.getItem('bestScore') || '—';

        // Reset score
        score.previous = 0;
        score.current = 0;
        updateScore();

        // Set the gameState to ready
        gameState = gameStates.ready;

        // Reset game over
        gameOver = false;

        // Create the level
        createLevel();

        // Find initial clusters and moves
        findMoves();
        findClusters();
    }

    // Create a random level
    function createLevel() {
        let done = false;

        // Keep generating levels until it is correct
        while (!done) {

            // Create a level with random tiles
            for (let i = 0; i < level.columns; i++) {
                for (let j = 0; j < level.rows; j++) {
                    level.tiles[i][j].type = getRandomTile();
                    level.tiles[i][j].size = 1;
                    level.tiles[i][j].prev = [];
                }
            }

            // Resolve the clusters
            resolveClusters();

            // Check if there are valid moves
            findMoves();

            // Done when there is a valid move
            if (moves.length > 0) {
                done = true;
            }
        }
    }

    // Get a random tile
    function getRandomTile() {
        return Math.floor(Math.random() * tileColors.length);
    }

    // Remove clusters and insert tiles
    function resolveClusters() {
        // Check for clusters
        findClusters();

        // While there are clusters left
        while (clusters.length > 0) {

            // Remove clusters
            removeClusters();

            // Shift tiles
            shiftTiles();

            // Check if there are clusters left
            findClusters();
        }
    }

    // Find clusters in the level
    function findClusters() {
        // Reset clusters
        clusters = []

        // Find horizontal clusters
        for (let j = 0; j < level.rows; j++) {
            // Start with a single tile, cluster of 1
            let matchlength = 1;
            for (let i = 0; i < level.columns; i++) {
                let checkcluster = false;

                if (i === level.columns - 1) {
                    // Last tile
                    checkcluster = true;
                } else {
                    // Check the type of the next tile
                    if (level.tiles[i][j].type === level.tiles[i + 1][j].type &&
                        level.tiles[i][j].type !== -1) {
                        // Same type as the previous tile, increase matchlength
                        matchlength += 1;
                    } else {
                        // Different type
                        checkcluster = true;
                    }
                }

                // Check if there was a cluster
                if (checkcluster) {
                    if (matchlength >= 3) {
                        // Found a horizontal cluster
                        clusters.push({
                            column: i + 1 - matchlength, row: j,
                            length: matchlength,
                            horizontal: true
                        });
                    }

                    matchlength = 1;
                }
            }
        }

        // Find vertical clusters
        for (let i = 0; i < level.columns; i++) {
            // Start with a single tile, cluster of 1
            let matchlength = 1;
            for (let j = 0; j < level.rows; j++) {
                let checkcluster = false;

                if (j === level.rows - 1) {
                    // Last tile
                    checkcluster = true;
                } else {
                    // Check the type of the next tile
                    if (level.tiles[i][j].type === level.tiles[i][j + 1].type &&
                        level.tiles[i][j].type !== -1) {
                        // Same type as the previous tile, increase matchlength
                        matchlength += 1;
                    } else {
                        // Different type
                        checkcluster = true;
                    }
                }

                // Check if there was a cluster
                if (checkcluster) {
                    if (matchlength >= 3) {
                        // Found a vertical cluster
                        clusters.push({
                            column: i, row: j + 1 - matchlength,
                            length: matchlength,
                            horizontal: false
                        });
                    }

                    matchlength = 1;
                }
            }
        }
    }

    // Find available moves
    function findMoves() {
        // Reset moves
        moves = []

        // Check horizontal swaps
        for (let j = 0; j < level.rows; j++) {
            for (let i = 0; i < level.columns - 1; i++) {
                // Swap, find clusters and swap back
                swap(i, j, i + 1, j);
                findClusters();
                swap(i, j, i + 1, j);

                // Check if the swap made a cluster
                if (clusters.length > 0) {
                    // Found a move
                    moves.push({column1: i, row1: j, column2: i + 1, row2: j});
                }
            }
        }

        // Check vertical swaps
        for (let i = 0; i < level.columns; i++) {
            for (let j = 0; j < level.rows - 1; j++) {
                // Swap, find clusters and swap back
                swap(i, j, i, j + 1);
                findClusters();
                swap(i, j, i, j + 1);

                // Check if the swap made a cluster
                if (clusters.length > 0) {
                    // Found a move
                    moves.push({column1: i, row1: j, column2: i, row2: j + 1});
                }
            }
        }

        // Reset clusters
        updateMoves();
        clusters = []
    }

    // Loop over the cluster tiles and execute a function
    function loopClusters(func) {
        for (let i = 0; i < clusters.length; i++) {
            //  { column, row, length, horizontal }
            let cluster = clusters[i];
            let coffset = 0;
            let roffset = 0;
            for (let j = 0; j < cluster.length; j++) {
                func(i, cluster.column + coffset, cluster.row + roffset, cluster);

                if (cluster.horizontal) {
                    coffset++;
                } else {
                    roffset++;
                }
            }
        }
    }

    // Remove the clusters
    function removeClusters() {
        // Change the type of the tiles to -1, indicating a removed tile
        loopClusters(function (index, column, row, cluster) {
            let pr = level.tiles[column][row].type
            level.tiles[column][row].type = -1;
        });

        // Calculate how much a tile should be shifted downwards
        for (let i = 0; i < level.columns; i++) {
            let shift = 0;
            for (let j = level.rows - 1; j >= 0; j--) {
                // Loop from bottom to top
                if (level.tiles[i][j].type === -1) {
                    // Tile is removed, increase shift
                    shift++;
                    level.tiles[i][j].shift = 0;
                } else {
                    // Set the shift
                    level.tiles[i][j].shift = shift;
                }
            }
        }
    }

    // Shift tiles and insert new tiles
    function shiftTiles() {
        // Shift tiles
        for (let i = 0; i < level.columns; i++) {
            for (let j = level.rows - 1; j >= 0; j--) {
                // Loop from bottom to top
                if (level.tiles[i][j].type === -1) {
                    // Insert new random tile
                    level.tiles[i][j].type = getRandomTile();
                } else {
                    // Swap tile to shift it
                    let shift = level.tiles[i][j].shift;
                    if (shift > 0) {
                        swap(i, j, i, j + shift)
                    }
                }

                // Reset shift
                level.tiles[i][j].shift = 0;
            }
        }
    }

    // Get the tile under the mouse
    function getMouseTile(pos) {
        // Calculate the index of the tile
        let tx = Math.floor((pos.x - level.x) / level.tileWidth);
        let ty = Math.floor((pos.y - level.y) / level.tileHeight);

        // Check if the tile is valid
        if (tx >= 0 && tx < level.columns && ty >= 0 && ty < level.rows) {
            // Tile is valid
            return {
                valid: true,
                x: tx,
                y: ty
            };
        }

        // No valid tile
        return {
            valid: false,
            x: 0,
            y: 0
        };
    }

    // Check if two tiles can be swapped
    function canSwap(x1, y1, x2, y2) {
        // Check if the tile is a direct neighbor of the selected tile
        return (Math.abs(x1 - x2) === 1 && y1 === y2) ||
            (Math.abs(y1 - y2) === 1 && x1 === x2);
    }

    // Swap two tiles in the level
    function swap(x1, y1, x2, y2) {
        let typeSwap = level.tiles[x1][y1].type;
        level.tiles[x1][y1].type = level.tiles[x2][y2].type;
        level.tiles[x2][y2].type = typeSwap;
    }

    // Swap two tiles as a player action
    function mouseSwap(c1, r1, c2, r2) {
        // Save the current move
        currentMove = {column1: c1, row1: r1, column2: c2, row2: r2};

        // Deselect
        level.selectedTile.selected = false;

        // Start animation
        animationState = 2;
        animationTime = 0;
        gameState = gameStates.resolve;
    }

    // On mouse movement
    function onMouseMove(e) {
        // Get the mouse position
        let pos = clickType === 'click'
            ? getMousePos(canvas, e)
            : getMousePos(canvas, e.touches[0]);

        // Check if we are dragging with a tile selected
        if (drag && level.selectedTile.selected) {
            // Get the tile under the mouse
            mt = getMouseTile(pos);
            if (mt.valid) {
                // Valid tile

                // Check if the tiles can be swapped
                if (canSwap(mt.x, mt.y, level.selectedTile.column, level.selectedTile.row)) {
                    // Swap the tiles
                    mouseSwap(mt.x, mt.y, level.selectedTile.column, level.selectedTile.row);
                }
            }
        }
    }

    // On mouse button click
    function onMouseDown(e) {
        // Get the mouse position
        let pos = clickType === 'click'
            ? getMousePos(canvas, e)
            : getMousePos(canvas, e.changedTouches[0]);

        // Start dragging
        if (!drag) {
            // Get the tile under the mouse
            mt = getMouseTile(pos);

            if (mt.valid) {
                // Valid tile
                let swapped = false;
                if (level.selectedTile.selected) {
                    if (mt.x === level.selectedTile.column && mt.y === level.selectedTile.row) {
                        // Same tile selected, deselect
                        level.selectedTile.selected = false;
                        drag = true;
                        return;
                    } else if (canSwap(mt.x, mt.y, level.selectedTile.column, level.selectedTile.row)) {
                        // Tiles can be swapped, swap the tiles
                        mouseSwap(mt.x, mt.y, level.selectedTile.column, level.selectedTile.row);
                        swapped = true;
                    }
                }

                if (!swapped) {
                    // Set the new selected tile
                    level.selectedTile.column = mt.x;
                    level.selectedTile.row = mt.y;
                    level.selectedTile.selected = true;
                }
            } else {
                // Invalid tile
                level.selectedTile.selected = false;
            }

            // Start dragging
            drag = true;
        }
    }

    function onMouseUp(e) {
        // Reset dragging
        drag = false;
    }

    function onMouseOut(e) {
        // Reset dragging
        drag = false;
    }

    // Get the mouse position
    function getMousePos(canvas, e) {
        let rect = canvas.getBoundingClientRect();
        return {
            x: Math.round((e.clientX - rect.left) / (rect.right - rect.left) * canvas.width),
            y: Math.round((e.clientY - rect.top) / (rect.bottom - rect.top) * canvas.height)
        };
    }

    // Call init to start the game
    init();

    newGameButton.addEventListener('click', () => {
        newGame();
    })

    showMovesButton.addEventListener('click', () => {
        showMoves = !showMoves;
        updateMoves();
    })
    autoPlayButton.addEventListener('click', () => {
        aiBot = !aiBot;
        updateAiBot();
    })
};
