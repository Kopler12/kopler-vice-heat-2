// VICE HEAT — editor wiring.
//
// Owns the interactive state (photos, panels, caption), binds every
// control in index.html, renders the live preview through the shared
// engine in cover.js, and exports PNGs. If a ?shot= mode is requested,
// shots.js takes over instead and this editor never boots.

import {
  COVER_LAYOUTS,
  createCoverState,
  createPanelState,
  drawCover,
  panelCountForLayout,
  panelIndexAtPoint,
} from "./cover.js";
import { bootShotModeIfRequested, loadSamplePhotos } from "./shots.js";

const PREVIEW_WIDTH = 1080;
const PREVIEW_HEIGHT = 1350;

const editorState = {
  cover: createCoverState(panelCountForLayout("grid6")),
  photos: [], // every loaded HTMLImageElement, in tray order
  photoNames: [],
  selectedPanelIndex: 0,
};

const elements = {};

function cacheElements() {
  const ids = [
    "cover-canvas", "photo-input", "photo-tray", "load-samples-button",
    "fill-one-button", "layout-picker", "grade-picker", "zoom-slider",
    "zoom-value", "offset-x-slider", "offset-x-value", "offset-y-slider",
    "offset-y-value", "selected-panel-label", "panel-count-label",
    "title-input", "tagline-input", "lettering-select", "stars-select",
    "badge-input", "export-size", "export-button",
  ];
  for (const id of ids) elements[id] = document.getElementById(id);
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

function renderPreview() {
  const canvas = elements["cover-canvas"];
  const context = canvas.getContext("2d");
  drawCover(context, canvas.width, canvas.height, editorState.cover, {
    showSelection: true,
    selectedPanelIndex: editorState.selectedPanelIndex,
  });
  syncPanelControls();
}

function syncPanelControls() {
  const panel = editorState.cover.panels[editorState.selectedPanelIndex];
  if (!panel) return;
  elements["selected-panel-label"].textContent = String(editorState.selectedPanelIndex + 1);
  elements["panel-count-label"].textContent = String(editorState.cover.panels.length);
  elements["zoom-slider"].value = String(panel.zoom);
  elements["zoom-value"].textContent = `${panel.zoom.toFixed(2)}×`;
  elements["offset-x-slider"].value = String(Math.round(panel.offsetX * 100));
  elements["offset-x-value"].textContent = `${Math.round(panel.offsetX * 100)}%`;
  elements["offset-y-slider"].value = String(Math.round(panel.offsetY * 100));
  elements["offset-y-value"].textContent = `${Math.round(panel.offsetY * 100)}%`;
  markAssignedThumbnails();
}

// ---------------------------------------------------------------------------
// Photos
// ---------------------------------------------------------------------------

function addPhotoToTray(image, name) {
  editorState.photos.push(image);
  editorState.photoNames.push(name);
  const thumb = document.createElement("img");
  thumb.className = "photo-thumb";
  thumb.src = image.src;
  thumb.alt = name;
  thumb.title = name;
  const photoIndex = editorState.photos.length - 1;
  thumb.dataset.photoIndex = String(photoIndex);
  thumb.addEventListener("click", () => assignPhotoToSelectedPanel(photoIndex));
  elements["photo-tray"].appendChild(thumb);
  return editorState.photos.length - 1;
}

function markAssignedThumbnails() {
  const assigned = new Set(
    editorState.cover.panels.map((panel) => editorState.photos.indexOf(panel.image)).filter((i) => i >= 0),
  );
  elements["photo-tray"].querySelectorAll(".photo-thumb").forEach((thumb) => {
    thumb.classList.toggle("is-assigned", assigned.has(Number(thumb.dataset.photoIndex)));
  });
}

function assignPhotoToSelectedPanel(photoIndex) {
  const panel = editorState.cover.panels[editorState.selectedPanelIndex];
  if (!panel || !editorState.photos[photoIndex]) return;
  panel.image = editorState.photos[photoIndex];
  renderPreview();
}

function assignPhotoToPanel(photoIndex, panelIndex) {
  const panel = editorState.cover.panels[panelIndex];
  if (!panel || !editorState.photos[photoIndex]) return;
  panel.image = editorState.photos[photoIndex];
}

function fillAllPanelsWithSelectedPhoto() {
  const panel = editorState.cover.panels[editorState.selectedPanelIndex];
  const image = panel?.image ?? editorState.photos[0];
  if (!image) return;
  for (const target of editorState.cover.panels) target.image = image;
  renderPreview();
}

// Spread the loaded photos across the panels in order (wrapping around),
// which is what makes the editor feel alive right after samples load.
function dealPhotosAcrossPanels() {
  if (editorState.photos.length === 0) return;
  editorState.cover.panels.forEach((panel, index) => {
    panel.image = editorState.photos[index % editorState.photos.length];
  });
}

async function loadSamplesIntoEditor() {
  const existingSources = new Set(editorState.photos.map((photo) => photo.src));
  const samples = await loadSamplePhotos();
  let addedAny = false;
  samples.forEach((sample, index) => {
    if (!existingSources.has(sample.src)) {
      addPhotoToTray(sample, index === 0 ? "Sample — Boulevard" : "Sample — Rooftop");
      addedAny = true;
    }
  });
  if (addedAny || editorState.cover.panels.every((panel) => !panel.image)) {
    dealPhotosAcrossPanels();
  }
  renderPreview();
}

function handlePhotoFileSelection(event) {
  const files = Array.from(event.target.files ?? []);
  for (const file of files) {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      addPhotoToTray(image, file.name);
      // First photo into the selected panel so uploads feel instant.
      if (editorState.photos.length === 1) assignPhotoToSelectedPanel(0);
      renderPreview();
    };
    image.src = objectUrl;
  }
  event.target.value = "";
}

