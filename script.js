const body = document.getElementById('bodyCuerpo');
const cameraPanel = document.getElementById('cameraPanel');
const cameraFade = document.getElementById('cameraFade');
const camSound = document.getElementById('camSound');
const bellSound = document.getElementById('bellSound');

let activeTimeouts = new Set();
let enemyLoopTimeout;
let gameLocked = false;

let gameOver = false;
let gameState = "playing"; 
// "playing" | "jumpscare" | "transition"

const cameraImg = [
  'source/img/oficina.jpg',
  'source/img/cam01.jpg',
  'source/img/cam02.jpg',
  'source/img/cam03.jpg',
  'source/img/cam04.jpg',
  'source/img/cam05.jpg',
  'source/img/cam06.jpg'
];

const lowPersonaImages = [
  'source/img/0000persona.png',
  'source/img/0100persona.png',
  'source/img/0200persona.png',
  'source/img/0300persona.png',
  'source/img/0400persona.png'
];
const highPersonaImages = [
  'source/img/9900persona.png'];
const cameraPeople = { 1: [], 5: [] };
let currentCameraIndex = 0;
let isNightTransitioning = false;
let isCameraFading = false;

const menuBody = document.getElementById('bodyMenu');
const menuFade = document.getElementById('menuFade');
const menuMusic = document.getElementById('menuMusic');

function forceBlackScreen() {
  if (!cameraFade) return;

  cameraFade.style.transition = 'none';
  cameraFade.style.opacity = '1';
  cameraFade.style.background = 'black';
  cameraFade.style.backgroundImage = 'none';
  cameraFade.style.pointerEvents = 'none'; // 🔥 NO BLOQUEA CLICKS
}

function showBlackTransition() {
  cameraFade.style.transition = 'none';
  cameraFade.style.opacity = '1';
  cameraFade.style.background = 'black';
  cameraFade.style.backgroundImage = 'none';
  cameraFade.style.pointerEvents = 'all';
  cameraFade.style.zIndex = '9999';
}

function safeTimeout(fn, time) {
  const id = setTimeout(() => {
    activeTimeouts.delete(id);
    if (!gameLocked) fn();
  }, time);

  activeTimeouts.add(id);
  return id;
}

function tryPlayMenuMusic() {
  if (!menuMusic) return;
  menuMusic.volume = 0.1;
  menuMusic.loop = true;
  menuMusic.play().catch(() => {
    // Autoplay puede estar bloqueado; el audio se intentará reproducir con interacción.
  });
}

if (menuMusic) {
  tryPlayMenuMusic();
  document.addEventListener('click', tryPlayMenuMusic, { once: true, passive: true });
}

function fadeMenuBackgroundRandom() {
  if (!menuBody || !menuFade) return;
  const randomIndex = Math.floor(Math.random() * cameraImg.length);
  menuFade.style.opacity = '1';

  setTimeout(() => {
    menuBody.style.backgroundImage = `url("${cameraImg[randomIndex]}")`;
    menuBody.style.backgroundSize = 'cover';
    menuBody.style.backgroundRepeat = 'no-repeat';
    menuBody.style.backgroundPosition = 'center center';
    menuFade.style.opacity = '0';
  }, 375);
}

if (menuBody && menuFade) {
  setInterval(fadeMenuBackgroundRandom, 5000);
}

function getPersonPositions(count) {
  if (count === 1) return ['50% 75%'];
  if (count === 2) return ['25% 78%', '75% 78%'];
  if (count === 3) return ['15% 78%', '50% 72%', '85% 78%'];
  return Array.from({ length: count }, (_, idx) => `${10 + idx * 22}% 78%`);
}

function setCameraView(index) {
  if (!body) return;

    
  const cameraImage = cameraImg[index];

  const enemiesHere = lowEnemies
    .filter(e => e.currentCam === index)
    .map(e => e.img);

  if (enemiesHere.length > 0) {

    const backgrounds = enemiesHere.map(img => `url("${img}")`).join(', ');
    const sizes = enemiesHere.map(() => '14% auto').join(', ') + ', cover';
    const positions = enemiesHere.map(() => {
      const x = Math.floor(Math.random() * 80) + 10; // 10% a 90%
      const y = Math.floor(Math.random() * 60) + 20; // 20% a 80%
      return `${x}% ${y}%`;
    }).join(', ') + ', center center';
    const repeats = enemiesHere.map(() => 'no-repeat').join(', ') + ', no-repeat';

    body.style.backgroundImage = `${backgrounds}, url("${cameraImage}")`;
    body.style.backgroundSize = sizes;
    body.style.backgroundPosition = positions;
    body.style.backgroundRepeat = repeats;

  } else {
    body.style.backgroundImage = `url("${cameraImage}")`;
    body.style.backgroundSize = 'cover';
    body.style.backgroundRepeat = 'no-repeat';
    body.style.backgroundPosition = 'center center';
  }
}

