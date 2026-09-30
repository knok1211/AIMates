/* ==========================================
   Main Game Loop, Input Controller & Stage Logic
   ========================================== */

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.renderer = new GameRenderer(this.canvas);

        this.currentStage = 1;
        this.isCoopMode = false;
        this.activeCharIndex = 0; // 0: Gawon, 1: Hamdori, 2: Lulu

        this.players = [
            new Player('gawon', 80, 500),
            new Player('hamdori', 140, 500),
            new Player('lulu', 200, 500)
        ];

        this.inventory = {
            seed: 0,
            cable: 0,
            battery: 0,
            ampoule: 0
        };

        this.enemies = [];
        this.collectibles = [];
        this.map = null;

        this.cameraX = 0;
        this.keys = {};
        this.coopKeys = { p1: {}, p2: {}, p3: {} };

        this.gameTime = 0;
        this.isPaused = false;
        this.isEnding = false;

        this.initDOMListeners();
        this.initInputListeners();
        this.loadStage(1);
    }

    initDOMListeners() {
        // UI Buttons
        document.getElementById('btnStartGame').addEventListener('click', () => {
            document.getElementById('storyOverlay').classList.remove('active');
            audio.startBGM(false);
        });

        document.getElementById('btnMode').addEventListener('click', () => {
            this.isCoopMode = !this.isCoopMode;
            document.getElementById('modeText').textContent = this.isCoopMode ? '3인 협동 (Co-op)' : '싱글 스위칭 (1P)';
            audio.playSwitch();
        });

        document.getElementById('btnHelp').addEventListener('click', () => {
            document.getElementById('helpModal').classList.remove('hidden');
        });

        document.getElementById('btnCloseHelp').addEventListener('click', () => {
            document.getElementById('helpModal').classList.add('hidden');
        });

        document.getElementById('btnAudio').addEventListener('click', () => {
            const enabled = audio.toggleSound();
            document.getElementById('btnAudio').textContent = enabled ? '🔊' : '🔇';
        });

        document.getElementById('btnRestart').addEventListener('click', () => {
            this.loadStage(this.currentStage);
        });

        document.getElementById('btnNextStage').addEventListener('click', () => {
            document.getElementById('modalOverlay').classList.add('hidden');
            if (this.currentStage < 3) {
                this.loadStage(this.currentStage + 1);
            } else {
                this.showDjEnding();
            }
        });

        // DJ Party Buttons
        document.getElementById('btnDjEffect1').addEventListener('click', () => audio.playBeatDrop());
        document.getElementById('btnDjEffect2').addEventListener('click', () => audio.playMirrorball());
        document.getElementById('btnDjEffect3').addEventListener('click', () => audio.playLaserBloom());
        document.getElementById('btnReplay').addEventListener('click', () => {
            document.getElementById('djOverlay').classList.add('hidden');
            this.loadStage(1);
            audio.startBGM(false);
        });

        // Character Selector Cards
        document.querySelectorAll('.char-card').forEach((card, index) => {
            card.addEventListener('click', () => {
                this.switchCharacter(index);
            });
        });
    }

    initInputListeners() {
        window.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;

            // Character Switching (1, 2, 3)
            if (e.code === 'Digit1') this.switchCharacter(0);
            if (e.code === 'Digit2') this.switchCharacter(1);
            if (e.code === 'Digit3') this.switchCharacter(2);

            // Skill Activation (E)
            if (e.code === 'KeyE' && !this.isCoopMode) {
                const activePlayer = this.players[this.activeCharIndex];
                activePlayer.useSkill(this.enemies, this.map, this.renderer.particleSystem);
            }

            // Interaction / Item Use (R / F)
            if (e.code === 'KeyR' || (e.code === 'KeyF' && !this.isCoopMode)) {
                const activeP = this.players[this.activeCharIndex];
                
                // Check near security gate (tile 4)
                for (let r = 0; r < this.map.rows; r++) {
                    for (let c = 0; c < this.map.cols; c++) {
                        if (this.map.tiles[r][c] === 4) {
                            const gx = c * this.map.tileSize;
                            const gy = r * this.map.tileSize;
                            if (Math.hypot(activeP.x - gx, activeP.y - gy) < 100) {
                                if (this.inventory.cable > 0 || this.inventory.ampoule > 0) {
                                    this.map.tiles[r][c] = 0; // Open Security Gate!
                                    audio.playPickup();
                                    this.renderer.particleSystem.spawnFlowerPetals(gx, gy, 60);
                                }
                            }
                        }
                    }
                }

                // Check near Boss Main Console in Stage 3
                if (this.currentStage === 3) {
                    const bossConsoleX = 42 * 40;
                    if (Math.hypot(activeP.x - bossConsoleX, activeP.y - 360) < 120) {
                        if (this.inventory.battery > 0 || this.inventory.cable > 0) {
                            // Purify final core reactor!
                            this.map.purifyRadius(bossConsoleX, 360, 500);
                            audio.playVictory();
                            setTimeout(() => this.showDjEnding(), 1000);
                        }
                    }
                }
            }

            // Co-op Specific Keys
            if (this.isCoopMode) {
                if (e.code === 'KeyF') this.players[0].useSkill(this.enemies, this.map, this.renderer.particleSystem);
                if (e.code === 'KeyL') this.players[1].useSkill(this.enemies, this.map, this.renderer.particleSystem);
                if (e.code === 'KeyK') this.players[2].useSkill(this.enemies, this.map, this.renderer.particleSystem);
            }
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
    }

    switchCharacter(index) {
        if (this.activeCharIndex === index) return;
        this.activeCharIndex = index;
        audio.playSwitch();

        document.querySelectorAll('.char-card').forEach((card, idx) => {
            if (idx === index) {
                card.classList.add('active');
            } else {
                card.classList.remove('active');
            }
        });
    }

    loadStage(stageNum) {
        this.currentStage = stageNum;
        this.map = new GameMap(stageNum);
        this.collectibles = [];
        this.enemies = [];

        // Reset player positions
        this.players[0].x = 80; this.players[0].y = 500;
        this.players[1].x = 140; this.players[1].y = 500;
        this.players[2].x = 200; this.players[2].y = 500;

        // Stage Collectibles & Enemies Setup
        if (stageNum === 1) {
            this.collectibles.push(new Collectible(1, 'seed', 380, 480, '은방울 씨앗'));
            this.collectibles.push(new Collectible(2, 'cable', 920, 320, '노트북 케이블'));
            this.enemies.push(new Enemy(600, 584, 500, 850));
        } 
        else if (stageNum === 2) {
            // High Vent Tower requiring Hamdori
            this.collectibles.push(new Collectible(3, 'battery', 680, 140, '정화 배터리'));
            this.collectibles.push(new Collectible(4, 'ampoule', 1100, 420, '은방울 앰플'));
            this.enemies.push(new Enemy(400, 584, 300, 750));
            this.enemies.push(new Enemy(1000, 584, 900, 1200));
        } 
        else if (stageNum === 3) {
            this.enemies.push(new Enemy(500, 584, 400, 750));
            this.enemies.push(new Enemy(1100, 584, 950, 1300));
            // Boss Factory Manager
            this.enemies.push(new Enemy(1600, 584, 1500, 1750, true));
        }

        // Show Story Dialog
        this.showStoryModal(stageNum);
    }

    showStoryModal(stage) {
        const overlay = document.getElementById('storyOverlay');
        const tag = document.getElementById('storyChapterTag');
        const title = document.getElementById('storyTitle');
        const text = document.getElementById('storyText');

        if (stage === 1) {
            tag.textContent = '[기] 도입부';
            title.textContent = '잿빛 지구로의 불시착';
            text.textContent = '서로 다른 세계에 살던 가원, 햄도리, 루루가 우연히 차원의 문을 넘어 오염된 잿빛 지구에 떨어졌습니다! 공장 외곽의 매연과 폐수를 돌파하세요!';
        } else if (stage === 2) {
            tag.textContent = '[승] 전개';
            title.textContent = '보안 통로와 높은 환기탑';
            text.textContent = '원래 세계로 돌아가려면 지구 정화가 필수입니다! 햄도리는 높은 환기탑을 타서 정화 배터리를 구하고, 가원과 루루는 보안 통로를 개방하세요!';
        } else if (stage === 3) {
            tag.textContent = '[전] 절정';
            title.textContent = '중앙 배출 제어실 & 메인 콘솔';
            text.textContent = '공장 최상층 제어실에 도착했습니다! 햄도리가 어그로를 끄는 동안 가원이 아이컨택으로 책임자를 조종하고, 루루가 꽃을 피워 핵심 장치를 정화하세요!';
        }

        overlay.classList.add('active');
        this.renderer.renderCutscene(document.getElementById('cutsceneCanvas'), stage);
    }

    showDjEnding() {
        this.isEnding = true;
        document.getElementById('djOverlay').classList.remove('hidden');
        audio.startBGM(true); // Upbeat DJ music
        audio.playVictory();
    }

    update(dt) {
        if (this.isEnding) return;

        this.gameTime += dt;

        // Player Controls Mapping
        const activeP = this.players[this.activeCharIndex];
        const inputKeys = {
            left: this.keys['ArrowLeft'] || this.keys['KeyA'],
            right: this.keys['ArrowRight'] || this.keys['KeyD'],
            up: this.keys['ArrowUp'] || this.keys['KeyW'],
            down: this.keys['ArrowDown'] || this.keys['KeyS'],
            jump: this.keys['Space'] || this.keys['ArrowUp'] || this.keys['KeyW']
        };

        // Update Players
        this.players.forEach((player, idx) => {
            const isActive = idx === this.activeCharIndex;
            player.update(dt, this.map, inputKeys, isActive);
        });

        // Camera follow active player
        this.cameraX = Math.max(0, Math.min(this.map.cols * this.map.tileSize - this.canvas.width, activeP.x - this.canvas.width / 2 + 100));

        // Update Enemies
        this.enemies.forEach(enemy => enemy.update(dt));

        // Item Collection Detection
        this.collectibles.forEach(item => {
            if (!item.collected) {
                this.players.forEach(p => {
                    if (Math.hypot(p.x - item.x, p.y - item.y) < 40) {
                        item.collected = true;
                        this.inventory[item.type]++;
                        document.getElementById(`count-${item.type}`).textContent = this.inventory[item.type];
                        audio.playPickup();
                    }
                });
            }
        });

        // Stage Completion Criteria Check
        const purPercent = this.map.getPurificationPercentage();
        document.getElementById('purificationPercent').textContent = `${purPercent}%`;
        document.getElementById('purificationFill').style.width = `${purPercent}%`;

        // Check Goal
        if (activeP.x >= (this.map.cols - 3) * this.map.tileSize) {
            audio.playVictory();
            document.getElementById('modalOverlay').classList.remove('hidden');
        }

        // Update Cooldown Bars UI
        ['gawon', 'hamdori', 'lulu'].forEach((type, i) => {
            const p = this.players[i];
            const cdFill = document.getElementById(`cd-${type}`);
            if (cdFill) {
                const percent = p.cooldown > 0 ? (1 - p.cooldown / p.maxCooldown) * 100 : 100;
                cdFill.style.width = `${percent}%`;
            }
        });
    }

    loop() {
        const dt = 1 / 60;
        this.update(dt);

        if (this.isEnding) {
            this.renderer.renderDjStage(document.getElementById('djCanvas'), this.gameTime);
        } else {
            this.renderer.render(
                this.map,
                this.players,
                this.activeCharIndex,
                this.enemies,
                this.collectibles,
                this.cameraX,
                this.gameTime
            );
        }

        requestAnimationFrame(() => this.loop());
    }
}

// Start Game Engine when DOM loaded
window.addEventListener('DOMContentLoaded', () => {
    const game = new Game();
    game.loop();
});
