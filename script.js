
// =========================================
// CANVAS SETUP
// =========================================

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

function resizeCanvas() {
    const panelWidth =
        document.getElementById("teacher-panel")?.offsetWidth || 0;

    canvas.width = window.innerWidth - panelWidth;
    canvas.height = window.innerHeight;
}

resizeCanvas();
window.addEventListener("resize", resizeCanvas);

// =========================================
// SOUND SYSTEM (UPGRADED)
// =========================================

let soundOn = true;

const popSounds = [
    new Audio("https://actions.google.com/sounds/v1/bubbles/bubble_pop.ogg"),
    new Audio("https://actions.google.com/sounds/v1/bubbles/bubble_pop.ogg"),
    new Audio("https://actions.google.com/sounds/v1/bubbles/bubble_pop.ogg")
];

const missSound = new Audio(
    "https://actions.google.com/sounds/v1/cartoon/wood_plank_flicks.ogg"
);

popSounds.forEach(s => s.volume = 0.4);
missSound.volume = 0.5;

function playPopSound() {
    if (!soundOn) return;

    const sound = popSounds[Math.floor(Math.random() * popSounds.length)];
    sound.currentTime = 0;
    sound.playbackRate = 0.9 + Math.random() * 0.2;
    sound.play();
}

function playMissSound() {
    if (!soundOn) return;

    missSound.currentTime = 0;
    missSound.playbackRate = 1 + Math.random() * 0.2;
    missSound.play();
}

// toggle button
const muteBtn = document.getElementById("mute-btn");
if (muteBtn) {
    muteBtn.onclick = () => {
        soundOn = !soundOn;
        muteBtn.textContent = soundOn ? "🔊" : "🔇";
    };
}

// =========================================
// GAME STATE
// =========================================

let score = 0;
let level = 1;
const maxLevels = 10;

let timeLeft = 60;
let timerInterval = null;

let attemptsLeft = 20;

let bubbles = [];
let vocabList = [];
let currentWord = null;

let gameOver = false;

// visuals
let flashColor = null;
let flashAlpha = 0;

// HUD
const scoreDisplay = document.getElementById("score");
const levelDisplay = document.getElementById("level");
const timerDisplay = document.getElementById("timer");
const attemptsDisplay = document.getElementById("attempts");
const targetWordDisplay = document.getElementById("target-word");

// =========================================
// TIMER
// =========================================

function startTimer() {

    clearInterval(timerInterval);

    timeLeft = 60;
    timerDisplay.textContent = timeLeft;

    timerInterval = setInterval(() => {
        timeLeft--;
        timerDisplay.textContent = timeLeft;

        if (timeLeft <= 0) endGame("Time's up!");
    }, 1000);
}

// =========================================
// PARSE VOCAB
// =========================================

function getVocabularyList() {

    return document.getElementById("bulk-vocab-input")
        .value.split("\n")
        .map(line => line.split(","))
        .filter(parts => parts.length > 1)
        .map(parts => ({
            word: parts[0].trim(),
            definition: parts.slice(1).join(",").trim()
        }));
}

// =========================================
// BUBBLE CLASS
// =========================================

class Bubble {

    constructor(x, y, radius, text, correct, speed) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.text = text;
        this.correct = correct;

        this.vx = speed;
        this.vy = 0;

        this.popping = false;
        this.popFrame = 0;
    }

    update() {

        if (level >= 2) {

            this.x += this.vx;
            this.y += this.vy;

            if (level >= 3) {
                this.y += Math.sin(Date.now() / 300 + this.x) * 0.5;
            }

            if (level >= 5) {
                this.vy += (Math.random() - 0.5) * 0.2;
            }

            if (this.x < this.radius || this.x > canvas.width - this.radius) {
                this.vx *= -1;
            }

            if (this.y < this.radius || this.y > canvas.height - 200) {
                this.vy *= -1;
            }
        }
    }

    draw() {

        if (this.popping) {
            this.popFrame++;
            this.radius += 2;

            ctx.globalAlpha = 1 - this.popFrame / 10;

            if (this.popFrame > 10) {
                ctx.globalAlpha = 1;
                return;
            }
        }

        let g = ctx.createRadialGradient(
            this.x - this.radius * 0.3,
            this.y - this.radius * 0.3,
            this.radius * 0.2,
            this.x,
            this.y,
            this.radius
        );

        g.addColorStop(0, "rgba(255,255,255,0.9)");
        g.addColorStop(0.4, "rgba(200,230,255,0.6)");
        g.addColorStop(1, "rgba(150,200,255,0.3)");

        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = g;
        ctx.fill();

        ctx.strokeStyle = "rgba(255,255,255,0.6)";
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(
            this.x - this.radius * 0.35,
            this.y - this.radius * 0.35,
            this.radius * 0.18,
            0,
            Math.PI * 2
        );
        ctx.fillStyle = "rgba(255,255,255,0.8)";
        ctx.fill();

        ctx.fillStyle = "#123";
        ctx.font = "15px Arial";
        ctx.textAlign = "center";

        wrapText(this.text, this.x, this.y, this.radius * 1.4, 18);

        ctx.globalAlpha = 1;
    }
}

// =========================================
// TEXT WRAP
// =========================================