const lowEnemies = [];
const lowSpawnSchedule = [];

function setupNightSpawns() {
  lowEnemies.length = 0;
  lowSpawnSchedule.length = 0;

  const maxEnemies = night;
  const availableImgs = [...lowPersonaImages];

  let usedTimes = [];

  for (let i = 0; i < maxEnemies; i++) {

    const img = availableImgs.splice(Math.floor(Math.random() * availableImgs.length), 1)[0];

    let hour, minute;

    do {
      const possibleHours = [12, 1, 2];
      hour = possibleHours[Math.floor(Math.random() * possibleHours.length)];
      minute = Math.floor(Math.random() * 12) * 5;

      var valid = !usedTimes.some(t =>
        t.hour === hour && Math.abs(t.minute - minute) < 25 // 5 ticks = 25 min
      );

    } while (!valid);

    usedTimes.push({ hour, minute });

    lowSpawnSchedule.push({
      img,
      spawnHour: hour,
      spawnMinute: minute,
      spawned: false
    });
  }
  console.log("SPAWNS NOCHE " + night, JSON.stringify(lowSpawnSchedule, null, 2));
}

function updateLowSpawns() {
  for (let s of lowSpawnSchedule) {

    if (s.spawned) continue;

    if (
      currentHour === s.spawnHour &&
      currentMinute >= s.spawnMinute
    ) {

      lowEnemies.push({
        img: s.img,
        currentCam: 1, // SIEMPRE CAM 1
        phase: 1,
        alive: true,
        moveCooldown: 2,
        hasMoved: false
      });

      // 🔊 sonido (forzado)
      const spawnSound = new Audio('source/audio/lowSpawn.mp3');
      spawnSound.volume = 1;
      spawnSound.currentTime = 0;

      spawnSound.play().catch(() => {
        document.addEventListener('click', () => spawnSound.play(), { once: true });
      });

      s.spawned = true;
    }
  }
}

function spawnHighPersona() {
  const available = highPersonaImages.filter(img => !cameraPeople[5].includes(img));
  if (available.length === 0) return false;
  const chosen = available[Math.floor(Math.random() * available.length)];
  cameraPeople[5].push(chosen);
  return true;
}



function resetNightState() {
  cameraPeople[1] = [];
  cameraPeople[5] = [];
}



function fadeToCamera(index) {
  if (!cameraFade || !body || isNightTransitioning || isCameraFading) return;

  if (camSound) {
    camSound.currentTime = 0;
    camSound.play().catch(() => {
      // autoplay may be blocked until user interaction; ignore error
    });
  }

  isCameraFading = true;
  cameraFade.style.backgroundColor = 'black';
  cameraFade.style.backgroundImage = 'url("source/img/cambioCam.jpeg")';
  cameraFade.style.backgroundSize = 'cover';
  cameraFade.style.backgroundPosition = 'center center';
  cameraFade.style.backgroundRepeat = 'no-repeat';
  cameraFade.style.opacity = '1';
  cameraFade.style.pointerEvents = 'auto';

  setTimeout(() => {
    if (!isNightTransitioning) {
      setCameraView(index);
    }
    cameraFade.style.opacity = '0';
    cameraFade.style.pointerEvents = 'none';

    setTimeout(() => {
      cameraFade.style.backgroundImage = '';
      cameraFade.style.backgroundColor = '';
      isCameraFading = false;
    }, 400);
  }, 400);
}

if (body) {
  if (cameraPanel) {
    cameraPanel.querySelectorAll('.camButton').forEach(button => {
      button.addEventListener('click', () => {
        if (isNightTransitioning || currentHour === 6 || (currentHour === 5 && currentMinute >= 55)) return;
        const camIndex = Number(button.dataset.cam);
        currentCameraIndex = camIndex;
        fadeToCamera(camIndex);
      });
    });
  }

  setTimeout(() => {
    setCameraView(0);

    if (cameraPanel) {
      cameraPanel.style.display = 'flex';
    }

    setupNightSpawns();

    // Iniciar reloj después de la cinemática
    startReloj();
  }, 3000);
}

// Reloj y noches
let currentHour = 12;
let currentMinute = 0;
let night = 1;
let relojInterval;
const gameMinuteDurationSeconds = 1; // seconds per in-game 5 minutes
const minutesPerTick = 5;

function updateReloj() {
  const reloj = document.getElementById('reloj');
  if (reloj) {
    const minuteStr = String(currentMinute).padStart(2, '0');
    reloj.textContent = `${currentHour}:${minuteStr} AM`;
  }
}

