export class PowerUpManager {
    constructor(game) {
        this.game = game;
        this.powerUps = []; // active pickups on field
        // types: icon, apply function (called when picked)
        this.types = {
            Health: { icon: '❤️', apply: (player) => { player.addHealth(1); return 'Restored 1 HP'; } },
            Shield: { icon: '🛡️', apply: (player) => { player.addShield(player.maxShield); return 'Shield restored'; } },
            RapidFire: { icon: '⚡', duration: 10000, apply: (player) => {
                // reduce fireRate by 30% temporarily
                player.addTemporaryModifier({
                    id: 'RapidFire',
                    duration: 10000,
                    apply: () => {
                        player.weapons.forEach(w => { w._origFireRate = w.fireRate; w.fireRate *= 0.7; });
                    },
                    revert: () => {
                        player.weapons.forEach(w => { if (w._origFireRate) { w.fireRate = w._origFireRate; delete w._origFireRate; }});
                    }
                });
                return 'Rapid Fire for 10s';
            }},
            DoubleGold: { icon: '💰', duration: 15000, apply: (player, game) => {
                game.goldMultiplier = (game.goldMultiplier || 1) * 2;
                // schedule revert via temporary modifier
                player.addTemporaryModifier({
                    id: 'DoubleGold',
                    duration: 15000,
                    apply: () => {},
                    revert: () => { game.goldMultiplier = (game.goldMultiplier || 1) / 2; }
                });
                return 'Double Gold for 15s';
            }},
            Invincibility: { icon: '✨', duration: 5000, apply: (player) => {
                player.addTemporaryModifier({
                    id: 'Invincibility',
                    duration: 5000,
                    apply: () => { player.invincible = true; },
                    revert: () => { player.invincible = false; }
                });
                return 'Invincible for 5s';
            }}
        };
    }

    spawnPowerUp(x, y) {
        // 30% chance to drop a power-up
        if (Math.random() > 0.3) return;
        const keys = Object.keys(this.types);
        const type = keys[Math.floor(Math.random() * keys.length)];
        this.powerUps.push(new PowerUp(this.game, x, y, type, this.types[type]));
    }

    update(deltaTime) {
        for (let i = this.powerUps.length - 1; i >= 0; i--) {
            const p = this.powerUps[i];
            p.update(deltaTime);
            if (p.collected || p.markedForDeletion) this.powerUps.splice(i, 1);
        }
    }

    render(ctx) {
        this.powerUps.forEach(p => p.render(ctx));
    }
}

class PowerUp {
    constructor(game, x, y, type, meta) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.size = 18;
        this.type = type;
        this.meta = meta;
        this.vy = 1 + Math.random() * 1.5; // falling speed
        this.markedForDeletion = false;
        this.collected = false;
    }

    update(deltaTime) {
        this.y += this.vy;
        // remove if out of bounds
        if (this.y > this.game.height) {
            this.markedForDeletion = true;
            return;
        }

        // check collision with player
        const p = this.game.player;
        if (
            this.x < p.x + p.width &&
            this.x + this.size > p.x &&
            this.y < p.y + p.height &&
            this.y + this.size > p.y
        ) {
            this.onCollect();
        }
    }

    render(ctx) {
        ctx.save();
        ctx.fillStyle = '#222';
        ctx.beginPath();
        ctx.arc(this.x + this.size/2, this.y + this.size/2, this.size/2, 0, Math.PI*2);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.meta.icon || '?', this.x + this.size/2, this.y + this.size/2 + 1);
        ctx.restore();
    }

    onCollect() {
        // Apply effect
        const player = this.game.player;
        const message = (this.meta.apply.length === 2) ? this.meta.apply(player, this.game) : this.meta.apply(player);
        // show small feedback
        this.showPickupMessage(message || this.type);
        this.collected = true;
    }

    showPickupMessage(msg) {
        const el = document.createElement('div');
        el.className = 'gold-pickup';
        el.textContent = msg;
        el.style.left = `${this.x}px`;
        el.style.top = `${this.y}px`;
        document.body.appendChild(el);
        setTimeout(() => { if (document.body.contains(el)) document.body.removeChild(el); }, 1200);
    }
}