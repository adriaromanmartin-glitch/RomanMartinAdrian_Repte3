// Paleta de colors utilitzada a tota la visualització
const PALETA = {
  fons: "#070A12", // color de fons general
  profund: "#0B1B3A", // color de l’aigua
  blau: "#2D7CFF", // color de les gotes
  cian: "#2EE6D6", // color de les ones
  llima: "#A8FF60", // color secundari (no molt utilitzat)
  blanc: "#F6FBFF" // color per textos
};

// Variables d’estat del cronòmetre
let cronometreActiu = false; // indica si el cronòmetre està en marxa
let segonsPassats = 0; // nombre de segons acumulats
let intensitat = 3; // intensitat visual (nombre de gotes)

// Arrays d’elements visuals
let gotesPetites = []; // llista de gotes petites
let ones = []; // llista d’ones

let ultimTemps = 0; // guarda el temps de l’últim segon calculat
let marge = 14; // marge del dibuix dins el canvas

// --------------------
// DOM
// --------------------
// Esperem que el DOM estigui carregat per assignar events
window.addEventListener("DOMContentLoaded", () => {
  const startBtn = document.getElementById("startBtn");
  const resetBtn = document.getElementById("resetBtn");
  const slider = document.getElementById("intensitySlider");

  // Botó iniciar/pausar
  startBtn.addEventListener("click", toggleCronometre);

  // Botó reiniciar
  resetBtn.addEventListener("click", resetCronometre);

  // Slider d’intensitat
  slider.addEventListener("input", (e) => {
    intensitat = Number(e.target.value); // actualitza la intensitat
    storeItem("intensitatVisual", intensitat); // guarda el valor
    document.getElementById("sliderValue").textContent = intensitat; // actualitza UI
  });
});

// --------------------
// P5
// --------------------
// Inicialització del canvas i estat
function setup() {
  const canvas = createCanvas(300, 150); // crea canvas de mida reduïda
  canvas.parent("canvas-container"); // el col·loca dins el div HTML

  recuperarEstat(); // recupera dades guardades

  // Actualitza slider amb valor guardat
  const slider = document.getElementById("intensitySlider");
  const sliderValue = document.getElementById("sliderValue");

  if (slider) slider.value = intensitat;
  if (sliderValue) sliderValue.textContent = intensitat;

  actualitzarUI(); // actualitza la interfície
  ultimTemps = millis(); // inicialitza el temps
}

// Loop principal de dibuix
function draw() {
  background(PALETA.fons); // neteja el canvas

  actualitzarTemps(); // controla el cronòmetre

  // Dibuix dels elements visuals
  dibuixaFonsAtmosferic();
  dibuixaDiposit();
  actualitzaIDibuixaOnes();
  actualitzaIDibuixaGotesPetites();
  dibuixaHUD();
}

// --------------------
// Temps i estat
// --------------------
// Controla el pas del temps (cada segon)
function actualitzarTemps() {
  if (!cronometreActiu) return; // si està pausat, no fa res

  const ara = millis(); // temps actual

  // Si ha passat 1 segon
  if (ara - ultimTemps >= 1000) {
    segonsPassats++; // incrementa el temps
    aSegonTick(); // crea noves gotes i ones
    ultimTemps = ara;

    // Guarda estat al localStorage
    storeItem("segonsGuardats", segonsPassats);
    storeItem("estatCronometre", cronometreActiu);

    actualitzarUI(); // refresca la UI
  }
}

// Inicia o pausa el cronòmetre
function toggleCronometre() {
  cronometreActiu = !cronometreActiu;
  storeItem("estatCronometre", cronometreActiu);
  ultimTemps = millis();
  actualitzarUI();
}

// Reinicia tot l’estat
function resetCronometre() {
  cronometreActiu = false;
  segonsPassats = 0;
  gotesPetites = [];
  ones = [];
  ultimTemps = millis();

  storeItem("segonsGuardats", segonsPassats);
  storeItem("estatCronometre", cronometreActiu);

  actualitzarUI();
}

// Recupera dades guardades
function recuperarEstat() {
  segonsPassats = getItem("segonsGuardats");
  cronometreActiu = getItem("estatCronometre");
  intensitat = getItem("intensitatVisual");

  // Valors per defecte si no existeixen
  if (segonsPassats === null) segonsPassats = 0;
  if (cronometreActiu === null) cronometreActiu = false;
  if (intensitat === null) intensitat = 3;
}

// Actualitza textos i botons de la UI
function actualitzarUI() {
  const status = document.getElementById("status");
  const startBtn = document.getElementById("startBtn");
  const sliderValue = document.getElementById("sliderValue");

  if (status) {
    status.textContent = `Temps de descans: ${segonsPassats} s`;
  }

  if (startBtn) {
    startBtn.textContent = cronometreActiu ? "Pausar" : "Iniciar";
  }

  if (sliderValue) {
    sliderValue.textContent = intensitat;
  }
}

