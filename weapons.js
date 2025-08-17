export class WeaponManager {
    constructor(game) {
        this.game = game;
        this.projectiles = [];
        
        this.weaponTypes = {
            Gun: {
                damage: 1,
                fireRate: 400,
                projectileSpeed: 8,
                projectileSize: 5,
                projectileColor: '#fff',
                price: 120, // slightly more expensive
                description: 'Balanced weapon'
            },
            MachineGun: {
                damage: 0.5,
                fireRate: 130, // slightly slower
                projectileSpeed: 10,
                projectileSize: 3,
                projectileColor: '#5f5',
                price: 240,
                description: 'Fast firing, less damage'
            },
            Shotgun: {
                damage: 0.7,
                fireRate: 900, // slower
                projectileSpeed: 7,
                projectileSize: 4,
                projectileCount: 5,
                spread: 0.3,
                projectileColor: '#fa5',
                price: 350,
                description: 'Fires multiple projectiles'
            },
            Rocket: {
                damage: 3,
                fireRate: 1400, // slower
                projectileSpeed: 5,
                projectileSize: 8,
                explosionRadius: 50,
                projectileColor: '#f55',
                price: 600,
                description: 'High damage, slow fire rate'
            },
            Laser: {
                damage: 0.05,
                fireRate: 50,
                beamWidth: 5,
                beamColor: '#00ff88',
                beamDuration: 100,
                piercing: true,
                price: 1500,
                description: 'Continuous beam, pierces enemies'
            },
            Sniper: {
                damage: 5,
                fireRate: 1500,
                projectileSpeed: 15,
                projectileSize: 4,
                piercing: true,
                projectileColor: '#5df',
                price: 700,
                description: 'High damage, pierces enemies'
            },
            Flamethrower: {
                damage: 0.15,
                fireRate: 40,
                projectileSpeed: 6,
                projectileSize: 6,
                projectileColor: '#ff8000',
                price: 600,
                description: 'Short range, rapid fire, burns enemies',
                element: 'fire'
            },
            Railgun: {
                damage: 8,
                fireRate: 2000,
                projectileSpeed: 20,
                projectileSize: 6,
                projectileColor: '#0ff',
                piercing: true,
                price: 400,
                description: 'Very high damage, pierces all enemies, slow reload',
                element: 'electric'
            },
            PlasmaCannon: {
                damage: 10,
                fireRate: 2500,
                projectileSpeed: 7,
                projectileSize: 12,
                explosionRadius: 70,
                projectileColor: '#aaf',
                price: 1500,
                description: 'Slow, huge plasma ball with splash damage',
                element: 'plasma'
            },
            IceBlaster: {
                damage: 1.2,
                fireRate: 350,
                projectileSpeed: 7,
                projectileSize: 6,
                projectileColor: '#0ff',
                price: 900,
                description: 'Slows enemies with ice shots',
                element: 'ice'
            },
            ToxicSprayer: {
                damage: 0.18,
                fireRate: 35,
                projectileSpeed: 5,
                projectileSize: 5,
                projectileColor: '#8f8',
                price: 650,
                description: 'Rapid fire, poisons enemies over time',
                element: 'toxic'
            }
        };
    }
    
    createWeapon(type, tier = 'common') {
        if (this.weaponTypes[type]) {
            return new Weapon(this.game, type, tier);
        }
        return null;
    }
    
    update(deltaTime) {
        // Update all projectiles
        this.projectiles.forEach(projectile => projectile.update(deltaTime));
        
        // Remove projectiles marked for deletion
        this.projectiles = this.projectiles.filter(projectile => !projectile.markedForDeletion);
    }
    
    render(ctx) {
        // Render all projectiles
        this.projectiles.forEach(projectile => projectile.render(ctx));
    }
    
    getTierMultiplier(tier) {
        switch (tier) {
            case 'common': return 1;
            case 'uncommon': return 1.5;
            case 'rare': return 2;
            case 'epic': return 3;
            case 'legendary': return 6;
            case 'mythic': return 8;
            case 'exotic': return 10;
            case 'transcendent': return 20;
            default: return 1;
        }
    }
}

