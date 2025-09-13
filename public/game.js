// Main Game Logic and Controller
class MazeGame {
    constructor() {
        this.canvas = document.getElementById('maze-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.characterSprite = document.getElementById('character-sprite');
        
        this.currentLevel = 1;
        this.isRunning = false;
        this.isPaused = false;
        this.startTime = null;
        this.endTime = null;
        
        this.player = {
            x: 0,
            y: 0,
            direction: 0, // 0: right, 1: down, 2: left, 3: up
            sprite: '🛡️'
        };
        
        this.gameObjects = {
            treasures: [],
            keys: [],
            doors: [],
            enemies: [],
            powerups: []
        };
        
        this.collectedItems = {
            treasures: 0,
            keys: 0
        };
        
        this.executionQueue = [];
        this.currentCommand = 0;
        this.executionSpeed = 800; // milliseconds between commands
        
        this.init();
    }

    init() {
        this.setupCanvas();
        this.setupControls();
        this.loadLevel(this.currentLevel);
    }

    setupCanvas() {
        // Set canvas size based on container
        const container = this.canvas.parentElement;
        const containerRect = container.getBoundingClientRect();
        
        this.canvas.width = Math.min(600, containerRect.width - 40);
        this.canvas.height = Math.min(400, containerRect.height - 40);
        
        // Set up rendering context
        this.ctx.imageSmoothingEnabled = false;
        this.cellSize = Math.min(this.canvas.width / 15, this.canvas.height / 10);
    }

    setupControls() {
        // Keyboard controls for testing
        document.addEventListener('keydown', (e) => {
            if (this.isRunning) return;
            
            switch(e.key) {
                case 'ArrowUp':
                    this.movePlayer(0, -1);
                    break;
                case 'ArrowDown':
                    this.movePlayer(0, 1);
                    break;
                case 'ArrowLeft':
                    this.movePlayer(-1, 0);
                    break;
                case 'ArrowRight':
                    this.movePlayer(1, 0);
                    break;
                case ' ':
                    e.preventDefault();
                    this.runCode();
                    break;
                case 'r':
                    this.restartLevel();
                    break;
            }
        });
    }

    loadLevel(levelNumber) {
        this.currentLevel = levelNumber;
        const levelData = this.getLevelData(levelNumber);
        
        if (!levelData) {
            this.showMessage('Congratulations! You\'ve completed all levels!', 'success');
            return;
        }
        
        // Set up maze
        this.maze = levelData.maze;
        this.player.x = levelData.start.x;
        this.player.y = levelData.start.y;
        this.player.direction = 0;
        this.goal = levelData.goal;
        
        // Set up game objects
        this.gameObjects = {
            treasures: [...(levelData.treasures || [])],
            keys: [...(levelData.keys || [])],
            doors: [...(levelData.doors || [])],
            enemies: [...(levelData.enemies || [])],
            powerups: [...(levelData.powerups || [])]
        };
        
        // Reset collected items
        this.collectedItems = { treasures: 0, keys: 0 };
        
        // Update difficulty indicator
        this.updateDifficultyIndicator(levelData.difficulty);
        
        // Update available blocks based on level
        this.updateAvailableBlocks(levelData.availableBlocks);
        
        // Clear workspace
        if (window.blockManager) {
            window.blockManager.clearWorkspace();
        }
        
        this.render();
        this.updateCharacterPosition();
    }

    getLevelData(levelNumber) {
        const levels = {
            1: {
                difficulty: 'Beginner',
                maze: [
                    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                    [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
                    [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0],
                    [0, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 0],
                    [0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0],
                    [0, 1, 0, 1, 0, 1, 1, 1, 1, 1, 0, 1, 0, 1, 0],
                    [0, 1, 0, 1, 0, 1, 0, 0, 0, 1, 0, 1, 0, 1, 0],
                    [0, 1, 0, 1, 0, 1, 1, 1, 1, 1, 0, 1, 0, 1, 0],
                    [0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0],
                    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
                ],
                start: { x: 1, y: 1 },
                goal: { x: 13, y: 8 },
                treasures: [{ x: 7, y: 4 }, { x: 11, y: 6 }],
                availableBlocks: ['forward', 'turn-left', 'turn-right'],
                description: 'Learn basic movement commands to reach the goal!'
            },
            2: {
                difficulty: 'Beginner',
                maze: [
                    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                    [0, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 0],
                    [0, 1, 0, 1, 0, 1, 0, 0, 0, 1, 0, 1, 0, 1, 0],
                    [0, 1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1, 0],
                    [0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0],
                    [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
                    [0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0],
                    [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
                    [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0],
                    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
                ],
                start: { x: 1, y: 1 },
                goal: { x: 13, y: 8 },
                treasures: [{ x: 3, y: 3 }, { x: 7, y: 5 }, { x: 11, y: 3 }],
                availableBlocks: ['forward', 'turn-left', 'turn-right', 'repeat'],
                description: 'Use loops to repeat actions efficiently!'
            },
            3: {
                difficulty: 'Intermediate',
                maze: [
                    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                    [0, 1, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 0],
                    [0, 1, 0, 0, 1, 0, 1, 0, 1, 0, 1, 0, 0, 1, 0],
                    [0, 1, 0, 0, 1, 1, 1, 0, 1, 1, 1, 0, 0, 1, 0],
                    [0, 1, 1, 1, 1, 0, 0, 0, 1, 0, 0, 1, 1, 1, 0],
                    [0, 0, 0, 0, 1, 0, 1, 1, 1, 0, 1, 1, 0, 0, 0],
                    [0, 1, 1, 1, 1, 0, 1, 0, 1, 0, 1, 1, 1, 1, 0],
                    [0, 1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 1, 0],
                    [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
                    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
                ],
                start: { x: 1, y: 1 },
                goal: { x: 13, y: 8 },
                treasures: [{ x: 4, y: 2 }, { x: 8, y: 4 }, { x: 12, y: 6 }],
                keys: [{ x: 6, y: 6 }],
                doors: [{ x: 10, y: 5 }],
                availableBlocks: ['forward', 'turn-left', 'turn-right', 'repeat', 'if-wall'],
                description: 'Use conditions to navigate around obstacles!'
            },
            4: {
                difficulty: 'Intermediate',
                maze: [
                    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                    [0, 1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1, 0],
                    [0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0],
                    [0, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 0],
                    [0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
                    [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
                    [0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
                    [0, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 0],
                    [0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0],
                    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
                ],
                start: { x: 1, y: 1 },
                goal: { x: 13, y: 8 },
                treasures: [{ x: 3, y: 5 }, { x: 7, y: 3 }, { x: 11, y: 5 }, { x: 7, y: 7 }],
                availableBlocks: ['forward', 'turn-left', 'turn-right', 'repeat', 'if-wall', 'if-treasure'],
                description: 'Collect all treasures using conditional logic!'
            },
            5: {
                difficulty: 'Advanced',
                maze: [
                    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                    [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
                    [0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0],
                    [0, 1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1, 0],
                    [0, 1, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0],
                    [0, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 0],
                    [0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0],
                    [0, 1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1, 0],
                    [0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0],
                    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
                ],
                start: { x: 1, y: 1 },
                goal: { x: 13, y: 8 },
                treasures: [{ x: 5, y: 3 }, { x: 9, y: 5 }, { x: 7, y: 7 }],
                keys: [{ x: 3, y: 5 }, { x: 11, y: 3 }],
                doors: [{ x: 7, y: 2 }, { x: 7, y: 6 }],
                enemies: [{ x: 5, y: 7, patrol: [{x: 5, y: 7}, {x: 9, y: 7}] }],
                availableBlocks: ['forward', 'turn-left', 'turn-right', 'repeat', 'if-wall', 'if-treasure'],
                description: 'Master all concepts to complete this challenging maze!'
            }
        };
        
        return levels[levelNumber] || null;
    }

    updateDifficultyIndicator(difficulty) {
        const indicator = document.getElementById('difficulty-level');
        if (indicator) {
            indicator.textContent = difficulty;
            indicator.className = 'difficulty-indicator ' + difficulty.toLowerCase();
        }
    }

    updateAvailableBlocks(availableBlocks) {
        const categories = document.querySelectorAll('.block-category');
        categories.forEach(category => {
            const categoryType = category.dataset.category;
            const blocks = category.querySelectorAll('.code-block');
            
            blocks.forEach(block => {
                const command = block.dataset.command;
                if (availableBlocks.includes(command)) {
                    block.style.display = 'flex';
                } else {
                    block.style.display = 'none';
                }
            });
            
            // Hide category if no blocks are available
            const visibleBlocks = category.querySelectorAll('.code-block[style*="flex"]');
            if (visibleBlocks.length === 0) {
                category.style.display = 'none';
            } else {
                category.style.display = 'block';
            }
        });
    }

    render() {
        // Clear canvas
        this.ctx.fillStyle = '#f8f9fa';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw maze
        this.drawMaze();
        
        // Draw game objects
        this.drawGameObjects();
        
        // Draw goal
        this.drawGoal();
    }

    drawMaze() {
        const cellSize = this.cellSize;
        
        for (let y = 0; y < this.maze.length; y++) {
            for (let x = 0; x < this.maze[y].length; x++) {
                const cell = this.maze[y][x];
                const pixelX = x * cellSize;
                const pixelY = y * cellSize;
                
                if (cell === 0) {
                    // Wall
                    this.ctx.fillStyle = '#2c3e50';
                    this.ctx.fillRect(pixelX, pixelY, cellSize, cellSize);
                    
                    // Add wall texture
                    this.ctx.fillStyle = '#34495e';
                    this.ctx.fillRect(pixelX + 2, pixelY + 2, cellSize - 4, cellSize - 4);
                } else {
                    // Path
                    this.ctx.fillStyle = '#ecf0f1';
                    this.ctx.fillRect(pixelX, pixelY, cellSize, cellSize);
                    
                    // Add subtle grid
                    this.ctx.strokeStyle = '#bdc3c7';
                    this.ctx.lineWidth = 0.5;
                    this.ctx.strokeRect(pixelX, pixelY, cellSize, cellSize);
                }
            }
        }
    }

    drawGameObjects() {
        const cellSize = this.cellSize;
        
        // Draw treasures
        this.gameObjects.treasures.forEach(treasure => {
            if (!treasure.collected) {
                const x = treasure.x * cellSize + cellSize / 2;
                const y = treasure.y * cellSize + cellSize / 2;
                
                this.ctx.fillStyle = '#f1c40f';
                this.ctx.beginPath();
                this.ctx.arc(x, y, cellSize / 4, 0, Math.PI * 2);
                this.ctx.fill();
                
                // Add sparkle effect
                this.ctx.fillStyle = '#fff';
                this.ctx.beginPath();
                this.ctx.arc(x - 3, y - 3, 2, 0, Math.PI * 2);
                this.ctx.fill();
            }
        });
        
        // Draw keys
        this.gameObjects.keys.forEach(key => {
            if (!key.collected) {
                const x = key.x * cellSize + cellSize / 2;
                const y = key.y * cellSize + cellSize / 2;
                
                this.ctx.fillStyle = '#e74c3c';
                this.ctx.fillRect(x - cellSize / 6, y - cellSize / 6, cellSize / 3, cellSize / 3);
            }
        });
        
        // Draw doors
        this.gameObjects.doors.forEach(door => {
            if (!door.opened) {
                const x = door.x * cellSize;
                const y = door.y * cellSize;
                
                this.ctx.fillStyle = '#8b4513';
                this.ctx.fillRect(x, y, cellSize, cellSize);
                
                // Door handle
                this.ctx.fillStyle = '#ffd700';
                this.ctx.beginPath();
                this.ctx.arc(x + cellSize * 0.8, y + cellSize / 2, 3, 0, Math.PI * 2);
                this.ctx.fill();
            }
        });
        
        // Draw enemies
        this.gameObjects.enemies.forEach(enemy => {
            const x = enemy.x * cellSize + cellSize / 2;
            const y = enemy.y * cellSize + cellSize / 2;
            
            this.ctx.fillStyle = '#e74c3c';
            this.ctx.beginPath();
            this.ctx.arc(x, y, cellSize / 3, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Enemy eyes
            this.ctx.fillStyle = '#fff';
            this.ctx.beginPath();
            this.ctx.arc(x - 3, y - 3, 2, 0, Math.PI * 2);
            this.ctx.arc(x + 3, y - 3, 2, 0, Math.PI * 2);
            this.ctx.fill();
        });
    }

    drawGoal() {
        const x = this.goal.x * this.cellSize;
        const y = this.goal.y * this.cellSize;
        
        // Goal flag
        this.ctx.fillStyle = '#27ae60';
        this.ctx.fillRect(x + this.cellSize * 0.7, y + this.cellSize * 0.1, 
                         this.cellSize * 0.2, this.cellSize * 0.8);
        
        this.ctx.fillStyle = '#2ecc71';
        this.ctx.fillRect(x + this.cellSize * 0.1, y + this.cellSize * 0.1, 
                         this.cellSize * 0.6, this.cellSize * 0.4);
        
        // Flag pole
        this.ctx.strokeStyle = '#34495e';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.moveTo(x + this.cellSize * 0.7, y + this.cellSize * 0.1);
        this.ctx.lineTo(x + this.cellSize * 0.7, y + this.cellSize * 0.9);
        this.ctx.stroke();
    }

    updateCharacterPosition() {
        // Calculate pixel position within the canvas
        const pixelX = this.player.x * this.cellSize + this.cellSize / 2 - 20;
        const pixelY = this.player.y * this.cellSize + this.cellSize / 2 - 20;
        
        this.characterSprite.style.left = pixelX + 'px';
        this.characterSprite.style.top = pixelY + 'px';
        
        // Update character rotation based on direction
        const rotations = ['0deg', '90deg', '180deg', '270deg'];
        this.characterSprite.style.transform = `rotate(${rotations[this.player.direction]})`;
    }

    movePlayer(dx, dy) {
        const newX = this.player.x + dx;
        const newY = this.player.y + dy;
        
        // Check bounds
        if (newX < 0 || newX >= this.maze[0].length || 
            newY < 0 || newY >= this.maze.length) {
            return false;
        }
        
        // Check walls
        if (this.maze[newY][newX] === 0) {
            return false;
        }
        
        // Check doors
        const door = this.gameObjects.doors.find(d => d.x === newX && d.y === newY && !d.opened);
        if (door) {
            if (this.collectedItems.keys > 0) {
                door.opened = true;
                this.collectedItems.keys--;
                this.showMessage('Door unlocked!', 'success');
            } else {
                this.showMessage('You need a key to open this door!', 'error');
                return false;
            }
        }
        
        // Check enemies
        const enemy = this.gameObjects.enemies.find(e => e.x === newX && e.y === newY);
        if (enemy) {
            this.showMessage('Oh no! You hit an enemy!', 'error');
            this.restartLevel();
            return false;
        }
        
        // Move player
        this.player.x = newX;
        this.player.y = newY;
        
        // Check for collectibles
        this.checkCollectibles();
        
        // Check win condition
        if (this.player.x === this.goal.x && this.player.y === this.goal.y) {
            this.levelComplete();
        }
        
        this.updateCharacterPosition();
        this.render();
        return true;
    }

    checkCollectibles() {
        // Check treasures
        this.gameObjects.treasures.forEach(treasure => {
            if (!treasure.collected && treasure.x === this.player.x && treasure.y === this.player.y) {
                treasure.collected = true;
                this.collectedItems.treasures++;
                this.showMessage('Treasure collected! ✨', 'success');
                this.updateStarsDisplay();
            }
        });
        
        // Check keys
        this.gameObjects.keys.forEach(key => {
            if (!key.collected && key.x === this.player.x && key.y === this.player.y) {
                key.collected = true;
                this.collectedItems.keys++;
                this.showMessage('Key collected! 🗝️', 'success');
            }
        });
    }

    updateStarsDisplay() {
        const starsElement = document.getElementById('stars-collected');
        if (starsElement && window.app) {
            const totalStars = window.app.gameState.stars + this.collectedItems.treasures;
            starsElement.textContent = totalStars;
        }
    }

    turnPlayer(direction) {
        // direction: -1 for left, 1 for right
        this.player.direction = (this.player.direction + direction + 4) % 4;
        this.updateCharacterPosition();
    }

    moveForward() {
        const directions = [
            { x: 1, y: 0 },  // right
            { x: 0, y: 1 },  // down
            { x: -1, y: 0 }, // left
            { x: 0, y: -1 }  // up
        ];
        
        const dir = directions[this.player.direction];
        return this.movePlayer(dir.x, dir.y);
    }

    async runCode() {
        if (this.isRunning) return;
        
        if (!window.blockManager) {
            this.showMessage('No code blocks to execute!', 'error');
            return;
        }
        
        const commands = window.blockManager.getExecutionQueue();
        if (commands.length === 0) {
            this.showMessage('Add some code blocks first!', 'hint');
            return;
        }
        
        this.isRunning = true;
        this.startTime = Date.now();
        this.currentCommand = 0;
        
        // Add executing class to character
        this.characterSprite.classList.add('executing');
        
        try {
            await this.executeCommands(commands);
        } catch (error) {
            console.error('Execution error:', error);
            this.showMessage('Something went wrong during execution!', 'error');
        }
        
        this.isRunning = false;
        this.characterSprite.classList.remove('executing');
    }

    async executeCommands(commands) {
        for (let i = 0; i < commands.length; i++) {
            if (!this.isRunning) break;
            
            const command = commands[i];
            this.currentCommand = i;
            
            // Highlight current block
            this.highlightCurrentBlock(i);
            
            await this.executeCommand(command);
            await this.delay(this.executionSpeed);
        }
    }

    async executeCommand(command) {
        switch (command.type) {
            case 'forward':
                const moved = this.moveForward();
                if (!moved) {
                    this.showMessage('Can\'t move forward - there\'s a wall!', 'error');
                    throw new Error('Movement blocked');
                }
                break;
                
            case 'turn-left':
                this.turnPlayer(-1);
                break;
                
            case 'turn-right':
                this.turnPlayer(1);
                break;
                
            case 'repeat':
                const repeatCount = command.count || 3;
                const repeatCommands = command.commands || [];
                
                for (let i = 0; i < repeatCount; i++) {
                    if (!this.isRunning) break;
                    await this.executeCommands(repeatCommands);
                }
                break;
                
            case 'if-wall':
                if (this.isWallAhead()) {
                    await this.executeCommands(command.commands || []);
                }
                break;
                
            case 'if-treasure':
                if (this.isTreasureHere()) {
                    await this.executeCommands(command.commands || []);
                }
                break;
        }
    }

    isWallAhead() {
        const directions = [
            { x: 1, y: 0 },  // right
            { x: 0, y: 1 },  // down
            { x: -1, y: 0 }, // left
            { x: 0, y: -1 }  // up
        ];
        
        const dir = directions[this.player.direction];
        const checkX = this.player.x + dir.x;
        const checkY = this.player.y + dir.y;
        
        // Check bounds
        if (checkX < 0 || checkX >= this.maze[0].length || 
            checkY < 0 || checkY >= this.maze.length) {
            return true;
        }
        
        // Check wall
        return this.maze[checkY][checkX] === 0;
    }

    isTreasureHere() {
        return this.gameObjects.treasures.some(treasure => 
            !treasure.collected && 
            treasure.x === this.player.x && 
            treasure.y === this.player.y
        );
    }

    highlightCurrentBlock(index) {
        // Remove previous highlights
        document.querySelectorAll('.dropped-block.executing').forEach(block => {
            block.classList.remove('executing');
        });
        
        // Highlight current block
        const blocks = document.querySelectorAll('.dropped-block');
        if (blocks[index]) {
            blocks[index].classList.add('executing');
        }
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    levelComplete() {
        this.endTime = Date.now();
        const timeElapsed = this.endTime - this.startTime;
        const starsEarned = this.calculateStars();
        
        this.showMessage('Level Complete! 🎉', 'success');
        
        // Update game state
        if (window.app) {
            window.app.levelCompleted(this.currentLevel, starsEarned, timeElapsed);
        }
    }

    calculateStars() {
        let stars = 1; // Base star for completion
        
        // Bonus star for collecting all treasures
        const totalTreasures = this.gameObjects.treasures.length;
        if (this.collectedItems.treasures >= totalTreasures) {
            stars++;
        }
        
        // Bonus star for efficient solution (time-based)
        const timeElapsed = this.endTime - this.startTime;
        if (timeElapsed < 30000) { // Less than 30 seconds
            stars++;
        }
        
        return Math.min(stars, 3); // Max 3 stars
    }

    restartLevel() {
        this.isRunning = false;
        this.isPaused = false;
        this.loadLevel(this.currentLevel);
        this.showMessage('Level restarted!', 'info');
    }

    startLevel(levelNumber) {
        this.loadLevel(levelNumber);
    }

    pause() {
        this.isPaused = true;
    }

    resume() {
        this.isPaused = false;
    }

    showMessage(text, type = 'info') {
        const messagesContainer = document.getElementById('game-messages');
        if (!messagesContainer) return;
        
        const message = messagesContainer.querySelector(`.message.${type}`);
        if (message) {
            message.querySelector('.message-text').textContent = text;
            message.style.display = 'flex';
            
            setTimeout(() => {
                message.style.display = 'none';
            }, 3000);
        }
    }

    handleResize() {
        this.setupCanvas();
        this.render();
        this.updateCharacterPosition();
    }
}

// Global functions
function clearWorkspace() {
    if (window.blockManager) {
        window.blockManager.clearWorkspace();
    }
}

function runCode() {
    if (window.gameInstance) {
        window.gameInstance.runCode();
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MazeGame;
}
