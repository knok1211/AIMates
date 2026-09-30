/* ==========================================
   Game Entities: Players, Enemies, Items & Map
   ========================================== */

// Player Character Class
class Player {
    constructor(type, x, y) {
        this.type = type; // 'gawon', 'hamdori', 'lulu'
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.width = 36;
        this.height = 54;
        
        this.isGrounded = false;
        this.isWallHanging = false;
        this.facingRight = true;
        this.speed = 4.2;
        this.jumpForce = 11.5;
        
        // Skill Cooldowns (ms)
        this.cooldown = 0;
        this.maxCooldown = type === 'gawon' ? 60000 : (type === 'lulu' ? 4000 : 5000);
        this.skillActiveTimer = 0;

        // Custom States
        this.spacingOutTimer = 0;
        this.isSpinning = false;
        this.eyeContactLaser = null;
    }

    update(dt, map, keys, isCurrentActive) {
        // Cooldown timer decay
        if (this.cooldown > 0) {
            this.cooldown = Math.max(0, this.cooldown - dt * 1000);
        }
        if (this.skillActiveTimer > 0) {
            this.skillActiveTimer = Math.max(0, this.skillActiveTimer - dt * 1000);
        }

        // Apply physics if grounded or falling
        const gravity = 0.5;

        // Hamdori Wall Climb handling
        let onWallLeft = false;
        let onWallRight = false;

        if (this.type === 'hamdori') {
            onWallLeft = map.checkWallCollision(this.x - 4, this.y, this.width, this.height);
            onWallRight = map.checkWallCollision(this.x + 4, this.y, this.width, this.height);
        }

        if (this.type === 'hamdori' && (onWallLeft || onWallRight) && !this.isGrounded && keys.up) {
            this.isWallHanging = true;
            this.vy = -3.0; // Climb up wall!
        } else if (this.type === 'hamdori' && (onWallLeft || onWallRight) && !this.isGrounded && keys.down) {
            this.isWallHanging = true;
            this.vy = 2.0; // Slide down wall slowly
        } else if (this.type === 'hamdori' && (onWallLeft || onWallRight) && !this.isGrounded) {
            this.isWallHanging = true;
            this.vy = 0.8; // Slow wall slide
        } else {
            this.isWallHanging = false;
            this.vy += gravity;
        }

        // Horizontal Movement
        if (isCurrentActive) {
            if (keys.left) {
                this.vx = -this.speed;
                this.facingRight = false;
                this.spacingOutTimer = 0;
            } else if (keys.right) {
                this.vx = this.speed;
                this.facingRight = true;
                this.spacingOutTimer = 0;
            } else {
                this.vx *= 0.8;
                if (this.type === 'hamdori' && Math.abs(this.vx) < 0.1 && this.isGrounded) {
                    this.spacingOutTimer += dt;
                }
            }

            // Jump
            if (keys.jump && (this.isGrounded || this.isWallHanging)) {
                this.vy = -this.jumpForce;
                this.isGrounded = false;
                if (this.isWallHanging) {
                    this.vx = onWallLeft ? 5 : -5;
                }
                audio.playJump();
            }
        } else {
            // Idle physics when non-active
            this.vx *= 0.8;
        }

        // Map Collisions (X)
        this.x += this.vx;
        map.resolveXCollision(this);

        // Map Collisions (Y)
        this.y += this.vy;
        map.resolveYCollision(this);
    }

    // Cast Skill
    useSkill(enemies, map, particleSystem) {
        if (this.cooldown > 0) return false;

        if (this.type === 'gawon') {
            // Eye Contact Skill: Stun all guards in line of sight for 10 seconds
            audio.playEyeContact();
            this.cooldown = 12000; // 12 seconds cooldown
            this.skillActiveTimer = 2000; // Visual laser beam for 2s

            const eyeRange = 500;
            const targetX = this.facingRight ? this.x + eyeRange : this.x - eyeRange;
            this.eyeContactLaser = { startX: this.x + 18, startY: this.y + 16, endX: targetX };

            enemies.forEach(enemy => {
                const inRange = this.facingRight ? (enemy.x > this.x && enemy.x < targetX) : (enemy.x < this.x && enemy.x > targetX);
                const sameHeight = Math.abs(enemy.y - this.y) < 120;
                if (inRange && sameHeight) {
                    enemy.stun(10.0); // Stun for 10s
                    particleSystem.spawnStunRings(enemy.x + enemy.width / 2, enemy.y);
                }
            });
            return true;
        } 
        else if (this.type === 'hamdori') {
            // Taunt / Aggro Lure Skill: Lure all guards to look at Hamdori
            audio.playTaunt();
            this.cooldown = 5000;
            this.skillActiveTimer = 3000;

            enemies.forEach(enemy => {
                const dist = Math.hypot(enemy.x - this.x, enemy.y - this.y);
                if (dist < 450) {
                    enemy.lureTo(this.x);
                    particleSystem.spawnTauntEmotes(this.x + 18, this.y - 20);
                }
            });
            return true;
        }
        else if (this.type === 'lulu') {
            // Shalala Spin Skill: Purify 3m (180px) radius terrain & bloom flowers
            audio.playShalala();
            this.cooldown = 4000;
            this.skillActiveTimer = 1500;
            this.isSpinning = true;

            const radius = 180;
            map.purifyRadius(this.x + 18, this.y + 27, radius);
            particleSystem.spawnFlowerPetals(this.x + 18, this.y + 27, radius);
            return true;
        }
        return false;
    }
}

