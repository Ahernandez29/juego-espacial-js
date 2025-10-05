/* game.js
   Contiene el login simple y toda la lógica del juego.
   Coloca el archivo con index.html y styles.css en la misma carpeta.
   Asegúrate de tener las carpetas:
     images/
     musics/
*/

/* ---------- Esperar DOM ---------- */
document.addEventListener('DOMContentLoaded', () => {
  // Elementos DOM
  const loginBtn = document.getElementById('loginBtn');
  const loginMsg = document.getElementById('loginMsg');
  const loginBox = document.getElementById('loginBox');
  const gameArea = document.getElementById('gameArea');
  const restartBtn = document.getElementById('restartBtn');
  const logoutBtn = document.getElementById('logoutBtn');

  // Credenciales por defecto (cliente-side, NO seguro)
  const DEFAULT_USER = 'argen';
  const DEFAULT_PASS = '1234';

  loginBtn.addEventListener('click', () => {
    const user = document.getElementById('user').value.trim();
    const pass = document.getElementById('pass').value.trim();

    if (user === DEFAULT_USER && pass === DEFAULT_PASS) {
      loginMsg.style.display = 'none';
      showGame();
    } else {
      loginMsg.style.display = 'block';
      loginMsg.textContent = 'Usuario o contraseña inválidos. (usa argen / 1234)';
    }
  });

  restartBtn.addEventListener('click', () => Game.restart());
  logoutBtn.addEventListener('click', () => Game.logout());

  function showGame() {
    loginBox.style.display = 'none';
    gameArea.style.display = 'flex';
    loginBox.setAttribute('aria-hidden','true');
    gameArea.setAttribute('aria-hidden','false');
    Game.init();
  }
});

