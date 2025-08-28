import { Player } from './player.js';
import { EnemyManager } from './enemies.js';
import { WeaponManager } from './weapons.js';
import { SkillManager } from './skills.js';
import { ShopManager } from './shop.js';
import { UIManager } from './ui.js';
import { LevelManager } from './levels.js';
import { PowerUpManager } from './powerups.js'; // added import

class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.lastTime = 0;
        this.accumulator = 0;
        this.timeStep = 1000 / 60; // 60 FPS
        
        this.width = 800;
        this.height = 600;
        this.gameState = 'menu'; // menu, playing, shop, skill, gameOver
        
        // Changed: Two players!
        this.player1 = new Player(this); // Player 1
        this.player2 = new Player(this); // Player 2
        
        // Position player2 on the right side to start
        this.player2.x = this.width / 2 + 100;
        
        // ... rest as before
        this.enemyManager = null;
        this.weaponManager = null;
        this.skillManager = null;
        this.shopManager = null;
        this.uiManager = null;
        this.levelManager = null;
        this.powerUpManager = null;
        
        this.level = 1;
        this.gold = 0;
        this.enemiesDefeated = 0;
        
        this.init();
    }

    // Update both players
    update(deltaTime) {
        this.player1.update(deltaTime);
        this.player2.update(deltaTime);
        // ...rest of update logic
    }

    // Render both players
    render() {
        // ...your background, enemies, etc.
        this.player1.render(this.ctx);
        this.player2.render(this.ctx);
        // ...rest of render logic
    }

    setupControls() {
        window.addEventListener('keydown', (e) => {
            if (this.gameState !== 'playing') return;
            switch (e.key) {
                // Player 1: A/D to move, F to shoot
                case 'a':
                    this.player1.moveLeft = true;
                    break;
                case 'd':
                    this.player1.moveRight = true;
                    break;
                case 'f':
                    this.player1.shooting = true;
                    break;
                // Player 2: Left/Right arrows, Space to shoot
                case 'ArrowLeft':
                    this.player2.moveLeft = true;
                    break;
                case 'ArrowRight':
                    this.player2.moveRight = true;
                    break;
                case ' ':
                    this.player2.shooting = true;
                    break;
            }
        });
        window.addEventListener('keyup', (e) => {
            switch (e.key) {
                // Player 1
                case 'a':
                    this.player1.moveLeft = false;
                    break;
                case 'd':
                    this.player1.moveRight = false;
                    break;
                case 'f':
                    this.player1.shooting = false;
                    break;
                // Player 2
                case 'ArrowLeft':
                    this.player2.moveLeft = false;
                    break;
                case 'ArrowRight':
                    this.player2.moveRight = false;
                    break;
                case ' ':
                    this.player2.shooting = false;
                    break;
            }
        });
    }
}

window.addEventListener('load', () => {
    new Game();
});