class Weapon {
    constructor(game, type, tier) {
        this.game = game;
        this.type = type;
        this.name = type;
        this.tier = tier;
        const baseStats = game.weaponManager.weaponTypes[type];
        const tierMultiplier = game.weaponManager.getTierMultiplier(tier);

        this.damage = baseStats.damage * tierMultiplier;
        this.fireRate = baseStats.fireRate / Math.sqrt(tierMultiplier);
        this.projectileSpeed = baseStats.projectileSpeed * Math.sqrt(tierMultiplier);
        this.projectileSize = baseStats.projectileSize;
        this.projectileColor = baseStats.projectileColor;
        this.projectileCount = baseStats.projectileCount || 1;
        this.spread = baseStats.spread || 0;
        this.piercing = baseStats.piercing || false;
        this.explosionRadius = baseStats.explosionRadius || 0;
        this.beamWidth = baseStats.beamWidth || 0;
        this.beamDuration = baseStats.beamDuration || 0;
        this.price = baseStats.price;
        this.description = baseStats.description;
        this.element = baseStats.element || null; // fire, ice, electric, etc.
        this.lastFireTime = 0;
    }

    fire(x, y) {
        const currentTime = Date.now();
        if (currentTime - this.lastFireTime < this.fireRate) {
            return;
        }
        this.lastFireTime = currentTime;

        switch (this.type) {
            case 'Gun':
            case 'MachineGun':
                this.fireProjectile(x, y, 0, -this.projectileSpeed);
                break;
            case 'Shotgun':
                for (let i = 0; i < this.projectileCount; i++) {
                    const spreadFactor = (i - (this.projectileCount - 1) / 2) * this.spread;
                    this.fireProjectile(
                        x,
                        y,
                        spreadFactor * this.projectileSpeed,
                        -this.projectileSpeed
                    );
                }
                break;
            case 'Rocket':
                this.fireProjectile(x, y, 0, -this.projectileSpeed, true);
                break;
            case 'Laser':
                this.fireLaser(x, y);
                break;
            case 'Sniper':
                this.fireProjectile(x, y, 0, -this.projectileSpeed, false, true);
                break;
            case 'Flamethrower':
                for (let i = 0; i < 2; i++) {
                    const spread = (Math.random() - 0.5) * 0.5;
                    this.fireProjectile(
                        x,
                        y,
                        spread * this.projectileSpeed,
                        -this.projectileSpeed * (0.7 + Math.random() * 0.3),
                        false,
                        false,
                        'fire'
                    );
                }
                break;
            case 'Railgun':
                this.fireProjectile(x, y, 0, -this.projectileSpeed, false, true, 'electric');
                break;
            // --- New Weapon Types ---
            case 'PlasmaCannon':
                this.fireProjectile(x, y, 0, -this.projectileSpeed, true, false, 'plasma');
                break;
            case 'IceBlaster':
                this.fireProjectile(x, y, 0, -this.projectileSpeed, false, false, 'ice');
                break;
            case 'ToxicSprayer':
                for (let i = 0; i < 2; i++) {
                    const spread = (Math.random() - 0.5) * 0.7;
                    this.fireProjectile(
                        x,
                        y,
                        spread * this.projectileSpeed,
                        -this.projectileSpeed * (0.8 + Math.random() * 0.2),
                        false,
                        false,
                        'toxic'
                    );
                }
                break;
        }
        this.playSound();
    }

    fireProjectile(x, y, dx, dy, isExplosive = false, isPiercing = this.piercing, element = this.element) {
        const projectile = new Projectile(
            this.game,
            x - this.projectileSize / 2,
            y - this.projectileSize,
            this.projectileSize,
            dx,
            dy,
            this.damage,
            this.projectileColor,
            isExplosive,
            this.explosionRadius,
            isPiercing,
            element
        );
        this.game.weaponManager.projectiles.push(projectile);
    }

    fireLaser(x, y) {
        const laser = new Laser(
            this.game,
            x,
            y,
            this.beamWidth,
            this.damage,
            this.beamColor,
            this.beamDuration
        );
        
        this.game.weaponManager.projectiles.push(laser);
    }
    
    playSound() {
        // Map weapon type to sound file
        const soundMap = {
            Gun: 'gun.wav',
            MachineGun: 'machine_gun.wav',
            Shotgun: 'shotgun.wav',
            Rocket: 'rocket.wav',
            Laser: 'laser.wav',
            Sniper: 'sniper.wav',
            Flamethrower: 'flamethrower.wav',
            Railgun: 'railgun.wav',
            PlasmaCannon: 'plasma_cannon.wav',
            IceBlaster: 'ice_blaster.wav',
            ToxicSprayer: 'toxic_sprayer.wav',
        };
        const soundFile = soundMap[this.type];
        if (!soundFile) return;

        try {
            // Stop previous sound if playing
            if (this.audio && !this.audio.paused) {
                this.audio.pause();
                this.audio.currentTime = 0;
            }
            this.audio = new Audio(`assests/sound/${soundFile}`);
            this.audio.volume = 0.5;
            this.audio.currentTime = 0;
            this.audio.play();
        } catch (e) {
            // Fallback: do nothing or log error
        }
    }

