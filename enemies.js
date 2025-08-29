export class EnemyManager {
    constructor(game) {
        this.game = game;
        this.enemies = [];
        this.enemyTypes = {
            normal: {
                emoji: '👾',
                speed: 1,
                health: 1.2, // slightly more health
                size: 30,
                scoreValue: 10,
                goldValue: 7, // more gold
                color: '#5d5',
                probability: 40
            },
            fast: {
                emoji: '⚡',
                speed: 2,
                health: 1,
                size: 25,
                scoreValue: 15,
                goldValue: 8,
                color: '#5df',
                probability: 12
            },
            tank: {
                emoji: '🪖',
                speed: 0.7,
                health: 3,
                size: 35,
                scoreValue: 20,
                goldValue: 10,
                color: '#55f',
                probability: 12
            },
            jump: {
                emoji: '🦘',
                speed: 1.2,
                health: 1.2,
                size: 30,
                scoreValue: 25,
                goldValue: 12,
                jumpInterval: 1000,
                jumpDistance: 50,
                color: '#f5d',
                probability: 11
            },
            boss: {
                emoji: '👹',
                speed: 0.5,
                health: 10,
                size: 50,
                scoreValue: 100,
                goldValue: 50,
                color: '#f55',
                probability: 1
            },
            superBoss: {
                emoji: '🐉',
                speed: 0.4,
                health: 25,
                size: 60,
                scoreValue: 250,
                goldValue: 100,
                color: '#f22',
                probability: 0.1
            },
            hyperBoss: {
                emoji: '👿',
                speed: 0.3,
                health: 50,
                size: 70,
                scoreValue: 500,
                goldValue: 200,
                color: '#a0f',
                probability: 0.01
            },
            ultraBoss: {
                emoji: '💀',
                speed: 0.2,
                health: 100,
                size: 80,
                scoreValue: 1000,
                goldValue: 500,
                color: '#ff0080', // Changed from black to bright pink
                probability: 0.001
            },
            // New enemy types for more features
            shielded: {
                emoji: '🛡️',
                speed: 0.8,
                health: 2,
                size: 32,
                scoreValue: 30,
                goldValue: 15,
                color: '#0ff',
                shield: 2, // Takes 2 extra hits to break shield
                probability: 8
            },
            teleporter: {
                emoji: '🌀',
                speed: 1.5,
                health: 1.5,
                size: 28,
                scoreValue: 35,
                goldValue: 18,
                color: '#f0f',
                teleportInterval: 3000,
                probability: 6
            },
            spawner: {
                emoji: '🥚',
                speed: 0.6,
                health: 4,
                size: 40,
                scoreValue: 60,
                goldValue: 30,
                color: '#fa0',
                spawnInterval: 5000,
                probability: 5
            },
            healer: {
                emoji: '💚',
                speed: 1,
                health: 2,
                size: 30,
                scoreValue: 40,
                goldValue: 20,
                color: '#0f0',
                healInterval: 4000,
                healRange: 100,
                probability: 5
            }
        };
    }
    
    reset() {
        this.enemies = [];
    }
    
    createEnemyGrid(rows, cols, level) {
        this.enemies = [];
        
        const gridWidth = cols * 60;
        const startX = (this.game.width - gridWidth) / 2;
        
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const x = startX + col * 60;
                const y = 50 + row * 50;
                
                // Choose enemy type based on probabilities
                const enemyType = this.chooseEnemyType();
                
                // Create enemy with health scaled by level
                const healthMultiplier = 1 + (level - 1) * 0.1;
                this.enemies.push(new Enemy(
                    this.game,
                    x,
                    y,
                    enemyType,
                    this.enemyTypes[enemyType].health * healthMultiplier
                ));
            }
        }
    }
    
    chooseEnemyType() {
        const random = Math.random() * 100;
        let cumulativeProbability = 0;
        
        for (const type in this.enemyTypes) {
            cumulativeProbability += this.enemyTypes[type].probability;
            if (random <= cumulativeProbability) {
                return type;
            }
        }
        
        return 'normal'; // Default fallback
    }
    
    update(deltaTime) {
        this.enemies.forEach(enemy => enemy.update(deltaTime));
        
        // Remove dead enemies
        this.enemies = this.enemies.filter(enemy => !enemy.markedForDeletion);
    }
    
    render(ctx) {
        this.enemies.forEach(enemy => enemy.render(ctx));
    }
}