function wrapText(text, x, y, maxWidth, lineHeight) {

    const words = text.split(" ");
    let line = "";
    let lines = [];

    for (let w of words) {
        let test = line + w + " ";

        if (ctx.measureText(test).width > maxWidth) {
            lines.push(line);
            line = w + " ";
        } else {
            line = test;
        }
    }

    lines.push(line);

    let startY = y - (lines.length * lineHeight) / 2;

    lines.forEach((l, i) => {
        ctx.fillText(l, x, startY + i * lineHeight);
    });
}

// =========================================
// CREATE LEVEL
// =========================================

function createLevel() {

    attemptsLeft = 20;
    attemptsDisplay.textContent = attemptsLeft;

    startTimer();

    bubbles = [];

    currentWord =
        vocabList[Math.floor(Math.random() * vocabList.length)];

    targetWordDisplay.textContent =
        currentWord.word.toUpperCase();

    let selected = [...vocabList]
        .sort(() => Math.random() - 0.5)
        .slice(0, 10);

    if (!selected.includes(currentWord)) {
        selected[0] = currentWord;
    }

    selected.forEach(item => {

        let radius = 80;
        let x, y, safe = false;

        while (!safe) {

            x = radius + Math.random() * (canvas.width - radius * 2);
            y = radius + Math.random() * (canvas.height - 250);

            safe = true;

            for (let b of bubbles) {
                let dx = x - b.x;
                let dy = y - b.y;
                let dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < radius * 2.6) safe = false;
            }
        }

        let speed = (level - 1) * 0.8 * (Math.random() - 0.5);

        bubbles.push(
            new Bubble(
                x,
                y,
                radius,
                item.definition,
                item.word === currentWord.word,
                speed
            )
        );
    });
}

// =========================================
// DRAW
// =========================================

function drawGame() {

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    bubbles.forEach(b => {
        b.update();
        b.draw();
    });

    if (flashColor) {

        ctx.fillStyle = flashColor;
        ctx.globalAlpha = flashAlpha;

        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.globalAlpha = 1;

        flashAlpha -= 0.05;
        if (flashAlpha <= 0) flashColor = null;
    }
}

// =========================================
// CLICK HANDLER
// =========================================

canvas.addEventListener("click", (event) => {

    if (gameOver) return;

    const rect = canvas.getBoundingClientRect();
    const mx = event.clientX - rect.left;
    const my = event.clientY - rect.top;

    for (let bubble of bubbles) {

        let dx = mx - bubble.x;
        let dy = my - bubble.y;

        if (Math.sqrt(dx*dx + dy*dy) < bubble.radius) {

            if (bubble.correct) {

                playPopSound();

                score += 100;
                scoreDisplay.textContent = score;

                flashColor = "green";
                flashAlpha = 0.25;

                bubble.popping = true;

                setTimeout(() => {

                    bubbles = bubbles.filter(b => b !== bubble);

                    if (bubbles.length > 0) {

                        let next =
                            bubbles[Math.floor(Math.random() * bubbles.length)];

                        bubbles.forEach(b => b.correct = (b === next));

                        currentWord =
                            vocabList.find(v => v.definition === next.text);

                        targetWordDisplay.textContent =
                            currentWord.word.toUpperCase();

                    } else {

                        level++;

                        if (level > maxLevels) {
                            endGame("YOU WIN!");
                            return;
                        }

                        levelDisplay.textContent = level;
                        createLevel();
                    }

                }, 120);

            } else {

                playMissSound();

                score = Math.max(0, score - 25);
                scoreDisplay.textContent = score;

                attemptsLeft--;
                attemptsDisplay.textContent = attemptsLeft;

                flashColor = "red";
                flashAlpha = 0.25;

                if (attemptsLeft <= 0) {
                    endGame("Out of attempts!");
                }
            }

            break;
        }
    }
});

// =========================================
// GAME OVER
// =========================================

function endGame(message) {

    gameOver = true;
    clearInterval(timerInterval);

    bubbles = [];

    ctx.fillStyle = "rgba(0,0,0,0.7)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "white";
    ctx.font = "40px Arial";
    ctx.textAlign = "center";

    ctx.fillText(message, canvas.width / 2, canvas.height / 2 - 20);
    ctx.fillText("Score: " + score, canvas.width / 2, canvas.height / 2 + 40);
}

// =========================================
// START BUTTON
// =========================================

document.getElementById("start-game-btn")
.addEventListener("click", () => {

    vocabList = window.preloadedVocab || getVocabularyList();

    if (vocabList.length < 10) {
        alert("Enter at least 10 words.");
        return;
    }

    score = 0;
    level = 1;
    gameOver = false;

    scoreDisplay.textContent = score;
    levelDisplay.textContent = level;

    createLevel();
});

// =========================================
// AUTO START (LINK)
// =========================================

if (window.preloadedVocab) {

    vocabList = window.preloadedVocab;

    score = 0;
    level = 1;
    gameOver = false;

    scoreDisplay.textContent = score;
    levelDisplay.textContent = level;

    createLevel();
}

// =========================================
// GAME LOOP
// =========================================

function gameLoop() {
    drawGame();
    requestAnimationFrame(gameLoop);
}

// =========================================
// AUTO START FROM SHARED LINK (REQUIRED)
// =========================================

if (window.preloadedVocab && window.preloadedVocab.length > 0) {

    vocabList = window.preloadedVocab;

    score = 0;
    level = 1;
    gameOver = false;

    scoreDisplay.textContent = score;
    levelDisplay.textContent = level;

    createLevel();
}

gameLoop();
