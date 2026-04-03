// game.js — Huvudloop, state, Canvas-rendering

const Game = {
    canvas: null,
    ctx: null,
    state: 'start', // start, playing, gameover
    wave: 1,
    score: 0,
    correctAnswers: 0,
    streak: 0,
    lastTime: 0,
    currentQuestion: null,
    waitingForAnswer: false,
    nextQuestionDelay: 0,

    // Barrikad — byggs vid 10-streak
    barricade: { active: false, hp: 0, maxHp: 0, x: 0, flashTimer: 0 },

    selectedStartWave: 1,

    init() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this._resize();
        window.addEventListener('resize', () => this._resize());

        UI.init();
        UI.showStart();

        // Våg-väljare
        document.querySelectorAll('.wave-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.wave-btn').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                this.selectedStartWave = parseInt(btn.dataset.wave);
            });
        });

        // Event listeners
        UI.elements.startBtn.addEventListener('click', () => this.start());
        UI.elements.restartBtn.addEventListener('click', () => this.start());
        UI.elements.quitBtn.addEventListener('click', () => this.quit());

        // Callback för mattefrågor
        window._onMathAnswer = (isCorrect) => this._handleAnswer(isCorrect);

        // Piltangenter → svarsalternativ (upp=0, vänster=1, höger=2, ner=3)
        const keyMap = { ArrowUp: 0, ArrowLeft: 1, ArrowRight: 2, ArrowDown: 3 };
        document.addEventListener('keydown', (e) => {
            if (this.state !== 'playing' || !this.waitingForAnswer) return;
            const index = keyMap[e.key];
            if (index !== undefined) {
                e.preventDefault();
                const btn = UI.elements.answerButtons[index];
                if (btn && !btn.disabled) btn.click();
            }
        });

        // Starta renderloop
        requestAnimationFrame((t) => this._loop(t));
    },

    start() {
        this.state = 'playing';
        this.wave = this.selectedStartWave;
        this.score = 0;
        this.correctAnswers = 0;
        this.streak = 0;
        this.barricade = { active: false, hp: 0, maxHp: 0, x: 0, flashTimer: 0 };
        this.waitingForAnswer = false;
        this.nextQuestionDelay = 0.5;

        Cannon.reset(this.canvas.height);
        ZombieManager.reset();
        ZombieManager.startWave(this.wave);

        UI.hideStart();
        UI.hideGameOver();
    },

    quit() {
        this.state = 'start';
        this._checkHighscore();
        UI.elements.quitBtn.classList.add('hidden');
        UI.showStart();
    },

    _resize() {
        const container = document.getElementById('game-container');
        this.canvas.width = container.clientWidth;
        this.canvas.height = Math.min(300, window.innerHeight * 0.4);
        if (this.state === 'playing') {
            Cannon.y = this.canvas.height - 40 - Cannon.height;
        }
    },

    _loop(timestamp) {
        const dt = Math.min((timestamp - this.lastTime) / 1000, 0.1); // Cap delta
        this.lastTime = timestamp;

        if (this.state === 'playing') {
            this._update(dt);
        }

        this._draw();
        requestAnimationFrame((t) => this._loop(t));
    },

    _update(dt) {
        // Uppdatera zombies
        ZombieManager.update(dt, this.wave, this.canvas.width, this.canvas.height);

        // Uppdatera kanon + projektiler
        Cannon.update(dt, ZombieManager.zombies, this.canvas.width);

        // Poäng för dödade zombies (de som togs bort)
        const aliveCount = ZombieManager.zombies.length;

        // Barrikad flash-timer
        if (this.barricade.flashTimer > 0) {
            this.barricade.flashTimer -= dt;
        }

        // Zombies vs barrikad — stoppa dem och låt dem banka
        if (this.barricade.active) {
            for (const z of ZombieManager.zombies) {
                if (z.x <= this.barricade.x + 15 && z.x > Cannon.x) {
                    z.x = this.barricade.x + 15; // Stoppa vid barrikaden
                    // Banka ner barrikaden
                    if (!z._attackTimer) z._attackTimer = 0;
                    z._attackTimer -= dt;
                    if (z._attackTimer <= 0) {
                        this.barricade.hp--;
                        z._attackTimer = 0.8;
                        this.barricade.flashTimer = 0.15;
                    }
                }
            }
            if (this.barricade.hp <= 0) {
                this.barricade.active = false;
            }
        }

        // Kolla game over
        if (ZombieManager.hasReachedBase(Cannon.x)) {
            this.state = 'gameover';
            const isNewHighscore = this._checkHighscore();
            UI.showGameOver(this.wave, this.score, this.correctAnswers, isNewHighscore);
            return;
        }

        // Kolla om vågen är klar
        if (ZombieManager.isWaveComplete()) {
            this.wave++;
            this.score += this.wave * 10; // Bonus för avklarad våg
            ZombieManager.startWave(this.wave);
        }

        // Visa nästa fråga
        if (!this.waitingForAnswer) {
            this.nextQuestionDelay -= dt;
            if (this.nextQuestionDelay <= 0) {
                this._showNextQuestion();
            }
        }
    },

    _showNextQuestion() {
        const q = MathEngine.generate(this.wave);
        this.currentQuestion = q;
        this.waitingForAnswer = true;
        UI.showQuestion(q.question, q.options, q.correctAnswer);
    },

    _handleAnswer(isCorrect) {
        if (!this.waitingForAnswer) return;
        this.waitingForAnswer = false;

        if (isCorrect) {
            Cannon.addAmmo();
            this.score += 10 + this.wave * 2;
            this.correctAnswers++;
            this.streak++;

            // Streak-bonus: bygg barrikad vid 10 rätt i rad
            if (this.streak > 0 && this.streak % 10 === 0) {
                this._buildBarricade();
            }
        } else {
            this.streak = 0;
        }

        // Kort paus innan nästa fråga
        this.nextQuestionDelay = isCorrect ? 0.4 : 0.8;
    },

    _checkHighscore() {
        const prev = parseInt(localStorage.getItem('mathZombieHighscore') || '0');
        if (this.score > prev) {
            localStorage.setItem('mathZombieHighscore', this.score);
            return true;
        }
        return false;
    },

    _getHighscore() {
        return parseInt(localStorage.getItem('mathZombieHighscore') || '0');
    },

    _buildBarricade() {
        const groundY = this.canvas.height - 40;
        this.barricade = {
            active: true,
            hp: 5 + this.wave,
            maxHp: 5 + this.wave,
            x: 200, // Framför kanonen
            flashTimer: 1.0
        };
        this.score += 50;
    },

    _draw() {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;

        // Bakgrund — mörk himmel
        const gradient = ctx.createLinearGradient(0, 0, 0, h);
        gradient.addColorStop(0, '#1a1a2e');
        gradient.addColorStop(1, '#16213e');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, w, h);

        // Måne
        ctx.fillStyle = '#f0e68c';
        ctx.globalAlpha = 0.3;
        ctx.beginPath();
        ctx.arc(w - 80, 60, 30, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;

        if (this.state === 'playing' || this.state === 'gameover') {
            // Rita mark
            UI.drawGround(ctx, h);
            UI.drawBase(ctx, h);

            // Rita barrikad
            if (this.barricade.active) {
                this._drawBarricade(ctx, h);
            }

            // Rita kanon
            Cannon.draw(ctx);

            // Rita zombies
            ZombieManager.draw(ctx);

            // Rita HUD
            UI.drawHUD(ctx, {
                wave: this.wave,
                score: this.score,
                ammo: Cannon.ammo,
                streak: this.streak
            });
        }
    },

    _drawBarricade(ctx, canvasHeight) {
        const b = this.barricade;
        const groundY = canvasHeight - 40;
        const height = 50;
        const width = 15;
        const y = groundY - height;

        // Flash vid skada
        if (b.flashTimer > 0) {
            ctx.fillStyle = '#ff6b6b';
        } else {
            ctx.fillStyle = '#a0845c';
        }

        // Plankor
        ctx.fillRect(b.x, y, width, height);
        ctx.fillRect(b.x - 3, y + 10, width + 6, 6);
        ctx.fillRect(b.x - 3, y + 30, width + 6, 6);

        // Spik-detaljer
        ctx.fillStyle = '#666';
        ctx.fillRect(b.x + 3, y + 12, 2, 2);
        ctx.fillRect(b.x + width - 5, y + 12, 2, 2);
        ctx.fillRect(b.x + 3, y + 32, 2, 2);
        ctx.fillRect(b.x + width - 5, y + 32, 2, 2);

        // HP-bar ovanför
        const barWidth = 30;
        const barX = b.x - (barWidth - width) / 2;
        ctx.fillStyle = '#333';
        ctx.fillRect(barX, y - 10, barWidth, 5);
        ctx.fillStyle = '#3498db';
        ctx.fillRect(barX, y - 10, barWidth * (b.hp / b.maxHp), 5);
    }
};

// Starta spelet när sidan laddats
window.addEventListener('DOMContentLoaded', () => Game.init());