class Enemy {
    constructor(game, x, y, type, health) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.type = type;
        this.typeData = game.enemyManager.enemyTypes[type];
        this.size = this.typeData.size;
        this.health = health;
        this.maxHealth = health;
        this.speed = this.typeData.speed;
        this.markedForDeletion = false;
        this.direction = 1; // 1 for right, -1 for left
        this.moveDownDistance = 0;
        this.shouldMoveDown = false;
        
        // Jump type specific properties
        this.lastJumpTime = 0;
        this.jumpInterval = this.typeData.jumpInterval || 0;
        this.jumpDistance = this.typeData.jumpDistance || 0;
        this.isJumping = false;
        
        // Boss specific properties
        this.isBoss = type.includes('Boss');
        this.attackCooldown = 0;
        this.attackInterval = this.isBoss ? 1200 : 2000; // bosses attack more often
        
        // New enemy type specific properties
        this.shield = this.typeData.shield || 0;
        this.maxShield = this.shield;
        this.lastTeleportTime = 0;
        this.teleportInterval = this.typeData.teleportInterval || 0;
        this.lastSpawnTime = 0;
        this.spawnInterval = this.typeData.spawnInterval || 0;
        this.lastHealTime = 0;
        this.healInterval = this.typeData.healInterval || 0;
        this.healRange = this.typeData.healRange || 0;
    }
    
    update(deltaTime) {
        // Horizontal movement with direction changes
        this.x += this.speed * this.direction;
        
        // Check for wall collision
        if (this.x <= 0) {
            this.direction = 1;
            this.shouldMoveDown = true;
        } else if (this.x + this.size >= this.game.width) {
            this.direction = -1;
            this.shouldMoveDown = true;
        }
        
        // Move down if needed
        if (this.shouldMoveDown) {
            this.y += 20;
            this.shouldMoveDown = false;
        }
        
        // Handle jump type behavior
        if (this.type === 'jump' && !this.isJumping) {
            const currentTime = Date.now();
            if (currentTime - this.lastJumpTime > this.jumpInterval) {
                this.isJumping = true;
                this.lastJumpTime = currentTime;
                
                // Calculate jump destination
                setTimeout(() => {
                    if (!this.markedForDeletion) {
                        this.x += (Math.random() * 2 - 1) * this.jumpDistance;
                        this.y += Math.random() * 30;
                        
                        // Keep within bounds
                        this.x = Math.max(0, Math.min(this.game.width - this.size, this.x));
                        this.isJumping = false;
                    }
                }, 500);
            }
        }
        
        // Handle teleporter behavior
        if (this.type === 'teleporter') {
            const currentTime = Date.now();
            if (currentTime - this.lastTeleportTime > this.teleportInterval) {
                this.teleport();
                this.lastTeleportTime = currentTime;
            }
        }
        
        // Handle spawner behavior
        if (this.type === 'spawner') {
            const currentTime = Date.now();
            if (currentTime - this.lastSpawnTime > this.spawnInterval) {
                this.spawnMinion();
                this.lastSpawnTime = currentTime;
            }
        }
        
        // Handle healer behavior
        if (this.type === 'healer') {
            const currentTime = Date.now();
            if (currentTime - this.lastHealTime > this.healInterval) {
                this.healNearbyEnemies();
                this.lastHealTime = currentTime;
            }
        }
        
        // Boss attacks
        if (this.isBoss) {
            this.attackCooldown -= deltaTime;
            if (this.attackCooldown <= 0) {
                this.attack();
                this.attackCooldown = this.attackInterval;
            }
        }
        
        this.game.players.forEach(player => {
            if (player.health > 0) {
                // Check if enemy has reached the bottom
                if (this.y + this.size >= this.game.height - 50) {
                    player.takeDamage(1);
                    this.markedForDeletion = true;
                }
                
                // Check collision with player
                if (this.checkCollision(player)) {
                    player.takeDamage(1);
                    this.markedForDeletion = true;
                }
            }
        });
    }
    
    render(ctx) {
        // Draw enemy
        ctx.font = `${this.size}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.typeData.emoji, this.x + this.size / 2, this.y + this.size / 2);
        
        // Draw shield indicator
        if (this.shield > 0) {
            ctx.strokeStyle = '#0ff';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(this.x + this.size / 2, this.y + this.size / 2, this.size / 2 + 5, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        // Draw health bar
        const barWidth = this.size;
        const barHeight = 4;
        ctx.fillStyle = '#333';
        ctx.fillRect(this.x, this.y + this.size + 5, barWidth, barHeight);
        
        const healthPercent = Math.max(0, this.health / this.maxHealth);
        ctx.fillStyle = '#f44';
        ctx.fillRect(this.x, this.y + this.size + 5, barWidth * healthPercent, barHeight);
        
        // Draw shield bar if applicable
        if (this.maxShield > 0) {
            ctx.fillStyle = '#444';
            ctx.fillRect(this.x, this.y + this.size + 10, barWidth, barHeight);
            
            const shieldPercent = Math.max(0, this.shield / this.maxShield);
            ctx.fillStyle = '#0ff';
            ctx.fillRect(this.x, this.y + this.size + 10, barWidth * shieldPercent, barHeight);
        }
        
        // Draw boss name and larger health bar
        if (this.isBoss) {
            ctx.fillStyle = this.typeData.color;
            ctx.font = '16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(this.type.toUpperCase(), this.x + this.size / 2, this.y - 10);
        }
    }

    // utility: show floating text above this enemy (canvas -> page coords)
    showFloatingText(text, className = 'gold-pickup', yOffset = -20) {
        const canvas = this.game.canvas || document.getElementById('game-canvas');
        const rect = canvas.getBoundingClientRect();
        const el = document.createElement('div');
        el.className = className;
        el.textContent = text;
        // compute center of enemy on page
        const left = rect.left + (this.x + this.size / 2);
        const top = rect.top + (this.y + yOffset);
        el.style.left = `${left}px`;
        el.style.top = `${top}px`;
        document.body.appendChild(el);
        setTimeout(() => { if (document.body.contains(el)) document.body.removeChild(el); }, 1200);
    }

    // utility: try playing sound asset, fallback to simple beep
    playSound(name) {
        // Map enemy type to sound file
        const soundMap = {
            spawn: "spawn.wav",
            teleport: "teleport.wav",
            enemyDefeat: "enemy-defeat.wav",
        };

        const soundFile = soundMap[name];
        if (!soundFile) return;

        try {
            const audio = new Audio(`assests/sound/${soundFile}`);
            audio.volume = 0.5;
            audio.currentTime = 0;
            audio.play();
        } catch (e) {
            // Fallback: do nothing or log error
        }
    }

    teleport() {
        // Teleport to random position
        this.x = Math.random() * (this.game.width - this.size);
        this.y = Math.max(50, Math.min(this.game.height * 0.6, this.y + (Math.random() * 100 - 50)));

        // Play sound and show effect above head
        this.playSound('teleport');
        this.createTeleportEffect();
        this.showFloatingText('Teleported', 'teleport-effect', -10);
    }
    
    spawnMinion() {
        // Spawn a small minion enemy
        const minion = new Enemy(
            this.game,
            this.x + (Math.random() * 60 - 30),
            this.y + 50,
            'normal',
            0.5
        );
        minion.size = 20;
        minion.typeData = { ...this.game.enemyManager.enemyTypes.normal, size: 20 };
        this.game.enemyManager.enemies.push(minion);

        // Play spawn sound and show spawn text above the newly created minion's head
        this.playSound('spawn');
        // give a tiny delay so minion.x/minion.y are meaningful
        setTimeout(() => {
            if (!minion.markedForDeletion) {
                minion.showFloatingText('Spawned', 'gold-pickup', -10);
            }
        }, 20);
    }
    
    createTeleportEffect() {
        // Visual effect for teleportation (positioned above enemy using canvas coords)
        const canvas = this.game.canvas || document.getElementById('game-canvas');
        const rect = canvas.getBoundingClientRect();
        const effect = document.createElement('div');
        effect.className = 'teleport-effect';
        const left = rect.left + (this.x + this.size / 2);
        const top = rect.top + (this.y + this.size / 2);
        effect.style.left = `${left}px`;
        effect.style.top = `${top}px`;
        effect.textContent = '✨';
        document.body.appendChild(effect);

        setTimeout(() => {
            if (document.body.contains(effect)) {
                document.body.removeChild(effect);
            }
        }, 1000);
    }

    healNearbyEnemies() {
        // Heal all nearby enemies (excluding self) within healRange
        for (let i = 0; i < this.game.enemyManager.enemies.length; i++) {
            const target = this.game.enemyManager.enemies[i];
            if (target === this || target.type === 'projectile') continue;
            const dx = (target.x + target.size / 2) - (this.x + this.size / 2);
            const dy = (target.y + target.size / 2) - (this.y + this.size / 2);
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < this.healRange) {
                // Heal 1 HP, but not above maxHealth
                if (target.health < target.maxHealth) {
                    target.health = Math.min(target.maxHealth, target.health + 1);
                    // Optional: show heal effect
                    this.createHealEffect(target);
                }
            }
        }
    }
    
    createHealEffect(target) {
        const canvas = this.game.canvas || document.getElementById('game-canvas');
        const rect = canvas.getBoundingClientRect();
        const effect = document.createElement('div');
        effect.className = 'heal-effect';
        const left = rect.left + (target.x + target.size / 2);
        const top = rect.top + target.y;
        effect.style.left = `${left}px`;
        effect.style.top = `${top}px`;
        effect.textContent = '+1';
        effect.style.color = '#0f0';
        document.body.appendChild(effect);

        setTimeout(() => {
            if (document.body.contains(effect)) {
                document.body.removeChild(effect);
            }
        }, 1000);
    }
    
    takeDamage(amount) {
        // Check shield first
        if (this.shield > 0) {
            this.shield -= amount;
            if (this.shield < 0) {
                const overflow = Math.abs(this.shield);
                this.shield = 0;
                this.health -= overflow;
            }
        } else {
            this.health -= amount;
        }
        
        // Create damage number
        const damageText = document.createElement('div');
        damageText.className = 'damage-number';
        damageText.textContent = amount;
        damageText.style.left = `${this.x + this.size / 2}px`;
        damageText.style.top = `${this.y}px`;
        document.body.appendChild(damageText);
        
        // Remove damage number after animation
        setTimeout(() => {
            if (document.body.contains(damageText)) {
                document.body.removeChild(damageText);
            }
        }, 1000);
        
        if (this.health <= 0) {
            this.die();
        }
    }
    
    die() {
        // Drop gold
        this.game.addGold(this.typeData.goldValue);
        
        // Show gold pickup text
        const goldText = document.createElement('div');
        goldText.className = 'gold-pickup';
        goldText.textContent = `+${this.typeData.goldValue} Gold`;
        goldText.style.left = `${this.x + this.size / 2}px`;
        goldText.style.top = `${this.y + 20}px`;
        document.body.appendChild(goldText);
        
        // Remove gold text after animation
        setTimeout(() => {
            document.body.removeChild(goldText);
        }, 1000);
        
        this.game.enemyDefeated();
        this.markedForDeletion = true;
        this.playSound('enemy-defeat');
        
        // Spawn a power-up sometimes
        if (this.game.powerUpManager) {
            this.game.powerUpManager.spawnPowerUp(this.x, this.y);
        }
    }
    
    attack() {
        // Different attack patterns based on boss type
        switch (this.type) {
            case 'boss':
                // Shoot 3 projectiles in a spread
                for (let i = -1; i <= 1; i++) {
                    this.shootProjectile(i * 0.3);
                }
                break;
            case 'superBoss':
                // Shoot 5 projectiles in a spread
                for (let i = -2; i <= 2; i++) {
                    this.shootProjectile(i * 0.25);
                }
                break;
            case 'hyperBoss':
                // Shoot in 8 directions
                for (let i = 0; i < 8; i++) {
                    const angle = (i / 8) * Math.PI * 2;
                    this.shootProjectile(0, angle);
                }
                break;
            case 'ultraBoss':
                // Create a ring of projectiles
                for (let i = 0; i < 16; i++) {
                    const angle = (i / 16) * Math.PI * 2;
                    this.shootProjectile(0, angle);
                }
                // Plus a focused attack at the first available player
                const playerToAttack = this.game.players.find(p => p.health > 0) || this.game.players[0];
                const dx = playerToAttack.x + playerToAttack.width / 2 - (this.x + this.size / 2);
                const dy = playerToAttack.y - (this.y + this.size / 2);
                const angleToPlayer = Math.atan2(dy, dx);
                this.shootProjectile(0, angleToPlayer, 2);
                break;
        }
    }
    
    shootProjectile(spreadFactor = 0, angle = null, speedMultiplier = 1) {
        const projectileSize = 10;
        const projectileSpeed = 3 * speedMultiplier;
        
        let dx, dy;
        if (angle !== null) {
            dx = Math.cos(angle) * projectileSpeed;
            dy = Math.sin(angle) * projectileSpeed;
        } else {
            // Default direction is downward with optional spread
            dx = spreadFactor * projectileSpeed;
            dy = projectileSpeed;
        }
        
        const projectile = new EnemyProjectile(
            this.game,
            this.x + this.size / 2 - projectileSize / 2,
            this.y + this.size,
            projectileSize,
            dx,
            dy,
            this.typeData.color
        );
        
        this.game.enemyManager.enemies.push(projectile);
    }
    
    checkCollision(player) {
        return (
            this.x < player.x + player.width &&
            this.x + this.size > player.x &&
            this.y < player.y + player.height &&
            this.y + this.size > player.y
        );
    }
}

class EnemyProjectile {
    constructor(game, x, y, size, dx, dy, color) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.size = size;
        this.dx = dx;
        this.dy = dy;
        this.color = color;
        this.markedForDeletion = false;
        this.type = 'projectile'; // To differentiate from regular enemies
    }
    
    update(deltaTime) {
        this.x += this.dx;
        this.y += this.dy;
        
        // Check if projectile is out of bounds
        if (
            this.x < -this.size ||
            this.x > this.game.width ||
            this.y < -this.size ||
            this.y > this.game.height
        ) {
            this.markedForDeletion = true;
        }
        
        // Check collision with all players
        this.game.players.forEach(player => {
            if (player.health > 0 && this.checkCollision(player)) {
                player.takeDamage(1);
                this.markedForDeletion = true;
            }
        });
    }
    
    render(ctx) {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x + this.size / 2, this.y + this.size / 2, this.size / 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Add glow effect
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(this.x + this.size / 2, this.y + this.size / 2, this.size / 2, 0, Math.PI * 2);
        ctx.strokeStyle = this.color;
        ctx.stroke();
        ctx.shadowBlur = 0;
    }
    
    checkCollision(player) {
        return (
            this.x < player.x + player.width &&
            this.x + this.size > player.x &&
            this.y < player.y + player.height &&
            this.y + this.size > player.y
        );
    }
}
