export class ShopManager {
    constructor(game) {
        this.game = game;
        this.shopItems = [];
        this.inventory = [];
    }
    
    openShop() {
        // Generate shop items based on current level
        this.generateShopItems();
        
        // Update UI
        this.game.uiManager.showScreen('shop-screen');
        this.game.uiManager.updateShopUI();
    }
    
    generateShopItems() {
        this.shopItems = [];
        
        // Get all available weapon types
        const weaponTypes = Object.keys(this.game.weaponManager.weaponTypes);
        
        // Add some random weapons to the shop
        const count = Math.min(3 + Math.floor(this.game.level / 3), weaponTypes.length);
        
        for (let i = 0; i < count; i++) {
            const type = weaponTypes[i];
            const baseWeapon = this.game.weaponManager.weaponTypes[type];
            
            // Determine available tiers based on level
            let availableTiers = ['common'];
            if (this.game.level >= 2) availableTiers.push('uncommon');
            if (this.game.level >= 3) availableTiers.push('rare');
            if (this.game.level >= 6) availableTiers.push('epic');
            if (this.game.level >= 10) availableTiers.push('legendary');
            if (this.game.level >= 15) availableTiers.push('mythic');
            if (this.game.level >= 20) availableTiers.push('exotic');
            if (this.game.level >= 30) availableTiers.push('transcendent');
            
            // Pick random tier
            const tier = availableTiers[Math.floor(Math.random() * availableTiers.length)];
            
            // Calculate price based on tier
            const tierMultiplier = this.game.weaponManager.getTierMultiplier(tier);
            const price = Math.round(baseWeapon.price * tierMultiplier);
            
            this.shopItems.push({
                type,
                tier,
                price,
                description: baseWeapon.description
            });
        }
        
        // Add special items like health potion, shield, etc.
        this.shopItems.push({
            type: 'HealthPotion',
            name: 'Health Potion',
            description: 'Restore 1 HP',
            price: 50,
            icon: '❤️',
            use: () => {
                this.game.player.addHealth(1);
                return true;
            }
        });
        
        this.shopItems.push({
            type: 'ShieldBoost',
            name: 'Shield Boost',
            description: 'Restore shield',
            price: 75,
            icon: '🛡️',
            use: () => {
                this.game.player.addShield(this.game.player.maxShield);
                return true;
            }
        });
        
        // Shuffle items
        this.shopItems.sort(() => 0.5 - Math.random());
    }
    
    buyWeapon(index) {
        const item = this.shopItems[index];
        
        if (!item || this.game.gold < item.price) return false;
        
        // Consumable item
        if (item.use) {
            if (item.use()) {
                this.game.gold -= item.price;
                this.game.uiManager.updateHUD();
                this.game.uiManager.updateShopUI();
                return true;
            }
            return false;
        }
        
        // Weapon item
        const weapon = this.game.weaponManager.createWeapon(item.type, item.tier);
        
        if (this.game.player.addWeapon(weapon)) {
            this.game.gold -= item.price;
            this.game.uiManager.updateHUD();
            this.game.uiManager.updateShopUI();
            
            // Check for weapon upgrade opportunity
            this.game.player.tryWeaponUpgrade();
            
            return true;
        }
        
        return false;
    }
    
    getTierColor(tier) {
        switch (tier) {
            case 'common': return '#fff';
            case 'rare': return '#4af';
            case 'epic': return '#a4f';
            case 'epic+': return '#f4a';
            case 'legendary': return '#fd4';
            default: return '#fff';
        }
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
}