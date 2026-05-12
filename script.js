const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

function resizeCanvas() {
    const panelWidth = document.getElementById("teacher-panel")?.offsetWidth || 0;
    canvas.width = window.innerWidth - panelWidth;
    canvas.height = window.innerHeight;
}

resizeCanvas();
window.addEventListener("resize", resizeCanvas);

// ================= SOUND =================
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

// ================= GAME =================

let score = 0;
let level = 1;
let timeLeft = 60;
let attempts = 20;
let vocab = [];
let bubbles = [];
let timer;

const scoreDisplay = document.getElementById("score");
const levelDisplay = document.getElementById("level");
const timerDisplay = document.getElementById("timer");
const attemptsDisplay = document.getElementById("attempts");
const targetWordDisplay = document.getElementById("target-word");

// ================= CREATE LEVEL =================

function createLevel() {

    bubbles = [];

    attempts = 20;
    attemptsDisplay.textContent = attempts;

    startTimer();

    let selected = [...vocab].sort(() => Math.random() - 0.5).slice(0, 10);

    const answer = selected[Math.floor(Math.random() * selected.length)];

    targetWordDisplay.textContent = answer.word.toUpperCase();

    selected.forEach(item => {

        let radius = 100;

        let x = radius + Math.random() * (canvas.width - radius * 2);
        let y = radius + Math.random() * (canvas.height - 200);

        bubbles.push({
            x, y,
            r: radius,
            text: item.definition,
            correct: item.word === answer.word
        });

    });
}

// ================= TIMER =================

function startTimer() {
    clearInterval(timer);
    timeLeft = 60;
    timerDisplay.textContent = timeLeft;

    timer = setInterval(() => {
        timeLeft--;
        timerDisplay.textContent = timeLeft;

        if (timeLeft <= 0) endGame("TIME'S UP!");
    }, 1000);
}

// ================= DRAW =================

function draw() {

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    bubbles.forEach(b => {

        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI*2);
        ctx.fillStyle = "white";
        ctx.fill();

        ctx.fillStyle = "black";
        ctx.textAlign = "center";
        ctx.font = "20px Arial";

        wrapText(b.text, b.x, b.y, b.r * 1.5);
    });
}

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
        ctx.fillText(l, x, y + i*18 - 10);
    });
}

// ================= CLICK =================

canvas.onclick = e => {

    for (let b of bubbles) {

        let dx = e.offsetX - b.x;
        let dy = e.offsetY - b.y;

        if (Math.sqrt(dx*dx + dy*dy) < b.r * 1.1) {

            if (b.correct) {

                playPop();

                score += 100;
                scoreDisplay.textContent = score;

                bubbles = bubbles.filter(x => x !== b);

                if (bubbles.length === 0) {
                    level++;
                    createLevel();
                }

            } else {

                playMiss();

                attempts--;
                attemptsDisplay.textContent = attempts;

                if (attempts <= 0) endGame("OUT OF ATTEMPTS!");
            }

        }
    }
};

// ================= GAME OVER =================

function endGame(msg) {

    clearInterval(timer);

    ctx.fillStyle = "rgba(0,0,0,0.7)";
    ctx.fillRect(0,0,canvas.width,canvas.height);

    ctx.fillStyle = "white";
    ctx.font = "40px Arial";

    ctx.fillText(msg, canvas.width/2, canvas.height/2);
}

// ================= START =================

document.getElementById("start-game-btn").onclick = () => {

    vocab = window.preloadedVocab || document.getElementById("bulk-vocab-input")
    .value.split("\n").map(x => {
        let p = x.split(",");
        return { word:p[0], definition:p[1] };
    });

    createLevel();
};

// AUTO START
if (window.preloadedVocab) {
    vocab = window.preloadedVocab;
    createLevel();
}

// LOOP
function loop() {
    draw();
    requestAnimationFrame(loop);
}
loop();
