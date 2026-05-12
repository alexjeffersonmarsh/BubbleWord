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

// mute toggle
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
let shotsLeft = 20;

let correctCount = 0;
let totalClicks = 0;

let vocab = [];
let bubbles = [];
let timer;

let gameOver = false;

// play again button
let playAgainButton = {
    x: 0,
    y: 0,
    width: 220,
    height: 60,
    visible: false
};

// HUD elements
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

    shotsLeft = 20;
    attemptsDisplay.textContent = shotsLeft;

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

        // ✅ SAFE vertical spacing (avoids HUD + bottom bar)
        let y = radius + 100 + Math.random() * (canvas.height - 300);

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
// DRAW LOOP
// =========================================

function draw() {

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // draw bubbles
    bubbles.forEach(b => {

        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.fillStyle = "white";
        ctx.fill();

        ctx.strokeStyle = "#b8d7e8";
        ctx.stroke();

        ctx.fillStyle = "#123";
        ctx.font = "20px Arial";
        ctx.textAlign = "center";

        wrapText(b.text, b.x, b.y, b.r * 1.6);
    });

    // draw Play Again button
    if (playAgainButton.visible) {

        ctx.fillStyle = "#34bc6e";
        ctx.fillRect(
            playAgainButton.x,
            playAgainButton.y,
            playAgainButton.width,
            playAgainButton.height
        );

        ctx.fillStyle = "white";
        ctx.font = "22px Arial";
        ctx.fillText(
            "Play Again",
            canvas.width / 2,
            playAgainButton.y + 38
        );
    }
}

// =========================================
// TEXT WRAPPING
// =========================================

function wrapText(text, x, y, maxWidth) {

    const words = text.split(" ");
    let line = "";
    let lines = [];

    words.forEach(word => {

        let testLine = line + word + " ";

        if (ctx.measureText(testLine).width > maxWidth) {
            lines.push(line);
            line = word + " ";
        } else {
            line = testLine;
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

    const x = e.offsetX;
    const y = e.offsetY;

    // ✅ PLAY AGAIN CLICK
    if (gameOver && playAgainButton.visible) {

        if (
            x > playAgainButton.x &&
            x < playAgainButton.x + playAgainButton.width &&
            y > playAgainButton.y &&
            y < playAgainButton.y + playAgainButton.height
        ) {
            restartGame();
            return;
        }
    }

    if (gameOver) return;

    for (let b of bubbles) {

        let dx = x - b.x;
        let dy = y - b.y;

        if (Math.sqrt(dx * dx + dy * dy) < b.r * 1.1) {

            totalClicks++;

            // ✅ CORRECT
            if (b.correct) {

                playPop();

                correctCount++;

                score += 10;
                scoreDisplay.textContent = score;

                bubbles = bubbles.filter(rem => rem !== b);

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

                shotsLeft--;
                attemptsDisplay.textContent = shotsLeft;

                if (shotsLeft <= 0) {
                    endGame("OUT OF SHOTS!");
                }
            }

            break;
        }
    }
};

// =========================================
// GAME OVER SCREEN
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
    ctx.fillText(message, canvas.width / 2, canvas.height / 2 - 100);

    ctx.font = "28px Arial";

    ctx.fillText("Final Score: " + score, canvas.width / 2, canvas.height / 2 - 30);
    ctx.fillText("Correct: " + correctCount, canvas.width / 2, canvas.height / 2 + 10);
    ctx.fillText("Accuracy: " + accuracy + "%", canvas.width / 2, canvas.height / 2 + 50);

    // ✅ PLAY AGAIN BUTTON
    playAgainButton.x = canvas.width / 2 - 110;
    playAgainButton.y = canvas.height / 2 + 90;
    playAgainButton.visible = true;
}

// =========================================
// RESTART GAME
// =========================================

function restartGame() {

    score = 0;
    level = 1;
    correctCount = 0;
    totalClicks = 0;
    gameOver = false;

    scoreDisplay.textContent = score;
    levelDisplay.textContent = level;

    playAgainButton.visible = false;

    createLevel();
}

// =========================================
// START BUTTON
// =========================================

document.getElementById("start-game-btn").onclick = () => {

    vocab = window.preloadedVocab || document
        .getElementById("bulk-vocab-input")
        .value.split("\n")
        .map(line => {
            if (!line.includes(",")) return null;

            let parts = line.split(",");
            return {
                word: parts[0].trim(),
                definition: parts.slice(1).join(",").trim()
            };
        })
        .filter(v => v !== null && v.word && v.definition);

    if (vocab.length < 5) {
        alert("Please enter at least 5 valid vocabulary entries.");
        return;
    }

    score = 0;
    level = 1;
    correctCount = 0;
    totalClicks = 0;
    gameOver = false;

    scoreDisplay.textContent = score;
    levelDisplay.textContent = level;

    createLevel();
};
