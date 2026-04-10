const body = document.getElementById('bodyCuerpo');
const cameraPanel = document.getElementById('cameraPanel');
const cameraFade = document.getElementById('cameraFade');
const camSound = document.getElementById('camSound');
const bellSound = document.getElementById('bellSound');

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
  'source/img/0100persona.png'
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
    const positions = enemiesHere.map(() => 'center 80%').join(', ') + ', center center';
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

  const maxEnemies = Math.min(night, lowPersonaImages.length);

  const availableImgs = [...lowPersonaImages];

  for (let i = 0; i < maxEnemies; i++) {
    const img = availableImgs.splice(Math.floor(Math.random() * availableImgs.length), 1)[0];

    const spawnHour = 12 + Math.floor(Math.random() * 4); // 12 a 3 AM
    const spawnMinute = Math.floor(Math.random() * 60);

    lowSpawnSchedule.push({
      img,
      spawnHour,
      spawnMinute,
      spawned: false
    });
  }
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
        currentCam: 1,
        phase: 1,
        alive: true
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

      // Ocultar UI
      if (reloj) reloj.style.display = 'none';
      if (cameraPanel) cameraPanel.style.display = 'none';

      // Pantalla negra
      cameraFade.style.background = 'black';
      cameraFade.style.opacity = '1';

      if (bellSound) {
          bellSound.currentTime = 0;
          bellSound.play().catch(() => {});
        }

      // 👉 1. Mostrar 5 AM
      if (transicion) {
        transicion.style.display = 'block';
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
          }

          if (transicion) {
            transicion.textContent = `NOCHE ${night}`;
          }

          setTimeout(() => {

            // 👉 4. Volver al juego
            cameraFade.style.opacity = '0';
            if (transicion) transicion.style.display = 'none';

            resetNightState();

            if (finalNight) {
              window.location.href = 'index.html';
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

setInterval(() => {
  moveLowEnemies();
  checkLowAttacks();
}, 4000);

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
    alive: true
  });

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

  lowEnemies.forEach(enemy => {
    if (!enemy.alive) return;

    let possibleCams = [];

    // FASE 1
    if (enemy.phase === 1) {
      possibleCams = [1,2,3,4,6,0];
    }

    // FASE 2
    if (enemy.phase === 2) {
      possibleCams = [1,2,4,6,0];
    }

    // FASE 3
    if (enemy.phase === 3) {
      possibleCams = [2,3,4,6,0];
    }

    // 🚫 bloquear cam 5
    possibleCams = possibleCams.filter(cam => !forbiddenCams.includes(cam));

    // 🚪 regla: solo entra a cam 0 desde cam 3
    if (enemy.currentCam !== 3) {
      possibleCams = possibleCams.filter(cam => cam !== 0);
    }

    // 🎲 mover
    enemy.currentCam =
      possibleCams[Math.floor(Math.random() * possibleCams.length)];
  });

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

  clearInterval(relojInterval);

  if (cameraPanel) cameraPanel.style.display = 'none';
  const reloj = document.getElementById('reloj');
  if (reloj) reloj.style.display = 'none';

    const camera0Img = cameraImg[0]; // 👈 fondo cam 0

// 🔥 fondo cam 0 + enemigo encima
  cameraFade.style.opacity = '1';
  cameraFade.style.backgroundImage = `
    url("${camera0Img}"),
    url("${enemy.img}")
  `;

  cameraFade.style.backgroundSize = `
    cover,
    120%
  `;

  cameraFade.style.backgroundPosition = `
    center,
    center
  `;

  cameraFade.style.backgroundRepeat = `
    no-repeat,
    no-repeat
  `;

  cameraFade.style.transition = 'all 0.2s ease';

  const scream = new Audio('source/audio/jumpscare.mp3');
  scream.volume = 2;
  scream.play().catch(() => {});

  setTimeout(() => {
    window.location.href = 'index.html';
  }, 2500);
}