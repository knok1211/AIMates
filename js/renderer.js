/* ==========================================
   Canvas Visual Renderer & Particle Engine
   ========================================== */

class ParticleSystem {
    constructor() {
        this.particles = [];
    }

    spawnFlowerPetals(x, y, radius) {
        const count = 36;
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = Math.random() * radius;
            this.particles.push({
                x: x + Math.cos(angle) * (dist * 0.2),
                y: y + Math.sin(angle) * (dist * 0.2),
                vx: Math.cos(angle) * (2 + Math.random() * 4),
                vy: Math.sin(angle) * (2 + Math.random() * 4) - 1,
                size: 6 + Math.random() * 6,
                color: Math.random() > 0.3 ? '#ffffff' : '#a7f3d0',
                type: 'petal',
                life: 1.0,
                maxLife: 1.0
            });
        }
    }

    spawnStunRings(x, y) {
        for (let i = 0; i < 12; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 3,
                vy: -Math.random() * 3 - 1,
                size: 10 + Math.random() * 8,
                color: '#c084fc',
                type: 'ring',
                life: 1.0,
                maxLife: 1.0
            });
        }
    }

    spawnTauntEmotes(x, y) {
        this.particles.push({
            x: x,
            y: y,
            vx: 0,
            vy: -1.5,
            size: 20,
            text: '⚡',
            type: 'text',
            life: 1.2,
            maxLife: 1.2
        });
    }

    spawnSmog(x, y) {
        this.particles.push({
            x: x + (Math.random() - 0.5) * 20,
            y: y,
            vx: (Math.random() - 0.5) * 0.8,
            vy: -1.5 - Math.random() * 1.5,
            size: 16 + Math.random() * 16,
            color: 'rgba(75, 85, 99, 0.4)',
            type: 'smog',
            life: 1.0,
            maxLife: 1.0
        });
    }

    update(dt) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.life -= dt;
            p.x += p.vx;
            p.y += p.vy;
            if (p.type === 'smog') {
                p.size += 0.3;
            }
            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }

    draw(ctx, cameraX) {
        this.particles.forEach(p => {
            const alpha = p.life / p.maxLife;
            ctx.save();
            ctx.globalAlpha = alpha;

            if (p.type === 'petal') {
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(p.x - cameraX, p.y, p.size / 2, 0, Math.PI * 2);
                ctx.fill();
            } else if (p.type === 'ring') {
                ctx.strokeStyle = p.color;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(p.x - cameraX, p.y, (1 - alpha) * 24 + p.size, 0, Math.PI * 2);
                ctx.stroke();
            } else if (p.type === 'text') {
                ctx.font = '20px Outfit';
                ctx.fillText(p.text, p.x - cameraX, p.y);
            } else if (p.type === 'smog') {
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(p.x - cameraX, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
        });
    }
}

class GameRenderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.particleSystem = new ParticleSystem();

        // Load Character Image Assets
        this.images = {
            gawon: new Image(),
            hamdori: new Image(),
            lulu: new Image()
        };
        this.images.gawon.src = 'Assets/가원.png';
        this.images.hamdori.src = 'Assets/햄도리.png';
        this.images.lulu.src = 'Assets/루루.png';
    }

    render(map, players, activeIndex, enemies, collectibles, cameraX, time) {
        const ctx = this.ctx;
        const width = this.canvas.width;
        const height = this.canvas.height;

        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        // 1. Draw Background Sky (Transitioning from ash gray to blue as purification increases)
        const purPercent = map.getPurificationPercentage() / 100;
        const bgGrad = ctx.createLinearGradient(0, 0, 0, height);

        const r1 = Math.round(30 + (20 - 30) * purPercent);
        const g1 = Math.round(35 + (184 - 35) * purPercent);
        const b1 = Math.round(45 + (225 - 45) * purPercent);

        bgGrad.addColorStop(0, `rgb(${r1}, ${g1}, ${b1})`);
        bgGrad.addColorStop(1, purPercent > 0.5 ? '#1e293b' : '#0f172a');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, width, height);

        // Background Factory Silhouette
        ctx.fillStyle = `rgba(15, 23, 42, ${0.8 - purPercent * 0.4})`;
        const numSilhouettes = Math.ceil((map.cols * map.tileSize) / 320) + 2;
        for (let i = 0; i < numSilhouettes; i++) {
            const bx = i * 320 - (cameraX * 0.3) % 320;
            ctx.fillRect(bx, height - 380, 120, 380);
            // Smokestacks
            ctx.fillRect(bx + 40, height - 480, 40, 100);
        }

        // 2. Draw Map Tiles
        for (let r = 0; r < map.rows; r++) {
            for (let c = 0; c < map.cols; c++) {
                const tile = map.tiles[r][c];
                const isPurified = map.purifiedMask[r][c];
                const tx = c * map.tileSize - cameraX;
                const ty = r * map.tileSize;

                if (tx + map.tileSize < -50 || tx > width + 50) continue;

                if (tile === 1 || tile === 3) {
                    // Ground or Vent Tower Wall
                    if (isPurified) {
                        ctx.fillStyle = '#15803d'; // Rich green
                        ctx.fillRect(tx, ty, map.tileSize, map.tileSize);

                        // Draw white Lily of the Valley flower dots
                        ctx.fillStyle = '#ffffff';
                        ctx.beginPath();
                        ctx.arc(tx + 10, ty + 8, 3, 0, Math.PI * 2);
                        ctx.arc(tx + 28, ty + 12, 3, 0, Math.PI * 2);
                        ctx.fill();
                    } else {
                        ctx.fillStyle = tile === 3 ? '#334155' : '#475569'; // Ash gray metal
                        ctx.fillRect(tx, ty, map.tileSize, map.tileSize);
                        ctx.strokeStyle = '#1e293b';
                        ctx.strokeRect(tx, ty, map.tileSize, map.tileSize);
                    }
                } else if (tile === 2) {
                    // Toxic Wastewater Puddle (DANGER HAZARD)
                    if (isPurified) {
                        ctx.fillStyle = '#38bdf8';
                        ctx.fillRect(tx, ty + 12, map.tileSize, map.tileSize - 12);
                    } else {
                        // Poison Toxic Water Visuals
                        const toxicGrad = ctx.createLinearGradient(tx, ty + 12, tx, ty + map.tileSize);
                        toxicGrad.addColorStop(0, '#c026d3'); // Toxic Magenta
                        toxicGrad.addColorStop(1, '#581c87'); // Deep Poison Purple
                        ctx.fillStyle = toxicGrad;
                        ctx.fillRect(tx, ty + 12, map.tileSize, map.tileSize - 12);

                        // Glowing poison liquid top rim
                        ctx.fillStyle = '#f0abfc';
                        ctx.fillRect(tx, ty + 12, map.tileSize, 3);

                        // Animated Toxic bubbles & danger symbol
                        ctx.fillStyle = '#fae8ff';
                        const bubbleY = ty + 20 + Math.sin(time * 6 + c * 1.5) * 5;
                        ctx.beginPath();
                        ctx.arc(tx + 20, bubbleY, 4, 0, Math.PI * 2);
                        ctx.fill();

                        if (c % 3 === 0) {
                            ctx.font = '10px Outfit';
                            ctx.fillText('☠️', tx + 14, ty + 34);
                        }
                    }
                } else if (tile === 4) {
                    // Locked Security Gate
                    ctx.fillStyle = '#ef4444';
                    ctx.fillRect(tx + 12, ty, 16, map.tileSize);
                    ctx.fillStyle = '#fee2e2';
                    ctx.font = '12px Outfit';
                    ctx.fillText('🔒', tx + 10, ty + 24);
                }
            }
        }

        // 2b. Render Stage Finish Goal Banner / Flag at far right of map
        const goalX = (map.cols - 3) * map.tileSize - cameraX;
        const goalY = (map.rows - 5) * map.tileSize;
        ctx.save();
        ctx.fillStyle = '#22c55e';
        ctx.fillRect(goalX + 16, goalY, 8, 120); // Flag pole
        ctx.fillStyle = '#4ade80';
        ctx.beginPath();
        ctx.moveTo(goalX + 24, goalY + 10);
        ctx.lineTo(goalX + 70 + Math.sin(time * 4) * 5, goalY + 30);
        ctx.lineTo(goalX + 24, goalY + 50);
        ctx.closePath();
        ctx.fill();

        ctx.font = 'bold 14px Noto Sans KR';
        ctx.fillStyle = '#ffffff';
        ctx.fillText('GOAL 🚩', goalX + 2, goalY - 10);
        ctx.restore();

        // Smog Vents
        map.smogVents.forEach(vent => {
            const vx = vent.x - cameraX;
            ctx.fillStyle = vent.purified ? '#34d399' : '#64748b';
            ctx.fillRect(vx, vent.y, 40, 40);

            if (!vent.purified && Math.random() < 0.25) {
                this.particleSystem.spawnSmog(vent.x + 20, vent.y);
            }
        });

        // 3. Draw Collectibles
        collectibles.forEach(item => {
            if (item.collected) return;
            item.update(time);
            const ix = item.x - cameraX;
            const iy = item.y + item.bobbleY;

            ctx.save();
            ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
            ctx.beginPath();
            ctx.arc(ix + 16, iy + 16, 20, 0, Math.PI * 2);
            ctx.fill();

            ctx.font = '24px Outfit';
            let icon = '🎁';
            if (item.type === 'seed') icon = '🌱';
            if (item.type === 'cable') icon = '🔌';
            if (item.type === 'battery') icon = '🔋';
            if (item.type === 'ampoule') icon = '🧪';

            ctx.fillText(icon, ix + 4, iy + 24);
            ctx.restore();
        });

        // 4. Draw Enemies & Boss
        enemies.forEach(enemy => {
            const ex = enemy.x - cameraX;
            ctx.save();

            // Guard body
            ctx.fillStyle = enemy.isBoss ? '#dc2626' : '#1e3a8a';
            ctx.fillRect(ex, enemy.y, enemy.width, enemy.height);

            // Cap/Hat
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(ex - 4, enemy.y - 6, enemy.width + 8, 10);

            // Stunned indicator
            if (enemy.stunTimer > 0) {
                ctx.font = '22px Outfit';
                ctx.fillText('🌀', ex + 8, enemy.y - 12);
            } else {
                // Vision Cone Flashlight
                const coneLength = 160;
                const dir = enemy.facingRight ? 1 : -1;
                const grad = ctx.createRadialGradient(
                    ex + (enemy.facingRight ? enemy.width : 0), enemy.y + 20, 10,
                    ex + dir * coneLength, enemy.y + 20, coneLength
                );
                grad.addColorStop(0, 'rgba(254, 240, 138, 0.4)');
                grad.addColorStop(1, 'rgba(254, 240, 138, 0)');
                ctx.fillStyle = grad;

                ctx.beginPath();
                ctx.moveTo(ex + (enemy.facingRight ? enemy.width : 0), enemy.y + 20);
                ctx.lineTo(ex + dir * coneLength, enemy.y - 30);
                ctx.lineTo(ex + dir * coneLength, enemy.y + 70);
                ctx.closePath();
                ctx.fill();
            }
            ctx.restore();
        });

        // 5. Draw Players using Image Assets
        players.forEach((player, idx) => {
            const isActive = idx === activeIndex;
            const px = player.x - cameraX;
            ctx.save();

            // Highlight Ring for active player
            if (isActive) {
                ctx.strokeStyle = '#fde047';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(px + player.width / 2, player.y + player.height / 2, 34, 0, Math.PI * 2);
                ctx.stroke();
            }

            // Draw Character Image Asset with Facing Direction
            const img = this.images[player.type];
            const drawW = player.width + 16;
            const drawH = player.height + 20;

            if (!player.facingRight) {
                ctx.translate(px + player.width / 2, player.y + player.height / 2);
                ctx.scale(-1, 1);
                ctx.translate(-(px + player.width / 2), -(player.y + player.height / 2));
            }

            if (img && img.complete && img.naturalWidth > 0) {
                ctx.drawImage(img, px - 8, player.y - 18, drawW, drawH);
            } else {
                // Fallback fill
                ctx.fillStyle = player.type === 'gawon' ? '#a855f7' : (player.type === 'hamdori' ? '#f97316' : '#10b981');
                ctx.fillRect(px, player.y, player.width, player.height);
            }

            // Skill & Action Overlay Effects
            if (player.type === 'gawon' && player.skillActiveTimer > 0 && player.eyeContactLaser) {
                ctx.strokeStyle = '#c084fc';
                ctx.lineWidth = 4;
                ctx.beginPath();
                ctx.moveTo(px + 18, player.y + 14);
                ctx.lineTo(player.eyeContactLaser.endX - cameraX, player.y + 14);
                ctx.stroke();
            }

            if (player.type === 'hamdori') {
                if (player.isWallHanging) {
                    ctx.font = '16px Outfit';
                    ctx.fillText('🧗', px + 4, player.y - 4);
                }
                if (player.spacingOutTimer > 3.0) {
                    ctx.font = '14px Outfit';
                    ctx.fillText('💤 멍~', px - 8, player.y - 12);
                }
            }

            if (player.type === 'lulu' && player.isSpinning) {
                const spinOffset = Math.sin(time * 20) * 10;
                ctx.font = '18px Outfit';
                ctx.fillText('🌸', px + 22 + spinOffset, player.y + 16);
            }

            ctx.restore();
        });

        // 6. Draw Particles
        this.particleSystem.update(1 / 60);
        this.particleSystem.draw(ctx, cameraX);
    }

    // Render Cutscene Illustration Canvas
    renderCutscene(canvas, chapter) {
        const ctx = canvas.getContext('2d');
        const w = canvas.width;
        const h = canvas.height;
        ctx.clearRect(0, 0, w, h);

        const grad = ctx.createLinearGradient(0, 0, w, h);
        if (chapter === 1) {
            grad.addColorStop(0, '#1e293b');
            grad.addColorStop(1, '#475569');
        } else if (chapter === 2) {
            grad.addColorStop(0, '#0f172a');
            grad.addColorStop(1, '#0284c7');
        } else {
            grad.addColorStop(0, '#065f46');
            grad.addColorStop(1, '#10b981');
        }
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);

        // Story Illustration Icons & Character Assets
        if (chapter === 1) {
            ctx.font = '64px Outfit';
            ctx.textAlign = 'center';
            ctx.fillText('🌀 🪐 🌫️', w / 2, h / 2 - 20);
            ctx.font = '16px Noto Sans KR';
            ctx.fillStyle = '#cbd5e1';
            ctx.fillText('차원의 문 너머 잿빛 지구로...', w / 2, h / 2 + 55);
        } else if (chapter === 2) {
            const charW = 60;
            const charH = 75;
            if (this.images.gawon.complete) ctx.drawImage(this.images.gawon, w / 2 - 110, h / 2 - 50, charW, charH);
            if (this.images.hamdori.complete) ctx.drawImage(this.images.hamdori, w / 2 - 30, h / 2 - 50, charW, charH);
            if (this.images.lulu.complete) ctx.drawImage(this.images.lulu, w / 2 + 50, h / 2 - 50, charW, charH);

            ctx.font = '16px Noto Sans KR';
            ctx.fillStyle = '#e0f2fe';
            ctx.textAlign = 'center';
            ctx.fillText('세 친구의 협동 정화 개시!', w / 2, h / 2 + 55);
        } else {
            const charW = 70;
            const charH = 85;
            if (this.images.gawon.complete) ctx.drawImage(this.images.gawon, w / 2 - 120, h / 2 - 55, charW, charH);
            if (this.images.hamdori.complete) ctx.drawImage(this.images.hamdori, w / 2 - 35, h / 2 - 55, charW, charH);
            if (this.images.lulu.complete) ctx.drawImage(this.images.lulu, w / 2 + 50, h / 2 - 55, charW, charH);

            ctx.font = '16px Noto Sans KR';
            ctx.fillStyle = '#a7f3d0';
            ctx.textAlign = 'center';
            ctx.fillText('지구 정화 완료! 엔딩 축제!', w / 2, h / 2 + 55);
        }
    }

    // Render DJ Victory Stage Canvas
    renderDjStage(canvas, time) {
        const ctx = canvas.getContext('2d');
        const w = canvas.width;
        const h = canvas.height;
        ctx.clearRect(0, 0, w, h);

        // Disco gradient background
        const grad = ctx.createRadialGradient(w / 2, h / 2, 20, w / 2, h / 2, w / 2);
        grad.addColorStop(0, '#3b0764');
        grad.addColorStop(0.5, '#1e1b4b');
        grad.addColorStop(1, '#09090b');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);

        // Equalizer Bars
        const barCount = 24;
        const barWidth = w / barCount;
        for (let i = 0; i < barCount; i++) {
            const barHeight = Math.abs(Math.sin(time * 6 + i * 0.4)) * 140 + 20;
            const hue = (i * 15 + time * 100) % 360;
            ctx.fillStyle = `hsla(${hue}, 80%, 60%, 0.8)`;
            ctx.fillRect(i * barWidth + 4, h - barHeight, barWidth - 8, barHeight);
        }

        // Mirrorball
        ctx.fillStyle = '#f1f5f9';
        ctx.beginPath();
        ctx.arc(w / 2, 40, 24, 0, Math.PI * 2);
        ctx.fill();

        // Laser Light Beams
        ctx.strokeStyle = `rgba(52, 211, 153, 0.4)`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(w / 2, 40);
        ctx.lineTo(w / 2 + Math.sin(time * 3) * 250, h);
        ctx.moveTo(w / 2, 40);
        ctx.lineTo(w / 2 - Math.sin(time * 3) * 250, h);
        ctx.stroke();

        // DJ Gawon at Turntable
        if (this.images.gawon.complete) {
            ctx.drawImage(this.images.gawon, w / 2 - 40, h - 140, 80, 100);
        }
        ctx.font = '36px Outfit';
        ctx.textAlign = 'center';
        ctx.fillText('🎛️', w / 2, h - 20);

        // Dancing Hamdori & Lulu
        const hopY = Math.sin(time * 8) * 16;
        if (this.images.hamdori.complete) {
            ctx.drawImage(this.images.hamdori, w / 2 - 180, h - 120 + hopY, 70, 90);
        }
        if (this.images.lulu.complete) {
            ctx.drawImage(this.images.lulu, w / 2 + 110, h - 120 - hopY, 70, 90);
        }
    }
}