function startReloj() {
  updateReloj();

  relojInterval = setInterval(() => {

    currentMinute += minutesPerTick;

    if (currentMinute >= 60) {
      currentMinute -= 60;
      currentHour++;
      if (currentHour > 12) currentHour = 1;
    }

    // 🔥 Antes de las 6 AM (apagar cámaras)
    if (currentHour === 5 && currentMinute === 55) {
      currentCameraIndex = 0;
      if (cameraPanel) cameraPanel.style.display = 'none';

      const reloj = document.getElementById('reloj');
      if (reloj) reloj.style.display = 'none';

      setCameraView(0);
    }

    // 💥 TRANSICIÓN DE NOCHE (ARREGLADA)
    if (currentHour === 6 && currentMinute === 0 && !isNightTransitioning) {

      clearInterval(relojInterval);
      isNightTransitioning = true;

      const transicion = document.getElementById('transicion');
      const reloj = document.getElementById('reloj');

      // 🔥 ocultar TODO lo jugable
      if (reloj) reloj.style.display = 'none';
      if (cameraPanel) cameraPanel.style.display = 'none';

      // 🔥 BLACK SCREEN REAL (ESTO ES LO CLAVE)
      forceBlackScreen();

      if (bellSound) {
        bellSound.currentTime = 0;
        bellSound.play().catch(() => {});
      }
      cameraFade.style.opacity = '1';
      
      // texto encima del negro
      if (transicion) {
        transicion.style.display = 'block';
        transicion.style.position = 'fixed';
        transicion.style.zIndex = '1000000';
        transicion.style.color = 'white';
        transicion.style.width = '100%';
        transicion.style.textAlign = 'center';
        transicion.style.top = '45%';

        transicion.textContent = '5 AM';
      }

      setTimeout(() => {

        // 👉 2. Mostrar 6 AM
        if (transicion) {
          transicion.textContent = '6 AM';
        }

        setTimeout(() => {

          // 👉 3. Mostrar NOCHE X
          const finalNight = night === 5;

          if (!finalNight) {
            night++;
            setupNightSpawns();

            if (transicion) {
              transicion.textContent = `NOCHE ${night}`;
            }

          } else {
            // 🎉 FINAL
            if (transicion) {
              transicion.textContent = '¡ENHORABUENA!';
            }
          }

          setTimeout(() => {

            // 👉 4. Volver al juego
            cameraFade.style.opacity = '0';
            if (transicion) transicion.style.display = 'none';

            resetNightState();

            if (finalNight) {

              setTimeout(() => {
                if (transicion) {
                  transicion.style.display = 'block';
                  transicion.textContent = '¡ENHORABUENA!';
                }
              }, 2000);

              setTimeout(() => {
                window.location.href = 'index.html';
              }, 6000);

              return;
            }

            isNightTransitioning = false;

            // Reiniciar juego
            setCameraView(0);
            currentHour = 12;
            currentMinute = 0;
            updateReloj();

            if (reloj) reloj.style.display = 'block';
            if (cameraPanel) cameraPanel.style.display = 'flex';

            startReloj();

          }, 3000);

        }, 3000);

      }, 4000);

    } else {
      // Juego normal
      updateLowSpawns();
      updateLowPhases(currentHour);
      updateReloj();
    }

  }, gameMinuteDurationSeconds * 1000);
}


const forbiddenCams = [5];

function enemyLoop() {
  if (gameState !== "playing") return;

  moveLowEnemies();
  checkLowAttacks();

  //setTimeout(enemyLoop, (2 + Math.floor(Math.random() * 3)) * 1000);
  enemyLoopTimeout = safeTimeout(enemyLoop, (2 + Math.floor(Math.random() * 3)) * 1000);
}
enemyLoop();

function spawnLowPersona() {
  const available = lowPersonaImages.filter(img =>
    !lowEnemies.some(e => e.img === img)
  );

  if (available.length === 0) return false;

  const chosen = available[Math.floor(Math.random() * available.length)];

  lowEnemies.push({
    img: chosen,
    currentCam: 1,
    phase: 1,
    alive: true,
    moveCooldown: 2 // 👈 ticks de espera
  });

  const spawnSound = new Audio('source/audio/lowSpawn.mp3');
  spawnSound.volume = 1;
  spawnSound.play().catch(() => {});

  return true;
}

function updateLowPhases(hour) {
  lowEnemies.forEach(enemy => {
    if (hour === 1) enemy.phase = 1;
    if (hour === 2) enemy.phase = 2;
    if (hour >= 3) enemy.phase = 3;
  });
}

