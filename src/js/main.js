const DEFAULT_MODEL = "model1.glb";
const modelViewer = document.getElementById("modelViewer");
const buttonContainer = document.getElementById("modelButtons");
const returnViewBtn = document.getElementById("returnView");
const lockButton = document.getElementById("lockToggle");
const lockIcon = document.getElementById("lockIcon");

let models = [];
let isLocked = false;
let shouldRestoreAutoRotate = false;

let theta = 0;
let phi = 75;
let radius = 2.5;
let targetTheta = theta;
let targetPhi = phi;
let targetRadius = radius;

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function parseOrbit(orbitStr) {
  const [thetaStr, phiStr, radiusStr] = orbitStr.split(" ");
  return {
    theta: parseFloat(thetaStr),
    phi: parseFloat(phiStr),
    radius: parseFloat(radiusStr),
  };
}

function animateCamera() {
  theta = lerp(theta, targetTheta, 0.1);
  phi = lerp(phi, targetPhi, 0.1);
  radius = lerp(radius, targetRadius, 0.1);

  modelViewer.cameraOrbit = `${theta.toFixed(2)}deg ${phi.toFixed(
    2
  )}deg ${radius.toFixed(2)}m`;
  modelViewer.jumpCameraToGoal();

  if (
    shouldRestoreAutoRotate &&
    Math.abs(theta - targetTheta) < 0.01 &&
    Math.abs(phi - targetPhi) < 0.01 &&
    Math.abs(radius - targetRadius) < 0.01
  ) {
    modelViewer.setAttribute("auto-rotate", "");
    shouldRestoreAutoRotate = false;
  }

  requestAnimationFrame(animateCamera);
}

async function fetchJSON(path) {
  try {
    const res = await fetch(path);
    if (!res.ok) throw new Error();
    return await res.json();
  } catch {
    return null;
  }
}

async function initModels() {
  models = await fetchJSON("src/data/models.json");
  if (!models) return;

  models.forEach((model) => {
    const btn = document.createElement("button");
    btn.textContent = model.label;
    btn.dataset.model = model.file;
    buttonContainer.appendChild(btn);
  });

  const saved = sessionStorage.getItem("lastModel");
  const savedModel =
    models.find((m) => m.file === (JSON.parse(saved)?.file || saved)) ||
    models[0];
  setModel(savedModel);
}

function setModel(model) {
  modelViewer.setAttribute("src", `src/models/${model.file}`);
  sessionStorage.setItem("lastModel", JSON.stringify(model));
  highlightActiveButton(model.file);
  loadHotspots(model.file);

  if (model.fov) modelViewer.setAttribute("field-of-view", model.fov);

  if (model.orbit) {
    const { theta, phi, radius } = parseOrbit(model.orbit);
    targetTheta = theta;
    targetPhi = phi;
    targetRadius = radius;
    theta = theta + 5;
    phi = phi + 5;
    radius = radius + 0.5;
  }
}

function highlightActiveButton(activeModel) {
  document.querySelectorAll(".sidebar button").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.model === activeModel);
  });
}

async function loadHotspots(modelFile) {
  const data = await fetchJSON("src/data/hotspots.json");
  if (!data) return;

  const hotspots = data[modelFile] || [];
  document.querySelectorAll(".hotspot").forEach((h) => h.remove());

  hotspots.forEach((h) => {
    const wrapper = document.createElement("div");
    wrapper.className = "hotspot";
    wrapper.slot = h.slot;
    wrapper.dataset.position = h.position;
    wrapper.dataset.normal = h.normal;
    wrapper.innerHTML = `<div class="btn_container"><button class="pulse-button-shrink"></button></div>`;

    wrapper.querySelector("button")?.addEventListener("click", (e) => {
      e.stopPropagation();
      const popup = document.getElementById("popup");
      if (!popup) return;

      popup.querySelector("#popup-title").textContent = h.info.title;
      popup.querySelector("#popup-description").textContent =
        h.info.description;
      popup.classList.remove("hidden");
    });

    modelViewer.appendChild(wrapper);
  });
}

buttonContainer?.addEventListener("click", (e) => {
  if (e.target.tagName === "BUTTON") {
    const modelFile = e.target.dataset.model;
    const model = models.find((m) => m.file === modelFile);
    if (model) setModel(model);
  }
});

lockButton?.addEventListener("click", () => {
  isLocked = !isLocked;

  if (!modelViewer || !lockIcon) return;

  if (isLocked) {
    modelViewer.removeAttribute("auto-rotate");
    lockIcon.setAttribute("fill", "#f44336");
  } else {
    modelViewer.setAttribute("auto-rotate", "");
    lockIcon.setAttribute("fill", "white");
    modelViewer.jumpCameraToGoal();
  }
});

returnViewBtn?.addEventListener("click", () => {
  const stored = sessionStorage.getItem("lastModel");
  if (!stored) return;

  let model;
  try {
    model = JSON.parse(stored);
  } catch {
    return;
  }

  modelViewer.removeAttribute("auto-rotate");

  if (model.orbit) {
    const { theta: t, phi: p, radius: r } = parseOrbit(model.orbit);
    targetTheta = t;
    targetPhi = p;
    targetRadius = r;
    theta = t + 5;
    phi = p + 5;
    radius = r + 0.5;
  }

  if (model.fov) {
    modelViewer.setAttribute("field-of-view", model.fov);
  }

  shouldRestoreAutoRotate = true;
});

initModels();
animateCamera();