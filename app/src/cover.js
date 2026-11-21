// VICE HEAT — Canvas 2D cover rendering engine.
//
// Pure drawing code: given a cover state it paints panels, colour grades,
// caption lettering, wanted stars and a badge ribbon onto any 2D context.
// The editor (main.js) and the screenshot modes (shots.js) share this
// engine so what you see in the editor is exactly what gets exported.

// ---------------------------------------------------------------------------
// Layouts. Panel rectangles are fractions of the cover (0..1) so the same
// layout works at every export size.
// ---------------------------------------------------------------------------

export const COVER_LAYOUTS = {
  grid6: {
    label: "Six-Panel Cover Grid",
    panels: [
      { x: 0.0, y: 0.0, w: 1 / 3, h: 0.5 },
      { x: 1 / 3, y: 0.0, w: 1 / 3, h: 0.5 },
      { x: 2 / 3, y: 0.0, w: 1 / 3, h: 0.5 },
      { x: 0.0, y: 0.5, w: 1 / 3, h: 0.5 },
      { x: 1 / 3, y: 0.5, w: 1 / 3, h: 0.5 },
      { x: 2 / 3, y: 0.5, w: 1 / 3, h: 0.5 },
    ],
  },
  heroTrio: {
    label: "Hero + Trio",
    panels: [
      { x: 0.0, y: 0.0, w: 0.62, h: 1.0 },
      { x: 0.62, y: 0.0, w: 0.38, h: 1 / 3 },
      { x: 0.62, y: 1 / 3, w: 0.38, h: 1 / 3 },
      { x: 0.62, y: 2 / 3, w: 0.38, h: 1 / 3 },
    ],
  },
  duo: {
    label: "Duo Split",
    panels: [
      { x: 0.0, y: 0.0, w: 0.5, h: 1.0 },
      { x: 0.5, y: 0.0, w: 0.5, h: 1.0 },
    ],
  },
  poster: {
    label: "Full-Bleed Poster",
    panels: [{ x: 0.0, y: 0.0, w: 1.0, h: 1.0 }],
  },
};

// ---------------------------------------------------------------------------
// Colour grades. Each grade combines a CSS filter applied while drawing the
// photos, a diagonal gradient wash blended over the panels, and a tint used
// for the caption glow.
// ---------------------------------------------------------------------------

export const COLOR_GRADES = {
  sunset: {
    label: "Sunset Boulevard",
    filter: "contrast(1.12) saturate(1.35)",
    washStops: [
      [0, "rgba(255, 90, 60, 0.30)"],
      [0.5, "rgba(255, 46, 136, 0.16)"],
      [1, "rgba(40, 10, 80, 0.34)"],
    ],
    washMode: "overlay",
    glow: "#ff9a3d",
  },
  neon: {
    label: "Neon Nights",
    filter: "contrast(1.22) saturate(1.5)",
    washStops: [
      [0, "rgba(34, 211, 238, 0.26)"],
      [0.55, "rgba(120, 40, 220, 0.20)"],
      [1, "rgba(255, 46, 136, 0.30)"],
    ],
    washMode: "overlay",
    glow: "#22d3ee",
  },
  golden: {
    label: "Golden Hour",
    filter: "contrast(1.05) saturate(1.2) brightness(1.06)",
    washStops: [
      [0, "rgba(255, 210, 61, 0.28)"],
      [0.6, "rgba(255, 140, 40, 0.16)"],
      [1, "rgba(90, 40, 10, 0.26)"],
    ],
    washMode: "soft-light",
    glow: "#ffd23d",
  },
  chrome: {
    label: "Midnight Chrome",
    filter: "contrast(1.28) saturate(0.72) brightness(0.98)",
    washStops: [
      [0, "rgba(160, 190, 255, 0.22)"],
      [0.5, "rgba(30, 40, 80, 0.18)"],
      [1, "rgba(0, 0, 10, 0.42)"],
    ],
    washMode: "overlay",
    glow: "#a8c4ff",
  },
};

export const LETTERING_STYLES = ["blockbuster", "neon", "outline", "chrome"];

const TITLE_FONT_STACK = 'Impact, "Arial Black", "Segoe UI", Arial, sans-serif';
const TAGLINE_FONT_STACK = '"Segoe UI", system-ui, "Helvetica Neue", Arial, sans-serif';