function moveLowEnemies() {

  if (gameLocked) return;
  if (gameState !== "playing") return;

  lowEnemies.forEach(enemy => {
    if (!enemy.alive) return;

    // ⏱️ SOLO MOVER CADA 2 TICKS
    enemy.tickCounter = (enemy.tickCounter || 0) + 1;
    if (enemy.tickCounter < 2) return;
    enemy.tickCounter = 0;

    let nextCam;

    // =========================
    // 🔥 CASO ESPECIAL: CAM 3
    // =========================
    if (enemy.currentCam === 3) {

      const roll = Math.random();

      if (roll < 0.4) {
        nextCam = 0; // 💀 jumpscare
      } else {
        const options = [2, 4, 6]; // otras cámaras válidas
        nextCam = options[Math.floor(Math.random() * options.length)];
      }

    } else {

      // =========================
      // 🧠 MOVIMIENTO NORMAL
      // =========================

      let possibleCams = [2, 3, 4, 6];

      // ❌ nunca volver a 1
      possibleCams = possibleCams.filter(c => c !== 1);

      // 🎯 tendencia hacia cam 3
      const weighted = [];

      for (let cam of possibleCams) {
        if (cam === 3) {
          weighted.push(cam, cam, cam); // más probabilidad
        } else {
          weighted.push(cam);
        }
      }

      nextCam = weighted[Math.floor(Math.random() * weighted.length)];
    }

    // =========================
    // 👁️ CAMBIO DE CÁMARA EFECTO
    // =========================

    enemy.currentCam = nextCam;

    // 🔥 si muere → jumpscare
    if (enemy.currentCam === 0) {
      activarJumpscare(enemy);
      return;
    }

    // 📺 EFECTO CAMBIO CAMARA (1 segundo)
    if (cameraFade) {
      cameraPanel.style.display = 'none';

      cameraFade.style.transition = 'none';
      cameraFade.style.opacity = '1';
      cameraFade.style.backgroundImage = 'url("source/img/cambioCam.jpeg")';
      cameraFade.style.backgroundSize = 'cover';
      cameraFade.style.backgroundPosition = 'center';
      cameraFade.style.pointerEvents = 'none';

      safeTimeout(() => {
        if (gameLocked) return;

        cameraFade.style.opacity = '0';

        if (cameraPanel) {
          cameraPanel.style.display = 'flex';
        }

        setCameraView(currentCameraIndex);

      }, 1000);
          }
        });

  // refrescar vista
  setCameraView(currentCameraIndex);
}

function checkLowAttacks() {
  lowEnemies.forEach(enemy => {
    if (enemy.currentCam === 0) {
      activarJumpscare(enemy);
    }
  });
}

function activarJumpscare(enemy) {

  if (gameState !== "playing") return;
  gameState = "jumpscare";

  // ❌ parar reloj
  clearInterval(relojInterval);

  // ❌ bloquear UI
  if (cameraPanel) cameraPanel.style.display = 'none';
  const reloj = document.getElementById('reloj');
  if (reloj) reloj.style.display = 'none';

  // ❌ parar transiciones visuales
  cameraFade.style.transition = 'none';
  cameraFade.style.pointerEvents = 'none';

  const officeBg = cameraImg[0]; // oficina

  // =========================
  // 💥 FONDO + ENEMIGO CENTRADO
  // =========================
  cameraFade.style.opacity = '1';
  cameraFade.style.backgroundImage = `
    url("${officeBg}")
  `;
  cameraFade.style.backgroundSize = 'cover';
  cameraFade.style.backgroundPosition = 'center';
  cameraFade.style.backgroundRepeat = 'no-repeat';

  // 🧍 CREAR OVERLAY DEL ENEMIGO (GRANDE Y CENTRADO)
  const img = document.createElement("img");
  img.src = enemy.img;

  img.style.position = "fixed";
  img.style.left = "50%";
  img.style.top = "50%";
  img.style.transform = "translate(-50%, -50%) scale(1.4)";
  img.style.maxWidth = "60vw";
  img.style.maxHeight = "90vh";
  img.style.zIndex = "1000000";
  img.style.pointerEvents = "none";

  document.body.appendChild(img);

  // 🔊 SONIDO FORZADO (sin depender de autoplay fallback)
  try {
    const scream = new Audio('source/audio/jumpscare.mp3');
    scream.volume = 1;
    scream.currentTime = 0;

    const playPromise = scream.play();

    if (playPromise !== undefined) {
      playPromise.catch(() => {
        // fallback brutal: reintentar en interacción
        document.addEventListener('click', () => {
          scream.play();
        }, { once: true });
      });
    }
  } catch (e) {
    console.log("Error sonido jumpscare:", e);
  }

  cameraFade.style.zIndex = '999999';

  // 💀 FIN PARTIDA
  setTimeout(() => {

    gameState = "dead";
    window.location.href = 'index.html';

  }, 2500);
}