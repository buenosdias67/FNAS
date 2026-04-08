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

function setCameraView(index) {
  if (!body) return;
  body.style.backgroundImage = `url("${cameraImg[index]}")`;
  body.style.backgroundSize = 'cover';
  body.style.backgroundRepeat = 'no-repeat';
  body.style.backgroundPosition = 'center center';
}

function fadeToCamera(index) {
  if (!cameraFade || !body) return;

  if (camSound) {
    camSound.currentTime = 0;
    camSound.play().catch(() => {
      // autoplay may be blocked until user interaction; ignore error
    });
  }

  cameraFade.style.opacity = '1';
  cameraFade.style.pointerEvents = 'auto';

  setTimeout(() => {
    setCameraView(index);
    cameraFade.style.opacity = '0';
    cameraFade.style.pointerEvents = 'none';
  }, 400);
}

if (body) {
  if (cameraPanel) {
    cameraPanel.querySelectorAll('.camButton').forEach(button => {
      button.addEventListener('click', () => {
        const camIndex = Number(button.dataset.cam);
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
let night = 1;
let relojInterval;

function updateReloj() {
  const reloj = document.getElementById('reloj');
  if (reloj) {
    reloj.textContent = `${currentHour} AM`;
  }
}

function startReloj() {
  updateReloj();
  relojInterval = setInterval(() => {
    currentHour++;
    if (currentHour > 12) currentHour = 1;
    if (currentHour === 6) {
      // Pausar reloj
      clearInterval(relojInterval);
      // Transición a la siguiente noche
      const transicion = document.getElementById('transicion');
      const reloj = document.getElementById('reloj');
      if (transicion && cameraFade) {
        // Ocultar reloj y panel de cámaras durante la transición
        if (reloj) reloj.style.display = 'none';
        if (cameraPanel) cameraPanel.style.display = 'none';
        cameraFade.style.opacity = '1';
        transicion.style.display = 'block';
        transicion.textContent = '5 AM';
        // Reproducir sonido de campana
        if (bellSound) {
          bellSound.currentTime = 0;
          bellSound.volume = 0.5;
          bellSound.play().catch(() => {});
        }

        setTimeout(() => {
          transicion.textContent = '6 AM';
          setTimeout(() => {
            night++;
            if (night > 5) night = 1;
            transicion.textContent = `NOCHE ${night}`;
            // Fade out después de 4 segundos
            setTimeout(() => {
              cameraFade.style.opacity = '0';
              transicion.style.display = 'none';
              // Reiniciar
              setCameraView(0);
              currentHour = 12;
              updateReloj();
              if (reloj) reloj.style.display = 'block';
              if (cameraPanel) cameraPanel.style.display = 'flex';
              // Reiniciar reloj
              startReloj();
            }, 4000);
          }, 3000);
        }, 3000);
      }
    } else {
      updateReloj();
    }
  }, 1000); // Cada minuto (3s para pruebas)
}