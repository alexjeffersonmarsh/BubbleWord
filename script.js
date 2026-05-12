
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
// SOUND SYSTEM
// =========================================

let soundOn = true;

const pop = new Audio("https://actions.google.com/sounds/v1/bubbles/bubble_pop.ogg");
const miss = new Audio("https://actions.google.com/sounds/v1/cartoon/wood_plank_flicks.ogg");

function playPop() {
    if (!soundOn) return;
    pop.currentTime = 0;
    pop.play();
}

function playMiss() {
    if (!soundOn) return;
    miss.currentTime = 0;
    miss.play();
}

document.getElementById("mute-btn").onclick = () => {
    soundOn = !soundOn;
    document.getElementById("mute-btn").textContent = soundOn ? "🔊" : "🔇";
};

// =========================================
// GAME STATE
// =========================================

let score = 0;
let level = 1;
let timeLeft = 60;
let attempts = 20;

let correctCount = 0;
let totalClicks = 0;

let vocab = [];
let bubbles = [];
let timer;

let gameOver = false;

// HUD
const scoreDisplay = document.getElementById("score");
const levelDisplay = document.getElementById("level");
const timerDisplay = document.getElementById("timer");
const attemptsDisplay = document.getElementById("attempts");
const targetWordDisplay = document.getElementById("target-word");

// =========================================
// CREATE LEVEL
// =========================================

function createLevel() {

    bubbles = [];
    gameOver = false;

    attempts = 20;
    attemptsDisplay.textContent = attempts;

    startTimer();

    let selected = [...vocab]
        .sort(() => Math.random() - 0.5)
        .slice(0, 10);

    const answer =
        selected[Math.floor(Math.random() * selected.length)];

    targetWordDisplay.textContent =
        answer.word.toUpperCase();

    selected.forEach(item => {

        let radius = 100;

        let x = radius + Math.random() * (canvas.width - radius * 2);
        let y = radius + Math.random() * (canvas.height - 200);

        bubbles.push({
            x,
            y,
            r: radius,
            text: item.definition,
            correct: item.word === answer.word
        });
    });
}

// =========================================
// TIMER
// =========================================

function startTimer() {

    clearInterval(timer);

    timeLeft = 60;
    timerDisplay.textContent = timeLeft;

    timer = setInterval(() => {

        timeLeft--;
        timerDisplay.textContent = timeLeft;

        if (timeLeft <= 0) {
            playMiss();
            endGame("TIME'S UP!");
        }

    }, 1000);
}

// =========================================
// DRAW
// =========================================

function draw() {

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    bubbles.forEach(b => {

        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.fillStyle = "white";
        ctx.fill();

        ctx.fillStyle = "black";
        ctx.textAlign = "center";
        ctx.font = "20px Arial";

        wrapText(b.text, b.x, b.y, b.r * 1.6);
    });
}

// =========================================
// TEXT WRAP
// =========================================

function wrapText(text, x, y, maxWidth) {

    const words = text.split(" ");
    let lines = [];
    let line = "";

    words.forEach(word => {

        let test = line + word + " ";

        if (ctx.measureText(test).width > maxWidth) {
            lines.push(line);
            line = word + " ";
        } else {
            line = test;
        }
    });

    lines.push(line);

    lines.forEach((l, i) => {
        ctx.fillText(l, x, y + i * 20 - 10);
    });
}

// =========================================
// CLICK HANDLER
// =========================================

canvas.onclick = (e) => {

    if (gameOver) return;

    for (let b of bubbles) {

        let dx = e.offsetX - b.x;
        let dy = e.offsetY - b.y;

        if (Math.sqrt(dx * dx + dy * dy) < b.r * 1.1) {

            totalClicks++;

            // ✅ CORRECT
            if (b.correct) {

                playPop();

                correctCount++;

                score += 10;
                scoreDisplay.textContent = score;

                bubbles = bubbles.filter(x => x !== b);

                // ✅ LEVEL COMPLETE
                if (bubbles.length === 0) {

                    let bonus = timeLeft * 2;
                    score += bonus;

                    scoreDisplay.textContent = score;

                    level++;
                    levelDisplay.textContent = level;

                    createLevel();
                }

            }

            // ❌ INCORRECT
            else {

                playMiss();

                attempts--;
                attemptsDisplay.textContent = attempts;

                if (attempts <= 0) {
                    endGame("OUT OF ATTEMPTS!");
                }
            }

            break;
        }
    }
};

// =========================================
// GAME OVER
// =========================================

function endGame(message) {

    gameOver = true;
    clearInterval(timer);

    let accuracy =
        totalClicks > 0
            ? Math.round((correctCount / totalClicks) * 100)
            : 0;

    ctx.fillStyle = "rgba(0,0,0,0.8)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "white";
    ctx.textAlign = "center";

    ctx.font = "44px Arial";
    ctx.fillText(message, canvas.width / 2, canvas.height / 2 - 80);

    ctx.font = "28px Arial";

    ctx.fillText("Final Score: " + score, canvas.width / 2, canvas.height / 2 - 20);
    ctx.fillText("Correct Answers: " + correctCount, canvas.width / 2, canvas.height / 2 + 20);
    ctx.fillText("Accuracy: " + accuracy + "%", canvas.width / 2, canvas.height / 2 + 60);

    ctx.font = "18px Arial";
    ctx.fillText("Click Start to play again", canvas.width / 2, canvas.height / 2 + 110);
}

// =========================================
// START BUTTON
// =========================================

document.getElementById("start-game-btn").onclick = () => {

    vocab =
        window.preloadedVocab ||
        document.getElementById("bulk-vocab-input")
        .value.split("\n")
        .map(line => {
            let parts = line.split(",");
            return {
                word: parts[0]?.trim(),
                definition: parts.slice(1).join(",").trim()
            };
        })
        .filter(v => v.word && v.definition);

    score = 0;
    level = 1;
    correctCount = 0;
    totalClicks = 0;

    scoreDisplay.textContent = score;
    levelDisplay.textContent = level;

    createLevel();
};

// =========================================
// AUTO START FROM LINK
// =========================================

if (window.preloadedVocab && window.preloadedVocab.length > 0) {

    vocab = window.preloadedVocab;

    score = 0;
    level = 1;
    correctCount = 0;
    totalClicks = 0;

    scoreDisplay.textContent = score;
    levelDisplay.textContent = level;

    createLevel();
}

// =========================================
// LOOP
// =========================================

function loop() {
    draw();
    requestAnimationFrame(loop);
}

loop();
