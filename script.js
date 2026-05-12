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
let shotsLeft = 20;

let correctCount = 0;
let totalClicks = 0;

let vocab = [];
let bubbles = [];
let timer;

let gameOver = false;

// Play Again button
let playAgainButton = {
    x: 0,
    y: 0,
    width: 220,
    height: 60,
    visible: false
};

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

        let radius = 90;
        let x, y;
        let safe = false;

        while (!safe) {

            x = radius + Math.random() * (canvas.width - radius * 2);
            y = radius + 120 + Math.random() * (canvas.height - 350);

            safe = true;

            for (let other of bubbles) {
                let dx = x - other.x;
                let dy = y - other.y;
                let dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < radius * 2.4) {
                    safe = false;
                    break;
                }
            }
        }

        let speed = (level - 1) * 0.5;

        bubbles.push({
            x,
            y,
            r: radius,
            text: item.definition,
            correct: item.word === answer.word,
            vx: (Math.random() - 0.5) * speed,
            vy: (Math.random() - 0.5) * speed
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
// UPDATE (MOVEMENT)
// =========================================

function update() {

    bubbles.forEach(b => {

        if (level === 1) return;

        if (level === 2) {
            b.x += b.vx;
        }

        if (level >= 3) {
            b.x += b.vx;
            b.y += b.vy;
        }

        if (level >= 5) {
            b.vx += (Math.random() - 0.5) * 0.1;
            b.vy += (Math.random() - 0.5) * 0.1;
        }

        if (b.x < b.r || b.x > canvas.width - b.r) {
            b.vx *= -1;
        }

        if (b.y < b.r || b.y > canvas.height - 160) {
            b.vy *= -1;
        }
    });
}

// =========================================
// DRAW
// =========================================

function draw() {

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    bubbles.forEach(b => {

        // bubble shape
        ctx.beginPath();
        ctx.ellipse(b.x, b.y, b.r * 1.05, b.r * 0.9, 0, 0, Math.PI * 2);

        let gradient = ctx.createRadialGradient(
            b.x - b.r * 0.3,
            b.y - b.r * 0.3,
            b.r * 0.2,
            b.x,
            b.y,
            b.r
        );

        gradient.addColorStop(0, "rgba(255,255,255,0.9)");
        gradient.addColorStop(0.4, "rgba(200,230,255,0.6)");
        gradient.addColorStop(1, "rgba(150,200,255,0.3)");

        ctx.fillStyle = gradient;
        ctx.fill();

        ctx.strokeStyle = "rgba(255,255,255,0.6)";
        ctx.stroke();

        // highlight
        ctx.beginPath();
        ctx.ellipse(
            b.x - b.r * 0.35,
            b.y - b.r * 0.35,
            b.r * 0.2,
            b.r * 0.12,
            0, 0, Math.PI * 2
        );
        ctx.fillStyle = "rgba(255,255,255,0.8)";
        ctx.fill();

        // text
        ctx.fillStyle = "#123";
        ctx.font = "bold 20px Arial";
        ctx.textAlign = "center";

        wrapText(b.text, b.x, b.y, b.r * 1.6);
    });

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
// TEXT WRAP
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

    // play again
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

            if (b.correct) {

                playPop();

                correctCount++;

                score += 10;
                scoreDisplay.textContent = score;

                // REMOVE bubble
                bubbles = bubbles.filter(rem => rem !== b);

                // ✅ UPDATE TARGET WORD
                if (bubbles.length > 0) {

                    let next = bubbles[Math.floor(Math.random() * bubbles.length)];

                    bubbles.forEach(x => x.correct = (x === next));

                    let match = vocab.find(v => v.definition === next.text);
                    if (match) {
                        targetWordDisplay.textContent =
                            match.word.toUpperCase();
                    }

                } else {

                    let bonus = timeLeft * 2;
                    score += bonus;

                    scoreDisplay.textContent = score;

                    level++;
                    levelDisplay.textContent = level;

                    createLevel();
                }

            } else {

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
    ctx.fillText(message, canvas.width / 2, canvas.height / 2 - 100);

    ctx.font = "28px Arial";
    ctx.fillText("Final Score: " + score, canvas.width / 2, canvas.height / 2 - 30);
    ctx.fillText("Correct: " + correctCount, canvas.width / 2, canvas.height / 2 + 10);
    ctx.fillText("Accuracy: " + accuracy + "%", canvas.width / 2, canvas.height / 2 + 50);

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

    vocab =
        window.preloadedVocab ||
        document.getElementById("bulk-vocab-input")
        .value.split("\n")
        .map(line => {
            if (!line.includes(",")) return null;
            let p = line.split(",");
            return {
                word: p[0].trim(),
                definition: p.slice(1).join(",").trim()
            };
        })
        .filter(v => v && v.word && v.definition);

    if (vocab.length < 5) {
        alert("Please enter at least 5 valid entries.");
        return;
    }

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
    update();
    draw();
    requestAnimationFrame(loop);
}

loop();
