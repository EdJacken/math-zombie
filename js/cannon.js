// cannon.js — Kanon, ammo och projektiler

const Cannon = {
    x: 50,
    y: 0, // Sätts i init
    width: 50,
    height: 30,
    ammo: 0,
    shootTimer: 0,
    shootCooldown: 1.0, // Sekunder mellan skott
    barrelAngle: 0,
    recoilOffset: 0,
    projectiles: [],

    init(canvasHeight) {
        this.y = canvasHeight - 40 - this.height;
        this.projectiles = [];
        this.ammo = 0;
        this.shootTimer = 0;
        this.recoilOffset = 0;
    },

    reset(canvasHeight) {
        this.init(canvasHeight);
    },

    addAmmo() {
        this.ammo++;
    },

    update(dt, zombies, canvasWidth) {
        // Recoil-animation
        if (this.recoilOffset > 0) {
            this.recoilOffset = Math.max(0, this.recoilOffset - dt * 40);
        }

        // Bara räkna zombies som syns på skärmen
        const visibleZombies = zombies.filter(z => z.x < canvasWidth);

        // Skjut automatiskt om det finns ammo och synliga zombies
        this.shootTimer -= dt;
        if (this.shootTimer <= 0 && this.ammo > 0 && visibleZombies.length > 0) {
            this._shoot(visibleZombies);
            this.shootTimer = this.shootCooldown;
        }

        // Sikta mot närmaste synliga zombie
        if (visibleZombies.length > 0) {
            const nearest = visibleZombies.reduce((a, b) => a.x < b.x ? a : b);
            const dx = nearest.x - (this.x + this.width);
            const dy = (nearest.y + nearest.height / 2) - (this.y + this.height / 2);
            this.barrelAngle = Math.atan2(dy, dx);
        } else {
            this.barrelAngle = 0;
        }

        // Uppdatera projektiler
        for (const p of this.projectiles) {
            p.x += p.vx * dt;
            p.y += p.vy * dt;
        }

        // Kollision projektil <-> zombie
        this.projectiles = this.projectiles.filter(p => {
            for (const z of zombies) {
                if (p.x >= z.x && p.x <= z.x + z.width &&
                    p.y >= z.y && p.y <= z.y + z.height) {
                    z.hp--;
                    return false; // Ta bort projektilen
                }
            }
            return p.x < 900; // Ta bort om utanför skärmen
        });
    },

    _shoot(zombies) {
        if (this.ammo <= 0) return;
        this.ammo--;
        this.recoilOffset = 8;

        const speed = 400;
        const barrelTipX = this.x + this.width + Math.cos(this.barrelAngle) * 30;
        const barrelTipY = this.y + this.height / 2 + Math.sin(this.barrelAngle) * 30;

        this.projectiles.push({
            x: barrelTipX,
            y: barrelTipY,
            vx: Math.cos(this.barrelAngle) * speed,
            vy: Math.sin(this.barrelAngle) * speed,
            radius: 5
        });
    },

    draw(ctx) {
        const drawX = this.x - this.recoilOffset;

        // Bas/hjul
        ctx.fillStyle = '#555';
        ctx.beginPath();
        ctx.arc(drawX + 15, this.y + this.height + 5, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(drawX + this.width - 10, this.y + this.height + 5, 8, 0, Math.PI * 2);
        ctx.fill();

        // Kanonkropp
        ctx.fillStyle = '#666';
        ctx.fillRect(drawX, this.y, this.width, this.height);

        // Kanonpipa (roterar mot zombies)
        ctx.save();
        ctx.translate(drawX + this.width, this.y + this.height / 2);
        ctx.rotate(this.barrelAngle);
        ctx.fillStyle = '#444';
        ctx.fillRect(0, -5, 35, 10);
        // Mynning
        ctx.fillStyle = '#333';
        ctx.fillRect(30, -7, 8, 14);
        ctx.restore();

        // Projektiler
        ctx.fillStyle = '#f1c40f';
        for (const p of this.projectiles) {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fill();
        }
    }
};