/* ---------- Módulo del Juego ---------- */
const Game = (() => {
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');

  const assets = {
    background: 'images/background.png',
    player: 'images/astronave.png',
    enemy: 'images/nave-extraterrestre.png',
    bullet: 'images/bala.png',
    music: 'musics/MusicaFondo.mp3',
    sShot: 'musics/disparo.mp3',
    sHit: 'musics/Golpe.mp3'
  };

  let score = 0;
  let player = { x: 368, y: 520, w: 64, h: 64, speed: 4 };
  let keys = { left:false, right:false, space:false };
  let enemies = [];
  const enemyCount = 8;
  let bullets = [];
  let gameOver = false;

  const imgs = {};
  const sounds = {};

  const enemySpeedX = 2.5;
  const enemyDropY = 50;
  const collisionDistance = 27;

  function loadImage(src) {
    return new Promise((res, rej) => {
      const i = new Image();
      i.src = src;
      i.onload = () => res(i);
      i.onerror = () => rej(new Error('No se pudo cargar ' + src));
    });
  }
  function loadAudio(src, loop=false) {
    return new Promise((res, rej) => {
      const a = new Audio();
      a.src = src;
      a.loop = !!loop;
      a.preload = 'auto';
      a.oncanplaythrough = () => res(a);
      a.onerror = () => rej(new Error('No se pudo cargar audio ' + src));
    });
  }

  function resetEnemies() {
    enemies = [];
    for (let e = 0; e < enemyCount; e++) {
      enemies.push({
        x: Math.floor(Math.random() * 737),
        y: Math.floor(Math.random() * 151) + 20,
        vx: enemySpeedX,
        vyDrop: enemyDropY
      });
    }
  }

  function reset() {
    score = 0;
    bullets = [];
    player.x = 368;
    player.y = 520;
    gameOver = false;
    resetEnemies();
    updateScoreView();
    if (sounds.music && sounds.music.paused) {
      try { sounds.music.currentTime = 0; sounds.music.play(); } catch(e) {}
    }
  }

  function updateScoreView() {
    const el = document.getElementById('scoreView');
    if (el) el.textContent = score;
  }

  function collision(x1,y1,x2,y2) {
    const dist = Math.hypot(x1 - x2, y1 - y2);
    return dist < collisionDistance;
  }

  function addKeyListeners() {
    window.addEventListener('keydown', (e) => {
      if (e.code === 'ArrowLeft') keys.left = true;
      if (e.code === 'ArrowRight') keys.right = true;
      if (e.code === 'Space') keys.space = true;
    });
    window.addEventListener('keyup', (e) => {
      if (e.code === 'ArrowLeft') keys.left = false;
      if (e.code === 'ArrowRight') keys.right = false;
      if (e.code === 'Space') keys.space = false;
    });
  }

  function shoot() {
    bullets.push({
      x: player.x + (player.w/2) - 6,
      y: player.y,
      vy: -10
    });
    if (sounds.sShot) {
      try { sounds.sShot.currentTime = 0; sounds.sShot.play(); } catch(e) {}
    }
  }

  function update() {
    if (gameOver) return;

    if (keys.left) player.x -= player.speed;
    if (keys.right) player.x += player.speed;
    if (player.x < 0) player.x = 0;
    if (player.x > canvas.width - player.w) player.x = canvas.width - player.w;

    if (keys.space && canShoot()) {
      shoot();
      lastShotTime = Date.now();
    }

    for (let i = bullets.length - 1; i >= 0; i--) {
      bullets[i].y += bullets[i].vy;
      if (bullets[i].y < -20) bullets.splice(i,1);
    }

    for (let e = 0; e < enemies.length; e++) {
      if (!enemies[e]) continue;
      enemies[e].x += enemies[e].vx;

      if (enemies[e].x <= 0) {
        enemies[e].vx = Math.abs(enemies[e].vx);
        enemies[e].y += enemies[e].vyDrop;
      } else if (enemies[e].x >= canvas.width - 64) {
        enemies[e].vx = -Math.abs(enemies[e].vx);
        enemies[e].y += enemies[e].vyDrop;
      }

      if (enemies[e].y > 500) {
        gameOver = true;
        if (sounds.music) sounds.music.pause();
        break;
      }

      for (let b = bullets.length - 1; b >= 0; b--) {
        if (collision(enemies[e].x + 32, enemies[e].y + 32, bullets[b].x + 6, bullets[b].y + 6)) {
          if (sounds.sHit) { try { sounds.sHit.currentTime = 0; sounds.sHit.play(); } catch(e) {} }
          bullets.splice(b,1);
          score += 1;
          updateScoreView();
          enemies[e].x = Math.floor(Math.random() * 737);
          enemies[e].y = Math.floor(Math.random() * 151) + 20;
          enemies[e].vx = (Math.random() > 0.5 ? 1 : -1) * enemySpeedX;
          break;
        }
      }
    }
  }

  function draw() {
    ctx.clearRect(0,0,canvas.width,canvas.height);
    if (imgs.background) ctx.drawImage(imgs.background, 0, 0, canvas.width, canvas.height);

    if (imgs.player) ctx.drawImage(imgs.player, player.x, player.y, player.w, player.h);
    else { ctx.fillStyle = '#0f0'; ctx.fillRect(player.x, player.y, player.w, player.h); }

    enemies.forEach((en) => {
      if (!en) return;
      if (imgs.enemy) ctx.drawImage(imgs.enemy, en.x, en.y, 64, 64);
      else { ctx.fillStyle = '#f00'; ctx.fillRect(en.x, en.y, 64, 64); }
    });

    bullets.forEach(b => {
      if (imgs.bullet) ctx.drawImage(imgs.bullet, b.x, b.y, 12, 18);
      else { ctx.fillStyle = '#ff0'; ctx.fillRect(b.x, b.y, 4, 10); }
    });

    ctx.fillStyle = '#fff';
    ctx.font = '20px Arial';
    ctx.fillText('Score: ' + score, 10, 28);

    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 160, canvas.width, 160);
      ctx.fillStyle = '#fff';
      ctx.font = '48px Arial';
      ctx.fillText('GAME OVER', 220, 260);
      ctx.font = '20px Arial';
      ctx.fillText('Pulsa "Reiniciar" para jugar de nuevo', 250, 300);
    }
  }

  let rafId = null;
  function loop() {
    update();
    draw();
    rafId = requestAnimationFrame(loop);
  }

  let lastShotTime = 0;
  function canShoot() {
    const now = Date.now();
    if (now - lastShotTime > 200) return true;
    return false;
  }

  return {
    async init() {
      if (this._initialized) { reset(); return; }
      this._initialized = true;

      try {
        const imgsToLoad = [
          loadImage(assets.background).then(i=>imgs.background=i),
          loadImage(assets.player).then(i=>imgs.player=i),
          loadImage(assets.enemy).then(i=>imgs.enemy=i),
          loadImage(assets.bullet).then(i=>imgs.bullet=i)
        ];
        const audiosToLoad = [
          loadAudio(assets.music, true).then(a=>sounds.music=a),
          loadAudio(assets.sShot).then(a=>sounds.sShot=a),
          loadAudio(assets.sHit).then(a=>sounds.sHit=a)
        ];

        await Promise.all([...imgsToLoad, ...audiosToLoad]);
      } catch (err) {
        console.warn('Algunos recursos no cargaron:', err);
      }

      addKeyListeners();
      reset();
      loop();
    },
    stop() {
      if (rafId) cancelAnimationFrame(rafId);
      if (sounds.music) sounds.music.pause();
    },
    restart() {
      reset();
      if (!rafId) loop();
    },
    logout() {
      this.stop();
      if (sounds.music) { sounds.music.pause(); sounds.music.currentTime = 0; }
      const gameArea = document.getElementById('gameArea');
      const loginBox = document.getElementById('loginBox');
      if (gameArea && loginBox) {
        gameArea.style.display = 'none';
        loginBox.style.display = 'block';
        loginBox.setAttribute('aria-hidden','false');
        gameArea.setAttribute('aria-hidden','true');
      }
    }
  };
})();