// ---------------------------------------------------------------------------
// State helpers
// ---------------------------------------------------------------------------

export function createPanelState(image = null) {
  return { image, zoom: 1, offsetX: 0, offsetY: 0 };
}

export function createCoverState(panelCount) {
  return {
    layout: "grid6",
    grade: "sunset",
    panels: Array.from({ length: panelCount }, () => createPanelState()),
    title: "VICE HEAT",
    tagline: "One city. One summer. No way back.",
    lettering: "blockbuster",
    stars: 5,
    badge: "DELUXE EDITION",
  };
}

export function panelCountForLayout(layoutKey) {
  return COVER_LAYOUTS[layoutKey].panels.length;
}

// ---------------------------------------------------------------------------
// Photo drawing: cover-fit an image into a panel rect, honouring the
// panel's zoom and fractional offsets.
// ---------------------------------------------------------------------------

function drawPhotoCoverFit(context, image, rect, panel, filter) {
  const scale = Math.max(rect.w / image.naturalWidth, rect.h / image.naturalHeight) * panel.zoom;
  const drawnWidth = image.naturalWidth * scale;
  const drawnHeight = image.naturalHeight * scale;
  const drawnX = rect.x + (rect.w - drawnWidth) / 2 + panel.offsetX * rect.w;
  const drawnY = rect.y + (rect.h - drawnHeight) / 2 + panel.offsetY * rect.h;
  context.save();
  context.beginPath();
  context.rect(rect.x, rect.y, rect.w, rect.h);
  context.clip();
  if (filter) context.filter = filter;
  context.drawImage(image, drawnX, drawnY, drawnWidth, drawnHeight);
  context.restore();
}

// Placeholder art for empty panels: a striped vice-sky gradient with a
// palm silhouette, so an unfinished cover still looks intentional.
function drawPlaceholderPanel(context, rect, panelIndex, grade) {
  const gradient = context.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.h);
  gradient.addColorStop(0, "#2a0a4a");
  gradient.addColorStop(0.55, "#a4136e");
  gradient.addColorStop(0.78, grade.glow);
  gradient.addColorStop(1, "#ff7a3d");
  context.fillStyle = gradient;
  context.fillRect(rect.x, rect.y, rect.w, rect.h);

  // Sun disc.
  const sunRadius = Math.min(rect.w, rect.h) * 0.22;
  const sunX = rect.x + rect.w * (0.3 + 0.14 * (panelIndex % 3));
  const sunY = rect.y + rect.h * 0.62;
  context.fillStyle = "rgba(255, 220, 120, 0.95)";
  context.beginPath();
  context.arc(sunX, sunY, sunRadius, 0, Math.PI * 2);
  context.fill();
  // Sun stripes.
  context.fillStyle = "rgba(164, 19, 110, 0.85)";
  for (let stripe = 0; stripe < 3; stripe++) {
    const stripeY = sunY + sunRadius * (0.1 + stripe * 0.3);
    context.fillRect(sunX - sunRadius, stripeY, sunRadius * 2, sunRadius * 0.09);
  }

  drawPalmSilhouette(context, rect.x + rect.w * 0.78, rect.y + rect.h, Math.min(rect.w, rect.h) * 0.55);
  drawPalmSilhouette(context, rect.x + rect.w * 0.12, rect.y + rect.h, Math.min(rect.w, rect.h) * 0.4);
}

function drawPalmSilhouette(context, baseX, baseY, size) {
  context.save();
  context.strokeStyle = "rgba(8, 2, 16, 0.92)";
  context.fillStyle = "rgba(8, 2, 16, 0.92)";
  context.lineWidth = Math.max(2, size * 0.045);
  context.lineCap = "round";
  // Trunk: a gentle curve.
  const topX = baseX + size * 0.16;
  const topY = baseY - size;
  context.beginPath();
  context.moveTo(baseX, baseY);
  context.quadraticCurveTo(baseX + size * 0.02, baseY - size * 0.55, topX, topY);
  context.stroke();
  // Fronds.
  for (let frond = 0; frond < 6; frond++) {
    const angle = Math.PI * (0.08 + frond * 0.17);
    const frondLength = size * (0.42 + 0.1 * Math.sin(frond * 2.3));
    const endX = topX + Math.cos(angle) * frondLength * (frond < 3 ? -1 : 1) * (frond === 2 || frond === 3 ? 0.3 : 1);
    const endY = topY - Math.sin(angle) * frondLength * 0.55 + frondLength * 0.22;
    context.beginPath();
    context.moveTo(topX, topY);
    context.quadraticCurveTo(
      topX + (endX - topX) * 0.5,
      topY - frondLength * 0.28,
      endX,
      endY,
    );
    context.stroke();
  }
  context.restore();
}

