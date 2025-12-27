// ============================================
// SPEED DRAW - Game Logic
// ============================================

// Shape definitions - designed for point-and-click drawing
const SHAPES = [
    { name: 'Square', validate: validateSquare, hint: '4 corners' },
    { name: 'Triangle', validate: validateTriangle, hint: '3 points' },
    { name: 'Checkmark', validate: validateCheckmark, hint: '3 points: down then up' },
    { name: 'X', validate: validateX, hint: '5 points, cross in center' }
];

// Game state
let gameState = {
    score: 0,
    highScore: parseInt(localStorage.getItem('speedDrawHighScore')) || 0,
    currentShape: null,
    timeLeft: 12,
    baseTime: 12,  // Starting time
    timerInterval: null,
    isDrawing: false,
    points: [],
    lastUsedShapes: []
};


// DOM Elements
const startScreen = document.getElementById('start-screen');
const gameScreen = document.getElementById('game-screen');
const gameoverScreen = document.getElementById('gameover-screen');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');
const clearBtn = document.getElementById('clear-btn');
const undoBtn = document.getElementById('undo-btn');
const submitBtn = document.getElementById('submit-btn');
const canvas = document.getElementById('drawing-canvas');
const ctx = canvas.getContext('2d');
const timerDisplay = document.getElementById('timer');
const scoreDisplay = document.getElementById('current-score');
const shapePrompt = document.getElementById('shape-prompt');
const pointHint = document.getElementById('point-hint');
const highscoreDisplay = document.getElementById('highscore');
const finalScoreDisplay = document.getElementById('final-score');
const finalHighscoreDisplay = document.getElementById('final-highscore');
const newRecordDisplay = document.getElementById('new-record');
const pageTurn = document.getElementById('page-turn');
const notebookPage = document.getElementById('notebook-page');

// Initialize
function init() {
    setupCanvas();
    setupEventListeners();
    updateHighscoreDisplay();
}

function setupCanvas() {
    const container = document.querySelector('.canvas-container');
    const size = Math.min(container.clientWidth - 20, container.clientHeight - 20, 350);
    canvas.width = size;
    canvas.height = size;
    
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#2c3e50';
}

function setupEventListeners() {
    startBtn.addEventListener('click', startGame);
    restartBtn.addEventListener('click', startGame);
    undoBtn.addEventListener('click', undoLastPoint);
    clearBtn.addEventListener('click', clearCanvas);
    submitBtn.addEventListener('click', submitDrawing);
    
    // Click to place points
    canvas.addEventListener('click', addPoint);
    
    // Touch to place points
    canvas.addEventListener('touchend', handleTouchPoint, { passive: false });
    
    // Resize handler
    window.addEventListener('resize', () => {
        if (gameScreen.classList.contains('active')) {
            setupCanvas();
        }
    });
}

// Screen management
function showScreen(screen) {
    [startScreen, gameScreen, gameoverScreen].forEach(s => s.classList.remove('active'));
    screen.classList.add('active');
}

// Game flow
function startGame() {
    gameState.score = 0;
    gameState.baseTime = 12;  // Starting time
    gameState.lastUsedShapes = [];
    updateScoreDisplay();
    showScreen(gameScreen);
    
    setTimeout(() => {
        setupCanvas();
        nextRound();
    }, 100);
}

function nextRound() {
    clearCanvas();
    gameState.currentShape = getRandomShape();
    shapePrompt.textContent = gameState.currentShape.name;
    pointHint.textContent = gameState.currentShape.hint;
    
    // Decrease time as score increases (minimum 3 seconds)
    // Timer gets faster quickly: minimum 4 seconds, decrease 0.75 per round
    gameState.timeLeft = Math.max(4, gameState.baseTime - (gameState.score * 0.75));
    
    startTimer();
    
    // Add a little animation to the prompt
    shapePrompt.style.transform = 'scale(1.2)';
    setTimeout(() => {
        shapePrompt.style.transform = 'scale(1)';
    }, 200);
}

