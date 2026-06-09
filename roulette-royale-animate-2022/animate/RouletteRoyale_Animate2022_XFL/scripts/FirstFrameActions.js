/*
 * Adobe Animate 2022 - Scene 1, Frame 1 actions
 * Document Type: HTML5 Canvas
 * Canvas: 1920x1080, 60 FPS
 *
 * Add src/roulette-royale.js as an included JavaScript file in Publish Settings,
 * then place this action on the actions layer in Frame 1.
 */
(function () {
  "use strict";

  if (!window.RouletteRoyale) {
    throw new Error("Roulette Royale runtime is missing. Include src/roulette-royale.js in Publish Settings.");
  }

  var canvas = document.getElementById("canvas");
  if (!canvas) {
    throw new Error("Adobe Animate canvas element was not found.");
  }

  window.RouletteRoyale.bootstrap({
    canvasId: "canvas",
    containerId: "animation_container",
    overlayId: "dom_overlay_container"
  });
}());