    stopSound() {
        if (this.audio && !this.audio.paused) {
            this.audio.pause();
            this.audio.currentTime = 0;
        }
    }

    update(deltaTime) {
        // Weapon-specific updates
    }
}

// --- Enhanced Projectile for Elemental Effects ---
class Projectile {
    constructor(game, x, y, size, dx, dy, damage, color, isExplosive = false, explosionRadius = 0, isPiercing = false, element = null) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.size = size;
        this.dx = dx;
        this.dy = dy;
        this.damage = damage;
        this.color = color;
        this.isExplosive = isExplosive;
        this.explosionRadius = explosionRadius;
        this.isPiercing = isPiercing;
        this.element = element; // fire, ice, electric, etc.
        this.markedForDeletion = false;
        this.trail = [];
        this.maxTrailLength = 5;
    }

    update(deltaTime) {
        this.x += this.dx;
        this.y += this.dy;
        this.trail.push({ x: this.x, y: this.y });
        if (this.trail.length > this.maxTrailLength) {
            this.trail.shift();
        }
        if (this.y < -this.size || this.y > this.game.height ||
            this.x < -this.size || this.x > this.game.width) {
            this.markedForDeletion = true;
            return;
        }
        this.checkEnemyCollision();
    }

    render(ctx) {
        // Draw trail
        for (let i = 0; i < this.trail.length; i++) {
            const alpha = i / this.trail.length;
            ctx.fillStyle = this.color + Math.floor(alpha * 255).toString(16).padStart(2, '0');
            ctx.beginPath();
            ctx.arc(
                this.trail[i].x + this.size / 2,
                this.trail[i].y + this.size / 2,
                this.size / 2 * alpha,
                0,
                Math.PI * 2
            );
            ctx.fill();
        }
        // Draw projectile
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x + this.size / 2, this.y + this.size / 2, this.size / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(this.x + this.size / 2, this.y + this.size / 2, this.size / 2, 0, Math.PI * 2);
        ctx.strokeStyle = this.color;
        ctx.stroke();
        ctx.shadowBlur = 0;
    }

    checkEnemyCollision() {
        for (let i = 0; i < this.game.enemyManager.enemies.length; i++) {
            const enemy = this.game.enemyManager.enemies[i];
            if (enemy.type === 'projectile') continue;
            if (
                this.x < enemy.x + enemy.size &&
                this.x + this.size > enemy.x &&
                this.y < enemy.y + enemy.size &&
                this.y + this.size > enemy.y
            ) {
                enemy.takeDamage(this.damage);
                // --- Elemental Effects ---
                if (this.element === 'fire' && enemy && !enemy.burning) {
                    enemy.burning = true;
                    enemy.burnTicks = 3;
                    enemy.burnInterval = setInterval(() => {
                        if (enemy.burnTicks > 0 && !enemy.markedForDeletion) {
                            enemy.takeDamage(0.2 * this.damage);
                            enemy.burnTicks--;
                        } else {
                            clearInterval(enemy.burnInterval);
                            enemy.burning = false;
                        }
                    }, 500);
                }
                if (this.element === 'electric' && enemy && !enemy.shocked) {
                    enemy.shocked = true;
                    enemy.speed *= 0.5;
                    setTimeout(() => {
                        if (!enemy.markedForDeletion) {
                            enemy.speed = enemy.typeData.speed;
                            enemy.shocked = false;
                        }
                    }, 1000);
                }
                if (this.element === 'ice' && enemy && !enemy.slowed) {
                    enemy.slowed = true;
                    enemy.speed *= 0.6;
                    setTimeout(() => {
                        if (!enemy.markedForDeletion) {
                            enemy.speed = enemy.typeData.speed;
                            enemy.slowed = false;
                        }
                    }, 1200);
                }
                if (this.element === 'toxic' && enemy && !enemy.poisoned) {
                    enemy.poisoned = true;
                    enemy.poisonTicks = 5;
                    enemy.poisonInterval = setInterval(() => {
                        if (enemy.poisonTicks > 0 && !enemy.markedForDeletion) {
                            enemy.takeDamage(0.1 * this.damage);
                            enemy.poisonTicks--;
                        } else {
                            clearInterval(enemy.poisonInterval);
                            enemy.poisoned = false;
                        }
                    }, 400);
                }
                if (this.element === 'plasma') {
                    // Plasma: extra splash handled by explosion
                }
                if (this.isExplosive) {
                    this.explode();
                    this.markedForDeletion = true;
                    break;
                }
                if (!this.isPiercing) {
                    this.markedForDeletion = true;
                    break;
                }
            }
        }
    }
    
    explode() {
        // Create explosion effect
        const explosion = new Explosion(
            this.game,
            this.x - this.explosionRadius / 2 + this.size / 2,
            this.y - this.explosionRadius / 2 + this.size / 2,
            this.explosionRadius,
            this.damage / 2
        );
        this.game.weaponManager.projectiles.push(explosion);
    }
}

