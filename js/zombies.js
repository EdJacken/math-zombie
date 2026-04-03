// zombies.js — Zombie-spawn, rörelse och HP

const ZombieManager = {
    zombies: [],
    spawnTimer: 0,
    waveZombiesLeft: 0,

    reset() {
        this.zombies = [];
        this.spawnTimer = 0;
        this.waveZombiesLeft = 0;
    },

    startWave(wave) {
        this.waveZombiesLeft = 3 + wave * 2; // Fler zombies per våg
    },

    update(dt, wave, canvasWidth, canvasHeight) {
        // Spawna zombies
        this.spawnTimer -= dt;
        if (this.spawnTimer <= 0 && this.waveZombiesLeft > 0) {
            this._spawn(wave, canvasWidth, canvasHeight);
            this.waveZombiesLeft--;
            // Snabbare spawn vid högre vågor
            this.spawnTimer = Math.max(1.0, 3.0 - wave * 0.2);
        }

        // Flytta zombies
        for (const z of this.zombies) {
            z.x -= z.speed * dt;

            // Enkel "vankande" animation
            z.bobTimer += dt * 3;
            z.bobY = Math.sin(z.bobTimer) * 3;
        }

        // Ta bort döda zombies
        this.zombies = this.zombies.filter(z => z.hp > 0);
    },

    _spawn(wave, canvasWidth, canvasHeight) {
        const groundY = canvasHeight - 40; // Markens y-position
        const hp = Math.min(1 + Math.floor(wave / 3), 3);
        const speed = 20 + wave * 3 + Math.random() * 10;
        const size = 30 + Math.random() * 10;

        this.zombies.push({
            x: canvasWidth + 20 + Math.random() * 60,
            y: groundY - size,
            width: size * 0.6,
            height: size,
            hp,
            maxHp: hp,
            hasShield: hp >= 2,
            hasHelmet: hp >= 3,
            speed,
            bobTimer: Math.random() * Math.PI * 2,
            bobY: 0
        });
    },

    // Kolla om någon zombie nått basen
    hasReachedBase(baseX) {
        return this.zombies.some(z => z.x <= baseX + 40);
    },

    // Kolla om alla zombies i vågen är klara
    isWaveComplete() {
        return this.waveZombiesLeft <= 0 && this.zombies.length === 0;
    },

    draw(ctx) {
        for (const z of this.zombies) {
            const drawY = z.y + z.bobY;

            // Kropp — grön rektangel
            ctx.fillStyle = '#4a7c3f';
            ctx.fillRect(z.x, drawY, z.width, z.height);

            // Huvud
            const headSize = z.width * 0.8;
            const headX = z.x + (z.width - headSize) / 2;
            const headY = drawY - headSize * 0.7;
            ctx.fillStyle = '#5a8c4f';
            ctx.fillRect(headX, headY, headSize, headSize * 0.8);

            // Hjälm (om den har en)
            if (z.hasHelmet) {
                ctx.fillStyle = '#777';
                // Hjälmkupol
                ctx.beginPath();
                ctx.arc(headX + headSize / 2, headY + 2, headSize * 0.55, Math.PI, 0);
                ctx.fill();
                // Hjälmkant
                ctx.fillStyle = '#666';
                ctx.fillRect(headX - 2, headY, headSize + 4, 4);
            }

            // Ögon
            const eyeSize = 4;
            const eyeY = headY + headSize * 0.25;
            ctx.fillStyle = '#ff0000';
            ctx.fillRect(headX + headSize * 0.2, eyeY, eyeSize, eyeSize);
            ctx.fillRect(headX + headSize * 0.6, eyeY, eyeSize, eyeSize);

            // Armar — utsträckta framåt
            ctx.fillStyle = '#4a7c3f';
            ctx.fillRect(z.x - 12, drawY + 5, 14, 5);

            // Sköld (om den har en)
            if (z.hasShield) {
                const shieldX = z.x - 14;
                const shieldY = drawY + 2;
                const shieldW = 8;
                const shieldH = z.height * 0.7;
                // Sköldkropp
                ctx.fillStyle = '#8B6914';
                ctx.beginPath();
                ctx.moveTo(shieldX, shieldY);
                ctx.lineTo(shieldX + shieldW, shieldY);
                ctx.lineTo(shieldX + shieldW, shieldY + shieldH * 0.7);
                ctx.lineTo(shieldX + shieldW / 2, shieldY + shieldH);
                ctx.lineTo(shieldX, shieldY + shieldH * 0.7);
                ctx.closePath();
                ctx.fill();
                // Skölddetalj
                ctx.fillStyle = '#A07818';
                ctx.fillRect(shieldX + 2, shieldY + 3, shieldW - 4, 2);
                ctx.fillRect(shieldX + 3, shieldY + 3, 2, shieldH * 0.5);
            }
        }
    }
};
