const DEFAULT_MODEL = "model1.glb";
const modelViewer = document.getElementById("modelViewer");
const buttonContainer = document.getElementById("modelButtons");

// Carregar botões e configurar modelo inicial
fetch("src/data/models.json")
  .then((res) => res.json())
  .then((models) => {
    models.forEach((model) => {
      const btn = document.createElement("button");
      btn.textContent = model.label;
      btn.dataset.model = model.file;
      buttonContainer.appendChild(btn);
    });

    const savedModel = sessionStorage.getItem("lastModel") || DEFAULT_MODEL;
    setModel(savedModel);

    document.querySelectorAll(".sidebar button").forEach((button) => {
      button.addEventListener("click", () => {
        const modelFile = button.dataset.model;
        setModel(modelFile);
      });
    });
  });

function setModel(modelFile) {
  modelViewer.setAttribute("src", `src/models/${modelFile}`);
  sessionStorage.setItem("lastModel", modelFile);
  highlightActiveButton(modelFile);
  loadHotspots(modelFile);
}

function highlightActiveButton(activeModel) {
  document.querySelectorAll(".sidebar button").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.model === activeModel);
  });
}

async function loadHotspots(modelFile) {
  const res = await fetch("src/data/hotspots.json");
  const hotspots = (await res.json())[modelFile] || [];

  // Remover antigos
  document.querySelectorAll(".hotspot").forEach((h) => h.remove());

  hotspots.forEach((h) => {
    const wrapper = document.createElement("div");
    wrapper.className = "hotspot";
    wrapper.slot = h.slot;
    wrapper.dataset.position = h.position;
    wrapper.dataset.normal = h.normal;

    // Adiciona o HTML interno personalizado
    wrapper.innerHTML = `
      <div class="btn_container">
        <button class="pulse-button-shrink"></button>
      </div>
    `;

    // Evento de clique no botão interno
    wrapper.querySelector("button").addEventListener("click", () => {
      document.getElementById("popup-title").textContent = h.info.title;
      document.getElementById("popup-description").textContent =
        h.info.description;
      document.getElementById("popup").classList.remove("hidden");
    });

    modelViewer.appendChild(wrapper);
  });
}

const lockButton = document.getElementById("lockToggle");
const lockIcon = document.getElementById("lockIcon");
let isLocked = false;

lockButton.addEventListener("click", () => {
  isLocked = !isLocked;

  if (isLocked) {
    modelViewer.removeAttribute("auto-rotate");
    lockIcon.setAttribute("fill", "#f44336"); // vermelho
  } else {
    modelViewer.setAttribute("auto-rotate", "");
    lockIcon.setAttribute("fill", "white"); // branco

    modelViewer.jumpCameraToGoal();
  }
});

let theta = 0; // ângulo horizontal
let phi = 75; // ângulo vertical (altura)
let radius = 2.5; // distância
let targetTheta = theta;
let targetPhi = phi;
let targetRadius = radius;

const lerp = (a, b, t) => a + (b - a) * t;

function animateCamera() {
  theta = lerp(theta, targetTheta, 0.1);
  phi = lerp(phi, targetPhi, 0.1);
  radius = lerp(radius, targetRadius, 0.1);

  modelViewer.cameraOrbit = `${theta.toFixed(2)}deg ${phi.toFixed(
    2
  )}deg ${radius.toFixed(2)}m`;
  modelViewer.jumpCameraToGoal();

  requestAnimationFrame(animateCamera);
}

animateCamera(); // inicia animação