// ---------------------------------------------------------------------------
// Layout / grade switching — panel states are preserved where possible;
// growing a layout appends fresh panels that inherit the photo cycle.
// ---------------------------------------------------------------------------

function switchLayout(layoutKey) {
  const cover = editorState.cover;
  const targetCount = panelCountForLayout(layoutKey);
  while (cover.panels.length < targetCount) {
    const fresh = createPanelState();
    if (editorState.photos.length > 0) {
      fresh.image = editorState.photos[cover.panels.length % editorState.photos.length];
    }
    cover.panels.push(fresh);
  }
  cover.layout = layoutKey;
  editorState.selectedPanelIndex = Math.min(editorState.selectedPanelIndex, targetCount - 1);
  document.querySelectorAll("#layout-picker .toggle-button").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.layout === layoutKey);
  });
  renderPreview();
}

function switchGrade(gradeKey) {
  editorState.cover.grade = gradeKey;
  document.querySelectorAll("#grade-picker .toggle-button").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.grade === gradeKey);
  });
  renderPreview();
}

// ---------------------------------------------------------------------------
// Canvas interaction: click to select, drag to reposition.
// ---------------------------------------------------------------------------

function canvasPointFromEvent(event) {
  const canvas = elements["cover-canvas"];
  const bounds = canvas.getBoundingClientRect();
  return {
    x: ((event.clientX - bounds.left) / bounds.width) * canvas.width,
    y: ((event.clientY - bounds.top) / bounds.height) * canvas.height,
  };
}

