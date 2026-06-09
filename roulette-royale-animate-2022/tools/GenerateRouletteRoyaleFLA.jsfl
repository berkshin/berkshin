/*
 * Roulette Royale - Adobe Animate 2022 FLA Generator
 *
 * Run inside Adobe Animate 2022:
 *   File > Scripts > Run Script...
 *   Select this file.
 *
 * Output:
 *   deliverables/RouletteRoyale_Animate2022.fla
 *
 * This script must be executed by Adobe Animate because only Animate can write
 * a native, verified FLA document.
 */
(function () {
  var PROJECT_NAME = "Roulette Royale";
  var STAGE_WIDTH = 1920;
  var STAGE_HEIGHT = 1080;
  var FPS = 60;
  var BACKGROUND = "#050505";

  function fail(message) {
    fl.trace("[Roulette Royale Generator] ERROR: " + message);
    throw new Error(message);
  }

  function log(message) {
    fl.trace("[Roulette Royale Generator] " + message);
  }

  function normalizeUri(uri) {
    return uri.replace(/\\/g, "/");
  }

  function parentUri(uri) {
    uri = normalizeUri(uri);
    return uri.slice(0, uri.lastIndexOf("/"));
  }

  function joinUri(base, child) {
    return normalizeUri(base + "/" + child);
  }

  function ensureFolder(uri) {
    if (!FLfile.exists(uri)) {
      FLfile.createFolder(uri);
    }
  }

  function readRequired(uri) {
    if (!FLfile.exists(uri)) {
      fail("Required file not found: " + uri);
    }
    var contents = FLfile.read(uri);
    if (!contents || contents.length === 0) {
      fail("Required file is empty: " + uri);
    }
    return contents;
  }

  function setDocumentProperties(dom) {
    dom.width = STAGE_WIDTH;
    dom.height = STAGE_HEIGHT;
    dom.frameRate = FPS;
    dom.backgroundColor = BACKGROUND;
  }

  function getScriptRoot() {
    var scriptUri = fl.scriptURI;
    if (!scriptUri || scriptUri.length === 0) {
      fail("fl.scriptURI is unavailable. Save this JSFL file before running it.");
    }
    return parentUri(parentUri(scriptUri));
  }

  function createHtml5CanvasDocument() {
    var dom = null;
    try {
      dom = fl.createDocument("htmlcanvas");
    } catch (error) {
      dom = null;
    }
    if (!dom) {
      try {
        dom = fl.createDocument("HTML5 Canvas");
      } catch (fallbackError) {
        dom = null;
      }
    }
    if (!dom) {
      fail("Could not create an HTML5 Canvas document. Confirm Adobe Animate 2022 supports HTML5 Canvas documents.");
    }
    setDocumentProperties(dom);
    return dom;
  }

  function resetTimeline(timeline) {
    while (timeline.layers.length > 1) {
      timeline.deleteLayer(0);
    }
    timeline.layers[0].name = "background";
    timeline.layers[0].locked = false;
    timeline.layers[0].visible = true;
  }

  function addLayer(timeline, name) {
    timeline.addNewLayer(name, "normal", false);
    timeline.layers[0].name = name;
    timeline.layers[0].locked = false;
    timeline.layers[0].visible = true;
    return timeline.layers[0];
  }

  function ensureFrameAction(timeline, layerName, script) {
    var layerIndex = -1;
    var i;
    for (i = 0; i < timeline.layers.length; i += 1) {
      if (timeline.layers[i].name === layerName) {
        layerIndex = i;
        break;
      }
    }
    if (layerIndex === -1) {
      addLayer(timeline, layerName);
      layerIndex = 0;
    }
    timeline.currentLayer = layerIndex;
    timeline.currentFrame = 0;
    timeline.layers[layerIndex].frames[0].name = "scene_main_menu";
    timeline.layers[layerIndex].frames[0].actionScript = script;
  }

  function createText(dom, name, text, x, y, width, height, size, color) {
    dom.addNewText({ left: x, top: y, right: x + width, bottom: y + height });
    var element = dom.selection[0];
    element.name = name;
    element.setTextString(text);
    element.setTextAttr("face", "Arial");
    element.setTextAttr("size", size);
    element.setTextAttr("fillColor", color);
    element.setTextAttr("bold", true);
    element.setTextAttr("alignment", "center");
    return element;
  }

  function createRect(dom, name, x, y, width, height, fillColor, strokeColor) {
    dom.addNewRectangle({ left: x, top: y, right: x + width, bottom: y + height }, 16);
    var element = dom.selection[0];
    element.name = name;
    dom.setFillColor(fillColor);
    dom.setStrokeColor(strokeColor || "#d8ad49");
    return element;
  }

  function createCircle(dom, name, x, y, radius, fillColor, strokeColor) {
    dom.addNewOval({ left: x - radius, top: y - radius, right: x + radius, bottom: y + radius });
    var element = dom.selection[0];
    element.name = name;
    dom.setFillColor(fillColor);
    dom.setStrokeColor(strokeColor || "#f7e9c1");
    return element;
  }

  function convertSelectionToSymbol(dom, name, type, registration) {
    if (!dom.selection || dom.selection.length === 0) {
      fail("Cannot create symbol without a selected element: " + name);
    }
    dom.convertToSymbol(type, name, registration || "center");
    dom.selection[0].name = name;
  }

  function createLibrarySymbols(dom) {
    createRect(dom, "Button_Gold_Art", 0, 0, 420, 96, "#d8ad49", "#ffdf89");
    convertSelectionToSymbol(dom, "Button_Gold", "button", "center");

    createRect(dom, "Button_Green_Art", 0, 0, 420, 96, "#0b5b34", "#61c995");
    convertSelectionToSymbol(dom, "Button_Green", "button", "center");

    createRect(dom, "Button_Danger_Art", 0, 0, 420, 96, "#8f1818", "#ff7777");
    convertSelectionToSymbol(dom, "Button_Danger", "button", "center");

    createCircle(dom, "RouletteBall_Art", 0, 0, 18, "#f4f4f4", "#ffffff");
    convertSelectionToSymbol(dom, "RouletteBall", "movie clip", "center");

    createCircle(dom, "Chip_10_Art", 0, 0, 56, "#245bff", "#f7e9c1");
    convertSelectionToSymbol(dom, "Chip_10", "movie clip", "center");

    createCircle(dom, "Chip_50_Art", 0, 0, 56, "#eeeeee", "#d8ad49");
    convertSelectionToSymbol(dom, "Chip_50", "movie clip", "center");

    createCircle(dom, "Chip_100_Art", 0, 0, 56, "#d82727", "#f7e9c1");
    convertSelectionToSymbol(dom, "Chip_100", "movie clip", "center");

    createCircle(dom, "Chip_500_Art", 0, 0, 56, "#4f1a8d", "#f7e9c1");
    convertSelectionToSymbol(dom, "Chip_500", "movie clip", "center");

    createCircle(dom, "RouletteWheel_European_Art", 0, 0, 280, "#111111", "#d8ad49");
    convertSelectionToSymbol(dom, "RouletteWheel_European", "movie clip", "center");

    createRect(dom, "BettingTable_European_Art", 0, 0, 820, 860, "#06351f", "#d8ad49");
    convertSelectionToSymbol(dom, "BettingTable_European", "movie clip", "center");

    createRect(dom, "Popup_Settings_Art", 0, 0, 800, 790, "#0f0d0a", "#d8ad49");
    convertSelectionToSymbol(dom, "Popup_Settings", "movie clip", "center");

    createRect(dom, "Popup_Information_Art", 0, 0, 800, 790, "#0f0d0a", "#d8ad49");
    convertSelectionToSymbol(dom, "Popup_Information", "movie clip", "center");

    createRect(dom, "Popup_Exit_Art", 0, 0, 800, 790, "#0f0d0a", "#d8ad49");
    convertSelectionToSymbol(dom, "Popup_Exit", "movie clip", "center");
  }

  function addSymbolInstance(dom, libraryName, instanceName, x, y) {
    dom.library.addItemToDocument({ x: x, y: y }, libraryName);
    if (dom.selection && dom.selection[0]) {
      dom.selection[0].name = instanceName;
    }
  }

  function buildStageLayout(dom) {
    var timeline = dom.getTimeline();
    resetTimeline(timeline);
    addLayer(timeline, "hud");
    addLayer(timeline, "wheel_and_ball");
    addLayer(timeline, "betting_table");
    addLayer(timeline, "chip_selector");
    addLayer(timeline, "controls");
    addLayer(timeline, "result_overlay");
    addLayer(timeline, "menu_buttons");
    addLayer(timeline, "ui_popups");
    addLayer(timeline, "title_glow");
    addLayer(timeline, "actions");

    timeline.currentLayer = timeline.layers.length - 1;
    createRect(dom, "bgCasinoDark", 0, 0, STAGE_WIDTH, STAGE_HEIGHT, BACKGROUND, BACKGROUND);

    createText(dom, "txtTitleRoulette", "ROULETTE", 500, 238, 920, 120, 98, "#ffdf89");
    createText(dom, "txtTitleRoyale", "ROYALE", 500, 334, 920, 128, 104, "#ffffff");

    addSymbolInstance(dom, "Button_Gold", "btnPlay", 960, 559);
    addSymbolInstance(dom, "Button_Green", "btnSettings", 960, 656);
    addSymbolInstance(dom, "Button_Green", "btnInfo", 960, 746);
    addSymbolInstance(dom, "Button_Danger", "btnExit", 960, 836);

    addSymbolInstance(dom, "RouletteWheel_European", "mcRouletteWheel", 377, 478);
    addSymbolInstance(dom, "RouletteBall", "mcBall", 596, 311);
    addSymbolInstance(dom, "BettingTable_European", "panelBettingTable", 1060, 540);
    addSymbolInstance(dom, "Chip_10", "chip10", 150, 886);
    addSymbolInstance(dom, "Chip_50", "chip50", 292, 886);
    addSymbolInstance(dom, "Chip_100", "chip100", 434, 886);
    addSymbolInstance(dom, "Chip_500", "chip500", 576, 886);
    addSymbolInstance(dom, "Button_Gold", "btnSpin", 1650, 882);
    addSymbolInstance(dom, "Button_Green", "btnResetBets", 1650, 968);
    addSymbolInstance(dom, "Button_Green", "btnBackMenu", 202, 81);
  }

  function buildFrameScript(runtimeSource) {
    return [
      "/* Roulette Royale runtime embedded by GenerateRouletteRoyaleFLA.jsfl. */",
      runtimeSource,
      "",
      "(function () {",
      "  if (!window.RouletteRoyale) {",
      "    throw new Error('Roulette Royale runtime failed to initialize.');",
      "  }",
      "  window.RouletteRoyale.bootstrap({",
      "    canvasId: 'canvas',",
      "    containerId: 'animation_container',",
      "    overlayId: 'dom_overlay_container'",
      "  });",
      "}());"
    ].join("\\n");
  }

  function saveFla(dom, projectRoot) {
    var deliverablesUri = joinUri(projectRoot, "deliverables");
    var flaUri = joinUri(deliverablesUri, "RouletteRoyale_Animate2022.fla");
    ensureFolder(deliverablesUri);
    if (FLfile.exists(flaUri)) {
      FLfile.remove(flaUri);
    }
    var saved = fl.saveDocument(dom, flaUri);
    if (!saved || !FLfile.exists(flaUri)) {
      fail("Adobe Animate did not save the FLA: " + flaUri);
    }
    log("Saved native FLA: " + flaUri);
  }

  function main() {
    var projectRoot = getScriptRoot();
    var runtimeUri = joinUri(projectRoot, "src/roulette-royale.js");
    var runtimeSource = readRequired(runtimeUri);
    var dom = createHtml5CanvasDocument();
    var timeline = dom.getTimeline();

    createLibrarySymbols(dom);
    buildStageLayout(dom);
    ensureFrameAction(timeline, "actions", buildFrameScript(runtimeSource));
    saveFla(dom, projectRoot);

    log(PROJECT_NAME + " FLA generation complete.");
  }

  main();
}());
