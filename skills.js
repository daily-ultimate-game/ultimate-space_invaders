export class SkillManager {
    constructor(game) {
        this.game = game;
        this.skills = [
            {
                name: 'Fire Rate',
                description: 'Shoot 1% faster',
                icon: '🔥',
                apply: () => {
                    this.game.player.weapons.forEach(weapon => {
                        weapon.fireRate *= 0.99; // 1% faster shooting
                    });
                    return 'Increased fire rate by 1%';
                }
            },
            {
                name: 'Health',
                description: 'Add 1 HP',
                icon: '❤️',
                apply: () => {
                    this.game.player.maxHealth += 1;
                    this.game.player.health += 1;
                    this.game.uiManager.updateHUD();
                    return 'Added 1 HP';
                }
            },
            {
                name: 'Shield',
                description: 'Recover shield',
                icon: '🛡️',
                apply: () => {
                    this.game.player.shield = this.game.player.maxShield;
                    this.game.uiManager.updateHUD();
                    return 'Shield fully recovered';
                }
            },
            {
                name: 'Enemy Slowdown',
                description: 'Enemies move 1% slower',
                icon: '🐢',
                apply: () => {
                    // Store the slowdown effect for future enemies
                    this.game.enemyManager.enemySlowdownFactor = 
                        (this.game.enemyManager.enemySlowdownFactor || 1) * 0.99;
                    return 'Enemies slowed by 1%';
                }
            },
            {
                name: 'Player Speed',
                description: 'Move 1% faster',
                icon: '⚡',
                apply: () => {
                    this.game.player.speed *= 1.01; // 1% faster movement
                    return 'Movement speed increased by 1%';
                }
            },
            {
                name: 'Damage Boost',
                description: 'Increase damage by 1%',
                icon: '💥',
                apply: () => {
                    this.game.player.weapons.forEach(weapon => {
                        weapon.damage *= 1.01; // 1% more damage
                    });
                    return 'Damage increased by 1%';
                }
            },
            {
                name: 'Max Shield',
                description: 'Increase max shield by 1',
                icon: '🔷',
                apply: () => {
                    this.game.player.maxShield += 1;
                    this.game.player.shield += 1;
                    this.game.uiManager.updateHUD();
                    return 'Max shield increased by 1';
                }
            },
            {
                name: 'Gold Bonus',
                description: 'Enemies drop 10% more gold',
                icon: '💰',
                apply: () => {
                    this.game.goldMultiplier = (this.game.goldMultiplier || 1) * 1.1;
                    return 'Gold drops increased by 10%';
                }
            },
            {
                name: 'Projectile Size',
                description: 'Increase projectile size by 5%',
                icon: '⭕',
                apply: () => {
                    this.game.player.weapons.forEach(weapon => {
                        weapon.projectileSize *= 1.05; // 5% larger projectiles
                    });
                    return 'Projectile size increased by 5%';
                }
            },
            {
                name: 'Projectile Speed',
                description: 'Increase projectile speed by 5%',
                icon: '🚀',
                apply: () => {
                    this.game.player.weapons.forEach(weapon => {
                        weapon.projectileSpeed *= 1.05; // 5% faster projectiles
                    });
                    return 'Projectile speed increased by 5%';
                }
            }
        ];
    }
    
    getRandomSkills(count = 3) {
        // Get random skills from the available ones
        const shuffled = [...this.skills].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, Math.min(count, shuffled.length));
    }
    
    applySkill(skill) {
        return skill.apply();
    }
}