function getRandomShape() {
    // Avoid repeating recent shapes
    let availableShapes = SHAPES.filter(s => !gameState.lastUsedShapes.includes(s.name));
    if (availableShapes.length === 0) {
        availableShapes = SHAPES;
        gameState.lastUsedShapes = [];
    }
    
    const shape = availableShapes[Math.floor(Math.random() * availableShapes.length)];
    gameState.lastUsedShapes.push(shape.name);
    if (gameState.lastUsedShapes.length > 5) {
        gameState.lastUsedShapes.shift();
    }
    
    return shape;
}

function startTimer() {
    clearInterval(gameState.timerInterval);
    updateTimerDisplay();
    
    gameState.timerInterval = setInterval(() => {
        gameState.timeLeft -= 0.1;
        updateTimerDisplay();
        
        if (gameState.timeLeft <= 3) {
            timerDisplay.classList.add('warning');
        }
        
        if (gameState.timeLeft <= 0) {
            gameOver('Time\'s up!');
        }
    }, 100);
}

function stopTimer() {
    clearInterval(gameState.timerInterval);
}

function updateTimerDisplay() {
    timerDisplay.textContent = Math.max(0, gameState.timeLeft).toFixed(1);
}

function updateScoreDisplay() {
    scoreDisplay.textContent = gameState.score;
}

function updateHighscoreDisplay() {
    highscoreDisplay.textContent = gameState.highScore;
}

// Point-and-click drawing functions
function addPoint(e) {
    const pos = getCanvasPosition(e);
    gameState.points.push(pos);
    redrawCanvas();
}

function handleTouchPoint(e) {
    e.preventDefault();
    if (e.changedTouches.length > 0) {
        const touch = e.changedTouches[0];
        const mouseEvent = {
            clientX: touch.clientX,
            clientY: touch.clientY
        };
        addPoint(mouseEvent);
    }
}

function getCanvasPosition(e) {
    const rect = canvas.getBoundingClientRect();
    return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
    };
}

function redrawCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (gameState.points.length === 0) return;
    
    // Draw lines connecting points
    ctx.strokeStyle = '#2c3e50';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(gameState.points[0].x, gameState.points[0].y);
    
    for (let i = 1; i < gameState.points.length; i++) {
        ctx.lineTo(gameState.points[i].x, gameState.points[i].y);
    }
    ctx.stroke();
    
    // Draw points as circles
    for (let i = 0; i < gameState.points.length; i++) {
        const point = gameState.points[i];
        
        // Outer circle
        ctx.beginPath();
        ctx.arc(point.x, point.y, 10, 0, Math.PI * 2);
        ctx.fillStyle = '#3498db';
        ctx.fill();
        
        // Inner circle
        ctx.beginPath();
        ctx.arc(point.x, point.y, 6, 0, Math.PI * 2);
        ctx.fillStyle = '#fff';
        ctx.fill();
        
        // Point number
        ctx.fillStyle = '#2c3e50';
        ctx.font = 'bold 10px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText((i + 1).toString(), point.x, point.y);
    }
}

function undoLastPoint() {
    if (gameState.points.length > 0) {
        gameState.points.pop();
        redrawCanvas();
    }
}

function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    gameState.points = [];
}

// Submit and validation
function submitDrawing() {
    stopTimer();
    
    if (gameState.points.length < 2) {  // Need at least 2 points
        gameOver('Not enough points!');
        return;
    }
    
    const isCorrect = gameState.currentShape.validate(gameState.points, canvas.width, canvas.height);
    
    if (isCorrect) {
        gameState.score++;
        updateScoreDisplay();
        animatePageTurn(() => {
            nextRound();
        });
    } else {
        gameOver('Wrong shape!');
    }
}