// ---------------------------------------------------------------------------
// Grade wash + vignette
// ---------------------------------------------------------------------------

function applyGradeWash(context, width, height, grade) {
  const gradient = context.createLinearGradient(0, 0, width * 0.3, height);
  for (const [stop, color] of grade.washStops) gradient.addColorStop(stop, color);
  context.save();
  context.globalCompositeOperation = grade.washMode;
  context.fillStyle = gradient;
  context.fillRect(0, 0, width, height);
  context.restore();

  // Vignette to seat the caption.
  const vignette = context.createRadialGradient(
    width / 2, height / 2, Math.min(width, height) * 0.42,
    width / 2, height / 2, Math.max(width, height) * 0.78,
  );
  vignette.addColorStop(0, "rgba(0,0,0,0)");
  vignette.addColorStop(1, "rgba(0,0,0,0.38)");
  context.fillStyle = vignette;
  context.fillRect(0, 0, width, height);
}

// ---------------------------------------------------------------------------
// Caption lettering
// ---------------------------------------------------------------------------

function measureFittedTitleSize(context, title, maxWidth, startSize) {
  let size = startSize;
  context.font = `${size}px ${TITLE_FONT_STACK}`;
  while (size > 24 && context.measureText(title).width > maxWidth) {
    size -= 4;
    context.font = `${size}px ${TITLE_FONT_STACK}`;
  }
  return size;
}

function drawCoverTitle(context, width, height, state, grade) {
  const title = (state.title || "VICE HEAT").toUpperCase();
  const baseSize = Math.min(width, height) * 0.135;
  const size = measureFittedTitleSize(context, title, width * 0.92, baseSize);
  const titleY = height * 0.9;

  context.save();
  context.textAlign = "center";
  context.textBaseline = "alphabetic";
  context.font = `${size}px ${TITLE_FONT_STACK}`;

  // Soft dark plate behind the caption for legibility.
  const plateHeight = size * 1.62;
  const plateGradient = context.createLinearGradient(0, titleY - plateHeight, 0, height);
  plateGradient.addColorStop(0, "rgba(5,0,12,0)");
  plateGradient.addColorStop(0.45, "rgba(5,0,12,0.55)");
  plateGradient.addColorStop(1, "rgba(5,0,12,0.88)");
  context.fillStyle = plateGradient;
  context.fillRect(0, titleY - plateHeight, width, plateHeight + (height - titleY));

  const lettering = state.lettering;
  if (lettering === "neon") {
    context.shadowColor = grade.glow;
    context.shadowBlur = size * 0.32;
    context.lineWidth = size * 0.045;
    context.strokeStyle = "#ffffff";
    context.fillStyle = grade.glow;
    context.strokeText(title, width / 2, titleY);
    context.fillText(title, width / 2, titleY);
  } else if (lettering === "outline") {
    context.lineWidth = size * 0.07;
    context.strokeStyle = "#ffffff";
    context.shadowColor = "rgba(0,0,0,0.8)";
    context.shadowBlur = size * 0.12;
    context.strokeText(title, width / 2, titleY);
  } else if (lettering === "chrome") {
    const chromeGradient = context.createLinearGradient(0, titleY - size, 0, titleY);
    chromeGradient.addColorStop(0, "#f8fbff");
    chromeGradient.addColorStop(0.48, "#9fb6d8");
    chromeGradient.addColorStop(0.52, "#2c3e5e");
    chromeGradient.addColorStop(0.62, "#dfe9f7");
    chromeGradient.addColorStop(1, "#6f87ad");
    context.shadowColor = "rgba(0,0,0,0.75)";
    context.shadowBlur = size * 0.1;
    context.shadowOffsetY = size * 0.05;
    context.fillStyle = chromeGradient;
    context.fillText(title, width / 2, titleY);
    context.shadowColor = "transparent";
    context.lineWidth = size * 0.03;
    context.strokeStyle = "rgba(10,16,30,0.9)";
    context.strokeText(title, width / 2, titleY);
  } else {
    // Blockbuster: sunset gradient fill, white keyline, hard drop shadow.
    const fillGradient = context.createLinearGradient(0, titleY - size, 0, titleY);
    fillGradient.addColorStop(0, "#ffe259");
    fillGradient.addColorStop(0.5, "#ffa751");
    fillGradient.addColorStop(1, "#ff2e88");
    context.shadowColor = "rgba(0,0,0,0.85)";
    context.shadowBlur = 0;
    context.shadowOffsetX = size * 0.045;
    context.shadowOffsetY = size * 0.06;
    context.fillStyle = fillGradient;
    context.fillText(title, width / 2, titleY);
    context.shadowColor = "transparent";
    context.shadowOffsetX = 0;
    context.shadowOffsetY = 0;
    context.lineWidth = size * 0.035;
    context.strokeStyle = "#ffffff";
    context.strokeText(title, width / 2, titleY);
  }
  context.restore();

  if (state.tagline) drawCoverTagline(context, width, height, state, size);
  return size;
}