// Guard Enemy / Factory Manager Class
class Enemy {
    constructor(x, y, patrolMinX, patrolMaxX, isBoss = false) {
        this.x = x;
        this.y = y;
        this.width = 38;
        this.height = 56;
        this.patrolMinX = patrolMinX;
        this.patrolMaxX = patrolMaxX;
        this.vx = isBoss ? 1.0 : 1.8;
        this.facingRight = true;
        this.isBoss = isBoss;

        this.stunTimer = 0;
        this.lureTimer = 0;
        this.targetLureX = null;
    }

    stun(duration) {
        this.stunTimer = duration;
        this.vx = 0;
    }

    lureTo(targetX) {
        this.lureTimer = 6.0;
        this.targetLureX = targetX;
    }

    update(dt) {
        if (this.stunTimer > 0) {
            this.stunTimer -= dt;
            return;
        }

        if (this.lureTimer > 0 && this.targetLureX !== null) {
            this.lureTimer -= dt;
            const dir = this.targetLureX > this.x ? 1 : -1;
            this.x += dir * (this.isBoss ? 1.0 : 1.5);
            this.facingRight = dir > 0;
            return;
        }

        // Standard Patrol
        this.x += this.vx;
        if (this.x >= this.patrolMaxX) {
            this.x = this.patrolMaxX;
            this.vx = -Math.abs(this.vx);
            this.facingRight = false;
        } else if (this.x <= this.patrolMinX) {
            this.x = this.patrolMinX;
            this.vx = Math.abs(this.vx);
            this.facingRight = true;
        }
    }
}

// Collectible Item Class
class Collectible {
    constructor(id, type, x, y, label) {
        this.id = id;
        this.type = type; // 'seed', 'cable', 'battery', 'ampoule'
        this.x = x;
        this.y = y;
        this.width = 32;
        this.height = 32;
        this.label = label;
        this.collected = false;
        this.bobbleOffset = Math.random() * Math.PI * 2;
    }

    update(time) {
        this.bobbleY = Math.sin(time * 3 + this.bobbleOffset) * 6;
    }
}

// Map Tile & Obstacle Grid Engine
class GameMap {
    constructor(stageNum) {
        this.stageNum = stageNum;
        this.tileSize = 40;
        // Expanded map lengths for longer gameplay
        if (stageNum === 1) this.cols = 100;      // 4000px total map width
        else if (stageNum === 2) this.cols = 120; // 4800px total map width
        else this.cols = 140;                      // 5600px total map width
        
        this.rows = 18; // 720px map height
        
        this.tiles = Array(this.rows).fill(null).map(() => Array(this.cols).fill(0)); // 0: empty, 1: ground/wall, 2: toxic wastewater, 3: high vent tower, 4: security gate
        this.purifiedMask = Array(this.rows).fill(null).map(() => Array(this.cols).fill(false));

        this.smogVents = [];
        this.consoles = [];

        this.generateStageLayout(stageNum);
    }