function animatePageTurn(callback) {
    pageTurn.classList.add('animating');
    timerDisplay.classList.remove('warning');
    
    setTimeout(() => {
        pageTurn.classList.remove('animating');
        callback();
    }, 600);
}

function gameOver(reason) {
    stopTimer();
    timerDisplay.classList.remove('warning');
    
    // Check for new high score
    const isNewRecord = gameState.score > gameState.highScore;
    if (isNewRecord) {
        gameState.highScore = gameState.score;
        localStorage.setItem('speedDrawHighScore', gameState.highScore);
    }
    
    // Update displays
    finalScoreDisplay.textContent = gameState.score;
    finalHighscoreDisplay.textContent = gameState.highScore;
    updateHighscoreDisplay();
    
    newRecordDisplay.style.display = isNewRecord ? 'block' : 'none';
    
    setTimeout(() => {
        showScreen(gameoverScreen);
    }, 500);
}

// ============================================
// SHAPE VALIDATION FUNCTIONS (for point-and-click)
// ============================================

function getCenter(points) {
    const sumX = points.reduce((sum, p) => sum + p.x, 0);
    const sumY = points.reduce((sum, p) => sum + p.y, 0);
    return { x: sumX / points.length, y: sumY / points.length };
}

function getBoundingBox(points) {
    const xs = points.map(p => p.x);
    const ys = points.map(p => p.y);
    return {
        minX: Math.min(...xs),
        maxX: Math.max(...xs),
        minY: Math.min(...ys),
        maxY: Math.max(...ys),
        width: Math.max(...xs) - Math.min(...xs),
        height: Math.max(...ys) - Math.min(...ys)
    };
}

function distance(p1, p2) {
    return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
}

// Check if point is near a corner of the bounding box
function isNearCorner(point, box, threshold) {
    const corners = [
        { x: box.minX, y: box.minY }, // top-left
        { x: box.maxX, y: box.minY }, // top-right
        { x: box.minX, y: box.maxY }, // bottom-left
        { x: box.maxX, y: box.maxY }  // bottom-right
    ];
    return corners.some(corner => distance(point, corner) < threshold);
}

// Triangle: 3 points forming a proper triangle (not a line)
function validateTriangle(points) {
    if (points.length < 3 || points.length > 4) return false;  // Stricter: max 4 points
    
    const box = getBoundingBox(points);
    
    // Must have decent size
    if (box.width < 50 || box.height < 50) return false;  // Stricter: was 40
    
    // Check that points aren't all in a line (calculate triangle area)
    const p1 = points[0], p2 = points[1], p3 = points[2];
    const area = Math.abs((p1.x * (p2.y - p3.y) + p2.x * (p3.y - p1.y) + p3.x * (p1.y - p2.y)) / 2);
    
    // Area should be significant (not collinear) - stricter threshold
    const minArea = (box.width * box.height) * 0.15;  // Stricter: was 0.1
    
    return area > minArea;
}

// Square: 4 points near the corners of a rectangle
function validateSquare(points) {
    if (points.length < 4 || points.length > 5) return false;  // Stricter: max 5 points
    
    const box = getBoundingBox(points);
    
    // Must have decent size
    if (box.width < 50 || box.height < 50) return false;  // Stricter: was 40
    
    // Aspect ratio check - should be square-ish
    const aspectRatio = box.width / box.height;
    if (aspectRatio < 0.6 || aspectRatio > 1.7) return false;  // Stricter: was 0.5-2
    
    // Check that we have points near ALL 4 corners
    const threshold = Math.max(box.width, box.height) * 0.35;  // Stricter: was 0.4
    const corners = [
        { x: box.minX, y: box.minY },
        { x: box.maxX, y: box.minY },
        { x: box.minX, y: box.maxY },
        { x: box.maxX, y: box.maxY }
    ];
    
    let cornersHit = 0;
    for (const corner of corners) {
        if (points.some(p => distance(p, corner) < threshold)) {
            cornersHit++;
        }
    }
    
    return cornersHit >= 4;  // Stricter: was 3, now requires all 4 corners
}

