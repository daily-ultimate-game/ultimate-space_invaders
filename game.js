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
        
        this.player = null;
        this.enemyManager = null;
        this.weaponManager = null;
        this.skillManager = null;
        this.shopManager = null;
        this.uiManager = null;
        this.levelManager = null;
        this.powerUpManager = null; // new
        
        this.level = 1;
        this.gold = 0;
        this.enemiesDefeated = 0;
        
        this.init();
    }
    
    init() {
        // Set canvas size
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        
        // Initialize managers
        this.weaponManager = new WeaponManager(this);
        this.player = new Player(this);
        this.enemyManager = new EnemyManager(this);
        this.skillManager = new SkillManager(this);
        this.shopManager = new ShopManager(this);
        this.uiManager = new UIManager(this);
        this.levelManager = new LevelManager(this);
        
        // new: power-up manager
        this.powerUpManager = new PowerUpManager(this);
        
        // Event listeners
        document.getElementById('start-game').addEventListener('click', () => this.startGame());
        document.getElementById('continue-game').addEventListener('click', () => this.continueFromShop());
        document.getElementById('continue-after-skill').addEventListener('click', () => this.continueAfterSkill());
        document.getElementById('restart-game').addEventListener('click', () => this.restartGame());
        document.getElementById('return-menu').addEventListener('click', () => this.returnToMenu());
        
        // Set up keyboard controls
        this.setupControls();
        
        // Start game loop
        this.gameLoop(0);
    }
    
    resizeCanvas() {
        const container = document.getElementById('game-container');
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;
        
        // Maintain aspect ratio
        let canvasWidth = this.width;
        let canvasHeight = this.height;
        
        const containerRatio = containerWidth / containerHeight;
        const canvasRatio = this.width / this.height;
        
        if (containerRatio > canvasRatio) {
            // Container is wider
            canvasHeight = containerHeight * 0.9;
            canvasWidth = canvasHeight * canvasRatio;
        } else {
            // Container is taller
            canvasWidth = containerWidth * 0.9;
            canvasHeight = canvasWidth / canvasRatio;
        }
        
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        
        this.canvas.style.width = `${canvasWidth}px`;
        this.canvas.style.height = `${canvasHeight}px`;
    }
    
    setupControls() {
        window.addEventListener('keydown', (e) => {
            if (this.gameState !== 'playing') return;
            
            switch (e.key) {
                case 'ArrowLeft':
                case 'a':
                    this.player.moveLeft = true;
                    break;
                case 'ArrowRight':
                case 'd':
                    this.player.moveRight = true;
                    break;
                case ' ':
                    this.player.shooting = true;
                    break;
                case 'Escape':
                case 'p':
                    this.togglePause();
                    break;
                case '1':
                case '2':
                case '3':
                case '4':
                case '5':
                    const weaponIndex = parseInt(e.key) - 1;
                    this.player.switchWeapon(weaponIndex);
                    break;
            }
        });
        
        window.addEventListener('keyup', (e) => {
            switch (e.key) {
                case 'ArrowLeft':
                case 'a':
                    this.player.moveLeft = false;
                    break;
                case 'ArrowRight':
                case 'd':
                    this.player.moveRight = false;
                    break;
                case ' ':
                    this.player.shooting = false;
                    break;
            }
        });
    }
    
    startGame() {
        this.gameState = 'playing';
        this.level = 1;
        this.gold = 0;
        this.enemiesDefeated = 0;
        
        // Reset managers
        this.player.reset();
        this.enemyManager.reset();
        this.levelManager.startLevel(this.level);
        
        // Update UI
        this.uiManager.updateHUD();
        this.uiManager.showScreen('game-screen');
    }
    
    nextLevel() {
        this.level++;
        this.gameState = 'skill';
        this.uiManager.showSkillOptions();
    }
    
    continueAfterSkill() {
        this.gameState = 'shop';
        this.shopManager.openShop();
    }
    
    continueFromShop() {
        this.gameState = 'playing';
        this.levelManager.startLevel(this.level);
        this.uiManager.showScreen('game-screen');
    }
    
    gameOver() {
        this.gameState = 'gameOver';
        this.uiManager.showGameOver();
    }
    
    restartGame() {
        this.startGame();
    }
    
    returnToMenu() {
        this.gameState = 'menu';
        this.uiManager.showScreen('main-menu');
    }
    
    togglePause() {
        if (this.gameState === 'playing') {
            this.gameState = 'paused';
        } else if (this.gameState === 'paused') {
            this.gameState = 'playing';
        }
    }
    
    update(deltaTime) {
        if (this.gameState !== 'playing') return;
        
        this.player.update(deltaTime);
        this.enemyManager.update(deltaTime);
        this.weaponManager.update(deltaTime);
        
        // update powerups
        if (this.powerUpManager) this.powerUpManager.update(deltaTime);
        
        // Check if level is complete
        if (this.enemyManager.enemies.length === 0) {
            this.nextLevel();
        }
    }
    
    render() {
        this.ctx.clearRect(0, 0, this.width, this.height);
        
        // Draw background
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // Draw stars
        this.drawStars();
        
        if (this.gameState === 'playing' || this.gameState === 'paused') {
            this.player.render(this.ctx);
            this.enemyManager.render(this.ctx);
            this.weaponManager.render(this.ctx);
            
            // render powerups on top of world
            if (this.powerUpManager) this.powerUpManager.render(this.ctx);
            
            // Draw pause overlay if paused
            if (this.gameState === 'paused') {
                this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
                this.ctx.fillRect(0, 0, this.width, this.height);
                
                this.ctx.fillStyle = '#fff';
                this.ctx.font = '40px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.fillText('PAUSED', this.width / 2, this.height / 2);
                this.ctx.font = '20px Arial';
                this.ctx.fillText('Press ESC or P to continue', this.width / 2, this.height / 2 + 40);
            }
        }
    }
    
    drawStars() {
        // Draw distant stars
        this.ctx.fillStyle = '#fff';
        for (let i = 0; i < 100; i++) {
            const x = Math.random() * this.width;
            const y = Math.random() * this.height;
            const size = Math.random() * 2;
            this.ctx.fillRect(x, y, size, size);
        }
    }
    
    gameLoop(currentTime) {
        requestAnimationFrame((time) => this.gameLoop(time));
        
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        // Update with fixed time step
        this.accumulator += deltaTime;
        while (this.accumulator >= this.timeStep) {
            this.update(this.timeStep);
            this.accumulator -= this.timeStep;
        }
        
        this.render();
    }
    
    addGold(amount) {
        this.gold += amount;
        this.uiManager.updateHUD();
    }
    
    enemyDefeated() {
        this.enemiesDefeated++;
    }
}

// Start the game when the page is loaded
window.addEventListener('load', () => {
    new Game();
});