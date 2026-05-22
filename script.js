/* ========================= */
/* CAMARAS */
/* ========================= */

const cameras = [

    {
        name:"CAM00",
        image:"source/img/oficina.jpg"
    },
    {
        name:"CAM01",
        image:"source/img/cam01.jpg"
    },

    {
        name:"CAM02",
        image:"source/img/cam02.jpg"
    },

    {
        name:"CAM03",
        image:"source/img/cam03.jpg"
    },

    {
        name:"CAM04",
        image:"source/img/cam04.jpg"
    },

    {
        name:"CAM05",
        image:"source/img/cam05.jpg"
    },

    {
        name:"CAM06",
        image:"source/img/cam06.jpg"
    }

];

/* ========================= */
/* DETECTAR PAGINA */
/* ========================= */

const isMenu =
document.getElementById("bodyMenu");

const isGame =
document.getElementById("bodyCuerpo");

/* ====================================================== */
/* ======================= MENU ========================= */
/* ====================================================== */

if(isMenu){

    const background =
    document.getElementById("background");

    const music =
    document.getElementById("menuMusic");

    const boton =
    document.getElementById("botonMenu");

    let indice = 0;

    let ultimoTiempo = 0;

    let tiempoCambio = 0;

    let pausado = false;

    /* ========================= */
    /* GAME LOOP MENU */
    /* ========================= */

    function menuLoop(timestamp){

        if(pausado){

            requestAnimationFrame(menuLoop);
            return;
        }

        let deltaTime =
        timestamp - ultimoTiempo;

        ultimoTiempo = timestamp;

        tiempoCambio += deltaTime;

        if(tiempoCambio >= 3000){

            indice++;

            if(indice >= cameras.length){

                indice = 0;
            }

            background.style.opacity = 0;

            setTimeout(() => {

                background.src =
                cameras[indice].image;

                background.style.opacity = 0.35;

            }, 300);

            tiempoCambio = 0;
        }

        requestAnimationFrame(menuLoop);
    }

    requestAnimationFrame(menuLoop);

    /* ========================= */
    /* MUSICA */
    /* ========================= */

    window.addEventListener("click", () => {

        music.volume = 0.4;

        music.play();

    }, { once:true });

    /* ========================= */
    /* BOTON */
    /* ========================= */

    boton.addEventListener("click", () => {

        pausado = true;

        window.location.href =
        "juego.html";

    });
}

/* ====================================================== */
/* ======================= JUEGO ======================== */
/* ====================================================== */

if(isGame){

    /* ========================= */
    /* ELEMENTOS */
    /* ========================= */

    const cameraView =
    document.getElementById("cameraView");

    const camButtons =
    document.querySelectorAll(".camButton");

    const nightOverlay =
    document.getElementById("nightOverlay");

    /* ========================= */
    /* ESTADOS */
    /* ========================= */

    const GameState = {

        INTRO:"intro",
        PLAYING:"playing"

    };

    let currentState =
    GameState.INTRO;

    /* ========================= */
    /* VARIABLES */
    /* ========================= */

    let currentCamera = 0;

    let lastTime = 0;

    /* ========================= */
    /* CAMBIAR CAMARA */
    /* ========================= */

    function changeCamera(index){

        currentCamera = index;

        const camSound =
        document.getElementById("camSound");

        camSound.currentTime = 0;
        camSound.play();

        cameraView.style.opacity = 0;

        setTimeout(() => {

            cameraView.src =
            cameras[index].image;

            cameraView.style.opacity = 1;

        }, 100);

        camButtons.forEach(button => {

            button.classList.remove("active");

        });

        camButtons[index]
        .classList.add("active");
    }

    /* ========================= */
    /* BOTONES */
    /* ========================= */

    camButtons.forEach(button => {

        button.addEventListener("click", () => {

            const camIndex =
            parseInt(
                button.dataset.cam
            );

            changeCamera(camIndex);

        });

    });

    /* ========================= */
    /* INTRO */
    /* ========================= */

    setTimeout(() => {

        nightOverlay.style.opacity = 0;

        setTimeout(() => {

            nightOverlay.style.display =
            "none";

            currentState =
            GameState.PLAYING;

        }, 2000);

    }, 2500);

    /* ========================= */
    /* GAME LOOP */
    /* ========================= */

    function gameLoop(timestamp){

        const deltaTime =
        timestamp - lastTime;

        lastTime = timestamp;

        switch(currentState){

            case GameState.INTRO:

            break;

            case GameState.PLAYING:

            break;
        }

        requestAnimationFrame(gameLoop);
    }

    /* ========================= */
    /* START */
    /* ========================= */

    changeCamera(0);

    requestAnimationFrame(gameLoop);
}














































class Timer {

    constructor(callback, delay){

        this.callback = callback;
        this.delay = delay;

        this.timerId = null;

        this.running = false;
    }

    start(){

        if(this.running) return;

        this.running = true;

        this.timerId = setInterval(() => {

            this.callback();

        }, this.delay);

    }

    stop(){

        clearInterval(this.timerId);

        this.running = false;
    }

    restart(){

        this.stop();
        this.start();
    }

}