import { Player } from './player.js';
import { EnemyManager } from './enemies.js';
import { WeaponManager } from './weapons.js';
import { SkillManager } from './skills.js';
import { ShopManager } from './shop.js';
import { UIManager } from './ui.js';
import { LevelManager } from './levels.js';
import { PowerUpManager } from './powerups.js';

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

        this.playerCount = 1;
        this.players = [];

        // Initialize managers
        this.weaponManager = new WeaponManager(this);
        this.enemyManager = new EnemyManager(this);
        this.skillManager = new SkillManager(this);
        this.shopManager = new ShopManager(this);
        this.uiManager = new UIManager(this);
        this.levelManager = new LevelManager(this);
        this.powerUpManager = new PowerUpManager(this);

        this.level = 1;
        this.gold = 0;
        this.enemiesDefeated = 0;

        this.init();
    }

    init() {
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());

        document.getElementById('start-1-player').addEventListener('click', () => this.startGame(1));
        document.getElementById('start-2-players').addEventListener('click', () => this.startGame(2));
        document.getElementById('continue-game').addEventListener('click', () => this.continueFromShop());
        document.getElementById('continue-after-skill').addEventListener('click', () => this.continueAfterSkill());
        document.getElementById('restart-game').addEventListener('click', () => this.restartGame());
        document.getElementById('return-menu').addEventListener('click', () => this.returnToMenu());

        this.setupControls();
        this.gameLoop(0);
    }

    resizeCanvas() {
        const container = document.getElementById('game-container');
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;

        const canvasRatio = this.width / this.height;
        const containerRatio = containerWidth / containerHeight;

        let canvasWidth, canvasHeight;
        if (containerRatio > canvasRatio) {
            canvasHeight = containerHeight * 0.9;
            canvasWidth = canvasHeight * canvasRatio;
        } else {
            canvasWidth = containerWidth * 0.9;
            canvasHeight = canvasWidth / canvasRatio;
        }

        this.canvas.width = this.width;
        this.canvas.height = this.height;
        this.canvas.style.width = `${canvasWidth}px`;
        this.canvas.style.height = `${canvasHeight}px`;
    }

    startGame(playerCount) {
        this.playerCount = playerCount;
        this.gameState = 'playing';
        this.level = 1;
        this.gold = 0;
        this.enemiesDefeated = 0;
        this.players = [];

        for (let i = 0; i < this.playerCount; i++) {
            const newPlayer = new Player(this);
            if (i === 0) {
                newPlayer.x = this.width / 2 - (this.playerCount === 1 ? newPlayer.width / 2 : newPlayer.width + 20);
            } else {
                newPlayer.x = this.width / 2 + 20;
            }
            this.players.push(newPlayer);
        }
        
        // For compatibility with other classes that use game.player
        this.player = this.players[0];

        this.players.forEach(p => p.reset());
        this.enemyManager.reset();
        this.levelManager.startLevel(this.level);

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
        this.startGame(this.playerCount);
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

        this.players.forEach(player => player.update(deltaTime));
        this.enemyManager.update(deltaTime);
        this.weaponManager.update(deltaTime);
        if (this.powerUpManager) this.powerUpManager.update(deltaTime);

        if (this.enemyManager.enemies.length === 0) {
            this.nextLevel();
        }
    }

    render() {
        this.ctx.clearRect(0, 0, this.width, this.height);
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.width, this.height);
        this.drawStars();

        if (this.gameState === 'playing' || this.gameState === 'paused') {
            this.players.forEach(player => player.render(this.ctx));
            this.enemyManager.render(this.ctx);
            this.weaponManager.render(this.ctx);
            if (this.powerUpManager) this.powerUpManager.render(this.ctx);

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

    setupControls() {
        window.addEventListener('keydown', (e) => {
            if (this.gameState !== 'playing') return;
            
            if (this.playerCount === 1) {
                switch (e.key) {
                    case 'a': case 'ArrowLeft': this.players[0].moveLeft = true; break;
                    case 'd': case 'ArrowRight': this.players[0].moveRight = true; break;
                    case 'f': case ' ': this.players[0].shooting = true; break;
                }
            } else if (this.playerCount === 2) {
                switch (e.key) {
                    // Player 1
                    case 'a': this.players[0].moveLeft = true; break;
                    case 'd': this.players[0].moveRight = true; break;
                    case 'f': this.players[0].shooting = true; break;
                    // Player 2
                    case 'ArrowLeft': this.players[1].moveLeft = true; break;
                    case 'ArrowRight': this.players[1].moveRight = true; break;
                    case ' ': this.players[1].shooting = true; break;
                }
            }
        });

        window.addEventListener('keyup', (e) => {
            if (this.gameState !== 'playing') return;

            if (this.playerCount === 1) {
                switch (e.key) {
                    case 'a': case 'ArrowLeft': this.players[0].moveLeft = false; break;
                    case 'd': case 'ArrowRight': this.players[0].moveRight = false; break;
                    case 'f': case ' ': this.players[0].shooting = false; break;
                }
            } else if (this.playerCount === 2) {
                switch (e.key) {
                    // Player 1
                    case 'a': this.players[0].moveLeft = false; break;
                    case 'd': this.players[0].moveRight = false; break;
                    case 'f': this.players[0].shooting = false; break;
                    // Player 2
                    case 'ArrowLeft': this.players[1].moveLeft = false; break;
                    case 'ArrowRight': this.players[1].moveRight = false; break;
                    case ' ': this.players[1].shooting = false; break;
                }
            }
        });
    }
}

window.addEventListener('load', () => {
    new Game();
});
