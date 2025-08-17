export class LevelManager {
    constructor(game) {
        this.game = game;
        this.currentLevel = 1;
        this.enemyHealthMultiplier = 1;
        this.enemySpeedMultiplier = 1;
    }
    
    startLevel(level) {
        this.currentLevel = level;
        
        // Update UI
        this.game.uiManager.updateHUD();
        
        // Calculate enemy grid dimensions based on level
        let rows, cols;
        
        if (level <= 5) {
            rows = 3;
            cols = 5;
        } else if (level <= 10) {
            rows = 4;
            cols = 5;
        } else if (level <= 15) {
            rows = 4;
            cols = 6;
        } else if (level <= 20) {
            rows = 5;
            cols = 6;
        } else {
            rows = 5;
            cols = 7;
        }
        
        // Add boss on milestone levels
        if (level % 5 === 0) {
            // Create a smaller grid but with a boss
            rows = Math.max(2, rows - 1);
            cols = Math.max(3, cols - 1);
            
            // Create enemy grid
            this.game.enemyManager.createEnemyGrid(rows, cols, level);
            
            // Add boss in the middle
            const bossType = this.getBossTypeForLevel(level);
            const boss = this.createBoss(bossType, level);
            
            this.game.enemyManager.enemies.push(boss);
        } else {
            // Regular level
            this.game.enemyManager.createEnemyGrid(rows, cols, level);
        }
        
        // Increase difficulty with level
        this.enemyHealthMultiplier = 1 + (level - 1) * 0.5;
        this.enemySpeedMultiplier = 1 + (level - 1) * 0.1;
        
        // Apply any global modifiers (like slowdown from skills)
        if (this.game.enemyManager.enemySlowdownFactor) {
            this.enemySpeedMultiplier *= this.game.enemyManager.enemySlowdownFactor;
        }
    }
    
    createBoss(type, level) {
        const centerX = this.game.width / 2 - 30; // Center position
        
        // Create boss with health scaled by level
        const healthMultiplier = this.enemyHealthMultiplier * 2; // Bosses are tougher
        const boss = new Boss(
            this.game,
            centerX,
            80,
            type,
            this.game.enemyManager.enemyTypes[type].health * healthMultiplier
        );
        
        return boss;
    }
    
    getBossTypeForLevel(level) {
        if (level === 5) return 'boss';
        if (level === 10) return 'superBoss';
        if (level === 15) return 'hyperBoss';
        if (level === 20) return 'ultraBoss';
        
        // For levels beyond 20, randomly pick one of the boss types
        // with higher chance for stronger bosses as level increases
        const random = Math.random();
        
        if (level < 25) {
            if (random < 0.7) return 'boss';
            if (random < 0.9) return 'superBoss';
            if (random < 0.98) return 'hyperBoss';
            return 'ultraBoss';
        } else if (level < 30) {
            if (random < 0.4) return 'boss';
            if (random < 0.8) return 'superBoss';
            if (random < 0.95) return 'hyperBoss';
            return 'ultraBoss';
        } else {
            if (random < 0.2) return 'boss';
            if (random < 0.5) return 'superBoss';
            if (random < 0.8) return 'hyperBoss';
            return 'ultraBoss';
        }
    }
}

class Boss {
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
        
        // Boss movement pattern
        this.direction = 1; // 1 for right, -1 for left
        this.movementAmplitude = this.game.width / 3;
        this.centerX = x;
        this.attackCooldown = 0;
        this.attackInterval = 2000; // 2 seconds
        
        // Add boss health bar
        this.createHealthBar();
    }
    
    createHealthBar() {
        this.healthBar = document.createElement('div');
        this.healthBar.className = 'boss-health-bar';
        
        this.healthBarFill = document.createElement('div');
        this.healthBarFill.className = 'boss-health-bar-fill';
        
        this.healthBar.appendChild(this.healthBarFill);
        
        this.healthLabel = document.createElement('div');
        this.healthLabel.className = 'boss-health-label';
        this.healthLabel.textContent = `${this.type.toUpperCase()}`;
        
        document.body.appendChild(this.healthBar);
        document.body.appendChild(this.healthLabel);
    }
    
    update(deltaTime) {
        // Sinusoidal movement pattern
        this.x = this.centerX + Math.sin(Date.now() * 0.001) * this.movementAmplitude;
        
        // Keep within bounds
        this.x = Math.max(0, Math.min(this.game.width - this.size, this.x));
        
        // Attack cooldown
        this.attackCooldown -= deltaTime;
        if (this.attackCooldown <= 0) {
            this.attack();
            this.attackCooldown = this.attackInterval;
        }
        
        // Update health bar position
        if (this.healthBar) {
            const healthPercent = Math.max(0, this.health / this.maxHealth);
            this.healthBarFill.style.width = `${healthPercent * 100}%`;
        }
    }
    
    render(ctx) {
        // Draw boss
        ctx.font = `${this.size}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.typeData.emoji, this.x + this.size / 2, this.y + this.size / 2);
        
        // Add glow effect
        ctx.shadowColor = this.typeData.color;
        ctx.shadowBlur = 15;
        ctx.fillText(this.typeData.emoji, this.x + this.size / 2, this.y + this.size / 2);
        ctx.shadowBlur = 0;
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
                // Plus a focused attack at player
                const dx = this.game.player.x + this.game.player.width / 2 - (this.x + this.size / 2);
                const dy = this.game.player.y - (this.y + this.size / 2);
                const angle = Math.atan2(dy, dx);
                this.shootProjectile(0, angle, 2);
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
        
        const projectile = new BossProjectile(
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
    
    takeDamage(amount) {
        this.health -= amount;
        
        // Create damage number
        const damageText = document.createElement('div');
        damageText.className = 'damage-number';
        damageText.textContent = amount;
        damageText.style.left = `${this.x + this.size / 2}px`;
        damageText.style.top = `${this.y}px`;
        document.body.appendChild(damageText);
        
        // Remove damage number after animation
        setTimeout(() => {
            document.body.removeChild(damageText);
        }, 1000);
        
        if (this.health <= 0) {
            this.die();
        }
    }
    
    die() {
        // Drop gold
        const goldAmount = this.typeData.goldValue * (this.game.goldMultiplier || 1);
        this.game.addGold(goldAmount);
        
        // Show gold pickup text
        const goldText = document.createElement('div');
        goldText.className = 'gold-pickup';
        goldText.textContent = `+${goldAmount} Gold`;
        goldText.style.left = `${this.x + this.size / 2}px`;
        goldText.style.top = `${this.y + 20}px`;
        document.body.appendChild(goldText);
        
        // Remove gold text after animation
        setTimeout(() => {
            document.body.removeChild(goldText);
        }, 1000);
        
        // Remove health bar
        if (this.healthBar) {
            document.body.removeChild(this.healthBar);
            document.body.removeChild(this.healthLabel);
        }
        
        this.game.enemyDefeated();
        this.markedForDeletion = true;
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

class BossProjectile {
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
        
        // Check collision with player
        if (this.checkCollision(this.game.player)) {
            this.game.player.takeDamage(1);
            this.markedForDeletion = true;
        }
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