function bindCanvasInteractions() {
  const canvas = elements["cover-canvas"];
  let dragState = null;

  canvas.addEventListener("pointerdown", (event) => {
    const point = canvasPointFromEvent(event);
    const hitIndex = panelIndexAtPoint(
      editorState.cover.layout, canvas.width, canvas.height, point.x, point.y,
    );
    if (hitIndex >= 0) editorState.selectedPanelIndex = hitIndex;
    const panel = editorState.cover.panels[editorState.selectedPanelIndex];
    dragState = {
      startX: point.x,
      startY: point.y,
      startOffsetX: panel ? panel.offsetX : 0,
      startOffsetY: panel ? panel.offsetY : 0,
    };
    canvas.setPointerCapture(event.pointerId);
    renderPreview();
  });

  canvas.addEventListener("pointermove", (event) => {
    if (!dragState) return;
    const panel = editorState.cover.panels[editorState.selectedPanelIndex];
    if (!panel || !panel.image) return;
    const point = canvasPointFromEvent(event);
    const layout = COVER_LAYOUTS[editorState.cover.layout];
    const panelFraction = layout.panels[editorState.selectedPanelIndex];
    const panelPixelWidth = panelFraction.w * canvas.width;
    const panelPixelHeight = panelFraction.h * canvas.height;
    panel.offsetX = clampOffset(dragState.startOffsetX + (point.x - dragState.startX) / panelPixelWidth);
    panel.offsetY = clampOffset(dragState.startOffsetY + (point.y - dragState.startY) / panelPixelHeight);
    renderPreview();
  });

  const endDrag = () => { dragState = null; };
  canvas.addEventListener("pointerup", endDrag);
  canvas.addEventListener("pointercancel", endDrag);
}

function clampOffset(value) {
  return Math.max(-0.5, Math.min(0.5, value));
}

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

function exportCoverAsPng() {
  const [widthText, heightText] = elements["export-size"].value.split("x");
  const exportCanvas = document.createElement("canvas");
  exportCanvas.width = Number(widthText);
  exportCanvas.height = Number(heightText);
  const context = exportCanvas.getContext("2d");
  drawCover(context, exportCanvas.width, exportCanvas.height, editorState.cover);
  exportCanvas.toBlob((blob) => {
    if (!blob) return;
    const downloadUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = `vice-heat-cover-${exportCanvas.width}x${exportCanvas.height}.png`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(downloadUrl), 4000);
  }, "image/png");
}

// ---------------------------------------------------------------------------
// Control bindings
// ---------------------------------------------------------------------------

function bindControls() {
  elements["photo-input"].addEventListener("change", handlePhotoFileSelection);
  elements["load-samples-button"].addEventListener("click", loadSamplesIntoEditor);
  elements["fill-one-button"].addEventListener("click", fillAllPanelsWithSelectedPhoto);
  elements["export-button"].addEventListener("click", exportCoverAsPng);

  document.querySelectorAll("#layout-picker .toggle-button").forEach((button) => {
    button.addEventListener("click", () => switchLayout(button.dataset.layout));
  });
  document.querySelectorAll("#grade-picker .toggle-button").forEach((button) => {
    button.addEventListener("click", () => switchGrade(button.dataset.grade));
  });

  const selectedPanel = () => editorState.cover.panels[editorState.selectedPanelIndex];
  elements["zoom-slider"].addEventListener("input", (event) => {
    selectedPanel().zoom = Number(event.target.value);
    renderPreview();
  });
  elements["offset-x-slider"].addEventListener("input", (event) => {
    selectedPanel().offsetX = Number(event.target.value) / 100;
    renderPreview();
  });
  elements["offset-y-slider"].addEventListener("input", (event) => {
    selectedPanel().offsetY = Number(event.target.value) / 100;
    renderPreview();
  });

  elements["title-input"].addEventListener("input", (event) => {
    editorState.cover.title = event.target.value;
    renderPreview();
  });
  elements["tagline-input"].addEventListener("input", (event) => {
    editorState.cover.tagline = event.target.value;
    renderPreview();
  });
  elements["lettering-select"].addEventListener("change", (event) => {
    editorState.cover.lettering = event.target.value;
    renderPreview();
  });
  elements["stars-select"].addEventListener("change", (event) => {
    editorState.cover.stars = Number(event.target.value);
    renderPreview();
  });
  elements["badge-input"].addEventListener("input", (event) => {
    editorState.cover.badge = event.target.value;
    renderPreview();
  });
}

// ---------------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------------

async function bootEditor() {
  cacheElements();
  bindControls();
  bindCanvasInteractions();
  renderPreview();
  // Auto-load the bundled samples so the editor is alive immediately.
  await loadSamplesIntoEditor();
}

bootShotModeIfRequested().then((handledByShotMode) => {
  if (!handledByShotMode) return bootEditor();
  return undefined;
});