// Arrow: Points forming an elongated shape with arrowhead
function validateArrow(points) {
    if (points.length < 3 || points.length > 5) return false;  // Stricter: max 5 points
    
    const box = getBoundingBox(points);
    
    // Must have decent size
    if (box.width < 60 && box.height < 60) return false;  // Stricter: was 50
    
    // Arrow should be clearly elongated - one dimension notably larger
    const aspectRatio = box.width / box.height;
    const isElongated = aspectRatio > 2 || aspectRatio < 0.5;  // Stricter: was 1.5/0.67
    
    return isElongated;
}

// Checkmark: Points that form a V shape (down then up)
function validateCheckmark(points) {
    if (points.length < 3 || points.length > 4) return false;  // Stricter: need exactly 3-4 points
    
    const box = getBoundingBox(points);
    
    // Must have decent size
    if (box.width < 40 || box.height < 40) return false;  // Stricter: was 30
    
    // Find the lowest point (the bottom of the check - the vertex of the V)
    let lowestIdx = 0;
    for (let i = 1; i < points.length; i++) {
        if (points[i].y > points[lowestIdx].y) {
            lowestIdx = i;
        }
    }
    
    // The lowest point MUST be in the middle (not first or last) - this is the V vertex
    const hasVShape = lowestIdx > 0 && lowestIdx < points.length - 1;
    
    if (!hasVShape) return false;
    
    // The last point should be higher than the first (going up on the right side)
    const lastPoint = points[points.length - 1];
    const firstPoint = points[0];
    const lowestPoint = points[lowestIdx];
    
    // Last point should be above the lowest point (the upstroke)
    const hasUpstroke = lastPoint.y < lowestPoint.y;
    
    return hasUpstroke;
}

// X: Points crossing through the center
function validateX(points) {
    // X needs 5 points: corner → center → opposite corner → center → other corner
    if (points.length < 5 || points.length > 6) return false;  // Stricter: max 6 points
    
    const box = getBoundingBox(points);
    const centerX = (box.minX + box.maxX) / 2;
    const centerY = (box.minY + box.maxY) / 2;
    
    // Must have decent size
    if (box.width < 50 || box.height < 50) return false;  // Stricter: was 40
    
    // Should be roughly square
    const aspectRatio = box.width / box.height;
    if (aspectRatio < 0.5 || aspectRatio > 2) return false;
    
    // Check for a point near the center (the crossing point)
    const centerThreshold = Math.max(box.width, box.height) * 0.35;
    const hasCenterPoint = points.some(p => 
        Math.abs(p.x - centerX) < centerThreshold && 
        Math.abs(p.y - centerY) < centerThreshold
    );
    
    if (!hasCenterPoint) return false;
    
    // Check for points in the corners/edges (at least 3 quadrants)
    const cornerThreshold = Math.max(box.width, box.height) * 0.4;
    let hasTopLeft = points.some(p => p.x < centerX - cornerThreshold * 0.3 && p.y < centerY - cornerThreshold * 0.3);
    let hasTopRight = points.some(p => p.x > centerX + cornerThreshold * 0.3 && p.y < centerY - cornerThreshold * 0.3);
    let hasBottomLeft = points.some(p => p.x < centerX - cornerThreshold * 0.3 && p.y > centerY + cornerThreshold * 0.3);
    let hasBottomRight = points.some(p => p.x > centerX + cornerThreshold * 0.3 && p.y > centerY + cornerThreshold * 0.3);
    
    const cornersHit = (hasTopLeft ? 1 : 0) + (hasTopRight ? 1 : 0) + 
                       (hasBottomLeft ? 1 : 0) + (hasBottomRight ? 1 : 0);
    
    // Need at least 3 corners plus the center
    return cornersHit >= 3;
}

// Initialize the game
init();

