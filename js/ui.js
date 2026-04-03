// ui.js — HUD, startskärm, game over

const UI = {
    elements: {},

    init() {
        this.elements = {
            startScreen: document.getElementById('start-screen'),
            gameoverScreen: document.getElementById('gameover-screen'),
            startBtn: document.getElementById('start-btn'),
            restartBtn: document.getElementById('restart-btn'),
            mathQuestion: document.getElementById('math-question'),
            answerButtons: document.querySelectorAll('.answer-btn'),
            parachute: document.getElementById('parachute'),
            parachuteContainer: document.getElementById('parachute-container'),
            finalWave: document.getElementById('final-wave'),
            finalScore: document.getElementById('final-score'),
            finalCorrect: document.getElementById('final-correct'),
            mathArea: document.getElementById('math-area'),
        };
    },

    showStart() {
        this.elements.startScreen.classList.remove('hidden');
        this.elements.gameoverScreen.classList.add('hidden');
        this.elements.mathArea.classList.add('hidden');
    },

    hideStart() {
        this.elements.startScreen.classList.add('hidden');
        this.elements.mathArea.classList.remove('hidden');
    },

    showGameOver(wave, score, correctAnswers) {
        this.elements.gameoverScreen.classList.remove('hidden');
        this.elements.finalWave.textContent = wave;
        this.elements.finalScore.textContent = score;
        this.elements.finalCorrect.textContent = correctAnswers;
    },

    hideGameOver() {
        this.elements.gameoverScreen.classList.add('hidden');
    },

    // Visa nytt mattetal med fallskärmsanimation
    showQuestion(question, options, onAnswer) {
        const container = this.elements.parachuteContainer;
        container.classList.remove('drop-animation');
        // Trigger reflow för att återstarta animation
        void container.offsetWidth;
        container.classList.add('drop-animation');

        this.elements.mathQuestion.textContent = question;

        this.elements.answerButtons.forEach((btn, i) => {
            btn.textContent = options[i];
            btn.className = 'answer-btn';
            btn.disabled = false;
            btn.onclick = () => {
                const isCorrect = options[i] === onAnswer;
                btn.classList.add(isCorrect ? 'correct' : 'wrong');
                // Visa rätt svar kort
                if (!isCorrect) {
                    this.elements.answerButtons.forEach((b, j) => {
                        if (options[j] === onAnswer) b.classList.add('correct');
                    });
                }
                // Inaktivera alla knappar
                this.elements.answerButtons.forEach(b => b.disabled = true);
                // Callback
                setTimeout(() => {
                    if (typeof onAnswer === 'number') {
                        // Anropas inte direkt — Game hanterar detta
                    }
                }, 300);

                // Returnera om det var rätt
                if (window._onMathAnswer) {
                    window._onMathAnswer(isCorrect);
                }
            };
        });
    },

    // Rita HUD på canvas
    drawHUD(ctx, state) {
        const { wave, score, ammo, streak } = state;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(0, 0, ctx.canvas.width, 35);

        ctx.fillStyle = '#fff';
        ctx.font = 'bold 14px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`🧟 Våg: ${wave}`, 10, 24);

        // Streak — lyser upp närmare 10
        if (streak > 0) {
            const progress = streak % 10;
            const streakColor = progress >= 7 ? '#f1c40f' : progress >= 4 ? '#e67e22' : '#aaa';
            ctx.fillStyle = streakColor;
            ctx.fillText(`🔥 ${streak}`, 120, 24);
        }

        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.fillText(`⭐ ${score}`, ctx.canvas.width / 2, 24);

        ctx.textAlign = 'right';
        ctx.fillText(`💣 ${ammo}`, ctx.canvas.width - 10, 24);
    },

    // Rita mark
    drawGround(ctx, canvasHeight) {
        const groundY = canvasHeight - 40;
        ctx.fillStyle = '#3a5c2a';
        ctx.fillRect(0, groundY, ctx.canvas.width, 40);

        // Gräs-detaljer
        ctx.fillStyle = '#4a7c3f';
        for (let x = 0; x < ctx.canvas.width; x += 15) {
            ctx.fillRect(x, groundY - 3, 3, 6);
        }
    },

    // Rita basens vägg
    drawBase(ctx, canvasHeight) {
        const groundY = canvasHeight - 40;
        ctx.fillStyle = '#8b7355';
        ctx.fillRect(0, groundY - 80, 15, 80);
        ctx.fillRect(0, groundY - 80, 30, 10);
        // Tegelmönster
        ctx.strokeStyle = '#6b5335';
        ctx.lineWidth = 1;
        for (let y = groundY - 75; y < groundY; y += 12) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(15, y);
            ctx.stroke();
        }
    }
};
