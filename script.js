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

  const personImages = cameraPeople[index] || [];
  const cameraImage = cameraImg[index];

  if (personImages.length > 0) {
    const personBackgrounds = personImages.map(img => `url("${img}")`).join(', ');
    const personSizes = personImages.map(() => '14% auto').join(', ') + ', cover';
    const personPositions = getPersonPositions(personImages.length).join(', ') + ', center center';
    const personRepeats = personImages.map(() => 'no-repeat').join(', ') + ', no-repeat';

    body.style.backgroundImage = `${personBackgrounds}, url("${cameraImage}")`;
    body.style.backgroundSize = personSizes;
    body.style.backgroundPosition = personPositions;
    body.style.backgroundRepeat = personRepeats;
  } else {
    body.style.backgroundImage = `url("${cameraImage}")`;
    body.style.backgroundSize = 'cover';
    body.style.backgroundRepeat = 'no-repeat';
    body.style.backgroundPosition = 'center center';
  }
}

function spawnLowPersona() {
  const available = lowPersonaImages.filter(img => !cameraPeople[1].includes(img));
  if (available.length === 0) return false;
  const chosen = available[Math.floor(Math.random() * available.length)];
  cameraPeople[1].push(chosen);
  return true;
}

function spawnHighPersona() {
  const available = highPersonaImages.filter(img => !cameraPeople[5].includes(img));
  if (available.length === 0) return false;
  const chosen = available[Math.floor(Math.random() * available.length)];
  cameraPeople[5].push(chosen);
  return true;
}

function maybeSpawnPerson(hour) {
  let spawned = false;

  if (hour >= 1 && hour <= 5 && cameraPeople[1].length < night) {
    const chance = Math.min(0.4 + (night - 1) * 0.1, 1);
    if (Math.random() < chance) {
      spawned = spawnLowPersona();
    }
  }

  if (night >= 3 && hour >= 2 && hour <= 4 && cameraPeople[5].length === 0) {
    let chance = 0;
    if (night === 3) chance = 0.6;
    else if (night === 4) chance = 0.8;
    else if (night >= 5) chance = 1;
    if (Math.random() < chance) {
      spawned = spawnHighPersona() || spawned;
    }
  }

  if (spawned) {
    setCameraView(currentCameraIndex);
  }
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
const gameMinuteDurationSeconds = 0.1; // seconds per in-game 5 minutes
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
      maybeSpawnPerson(currentHour);
      updateReloj();
    }

  }, gameMinuteDurationSeconds * 1000);
}