// --------------------
// Tick de segon
// --------------------
// Funció que s’executa cada segon
function aSegonTick() {
  const diposit = obteRecteDiposit();
  const aiguaY = obteAiguaY();

  const count = intensitat; // nombre de gotes

  // Genera gotes petites
  for (let i = 0; i < count; i++) {
    const dx = random(diposit.x + 14, diposit.x + diposit.w - 14);
    const dy = random(diposit.y - 20, diposit.y + 6);
    gotesPetites.push(new Droplet(dx, dy));
  }

  // Genera una ona
  const rx = random(diposit.x + 20, diposit.x + diposit.w - 20);
  const ry = aiguaY + random(-2, 2);
  ones.push(new Ripple(rx, ry));

  // Limita arrays per rendiment
  limitarArray(gotesPetites, 120);
  limitarArray(ones, 80);
}

// --------------------
// Layout
// --------------------
// Defineix la zona del dipòsit
function obteRecteDiposit() {
  const x = marge;
  const y = 16;
  const w = width - marge * 2;
  const h = height - 30;
  return { x, y, w, h };
}

// Calcula el nivell de l’aigua segons el temps
function obteAiguaY() {
  const diposit = obteRecteDiposit();

  // Cicle de 5 minuts
  const cicle = 300;
  const segonsCicle = segonsPassats % cicle;

  return map(segonsCicle, 0, cicle, diposit.y + diposit.h - 8, diposit.y + 12);
}

// --------------------
// Dibuix
// --------------------
// Fons amb efecte atmosfèric
function dibuixaFonsAtmosferic() {
  noStroke();

  for (let i = 0; i < 6; i++) {
    const alpha = map(i, 0, 5, 8, 30);
    fill(45, 124, 255, alpha);
    ellipse(width * 0.18, 20, 120 + i * 8, 60 + i * 4);
  }
}

// Dibuixa el dipòsit i l’aigua
function dibuixaDiposit() {
  const diposit = obteRecteDiposit();
  const aiguaY = obteAiguaY();

  // Marc
  noFill();
  stroke(255, 30);
  strokeWeight(1.2);
  rect(diposit.x, diposit.y, diposit.w, diposit.h, 16);

  // Aigua
  noStroke();
  fill(PALETA.profund);
  rect(diposit.x + 2, aiguaY, diposit.w - 4, diposit.y + diposit.h - aiguaY - 2, 14);

  // Superfície brillant
  fill(46, 230, 214, 45);
  rect(diposit.x + 2, aiguaY, diposit.w - 4, 5, 12);

  // Reflex lateral
  fill(255, 20);
  rect(diposit.x + 8, diposit.y + 10, 3, diposit.h - 20, 8);
}

// Text informatiu
function dibuixaHUD() {
  fill(255, 185);
  noStroke();
  textAlign(LEFT, TOP);
  textSize(10);
  text("degoteig del descans", 14, 8);

  textAlign(RIGHT, TOP);
  text(`${nf(segonsPassats, 1)} s`, width - 14, 8);
}

// --------------------
// Ones
// --------------------
// Classe per crear ones
class Ripple {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.r = random(5, 9);
    this.life = 1.0;
    this.speed = random(1.2, 2.2);
  }

  update() {
    this.r += this.speed;
    this.life -= 0.03;
  }

  draw() {
    const a = constrain(this.life, 0, 1);
    noFill();
    stroke(46, 230, 214, 110 * a);
    strokeWeight(1.5);
    circle(this.x, this.y, this.r * 2);
  }

  isDead() {
    return this.life <= 0;
  }
}

// Actualitza i dibuixa les ones
function actualitzaIDibuixaOnes() {
  for (let i = ones.length - 1; i >= 0; i--) {
    ones[i].update();
    ones[i].draw();

    if (ones[i].isDead()) {
      ones.splice(i, 1);
    }
  }
}

// --------------------
// Gotes petites
// --------------------
// Classe per gotes
class Droplet {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vy = random(1.2, 2.4);
    this.size = random(3, 6);
    this.life = 1.0;
    this.phase = random(TWO_PI);
    this.wobble = random(0.3, 1.0);
  }

  update() {
    this.phase += 0.14;
    this.x += sin(this.phase) * this.wobble;
    this.y += this.vy;
    this.life -= 0.01;
  }

  draw() {
    const a = constrain(this.life, 0, 1);
    noStroke();
    fill(45, 124, 255, 170 * a);
    ellipse(this.x, this.y, this.size * 0.9, this.size * 1.35);
  }

  isDead() {
    return this.life <= 0;
  }
}

// Actualitza i dibuixa gotes
function actualitzaIDibuixaGotesPetites() {
  const aiguaY = obteAiguaY();
  const diposit = obteRecteDiposit();

  for (let i = gotesPetites.length - 1; i >= 0; i--) {
    const d = gotesPetites[i];
    d.update();
    d.draw();

    if (d.y >= aiguaY) {
      ones.push(new Ripple(d.x, aiguaY));
      gotesPetites.splice(i, 1);
      continue;
    }

    if (d.y > diposit.y + diposit.h + 20 || d.isDead()) {
      gotesPetites.splice(i, 1);
    }
  }
}

// --------------------
// Utilitat
// --------------------
// Limita la mida d’un array
function limitarArray(arr, max) {
  while (arr.length > max) {
    arr.shift();
  }
}