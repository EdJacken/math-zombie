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

            // Ögon
            const eyeSize = 4;
            const eyeY = headY + headSize * 0.25;
            ctx.fillStyle = '#ff0000';
            ctx.fillRect(headX + headSize * 0.2, eyeY, eyeSize, eyeSize);
            ctx.fillRect(headX + headSize * 0.6, eyeY, eyeSize, eyeSize);

            // Armar — utsträckta framåt
            ctx.fillStyle = '#4a7c3f';
            ctx.fillRect(z.x - 12, drawY + 5, 14, 5);

            // HP-bar
            if (z.maxHp > 1) {
                const barWidth = z.width;
                const barHeight = 4;
                const barY = headY - 8;
                ctx.fillStyle = '#333';
                ctx.fillRect(z.x, barY, barWidth, barHeight);
                ctx.fillStyle = '#e74c3c';
                ctx.fillRect(z.x, barY, barWidth * (z.hp / z.maxHp), barHeight);
            }
        }
    }
};
