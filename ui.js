export class UIManager {
    constructor(game) {
        this.game = game;
        this.screens = {
            'main-menu': document.getElementById('main-menu'),
            'game-screen': document.getElementById('game-screen'),
            'shop-screen': document.getElementById('shop-screen'),
            'skill-screen': document.getElementById('skill-screen'),
            'game-over': document.getElementById('game-over')
        };
        
        this.hudElements = {
            level: document.getElementById('level'),
            health: document.getElementById('health'),
            shield: document.getElementById('shield'),
            gold: document.getElementById('gold'),
            weaponSlots: document.querySelectorAll('.weapon-slot'),
            powerupsDisplay: document.getElementById('powerups-display') // new
        };
        
        this.shopElements = {
            goldDisplay: document.getElementById('shop-gold'),
            shopItems: document.getElementById('shop-items'),
            inventoryItems: document.getElementById('inventory-items')
        };
        
        this.skillElements = {
            skillOptions: document.getElementById('skill-options')
        };
        
        this.gameOverElements = {
            finalLevel: document.getElementById('final-level'),
            finalGold: document.getElementById('final-gold'),
            finalEnemies: document.getElementById('final-enemies')
        };
        
        // Add click handlers for weapon slots
        this.hudElements.weaponSlots.forEach((slot, index) => {
            slot.addEventListener('click', () => {
                this.game.player.switchWeapon(index);
            });
        });
    }
    
    showScreen(screenId) {
        // Hide all screens
        Object.values(this.screens).forEach(screen => {
            screen.classList.add('hidden');
        });
        
        // Show the requested screen
        this.screens[screenId].classList.remove('hidden');
    }
    
    updateHUD() {
        this.hudElements.level.textContent = `Level: ${this.game.level}`;
        this.hudElements.health.textContent = `HP: ${this.game.player.health}/${this.game.player.maxHealth}`;
        this.hudElements.shield.textContent = `Shield: ${this.game.player.shield}/${this.game.player.maxShield}`;
        this.hudElements.gold.textContent = `Gold: ${this.game.gold}`;
        
        this.updateWeaponDisplay();
        this.updatePowerups(this.game.player.temporaryModifiers || []);
    }

    updatePowerups(activeMods) {
        const container = this.hudElements.powerupsDisplay;
        if (!container) return;
        container.innerHTML = '';
        activeMods.forEach(mod => {
            const badge = document.createElement('div');
            badge.className = 'powerup-badge';
            badge.textContent = mod.id + (mod.expireAt ? ` (${Math.ceil((mod.expireAt - Date.now())/1000)}s)` : '');
            container.appendChild(badge);
        });
    }
    
    updateWeaponDisplay() {
        // Update weapon slots
        this.hudElements.weaponSlots.forEach((slot, index) => {
            const weapon = index < this.game.player.weapons.length ? this.game.player.weapons[index] : null;
            
            if (weapon) {
                // Remove all children
                while (slot.firstChild) {
                    slot.removeChild(slot.firstChild);
                }
                
                // Add weapon icon and tier indicator
                const icon = document.createElement('div');
                icon.className = 'weapon-icon';
                icon.textContent = this.getWeaponIcon(weapon.type);
                
                const tier = document.createElement('div');
                tier.className = `tier ${weapon.tier}`;
                tier.textContent = this.getTierShortName(weapon.tier);
                
                slot.appendChild(icon);
                slot.appendChild(tier);
                
                // Highlight active weapon
                if (index === this.game.player.activeWeaponIndex) {
                    slot.classList.add('active');
                } else {
                    slot.classList.remove('active');
                }
            } else {
                // Empty slot
                slot.innerHTML = index + 1;
                slot.classList.remove('active');
            }
        });
    }
    
    updateShopUI() {
        // Update gold display
        this.shopElements.goldDisplay.textContent = this.game.gold;
        
        // Update shop items
        this.shopElements.shopItems.innerHTML = '';
        
        this.game.shopManager.shopItems.forEach((item, index) => {
            const itemElement = document.createElement('div');
            itemElement.className = 'shop-item';
            
            let icon;
            let name;
            
            if (item.type === 'HealthPotion' || item.type === 'ShieldBoost') {
                // Consumable item
                icon = item.icon;
                name = item.name;
            } else {
                // Weapon item
                icon = this.getWeaponIcon(item.type);
                name = item.type;
                itemElement.style.borderColor = this.getTierColor(item.tier);
            }
            
            itemElement.innerHTML = `
                <div class="weapon-name">${name}</div>
                <div class="weapon-icon">${icon}</div>
                <div class="weapon-stats">
                    ${item.description}<br>
                    Tier: ${item.tier || 'N/A'}
                </div>
                <div class="price">Price: ${item.price} gold</div>
                <button ${this.game.gold < item.price ? 'disabled' : ''}>Buy</button>
            `;
            
            // Add click handler for buy button
            const buyButton = itemElement.querySelector('button');
            buyButton.addEventListener('click', () => {
                this.game.shopManager.buyWeapon(index);
            });
            
            this.shopElements.shopItems.appendChild(itemElement);
        });
        
        // Update inventory
        this.updateInventoryUI();
    }
    
    updateInventoryUI() {
        this.shopElements.inventoryItems.innerHTML = '';
        
        this.game.player.weapons.forEach((weapon, index) => {
            const itemElement = document.createElement('div');
            itemElement.className = `inventory-item ${weapon.tier}`;
            
            itemElement.innerHTML = `
                <div class="weapon-icon">${this.getWeaponIcon(weapon.type)}</div>
                <div>${weapon.name}</div>
                <div class="tier-badge ${weapon.tier}">${this.getTierShortName(weapon.tier)}</div>
                <button class="sell-btn">Sell</button>
            `;
            
            // Equip weapon on click (excluding the sell button)
            itemElement.addEventListener('click', (e) => {
                if (e.target.classList.contains('sell-btn')) return;
                this.game.player.switchWeapon(index);
                this.updateInventoryUI();
            });

            // Sell button logic
            itemElement.querySelector('.sell-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                const sellPrice = Math.round(weapon.price * 0.7);
                this.game.player.removeWeapon(index);
                this.game.gold += sellPrice;
                this.game.uiManager.updateHUD();
                this.updateInventoryUI();
            });

            // Highlight active weapon
            if (index === this.game.player.activeWeaponIndex) {
                itemElement.classList.add('active');
            }
            
            this.shopElements.inventoryItems.appendChild(itemElement);
        });
    }
    
    showSkillOptions() {
        this.showScreen('skill-screen');
        
        const skills = this.game.skillManager.getRandomSkills(3);
        
        this.skillElements.skillOptions.innerHTML = '';
        
        skills.forEach(skill => {
            const skillElement = document.createElement('div');
            skillElement.className = 'skill-option';
            
            skillElement.innerHTML = `
                <div class="skill-name">${skill.name}</div>
                <div class="skill-icon">${skill.icon}</div>
                <div class="skill-description">${skill.description}</div>
            `;
            
            skillElement.addEventListener('click', () => {
                // Apply skill and update UI
                const message = this.game.skillManager.applySkill(skill);

                // Show selection feedback
                document.querySelectorAll('.skill-option').forEach(el => {
                    el.classList.remove('selected');
                });
                skillElement.classList.add('selected');

                // Remove previous result message if any
                const prevResult = skillElement.querySelector('.skill-result');
                if (prevResult) prevResult.remove();

                // Add message about skill effect
                const resultMessage = document.createElement('div');
                resultMessage.className = 'skill-result';
                skillElement.appendChild(resultMessage);
            });
            
            this.skillElements.skillOptions.appendChild(skillElement);
        });
    }
    
    showGameOver() {
        this.showScreen('game-over');
        
        this.gameOverElements.finalLevel.textContent = this.game.level;
        this.gameOverElements.finalGold.textContent = this.game.gold;
        this.gameOverElements.finalEnemies.textContent = this.game.enemiesDefeated;
    }
    
    getWeaponIcon(type) {
        switch (type) {
            case 'Gun': return '🔫';
            case 'MachineGun': return '⚔️';
            case 'Shotgun': return '💥';
            case 'Rocket': return '🚀';
            case 'Laser': return '⚡';
            case 'Sniper': return '🎯';
            case 'Flamethrower': return '🔥';
            case 'Railgun': return '🔩';
            case 'PlasmaCannon': return '🟣';
            case 'IceBlaster': return '❄️';
            case 'ToxicSprayer': return '☣️';
            default: return '❓';
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
    
    getTierShortName(tier) {
        switch (tier) {
            case 'common': return 'C';
            case 'uncommon': return 'U';
            case 'rare': return 'R';
            case 'epic': return 'E';
            case 'legendary': return 'L';
            case 'mythic': return 'M';
            case 'exotic': return 'X';
            case 'transcendent': return 'T';
            default: return '';
        }
    }
}