class Laser {
    constructor(game, x, y, width, damage, color, duration) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.width = width;
        this.damage = damage;
        this.color = color;
        this.duration = duration;
        this.markedForDeletion = false;
        this.timeLeft = duration;
        
        // Laser goes from player to top of screen
        this.height = y;
    }
    
    update(deltaTime) {
        this.timeLeft -= deltaTime;
        
        if (this.timeLeft <= 0) {
            this.markedForDeletion = true;
            return;
        }
        
        // Check collision with all enemies in the path
        this.checkEnemyCollision();
    }
    
    render(ctx) {
        const alpha = this.timeLeft / this.duration;
        
        // Draw laser beam
        ctx.fillStyle = this.color + Math.floor(alpha * 255).toString(16).padStart(2, '0');
        ctx.fillRect(this.x - this.width / 2, 0, this.width, this.y);
        
        // Add glow effect
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 15;
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x - this.width / 2, 0, this.width, this.y);
        ctx.shadowBlur = 0;
    }
    
    checkEnemyCollision() {
        for (let i = 0; i < this.game.enemyManager.enemies.length; i++) {
            const enemy = this.game.enemyManager.enemies[i];
            
            // Skip projectiles (enemy projectiles)
            if (enemy.type === 'projectile') continue;
            
            if (
                this.x - this.width / 2 < enemy.x + enemy.size &&
                this.x + this.width / 2 > enemy.x &&
                enemy.y < this.y // Enemy is above player (laser goes up)
            ) {
                enemy.takeDamage(this.damage);
            }
        }
    }
}

class Explosion {
    constructor(game, x, y, radius, damage) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.damage = damage;
        this.currentRadius = 0;
        this.maxRadius = radius;
        this.growthSpeed = radius / 10; // Grow to full size in 10 frames
        this.markedForDeletion = false;
        this.hitEnemies = new Set(); // Track which enemies have been hit
        this.color = '#ff5';
    }
    
    update(deltaTime) {
        this.currentRadius += this.growthSpeed;
        
        if (this.currentRadius >= this.maxRadius) {
            this.markedForDeletion = true;
            return;
        }
        
        this.checkEnemyCollision();
    }
    
    render(ctx) {
        const alpha = 1 - (this.currentRadius / this.maxRadius);
        
        // Create radial gradient
        const gradient = ctx.createRadialGradient(
            this.x + this.maxRadius / 2,
            this.y + this.maxRadius / 2,
            0,
            this.x + this.maxRadius / 2,
            this.y + this.maxRadius / 2,
            this.currentRadius
        );
        gradient.addColorStop(0, this.color + 'ff');
        gradient.addColorStop(0.7, this.color + '80');
        gradient.addColorStop(1, this.color + '00');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(
            this.x + this.maxRadius / 2,
            this.y + this.maxRadius / 2,
            this.currentRadius,
            0,
            Math.PI * 2
        );
        ctx.fill();
    }
    
    checkEnemyCollision() {
        for (let i = 0; i < this.game.enemyManager.enemies.length; i++) {
            const enemy = this.game.enemyManager.enemies[i];
            
            // Skip projectiles and already hit enemies
            if (enemy.type === 'projectile' || this.hitEnemies.has(enemy)) continue;
            
            // Check if enemy is within explosion radius
            const dx = (enemy.x + enemy.size / 2) - (this.x + this.maxRadius / 2);
            const dy = (enemy.y + enemy.size / 2) - (this.y + this.maxRadius / 2);
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < this.currentRadius + enemy.size / 2) {
                enemy.takeDamage(this.damage);
                this.hitEnemies.add(enemy);
            }
        }
    }
}