    generateStageLayout(stage) {
        // Base ground floor
        for (let c = 0; c < this.cols; c++) {
            this.tiles[17][c] = 1;
            this.tiles[16][c] = 1;
        }

        if (stage === 1) {
            // Stage 1: Extended Factory Outskirts & Entrance (cols = 100)
            // Toxic wastewater puddles (unpurified poison hazards)
            for (let c = 10; c <= 15; c++) this.tiles[16][c] = 2;
            for (let c = 28; c <= 34; c++) this.tiles[16][c] = 2;
            for (let c = 48; c <= 55; c++) this.tiles[16][c] = 2;
            for (let c = 70; c <= 77; c++) this.tiles[16][c] = 2;
            for (let c = 88; c <= 93; c++) this.tiles[16][c] = 2;

            // Wall climb structures & platforms
            for (let r = 11; r <= 16; r++) this.tiles[r][22] = 3; // High Vent Wall for Hamdori
            for (let c = 23; c <= 27; c++) this.tiles[11][c] = 1; // Overhead platform

            // Security Gate 1
            for (let r = 13; r <= 16; r++) this.tiles[r][42] = 4;
            for (let c = 36; c <= 41; c++) this.tiles[13][c] = 1;

            // Middle high terrace
            for (let r = 9; r <= 16; r++) this.tiles[r][62] = 3;
            for (let c = 63; c <= 69; c++) this.tiles[9][c] = 1;

            // Final approach platforms
            for (let c = 79; c <= 86; c++) this.tiles[12][c] = 1;

            // Smog vents
            this.smogVents.push({ x: 12 * 40, y: 15 * 40, purified: false });
            this.smogVents.push({ x: 31 * 40, y: 15 * 40, purified: false });
            this.smogVents.push({ x: 51 * 40, y: 15 * 40, purified: false });
            this.smogVents.push({ x: 73 * 40, y: 15 * 40, purified: false });
            this.smogVents.push({ x: 90 * 40, y: 15 * 40, purified: false });
        } 
        else if (stage === 2) {
            // Stage 2: Extended Security Corridor & Ventilation Tower (cols = 120)
            // Toxic wastewater puddles
            for (let c = 12; c <= 17; c++) this.tiles[16][c] = 2;
            for (let c = 32; c <= 38; c++) this.tiles[16][c] = 2;
            for (let c = 55; c <= 62; c++) this.tiles[16][c] = 2;
            for (let c = 78; c <= 85; c++) this.tiles[16][c] = 2;
            for (let c = 100; c <= 108; c++) this.tiles[16][c] = 2;

            // Ventilation Tower 1
            for (let r = 4; r <= 16; r++) this.tiles[r][18] = 3; 
            for (let c = 18; c <= 25; c++) this.tiles[4][c] = 1; 

            // Security Gate 1
            for (let r = 13; r <= 16; r++) this.tiles[r][40] = 4; 
            for (let c = 26; c <= 33; c++) this.tiles[12][c] = 1;

            // Ventilation Tower 2
            for (let r = 4; r <= 16; r++) this.tiles[r][65] = 3;
            for (let c = 65; c <= 72; c++) this.tiles[4][c] = 1;

            // Security Gate 2
            for (let r = 13; r <= 16; r++) this.tiles[r][86] = 4;
            for (let c = 87; c <= 94; c++) this.tiles[12][c] = 1;

            this.smogVents.push({ x: 8 * 40, y: 15 * 40, purified: false });
            this.smogVents.push({ x: 26 * 40, y: 11 * 40, purified: false });
            this.smogVents.push({ x: 58 * 40, y: 15 * 40, purified: false });
            this.smogVents.push({ x: 80 * 40, y: 15 * 40, purified: false });
            this.smogVents.push({ x: 104 * 40, y: 15 * 40, purified: false });
        }
        else if (stage === 3) {
            // Stage 3: Extended Emission Control Room & Boss Arena (cols = 140)
            for (let c = 8; c <= 14; c++) this.tiles[12][c] = 1;
            for (let c = 22; c <= 30; c++) this.tiles[11][c] = 1;
            for (let c = 50; c <= 60; c++) this.tiles[10][c] = 1;
            for (let c = 82; c <= 92; c++) this.tiles[11][c] = 1;
            for (let c = 110; c <= 120; c++) this.tiles[10][c] = 1;

            // Toxic wastewater central pits
            for (let c = 15; c <= 21; c++) this.tiles[16][c] = 2;
            for (let c = 42; c <= 49; c++) this.tiles[16][c] = 2;
            for (let c = 72; c <= 80; c++) this.tiles[16][c] = 2;
            for (let c = 100; c <= 108; c++) this.tiles[16][c] = 2;
            for (let c = 122; c <= 128; c++) this.tiles[16][c] = 2;

            // Boss Main Console at end
            this.consoles.push({ x: 132 * 40, y: 9 * 40, active: false });

            this.smogVents.push({ x: 10 * 40, y: 11 * 40, purified: false });
            this.smogVents.push({ x: 25 * 40, y: 10 * 40, purified: false });
            this.smogVents.push({ x: 55 * 40, y: 9 * 40, purified: false });
            this.smogVents.push({ x: 85 * 40, y: 10 * 40, purified: false });
            this.smogVents.push({ x: 115 * 40, y: 9 * 40, purified: false });
        }
    }

