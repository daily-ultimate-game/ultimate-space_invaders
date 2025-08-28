export class Player {
    constructor(game) {
        this.game = game;
        this.width = 50;
        this.height = 40;
        this.x = game.width / 2 - this.width / 2;
        this.y = game.height - this.height - 20;
        this.speed = 5;
        this.health = 3;
        this.maxHealth = 3;
        this.shield = 0;
        this.maxShield = 3;
        
        this.moveLeft = false;
        this.moveRight = false;
        this.shooting = false;
        
        this.weapons = [];
        this.activeWeaponIndex = 0;
        
          // Option 1: Check if weaponSystem exists before using it
          this.weapon = weaponSystem ? weaponSystem.createWeapon(type, this) : null;
          
          // OR Option 2: Use a default weapon if the system doesn't exist
          this.weapon = weaponSystem ? weaponSystem.createWeapon(type, this) : this.createDefaultWeapon();

        this.invincible = false;
        this.temporaryModifiers = []; // {id, expireAt, revert}
    }
    
    reset() {
        this.x = this.game.width / 2 - this.width / 2;
        this.y = this.game.height - this.height - 20;
        this.health = 3;
        this.maxHealth = 3;
        this.shield = 0;
        this.maxShield = 3;
        this.speed = 5;
        
        // Reset weapons to just the default gun
        this.weapons = [];
        this.addWeapon(this.game.weaponManager.createWeapon('Gun', 'common'));
        this.activeWeaponIndex = 0;
    }
    
    update(deltaTime) {
        // Movement
        if (this.moveLeft && this.x > 0) {
            this.x -= this.speed;
        }
        if (this.moveRight && this.x < this.game.width - this.width) {
            this.x += this.speed;
        }
        
        // handle temp modifiers expiration
        const now = Date.now();
        for (let i = this.temporaryModifiers.length - 1; i >= 0; i--) {
            const mod = this.temporaryModifiers[i];
            if (mod.expireAt <= now) {
                if (typeof mod.revert === 'function') mod.revert();
                this.temporaryModifiers.splice(i, 1);
            }
        }
        
        // Shooting
        if (this.shooting && this.weapons.length > 0) {
            const activeWeapon = this.weapons[this.activeWeaponIndex];
            if (activeWeapon) {
                activeWeapon.fire(this.x + this.width / 2, this.y);
            }
        } else if (this.weapons.length > 0) {
            // Stop weapon sound when not shooting
            const activeWeapon = this.weapons[this.activeWeaponIndex];
            if (activeWeapon && typeof activeWeapon.stopSound === 'function') {
                activeWeapon.stopSound();
            }
        }

        // Update weapons
        this.weapons.forEach(weapon => weapon.update(deltaTime));
    }
    
    render(ctx) {
        // Draw ship body
        ctx.fillStyle = '#4af';
        ctx.beginPath();
        ctx.moveTo(this.x + this.width / 2, this.y);
        ctx.lineTo(this.x + this.width, this.y + this.height);
        ctx.lineTo(this.x, this.y + this.height);
        ctx.closePath();
        ctx.fill();
        
        // Draw ship details
        ctx.fillStyle = '#8cf';
        ctx.fillRect(this.x + this.width / 2 - 5, this.y + 10, 10, 20);
        
        // Draw ship glow
        ctx.shadowColor = '#4af';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.moveTo(this.x + this.width / 2, this.y);
        ctx.lineTo(this.x + this.width, this.y + this.height);
        ctx.lineTo(this.x, this.y + this.height);
        ctx.closePath();
        ctx.strokeStyle = '#8cf';
        ctx.stroke();
        ctx.shadowBlur = 0;
        
        // Draw health bar
        const healthBarWidth = this.width;
        const healthBarHeight = 5;
        ctx.fillStyle = '#333';
        ctx.fillRect(this.x, this.y + this.height + 5, healthBarWidth, healthBarHeight);
        
        const healthPercent = Math.max(0, this.health / this.maxHealth);
        ctx.fillStyle = '#f44';
        ctx.fillRect(this.x, this.y + this.height + 5, healthBarWidth * healthPercent, healthBarHeight);
        
        // Draw shield bar if player has shield
        if (this.maxShield > 0) {
            const shieldBarWidth = this.width;
            const shieldBarHeight = 3;
            ctx.fillStyle = '#333';
            ctx.fillRect(this.x, this.y + this.height + 11, shieldBarWidth, shieldBarHeight);
            
            const shieldPercent = Math.max(0, this.shield / this.maxShield);
            ctx.fillStyle = '#44f';
            ctx.fillRect(this.x, this.y + this.height + 11, shieldBarWidth * shieldPercent, shieldBarHeight);
        }
        
        // Draw active weapon indicator
        if (this.weapons.length > 0) {
            const weapon = this.weapons[this.activeWeaponIndex];
            ctx.fillStyle = this.getTierColor(weapon.tier);
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(weapon.name, this.x + this.width / 2, this.y + this.height + 25);
        }
    }
    
    getTierColor(tier) {
        switch (tier) {
            case 'common': return '#fff';
            case 'uncommon': return '#6f6';
            case 'rare': return '#4af';
            case 'epic': return '#a4f';
            case 'legendary': return '#fd4';
            case 'mythic': return '#f4a';
            case 'exotic': return '#0ff';
            case 'transcendent': return '#f00';
            default: return '#fff';
        }
    }
    
    takeDamage(amount) {
        if (this.invincible) return; // ignore damage while invincible

        // Shield takes damage first
        if (this.shield > 0) {
            if (this.shield >= amount) {
                this.shield -= amount;
                amount = 0;
            } else {
                amount -= this.shield;
                this.shield = 0;
            }
        }
        
        // Then health
        if (amount > 0) {
            this.health -= amount;
            
            if (this.health <= 0) {
                this.die();
            }
        }
        
        // Update UI
        this.game.uiManager.updateHUD();
    }
    
    die() {
        this.game.gameOver();
    }
    
    addHealth(amount) {
        this.health = Math.min(this.maxHealth, this.health + amount);
        this.game.uiManager.updateHUD();
    }
    
    addShield(amount) {
        this.shield = Math.min(this.maxShield, this.shield + amount);
        this.game.uiManager.updateHUD();
    }
    
    increaseSpeed(percent) {
        this.speed *= (1 + percent / 100);
    }
    
    addWeapon(weapon) {
        if (this.weapons.length < 5) {
            this.weapons.push(weapon);
            return true;
        }
        return false;
    }
    
    removeWeapon(index) {
        if (index >= 0 && index < this.weapons.length) {
            this.weapons.splice(index, 1);
            
            // Adjust active weapon index if needed
            if (this.activeWeaponIndex >= this.weapons.length) {
                this.activeWeaponIndex = Math.max(0, this.weapons.length - 1);
            }
            
            return true;
        }
        return false;
    }
    
    switchWeapon(index) {
        if (index >= 0 && index < this.weapons.length) {
            this.activeWeaponIndex = index;
            this.game.uiManager.updateWeaponDisplay();
            return true;
        }
        return false;
    }
    
    tryWeaponUpgrade() {
        const weaponCounts = {};
        
        // Count weapons by name and tier
        this.weapons.forEach(weapon => {
            const key = `${weapon.name}-${weapon.tier}`;
            weaponCounts[key] = (weaponCounts[key] || 0) + 1;
        });
        
        // Check for 3 or more of the same weapon and tier
        for (const key in weaponCounts) {
            if (weaponCounts[key] >= 3) {
                const [name, tier] = key.split('-');
                const nextTier = this.getNextTier(tier);
                
                if (nextTier) {
                    // Remove 3 weapons of the same type and tier
                    let removed = 0;
                    for (let i = this.weapons.length - 1; i >= 0 && removed < 3; i--) {
                        if (this.weapons[i].name === name && this.weapons[i].tier === tier) {
                            this.weapons.splice(i, 1);
                            removed++;
                            
                            // Adjust active weapon index if needed
                            if (i <= this.activeWeaponIndex) {
                                this.activeWeaponIndex = Math.max(0, this.activeWeaponIndex - 1);
                            }
                        }
                    }
                    
                    // Add upgraded weapon
                    const upgradedWeapon = this.game.weaponManager.createWeapon(name, nextTier);
                    this.weapons.push(upgradedWeapon);
                    
                    return true;
                }
            }
        }
        
        return false;
    }
    
    getNextTier(tier) {
        const tiers = [
            'common',
            'uncommon',
            'rare',
            'epic',
            'legendary',
            'mythic',
            'exotic',
            'transcendent'
        ];
        const currentIndex = tiers.indexOf(tier);
        if (currentIndex < tiers.length - 1) {
            return tiers[currentIndex + 1];
        }
        return null; // Already at max tier
    }
    
    addTemporaryModifier(mod) {
        // apply immediately
        if (typeof mod.apply === 'function') mod.apply();
        mod.expireAt = Date.now() + mod.duration;
        this.temporaryModifiers.push(mod);
        // update UI
        if (this.game.uiManager && typeof this.game.uiManager.updatePowerups === 'function') {
            this.game.uiManager.updatePowerups(this.temporaryModifiers);
        }
    }

    createDefaultWeapon() {
      return {
        damage: 10,
        fireRate: 0.5,
        // other default weapon properties
        fire: function() {
          // default fire behavior
          console.log("Default weapon fired");
        }
      }
}