function drawCoverTagline(context, width, height, state, titleSize) {
  const tagline = state.tagline;
  let size = Math.max(15, titleSize * 0.21);
  context.save();
  context.textAlign = "center";
  context.font = `600 ${size}px ${TAGLINE_FONT_STACK}`;
  while (size > 11 && context.measureText(tagline.toUpperCase()).width > width * 0.9) {
    size -= 1;
    context.font = `600 ${size}px ${TAGLINE_FONT_STACK}`;
  }
  context.letterSpacing = `${Math.max(1, size * 0.14)}px`;
  context.fillStyle = "rgba(255,255,255,0.94)";
  context.shadowColor = "rgba(0,0,0,0.8)";
  context.shadowBlur = size * 0.3;
  context.fillText(tagline.toUpperCase(), width / 2, height * 0.955);
  context.restore();
}

// ---------------------------------------------------------------------------
// Wanted stars + badge ribbon
// ---------------------------------------------------------------------------

function drawStarPath(context, centerX, centerY, outerRadius) {
  const innerRadius = outerRadius * 0.45;
  context.beginPath();
  for (let point = 0; point < 10; point++) {
    const radius = point % 2 === 0 ? outerRadius : innerRadius;
    const angle = -Math.PI / 2 + (point * Math.PI) / 5;
    const x = centerX + Math.cos(angle) * radius;
    const y = centerY + Math.sin(angle) * radius;
    if (point === 0) context.moveTo(x, y);
    else context.lineTo(x, y);
  }
  context.closePath();
}

function drawWantedStars(context, width, height, starCount) {
  if (!starCount || starCount < 1) return;
  const radius = Math.min(width, height) * 0.026;
  const gap = radius * 2.5;
  const totalWidth = gap * (starCount - 1);
  const startX = width - width * 0.045 - totalWidth - radius;
  const centerY = height * 0.045 + radius;
  context.save();
  for (let star = 0; star < starCount; star++) {
    const centerX = startX + star * gap + radius;
    drawStarPath(context, centerX, centerY, radius);
    context.fillStyle = "#ffd23d";
    context.shadowColor = "rgba(0,0,0,0.7)";
    context.shadowBlur = radius * 0.4;
    context.fill();
    context.shadowColor = "transparent";
    context.lineWidth = radius * 0.14;
    context.strokeStyle = "#7a4d00";
    context.stroke();
  }
  // "WANTED" micro-caption under the stars.
  context.font = `700 ${radius * 0.72}px ${TAGLINE_FONT_STACK}`;
  context.textAlign = "center";
  context.fillStyle = "rgba(255,255,255,0.92)";
  context.shadowColor = "rgba(0,0,0,0.8)";
  context.shadowBlur = radius * 0.3;
  context.fillText("W A N T E D", startX + totalWidth / 2 + radius, centerY + radius * 2.05);
  context.restore();
}

