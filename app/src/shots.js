// VICE HEAT — screenshot-mode boot.
//
// When the page is opened with ?shot=cover|portrait|square, the editor is
// hidden and a single cover fills the viewport, rendered by the same
// engine as the editor with the bundled sample photos and a strong
// default caption. This is how the entry screenshots are produced.

import {
  COLOR_GRADES,
  createCoverState,
  drawCover,
  panelCountForLayout,
} from "./cover.js";

export const SHOT_MODES = {
  cover: { layout: "grid6", grade: "sunset", aspectWidth: 16, aspectHeight: 9 },
  portrait: { layout: "heroTrio", grade: "neon", aspectWidth: 1080, aspectHeight: 1350 },
  square: { layout: "grid6", grade: "golden", aspectWidth: 1, aspectHeight: 1 },
};

const SAMPLE_PHOTO_URLS = ["samples/boulevard.jpg", "samples/rooftop.jpg"];

function loadImageElement(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`failed to load ${url}`));
    image.src = url;
  });
}

export async function loadSamplePhotos() {
  const photos = [];
  for (const url of SAMPLE_PHOTO_URLS) {
    try {
      photos.push(await loadImageElement(url));
    } catch {
      // A missing sample simply leaves its panels on placeholder art.
    }
  }
  return photos;
}

// Build the default cover state used by shot modes: samples are spread
// across the panels so every panel shows a real photo.
export function buildShotCoverState(modeKey, samplePhotos) {
  const mode = SHOT_MODES[modeKey] ?? SHOT_MODES.cover;
  const state = createCoverState(panelCountForLayout(mode.layout));
  state.layout = mode.layout;
  state.grade = mode.grade;
  state.title = "VICE HEAT";
  state.tagline = "One city. One summer. No way back.";
  state.lettering = "blockbuster";
  state.stars = 5;
  state.badge = "DELUXE EDITION";
  state.panels.forEach((panel, index) => {
    if (samplePhotos.length > 0) {
      panel.image = samplePhotos[index % samplePhotos.length];
      panel.zoom = 1.05 + (index % 3) * 0.08;
    }
  });
  return state;
}

// If a shot mode is requested, take over the page and render it. Returns
// true when shot mode handled the boot, false for the normal editor.
export async function bootShotModeIfRequested() {
  const params = new URLSearchParams(window.location.search);
  const shotKey = params.get("shot");
  if (!shotKey || !(shotKey in SHOT_MODES)) return false;

  const mode = SHOT_MODES[shotKey];
  document.body.classList.add("shot-mode");
  const editorRoot = document.getElementById("editor-root");
  if (editorRoot) editorRoot.hidden = true;
  const shotRoot = document.getElementById("shot-root");
  shotRoot.hidden = false;

  const canvas = document.createElement("canvas");
  // Render at a fixed high resolution matching the mode's aspect; CSS
  // scales it to the full viewport.
  const baseWidth = 1600;
  canvas.width = baseWidth;
  canvas.height = Math.round((baseWidth * mode.aspectHeight) / mode.aspectWidth);
  shotRoot.appendChild(canvas);

  const samplePhotos = await loadSamplePhotos();
  const state = buildShotCoverState(shotKey, samplePhotos);
  const context = canvas.getContext("2d");
  drawCover(context, canvas.width, canvas.height, state);
  document.title = `VICE HEAT — ${mode.layout} / ${COLOR_GRADES[mode.grade].label}`;
  return true;
}
