// ------------------------------------------------------------------------
// Based on http://rembound.com/articles/how-to-make-a-match3-game-with-html5-canvas
// Copyright (c) 2015 Rembound.com
// Copyright (c) 2025 Alexander Bazhanov
// ------------------------------------------------------------------------

let userLang = (navigator.language || navigator.userLanguage).indexOf('ru') !== -1 ? 'ru' : 'en';

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
        "ru": "Ходы",
        "en": "Moves"
    },
    "lang": {
        "ru": "English 🇬🇧",
        "en": "Русский 🇷🇺"
    },
    "gameOverNoMovesLeft": {
        "ru": "Конец игры. Ходы закончились",
        "en": "Game over. No more moves left"
    },
    "gameOverTimeOut": {
        "ru": "Конец игры. Время истекло.",
        "en": "Game over. Time's up."
    },
    "boosters": {
        "ru": "Усилители",
        "en": "Boosters"
    },
}

// The function gets called when the window is fully loaded
window.onload = function () {

    //------
    // Based on https://codepen.io/enxaneta/pen/yvPmLo

    let boostersCounter = {
        color: {
            used: 0,
            total: 0,
        },
        nearby: {
            used: 0,
            total: 0,
        },
        any: {
            used: 0,
            total: 0,
        }
    };
    let particles = [];

    // Draw explosion(s)
    function drawExplosion() {
        if (particles.length > 0) {
            for (let i = 0; i < particles.length; i++) {
                particles[i].update();
                if (particles[i].r < 0.5) {
                    particles.splice(i, 1);
                }
            }
        }
        if (particles.length > 0) {
            //context.clearRect(0, 0, canvas.width, canvas.height);
            context.save();
            //context.globalCompositeOperation = "lighter";
            for (let i = 0; i < particles.length; i++) {
                particles[i].draw();
            }
            context.restore();
        }
    }

    // Explosion
    function generateParticles(x, y, c) {
        //particles.length = 0;
        for (let i = 0; i < particlesNumber; i++) {
            particles.push(new Particle(x, y, c));
        }
    }


    const rad = Math.PI / 180;
    let explosionColors = [
        "#6A0000",
        "#900000",
        "#902B2B",
        "#A63232",
        "#A62626",
        "#FD5039",
        "#C12F2A",
        "#FF6540",
        "#f93801"
    ];

    function getExplosionColor(mainColor) {
        let mainColorArray = Array(10).fill(mainColor);
        let allColors = [...explosionColors, ...mainColorArray];
        return allColors[~~(Math.random() * allColors.length)];
    }

    const spring = 1 / 10;
    const friction = 0.85;

    const particlesNumber = 25; // change this

    function randomIntFromInterval(mn, mx) {
        return Math.floor(Math.random() * (mx - mn + 1) + mn);
    }

    /* Initialize particle object */
    class Particle {
        constructor(x, y, c) {
            this.decay = 0.95;
            //////////// Change this ///////////////
            this.r = randomIntFromInterval(5, 35);
            this.R = 40 - this.r;
            ////////////////////////////////////////
            this.angle = Math.random() * 2 * Math.PI;
            this.center = {x: x, y: y};
            this.pos = {};
            this.pos.x = this.center.x + this.r * Math.cos(this.angle);
            this.pos.y = this.center.y + this.r * Math.sin(this.angle);
            this.target = {};
            this.target.x = this.center.x + this.R * Math.cos(this.angle);
            this.target.y = this.center.y + this.R * Math.sin(this.angle);
            this.color = getExplosionColor(c);// explosionColors[~~(Math.random() * explosionColors.length)];
            this.vel = {
                x: 0,
                y: 0
            };
            this.acc = {
                x: 0,
                y: 0
            };
        }

        update() {
            let dx = this.target.x - this.pos.x;
            let dy = this.target.y - this.pos.y;

            this.acc.x = dx * spring;
            this.acc.y = dy * spring;
            this.vel.x += this.acc.x;
            this.vel.y += this.acc.y;

            this.vel.x *= friction;
            this.vel.y *= friction;

            this.pos.x += this.vel.x;
            this.pos.y += this.vel.y;

            if (this.r > 0) this.r *= this.decay;
        }

        draw() {
            context.fillStyle = this.color;
            context.beginPath();
            context.arc(this.pos.x, this.pos.y, this.r, 0, 2 * Math.PI);
            context.fill();
        }
    }


    //------

    let newGameButton = document.getElementById('new-game-button');
    let autoPlayButton = document.getElementById("auto-play-button");
    let changeLangButton = document.getElementById("change-lang-button");
    let showMovesButton = document.getElementById("show-move-button");
    let scoreCounter = document.querySelector('.score-counter');
    let bestScoreSpan = document.querySelector('.best-score > span');

    // Boosters
    let boosterShowMove = document.getElementById('booster-show-move');
    let boosterShowMoveBadge = document.querySelector('#booster-show-move .button-badge');

    let boosterBlowColor = document.getElementById('booster-blow-color');
    let boosterBlowColorBadge = document.querySelector('#booster-blow-color .button-badge');

    let boosterBlowNearby = document.getElementById('booster-blow-nearby');
    let boosterBlowNearbyBadge = document.querySelector('#booster-blow-nearby .button-badge');

    let boosterAnyColor = document.getElementById('booster-any-color');
    let boosterAnyColorBadge = document.querySelector('#booster-any-color .button-badge');

    let statistics = document.querySelector('.statistics');
    let timerFiller = document.querySelector('.timer_filler');

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
        tiles: [],      // The two-dimensional tile array
        selectedTile: {selected: false, column: 0, row: 0}
    };

    // All the different tile colors in RGB
    let tileColors = [
        {color: "#FF4E40", radii: [0, 36, 36, 36]},
        {color: "#BF61D6", radii: [36, 0, 36, 36]},
        {color: "#139DF5", radii: [36, 36, 0, 36]},
        {color: "#4ECC2C", radii: [36, 36, 36, 0]},
        {color: "#FED204", radii: [36, 0, 36, 0]},
        {color: "#FDA811", radii: [36, 36, 36, 36]},
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

    let statsCounter = {};
    let timer = {
        start: 120,
        current: 120,
        intervalId: null
    }

    // Animation variables
    let animationState = 0;
    let animationTime = 0;
    let animationTimeTotal = 0.3;

    // Show available moves
    let showMoves = false;
    let randomMove = null;

    // The AI bot
    let aiBot = false;

    // Game Over
    let gameOver = {
        status: false,
        reason: null,
    };


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

        if (particles.length > 0) {
            drawExplosion();
        }
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
                finishGame('noMoveLeft');
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
                            score.current = score.current + clusters[i].length * clusters[i].length;
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
        let textDim = context.measureText(text);
        context.fillText(text, x + (width - textDim.width) / 2, y);

    }

    // Update score
    function updateScore() {

        // Update boosters counter
        boostersCounter.color.total = Math.floor(score.current / 1000);
        boostersCounter.nearby.total = Math.floor(score.current / 500);
        boostersCounter.any.total = Math.floor(score.current / 250);
        let colorDiff = boostersCounter.color.total - boostersCounter.color.used;
        let nearbyDiff = boostersCounter.nearby.total - boostersCounter.nearby.used;
        let anyDiff = boostersCounter.any.total - boostersCounter.any.used;
        if (colorDiff > 0) {
            document.body.style.setProperty("--blow-color-badge-counter", "'" + colorDiff + "'");
            document.body.style.setProperty("--blow-color-badge-display", "flex")
            boosterBlowColor.removeAttribute('disabled');
            boosterBlowColorBadge.innerHTML = "" + colorDiff;
        } else {
            document.body.style.setProperty("--blow-color-badge-display", "none")
            boosterBlowColor.setAttribute('disabled', 'disabled');
            boosterBlowColorBadge.innerHTML = "";
        }
        if (nearbyDiff > 0) {
            document.body.style.setProperty("--blow-nearby-badge-counter", "'" + nearbyDiff + "'");
            document.body.style.setProperty("--blow-nearby-badge-display", "flex")
            boosterBlowNearby.removeAttribute('disabled');
            boosterBlowNearbyBadge.innerHTML = "" + nearbyDiff;
        } else {
            document.body.style.setProperty("--blow-nearby-badge-display", "none")
            boosterBlowNearby.setAttribute('disabled', 'disabled');
            boosterBlowNearbyBadge.innerHTML = "";
        }
        if (anyDiff > 0) {
            document.body.style.setProperty("--any-color-badge-counter", "'" + anyDiff + "'");
            document.body.style.setProperty("--any-color-badge-display", "flex")
            boosterAnyColor.removeAttribute('disabled');
            boosterAnyColorBadge.innerHTML = "" + anyDiff;
        } else {
            document.body.style.setProperty("--any-color-badge-display", "none")
            boosterAnyColor.setAttribute('disabled', 'disabled');
            boosterAnyColorBadge.innerHTML = "";
        }

        // Update timer
        let scoreDiff = score.current - score.previous;
        //console.log(scoreDiff);
        if (scoreDiff > 0) {
            let newTimerCurrent = timer.current + Math.floor(scoreDiff / 3);
            timer.current = newTimerCurrent > timer.start ? timer.start : newTimerCurrent;
        }

        // Update scores
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
    tileColors.forEach((t, i) => statsCounter[i] = 0);

    function updateStats() {
        for (let key in statsCounter) {
            statsCounter[key] = 0;
        }
        for (let i = 0; i < level.columns; i++) {
            for (let j = 0; j < level.rows; j++) {
                if (level.tiles[i][j].type >= 0 && level.tiles[i][j].type !== 777) {
                    statsCounter[level.tiles[i][j].type] += 1;
                }
            }
        }

        if (statistics.childNodes.length === 0) { // Or just `if (element.childNodes.length)`
            for (let key in statsCounter) {
                let item = document.createElement("div");
                item.style.backgroundColor = tileColors[key].color;
                item.style.width = `calc(${100 * statsCounter[key] / (level.columns * level.rows)}%)`
                statistics.appendChild(item);
            }
        }

        for (let key in statsCounter) {
            statistics.childNodes[key].style.width = `calc(${100 * statsCounter[key] / (level.columns * level.rows)}%)`;
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
            showMovesButton.innerHTML = l10n.showMoves[userLang];
            document.body.style.setProperty("--moves-badge-counter", "'" + moves.length + "'");
            boosterShowMoveBadge.innerHTML = "" + moves.length;
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
        context.clearRect(0, 0, canvas.width, canvas.height);

        // Draw score
        if (score.current !== score.previous) {
            updateScore();
        }

        // Draw level background
        let levelWidth = level.columns * level.tileWidth;
        let levelHeight = level.rows * level.tileHeight;
        context.fillStyle = bgColor.color;
        context.fillRect(level.x - 4, level.y - 4, levelWidth + 8, levelHeight + 8);

        // Render tiles
        renderTiles();

        // Render clusters
        renderClusters();

        // Render moves, when there are no clusters
        if (showMoves && clusters.length <= 0 && gameState === gameStates.ready) {
            renderMoves();
        }

        if (gameState === gameStates.resolve) {
            showMoves = false;
        }

        // Game Over overlay
        if (gameOver.status) {
            context.fillStyle = "rgba(0, 0, 0, 0.8)";
            context.fillRect(level.x, level.y, levelWidth, levelHeight);
            context.fillStyle = "#ffffff";
            context.font = "24px Verdana";
            drawCenterText(
                gameOver.reason === 'timeOut'
                    ? l10n.gameOverTimeOut[userLang]
                    : l10n.gameOverNoMovesLeft[userLang],
                level.x,
                level.y + levelHeight / 2 + 10,
                levelWidth);
        }
    }

    // Render tiles
    function renderTiles() {
        for (let i = 0; i < level.columns; i++) {
            for (let j = 0; j < level.rows; j++) {
                // Get the shift of the tile for animation
                let shift = level.tiles[i][j].shift;

                // Calculate the tile coordinates
                let coord = getTileCoordinate(i, j, 0, easeOutBack(animationTime / animationTimeTotal) * shift);

                // Check if there is a tile present
                if (level.tiles[i][j].type >= 0) {
                    if (level.tiles[i][j].type === 777) {
                        drawTile(coord.tileX, coord.tileY, null, 'superTile');
                    } else {
                        // Get the color of the tile
                        let col = tileColors[level.tiles[i][j].type];
                        // Draw the tile using the color
                        drawTile(coord.tileX, coord.tileY, col, 'tile');
                    }
                } else {
                    // do smth with empty tiles:
                    // coord.tileX + level.tileWidth / 2, coord.tileY + level.tileWidth / 2));
                }

                // Draw the selected tile
                if (level.selectedTile.selected) {
                    if (level.selectedTile.column === i && level.selectedTile.row === j) {
                        // Draw a red tile
                        drawTile(coord.tileX, coord.tileY, selectColor, 'select');
                    }
                }
            }
        }

        // Render the swap animation
        if (gameState === gameStates.resolve && (animationState === 2 || animationState === 3)) {
            // Calculate the x and y shift
            let shiftX = currentMove.column2 - currentMove.column1;
            let shiftY = currentMove.row2 - currentMove.row1;

            // First tile
            let coord1 = getTileCoordinate(currentMove.column1, currentMove.row1, 0, 0);
            let coord1shift = getTileCoordinate(currentMove.column1, currentMove.row1, easeOutBack(animationTime / animationTimeTotal) * shiftX, easeOutBack(animationTime / animationTimeTotal) * shiftY);
            let col1 = tileColors[level.tiles[currentMove.column1][currentMove.row1].type];
            let col1DrawType = level.tiles[currentMove.column1][currentMove.row1].type === 777 ? 'superTile' : 'tile';

            // Second tile
            let coord2 = getTileCoordinate(currentMove.column2, currentMove.row2, 0, 0);
            let coord2shift = getTileCoordinate(currentMove.column2, currentMove.row2, easeOutBack(animationTime / animationTimeTotal) * -shiftX, easeOutBack(animationTime / animationTimeTotal) * -shiftY);
            let col2 = tileColors[level.tiles[currentMove.column2][currentMove.row2].type];
            let col2DrawType = level.tiles[currentMove.column2][currentMove.row2].type === 777 ? 'superTile' : 'tile';


            // Draw background
            drawTile(coord1.tileX, coord1.tileY, bgColor, 'tileBg');
            drawTile(coord2.tileX, coord2.tileY, bgColor, 'tileBg');

            // Change the order, depending on the animation state
            if (animationState === 2) {
                // Draw the tiles
                drawTile(coord1shift.tileX, coord1shift.tileY, col1, col1DrawType);
                drawTile(coord2shift.tileX, coord2shift.tileY, col2, col2DrawType);
            } else {
                // Draw the tiles
                drawTile(coord2shift.tileX, coord2shift.tileY, col2, col2DrawType);
                drawTile(coord1shift.tileX, coord1shift.tileY, col1, col1DrawType);
            }
        }
    }

    // Get the tile coordinate
    function getTileCoordinate(column, row, columnOffset, rowOffset) {
        let tileX = level.x + (column + columnOffset) * level.tileWidth;
        let tileY = level.y + (row + rowOffset) * level.tileHeight;
        return {tileX: tileX, tileY: tileY, color: tileColors[level.tiles[column][row].type]};
    }

    // Draw superTile
    const drawSpiralCircle = (xCenter, yCenter, radius, arrayOfColors, progress) => {
        let center = {x: xCenter, y: yCenter};

        // Calc coord on circle
        const coordsOnCircle = (radius, angleRadians, xCenter, yCenter) => {
            //let angleRadians = angleDegrees * (Math.PI / 180);
            let x = xCenter + radius * Math.cos(angleRadians);
            let y = yCenter + radius * Math.sin(angleRadians);
            return {x: x, y: y}
        }

        // Calc coord on line (lerp)
        const coordsOnLine = (start, final, progress) => {
            return {
                x: start.x + (final.x - start.x) * progress,
                y: start.y + (final.y - start.y) * progress
            }
        }

        for (let i = 0; i < arrayOfColors.length; i++) {
            let startAngle = (360 / arrayOfColors.length) * i * (Math.PI / 180)
            let endAngle = (360 / arrayOfColors.length) * (i + 1) * (Math.PI / 180)
            let nextAngle = (360 / arrayOfColors.length) * (i + 2) * (Math.PI / 180)

            // Finding coordinates of points on circle for bezier control points
            let coordsStart = coordsOnCircle(radius, startAngle, xCenter, yCenter);
            let coordsEnd = coordsOnCircle(radius, endAngle, xCenter, yCenter);
            let coordsNextEnd = coordsOnCircle(radius, nextAngle, xCenter, yCenter);

            // Finding control points
            let cpStart1 = coordsOnLine(coordsEnd, coordsNextEnd, progress);
            let cpStart2 = coordsOnLine(coordsNextEnd, center, progress);

            let cpEnd1 = coordsOnLine(center, coordsEnd, progress);
            let cpEnd2 = coordsOnLine(coordsStart, coordsEnd, progress);

            context.save();
            context.fillStyle = arrayOfColors[i].color;
            context.strokeStyle = arrayOfColors[i].color;

            context.beginPath();

            // Draw arc sector
            context.arc(xCenter, yCenter, radius, startAngle, endAngle);

            // Draw curved line from arc end to circle center
            context.bezierCurveTo(
                cpStart1.x, //(coordsEnd.x + coordsNextEnd.x) / 2,
                cpStart1.y, //(coordsEnd.y + coordsNextEnd.y) / 2,
                cpStart2.x, //(coordsNextEnd.x + xCenter) / 2,
                cpStart2.y, //(coordsNextEnd.y + yCenter) / 2,
                center.x,
                center.y
            );

            // Draw curved line from circle center to arc start
            context.bezierCurveTo(
                cpEnd1.x, //(xCenter + coordsEnd.x) / 2,
                cpEnd1.y, //(yCenter + coordsEnd.y) / 2,
                cpEnd2.x, //(coordsStart.x + coordsEnd.x) / 2,
                cpEnd2.y, //(coordsStart.y + coordsEnd.y) / 2,
                coordsStart.x,
                coordsStart.y
            );

            context.fill();
            context.stroke();
            context.restore();
        }
    }

    // Draw a tile with a color
    function drawTile(x, y, c, type = 'tile', zoom = 1) {
        let w = level.tileWidth;
        let wZoomed = level.tileWidth * zoom;
        let paddingZoomed = (level.tileWidth - level.tileWidth * zoom) / 2;
        let t = type || 'tile';

        if (t === 'superTile') {
            drawSpiralCircle(
                x + (level.tileWidth / 2),
                y + (level.tileWidth / 2),
                (wZoomed / 2) - 8,
                tileColors,
                0.5
            )
        }
        if (t === 'tile') {
            context.save()
            context.beginPath();
            context.fillStyle = '#ccc';
            context.roundRect(x + paddingZoomed + 9, y + paddingZoomed + 9, wZoomed - 16, wZoomed - 16, c.radii);
            context.fill();
            context.beginPath();
            context.fillStyle = c.color;
            context.roundRect(x + paddingZoomed + 7, y + paddingZoomed + 7, wZoomed - 16, wZoomed - 16, c.radii);
            context.fill();
            context.restore();
        }
        if (t === 'tileBg') {
            context.save()
            context.beginPath();
            context.fillStyle = c.color;
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

    function easeOutBack(x) {
        const c1 = 1.70158;
        const c3 = c1 + 1;
        let result = 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
        return result.toFixed(2);
    }

    // Render clusters
    function renderClusters() {
        for (let i = 0; i < clusters.length; i++) {
            // Calculate the tile coordinates
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
                context.save();
                let zoom = easeOutBack(1 - animationTime / animationTimeTotal);
                zoom = zoom < 0.2 ? 0 : zoom;
                if (clusters[i].zoom !== zoom) {
                    clusters[i].zoom = zoom;
                    if (clusters[i].horizontal) {
                        for (let k = 0; k < clusters[i].length; k++) {
                            drawTile(x + level.tileWidth * k, y, bgColor, 'tileBg');
                            if (zoom > 0) {
                                drawTile(x + level.tileWidth * k, y, clusters[i].color, 'tile', clusters[i].zoom);
                            }
                        }
                    } else {
                        for (let k = 0; k < clusters[i].length; k++) {
                            drawTile(x, y + level.tileWidth * k, bgColor, 'tileBg');
                            if (zoom > 0) {
                                drawTile(x, y + level.tileWidth * k, clusters[i].color, 'tile', clusters[i].zoom);
                            }
                        }
                    }
                }
                // Draw border around
                context.strokeStyle = "white";
                context.fillStyle = `rgba(255, 255, 255, 0.5)`;
                //context.beginPath();
                context.lineWidth = 5;
                //context.roundRect(x, y, w, h, [0]);
                //context.fill();
                // Draw text
                //context.font = `${64 * ((animationTime < 0.05 ? 0.05 : animationTime) / animationTimeTotal)}px 'Arial', sans-serif`;
                context.font = "64px 'Arial', sans-serif";
                context.strokeStyle = "white";
                context.fillStyle = "#424243";
                context.textAlign = "center";
                context.textBaseline = "middle";
                context.strokeText('' + clusters[i].length * clusters[i].length, centerX, centerY - 25 * (animationTime / animationTimeTotal), maxW);
                context.fillText('' + clusters[i].length * clusters[i].length, centerX, centerY - 25 * (animationTime / animationTimeTotal), maxW);
                context.restore();
            }

            draw();
        }
    }

    // Render moves
    function renderMoves() {
        const draw = (coord1, coord2) => {
            // Draw a line from tile 1 to tile 2
            context.strokeStyle = selectColor.color;
            context.lineWidth = 3;
            context.lineCap = "round";
            context.beginPath();
            context.moveTo(coord1.tileX + level.tileWidth / 2, coord1.tileY + level.tileHeight / 2);
            context.lineTo(coord2.tileX + level.tileWidth / 2, coord2.tileY + level.tileHeight / 2);
            context.stroke();
            context.beginPath();
            context.arc(coord1.tileX + level.tileWidth / 2, coord1.tileY + level.tileHeight / 2, 8, 0, 2 * Math.PI)
            context.fill()
            context.beginPath();
            context.arc(coord2.tileX + level.tileWidth / 2, coord2.tileY + level.tileHeight / 2, 8, 0, 2 * Math.PI)
            context.fill()
        }

        if (randomMove) {
            let coord1 = getTileCoordinate(randomMove.column1, randomMove.row1, 0, 0);
            let coord2 = getTileCoordinate(randomMove.column2, randomMove.row2, 0, 0);
            draw(coord1, coord2)
        } else {
            for (let i = 0; i < moves.length; i++) {
                // Calculate coordinates of tile 1 and 2
                let coord1 = getTileCoordinate(moves[i].column1, moves[i].row1, 0, 0);
                let coord2 = getTileCoordinate(moves[i].column2, moves[i].row2, 0, 0);
                draw(coord1, coord2)
            }
        }
    }

    // Start a new game
    function newGame() {
        // Get best score
        bestScoreSpan.innerHTML = localStorage.getItem('bestScore') || '—';


        // Start timer
        startTimer();
        boosterShowMove.removeAttribute('disabled');

        // Reset score
        score.previous = 0;
        score.current = 0;
        updateScore();

        // Set the gameState to ready
        gameState = gameStates.ready;

        // Reset game over
        gameOver.status = false;
        gameOver.reason = null;

        // Create the level
        createLevel();

        // Find initial clusters and moves
        findMoves();
        findClusters();
    }

    // Finish game
    function finishGame(reason) {
        gameOver.status = true;
        gameOver.reason = reason;
        let bestScore = localStorage.getItem('bestScore') || 0;
        if (score.current > bestScore) {
            localStorage.setItem('bestScore', score.current);
        }
        endTimer();

        // Reset boosters button and counters
        boosterShowMove.setAttribute('disabled', 'disabled');

        document.body.style.setProperty("--blow-color-badge-display", "none")
        boosterBlowColor.setAttribute('disabled', 'disabled');
        boosterBlowColorBadge.innerHTML = "";

        document.body.style.setProperty("--blow-nearby-badge-display", "none")
        boosterBlowNearby.setAttribute('disabled', 'disabled');
        boosterBlowNearbyBadge.innerHTML = "";

        document.body.style.setProperty("--any-color-badge-display", "none")
        boosterAnyColor.setAttribute('disabled', 'disabled');
        boosterAnyColorBadge.innerHTML = "";

        boostersCounter.color.used = 0;
        boostersCounter.color.total = 0;
        boostersCounter.nearby.used = 0;
        boostersCounter.nearby.total = 0;
        boostersCounter.any.used = 0;
        boostersCounter.any.total = 0;
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

    const findMatchesWithWildcard = (arr) => {
        let result = [];
        arr.forEach((el, i) => {
            let index = result.findIndex(x => x.startIndex + x.length === i);
            //console.log(i, index)
            if (index < 0) {
                result.push({startIndex: i, length: 1, value: el})
            } else {
                if (result[index].value === el) {
                    result[index].length += 1;
                } else {
                    result.push({startIndex: i, length: 1, value: el})
                }
            }
        })

        let jokerIndex = result.findIndex(x => x.value === 777);
        if (jokerIndex > -1) {
            let beforeJokerVal = result[jokerIndex - 1]?.value || null;
            let afterJokerVal = result[jokerIndex + 1]?.value || null;

            if (result[jokerIndex].startIndex === 0) {
                //console.log('нужно вправо')
                result[jokerIndex + 1].length += 1;
                result[jokerIndex + 1].startIndex -= 1;
                result.splice(jokerIndex, 1);
            } else if (result[jokerIndex].startIndex === arr.length - 1) {
                //console.log('нужно влево')
                result[jokerIndex - 1].length += 1;
                result.splice(jokerIndex, 1);
            } else if (beforeJokerVal === afterJokerVal) {
                //console.log('нужно сливать лево и право')
                //console.log(result);
                result[jokerIndex - 1].length += (result[jokerIndex + 1].length + 1);
                result.splice(jokerIndex, 2);
            } else if (beforeJokerVal !== afterJokerVal) {
                //console.log('соседимся влево и вправо');
                result[jokerIndex - 1].length += 1;
                result[jokerIndex + 1].length += 1;
                result[jokerIndex + 1].startIndex -= 1;
                result.splice(jokerIndex, 1);
            }

        }

        return result.filter(x => x.length >= 3);
    }

    // Find clusters in the level
    function findClusters() {

        // Reset clusters
        clusters = []

        // Find horizontal clusters
        for (let j = 0; j < level.rows; j++) {
            let arr = level.tiles.map(x => x[j].type);
            let result = findMatchesWithWildcard(arr);

            if (result.length > 0) {
                result.forEach(item => {
                    if (item.value !== -1) {
                        clusters.push({
                            column: item.startIndex,
                            row: j,
                            length: item.length,
                            horizontal: true,
                            color: tileColors[item.value],
                        });
                    }
                })
            }
        }

        // Find vertical clusters
        for (let i = 0; i < level.columns; i++) {
            let arr = level.tiles[i].map(x => x.type);
            let result = findMatchesWithWildcard(arr);

            if (result.length > 0) {
                result.forEach(item => {
                    if (item.value !== -1) {
                        clusters.push({
                            column: i,
                            row: item.startIndex,
                            length: item.length,
                            horizontal: false,
                            color: tileColors[item.value],
                        });
                    }
                })
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
            let colOffset = 0;
            let rowOffset = 0;
            for (let j = 0; j < cluster.length; j++) {
                func(i, cluster.column + colOffset, cluster.row + rowOffset, cluster);

                if (cluster.horizontal) {
                    colOffset++;
                } else {
                    rowOffset++;
                }
            }
        }
    }

    // Remove the clusters
    function removeClusters() {
        // Change the type of the tiles to -1, indicating a removed tile
        loopClusters(function (index, column, row, cluster) {
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
        if (!drag && gameOver.status === false && gameState === gameStates.ready) {
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
        e.preventDefault();
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

    // Translate buttons
    function updateTranslate() {
        document.title = l10n.match3Game[userLang];
        //newGameButton.innerHTML = l10n.newGame[userLang];
        autoPlayButton.innerHTML = l10n.aiBot[userLang];
        changeLangButton.innerHTML = l10n.lang[userLang];
        showMovesButton.innerHTML = l10n.showMoves[userLang];
        if (moves && moves.length) {
            document.body.style.setProperty("--moves-badge-counter", "'" + moves.length + "'");
        }
    }

    const completionPercentageColor = [
        [100, 'rgb(255,0,0)', '#ff0000'],
        [96, 'rgb(255,0,0)', '#ff0000'],
        [91, 'rgb(255,42,0)', '#ff0000'],
        [86, 'rgb(255,91,0)', '#ff0000'],
        [81, 'rgb(255,144,0)', '#ff0000'],
        [76, 'rgb(255,198,0)', '#1677ff'],
        [71, 'rgb(255,255,0)', '#1677ff'],
        [66, 'rgb(198,255,0)', '#1677ff'],
        [61, 'rgb(144,255,0)', '#1677ff'],
        [56, 'rgb(91,255,0)', '#1677ff'],
        [51, 'rgb(42,255,0)', '#1677ff'],
        [46, 'rgb(0,255,0)', '#1677ff'],
        [41, 'rgb(0,255,42)', '#1677ff'],
        [36, 'rgb(0,255,91)', '#1677ff'],
        [31, 'rgb(0,255,144)', '#1677ff'],
        [26, 'rgb(0,255,198)', '#1677ff'],
        [21, 'rgb(0,255,255)', '#1677ff'],
        [16, 'rgb(0,198,255)', '#1677ff'],
        [11, 'rgb(0,144,255)', '#1677ff'],
        [5, 'rgb(0,91,255)', '#1677ff'],
        [1, 'rgb(0,42,255)', '#1677ff'],
        //[0, 'rgba(0,0,0,.25)', 'rgba(0,0,0,.25)'],
    ];

    const getCompletionPercentageColor = (percent) => {
        for (let [levels, color1, color2] of completionPercentageColor) {
            if (percent >= levels) return `${color2}`;
        }
        return undefined;
    }

    function startTimer() {
        timer.current = timer.start;
        timerFiller.style.width = `${100 * timer.current / timer.start}%`;
        timerFiller.style.backgroundColor = getCompletionPercentageColor(1);
        if (!timer.intervalId) {
            timer.intervalId = setInterval(() => {
                let percent = (100 * timer.current / timer.start).toFixed(0);
                timerFiller.style.width = `${percent}%`;
                timerFiller.style.backgroundColor = getCompletionPercentageColor(100 - percent);
                if (timer.current <= 0) {
                    finishGame('timeOut');
                }
                timer.current -= 1;
            }, 1000);
        }
    }

    function endTimer() {
        clearInterval(timer.intervalId);
        timer.intervalId = null;
    }

    updateTranslate();

    // Call init to start the game
    init();

    function blowUp(blowType = null, colorType = null, col = null, row = null) {
        if (!blowType) return;
        let count = 0;
        if (blowType === 'color') {
            level.tiles.forEach((col, i) => {
                col.forEach((rowItem, j) => {
                    if (rowItem.type === colorType) {
                        count += 1;
                        generateParticles(
                            i * level.tileWidth + level.tileWidth / 2,
                            j * level.tileWidth + level.tileWidth / 2,
                            tileColors[level.tiles[i][j].type].color
                        );
                        level.tiles[i][j].type = -1;
                        //clusters.push({column: i, row: j, length: 1, horizontal: false})
                    }
                })
            })
        }
        if (blowType === 'nearBy') {
            for (let i = -1; i < 2; i++) {
                for (let j = -1; j < 2; j++) {
                    if (typeof level.tiles[col + i] !== 'undefined'
                        && typeof level.tiles[col + i][row + j] !== 'undefined') {
                        count += 1;
                        generateParticles(
                            (col + i) * level.tileWidth + level.tileWidth / 2,
                            (row + j) * level.tileWidth + level.tileWidth / 2,
                            tileColors[level.tiles[col + i][row + j].type].color
                        );
                        level.tiles[col + i][row + j].type = -1;
                    }
                }
            }
        }
        if (blowType === 'any') {

        }
        score.previous = score.current;
        score.current = score.current + count * 6;

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

        // Deselect
        level.selectedTile.selected = false;

        // Start animation
        setTimeout(() => {
            animationState = 1;
            animationTime = 0;
            gameState = gameStates.resolve;
        }, 500)
    }

    newGameButton.addEventListener('click', () => {
        level.selectedTile.selected = false;
        aiBot = false;
        updateAiBot();
        newGame();
    })

    boosterShowMove.addEventListener('click', () => {
        if (gameState === gameStates.ready) {
            randomMove = moves[~~(Math.random() * moves.length)]
            showMoves = true;
            boosterShowMove.setAttribute('disabled', 'disabled')
            setTimeout(() => {
                showMoves = false;
                randomMove = null;
                boosterShowMove.removeAttribute("disabled")
            }, 5000)
            updateMoves();
        }
    })

    boosterAnyColor.addEventListener('click', () => {
        if (gameState === gameStates.ready) {
            // {selected: true, column: 4, row: 3}
            boostersCounter.any.used += 1;
            let st = level.selectedTile;
            if (st.selected) {
                level.tiles[st.column][st.row].type = 777;
            }

            // Deselect
            level.selectedTile.selected = false;

            // Start animation
            setTimeout(() => {
                animationState = 0;
                animationTime = 0;
                gameState = gameStates.resolve;
            }, 300)

        }
    })

    boosterBlowColor.addEventListener('click', () => {
        if (gameState === gameStates.ready) {
            // {selected: true, column: 4, row: 3}
            boostersCounter.color.used += 1;
            let st = level.selectedTile;
            if (st.selected) {
                let type = level.tiles[st.column][st.row].type;
                blowUp('color', type, null, null);
            }

        }
    })

    boosterBlowNearby.addEventListener('click', () => {
        if (gameState === gameStates.ready) {
            // {selected: true, column: 4, row: 3}
            boostersCounter.nearby.used += 1;
            let st = level.selectedTile;
            if (st.selected) {
                let type = level.tiles[st.column][st.row].type;
                blowUp('nearBy', type, st.column, st.row);
            }
        }
    })

    showMovesButton.addEventListener('click', () => {
        showMoves = !showMoves;
        updateMoves();
    })

    changeLangButton.addEventListener('click', () => {
        userLang = userLang === 'ru' ? 'en' : 'ru';
        updateTranslate();
    })

    autoPlayButton.addEventListener('click', () => {
        aiBot = !aiBot;
        updateAiBot();
    })
};