function drawBadgeRibbon(context, width, height, badgeText) {
  if (!badgeText) return;
  const text = badgeText.toUpperCase();
  const fontSize = Math.min(width, height) * 0.028;
  context.save();
  context.font = `800 ${fontSize}px ${TAGLINE_FONT_STACK}`;
  const textWidth = context.measureText(text).width;
  const ribbonLength = textWidth + fontSize * 2.6;
  const ribbonHeight = fontSize * 1.9;
  // Diagonal ribbon across the top-left corner.
  context.translate(width * 0.045, height * 0.1);
  context.rotate(-Math.PI / 12);
  const ribbonGradient = context.createLinearGradient(0, 0, ribbonLength, 0);
  ribbonGradient.addColorStop(0, "#ff2e88");
  ribbonGradient.addColorStop(1, "#ff9a3d");
  context.fillStyle = ribbonGradient;
  context.shadowColor = "rgba(0,0,0,0.55)";
  context.shadowBlur = fontSize * 0.4;
  context.shadowOffsetY = fontSize * 0.18;
  context.fillRect(0, -ribbonHeight / 2, ribbonLength, ribbonHeight);
  context.shadowColor = "transparent";
  context.shadowOffsetY = 0;
  context.fillStyle = "#ffffff";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(text, ribbonLength / 2, fontSize * 0.05);
  context.restore();
}

// ---------------------------------------------------------------------------
// Panel frames
// ---------------------------------------------------------------------------

function strokePanelFrames(context, width, height, layout, gutter) {
  context.save();
  context.strokeStyle = "#05010c";
  context.lineWidth = gutter;
  for (const panel of layout.panels) {
    context.strokeRect(
      panel.x * width + gutter / 2,
      panel.y * height + gutter / 2,
      panel.w * width - gutter,
      panel.h * height - gutter,
    );
  }
  context.restore();
}

function strokeSelectedPanel(context, width, height, layout, selectedIndex) {
  if (selectedIndex == null || selectedIndex < 0) return;
  const panel = layout.panels[selectedIndex];
  if (!panel) return;
  context.save();
  context.strokeStyle = "#ffd23d";
  context.lineWidth = Math.max(3, width * 0.006);
  context.setLineDash([width * 0.02, width * 0.012]);
  context.strokeRect(
    panel.x * width + context.lineWidth,
    panel.y * height + context.lineWidth,
    panel.w * width - context.lineWidth * 2,
    panel.h * height - context.lineWidth * 2,
  );
  context.restore();
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

export function drawCover(context, width, height, state, options = {}) {
  const layout = COVER_LAYOUTS[state.layout] ?? COVER_LAYOUTS.grid6;
  const grade = COLOR_GRADES[state.grade] ?? COLOR_GRADES.sunset;
  const gutter = Math.max(6, Math.round(width * 0.008));

  context.save();
  context.fillStyle = "#05010c";
  context.fillRect(0, 0, width, height);

  layout.panels.forEach((panelFraction, panelIndex) => {
    const rect = {
      x: panelFraction.x * width + gutter / 2,
      y: panelFraction.y * height + gutter / 2,
      w: panelFraction.w * width - gutter,
      h: panelFraction.h * height - gutter,
    };
    const panelState = state.panels[panelIndex] ?? createPanelState();
    if (panelState.image) {
      drawPhotoCoverFit(context, panelState.image, rect, panelState, grade.filter);
    } else {
      drawPlaceholderPanel(context, rect, panelIndex, grade);
    }
  });

  applyGradeWash(context, width, height, grade);
  strokePanelFrames(context, width, height, layout, gutter);
  drawBadgeRibbon(context, width, height, state.badge);
  drawWantedStars(context, width, height, state.stars);
  drawCoverTitle(context, width, height, state, grade);

  // Outer frame.
  context.strokeStyle = "#000000";
  context.lineWidth = Math.max(8, width * 0.012);
  context.strokeRect(0, 0, width, height);

  if (options.showSelection) {
    strokeSelectedPanel(context, width, height, layout, options.selectedPanelIndex);
  }
  context.restore();
}

// Hit-test a point (in canvas pixels) against the current layout; returns
// the panel index or -1. Used by the editor for click-select and dragging.
export function panelIndexAtPoint(layoutKey, width, height, pointX, pointY) {
  const layout = COVER_LAYOUTS[layoutKey] ?? COVER_LAYOUTS.grid6;
  for (let index = 0; index < layout.panels.length; index++) {
    const panel = layout.panels[index];
    if (
      pointX >= panel.x * width && pointX <= (panel.x + panel.w) * width &&
      pointY >= panel.y * height && pointY <= (panel.y + panel.h) * height
    ) {
      return index;
    }
  }
  return -1;
}