    purifyRadius(px, py, radius) {
        const startC = Math.max(0, Math.floor((px - radius) / this.tileSize));
        const endC = Math.min(this.cols - 1, Math.floor((px + radius) / this.tileSize));
        const startR = Math.max(0, Math.floor((py - radius) / this.tileSize));
        const endR = Math.min(this.rows - 1, Math.floor((py + radius) / this.tileSize));

        for (let r = startR; r <= endR; r++) {
            for (let c = startC; c <= endC; c++) {
                const tx = c * this.tileSize + this.tileSize / 2;
                const ty = r * this.tileSize + this.tileSize / 2;
                if (Math.hypot(tx - px, ty - py) <= radius) {
                    this.purifiedMask[r][c] = true;
                    // Neutralize toxic wastewater into safe walk-able purified ground
                    if (this.tiles[r][c] === 2) {
                        this.tiles[r][c] = 1; 
                    }
                }
            }
        }

        // Purify smog vents in radius
        this.smogVents.forEach(vent => {
            if (Math.hypot(vent.x - px, vent.y - py) <= radius + 40) {
                vent.purified = true;
            }
        });
    }

    checkPoisonCollision(player) {
        const minC = Math.max(0, Math.floor(player.x / this.tileSize));
        const maxC = Math.min(this.cols - 1, Math.floor((player.x + player.width) / this.tileSize));
        const minR = Math.max(0, Math.floor(player.y / this.tileSize));
        const maxR = Math.min(this.rows - 1, Math.floor((player.y + player.height) / this.tileSize));

        for (let r = minR; r <= maxR; r++) {
            for (let c = minC; c <= maxC; c++) {
                // Check toxic wastewater tile (tile 2) that is UNPURIFIED
                if (this.tiles[r][c] === 2 && !this.purifiedMask[r][c]) {
                    const tileX = c * this.tileSize;
                    const tileY = r * this.tileSize + 12; // Liquid surface offset
                    const tileW = this.tileSize;
                    const tileH = this.tileSize - 12;

                    // AABB Bounding Box Intersection with 4px inner padding for fine collision feel
                    if (player.x + 4 < tileX + tileW &&
                        player.x + player.width - 4 > tileX &&
                        player.y + 4 < tileY + tileH &&
                        player.y + player.height > tileY) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    getPurificationPercentage() {
        let purifiedCount = 0;
        let totalTiles = this.cols * this.rows;
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                if (this.purifiedMask[r][c]) purifiedCount++;
            }
        }
        return Math.min(100, Math.round((purifiedCount / (totalTiles * 0.35)) * 100));
    }

    checkWallCollision(x, y, w, h) {
        const minC = Math.floor(x / this.tileSize);
        const maxC = Math.floor((x + w) / this.tileSize);
        const minR = Math.floor(y / this.tileSize);
        const maxR = Math.floor((y + h) / this.tileSize);

        for (let r = minR; r <= maxR; r++) {
            for (let c = minC; c <= maxC; c++) {
                if (r >= 0 && r < this.rows && c >= 0 && c < this.cols) {
                    const t = this.tiles[r][c];
                    if (t === 1 || t === 3 || t === 4) return true;
                }
            }
        }
        return false;
    }

    resolveXCollision(player) {
        const minC = Math.floor(player.x / this.tileSize);
        const maxC = Math.floor((player.x + player.width) / this.tileSize);
        const minR = Math.floor(player.y / this.tileSize);
        const maxR = Math.floor((player.y + player.height - 1) / this.tileSize);

        for (let r = minR; r <= maxR; r++) {
            for (let c = minC; c <= maxC; c++) {
                if (r >= 0 && r < this.rows && c >= 0 && c < this.cols) {
                    const t = this.tiles[r][c];
                    if (t === 1 || t === 3 || t === 4) {
                        if (player.vx > 0) {
                            player.x = c * this.tileSize - player.width;
                            player.vx = 0;
                        } else if (player.vx < 0) {
                            player.x = (c + 1) * this.tileSize;
                            player.vx = 0;
                        }
                    }
                }
            }
        }
    }

    resolveYCollision(player) {
        const minC = Math.floor((player.x + 4) / this.tileSize);
        const maxC = Math.floor((player.x + player.width - 4) / this.tileSize);
        const minR = Math.floor(player.y / this.tileSize);
        const maxR = Math.floor((player.y + player.height) / this.tileSize);

        player.isGrounded = false;

        for (let r = minR; r <= maxR; r++) {
            for (let c = minC; c <= maxC; c++) {
                if (r >= 0 && r < this.rows && c >= 0 && c < this.cols) {
                    const t = this.tiles[r][c];
                    if (t === 1 || t === 3 || t === 4) {
                        if (player.vy > 0) {
                            player.y = r * this.tileSize - player.height;
                            player.vy = 0;
                            player.isGrounded = true;
                        } else if (player.vy < 0) {
                            player.y = (r + 1) * this.tileSize;
                            player.vy = 0;
                        }
                    }
                }
            }
        }
    }
}
