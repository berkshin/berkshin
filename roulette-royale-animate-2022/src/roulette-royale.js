/* global window, document, localStorage */
/*
 * Roulette Royale
 * Target: Adobe Animate 2022, HTML5 Canvas document, 1920x1080, 60 FPS.
 * The file is intentionally namespaced so it can be loaded from Animate Publish
 * Settings or pasted into Scene 1 frame actions without build tooling.
 */
(function (global) {
  "use strict";

  // ---------------------------------------------------------------------------
  // Constants and shared helpers
  // ---------------------------------------------------------------------------
  const RR = {};

  RR.Constants = Object.freeze({
    WIDTH: 1920,
    HEIGHT: 1080,
    FPS: 60,
    STARTING_BALANCE: 1000,
    CHIP_VALUES: [10, 50, 100, 500],
    NUMBERS: Array.from({ length: 37 }, (_, index) => index),
    EUROPEAN_WHEEL_ORDER: [
      0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10,
      5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26
    ],
    RED_NUMBERS: new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]),
    BET_TYPES: Object.freeze({
      SINGLE: "single",
      RED: "red",
      BLACK: "black",
      EVEN: "even",
      ODD: "odd",
      LOW: "low",
      HIGH: "high"
    }),
    PAYOUTS: Object.freeze({
      single: 35,
      red: 1,
      black: 1,
      even: 1,
      odd: 1,
      low: 1,
      high: 1
    }),
    COLORS: Object.freeze({
      felt: "#06351f",
      feltDark: "#04180f",
      gold: "#d8ad49",
      goldBright: "#ffdf89",
      red: "#a61919",
      black: "#111111",
      green: "#0f7d40",
      cream: "#f7e9c1",
      text: "#fff8dd",
      muted: "#b69b64",
      panel: "rgba(12, 12, 12, 0.88)",
      panelSolid: "#0f0d0a"
    })
  });

  const C = RR.Constants;
  const TAU = Math.PI * 2;

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  function formatCredits(value) {
    return `${Math.round(value)} Credits`;
  }

  function numberColor(number) {
    if (number === 0) {
      return "green";
    }
    return C.RED_NUMBERS.has(number) ? "red" : "black";
  }

  function safeStorageGet(key, fallback) {
    try {
      const value = global.localStorage && global.localStorage.getItem(key);
      return value === null || value === undefined ? fallback : JSON.parse(value);
    } catch (error) {
      return fallback;
    }
  }

  function safeStorageSet(key, value) {
    try {
      if (global.localStorage) {
        global.localStorage.setItem(key, JSON.stringify(value));
      }
    } catch (error) {
      // Storage can be blocked in embedded environments. Runtime continues.
    }
  }

  function createLinearGradient(ctx, x0, y0, x1, y1, stops) {
    const gradient = ctx.createLinearGradient(x0, y0, x1, y1);
    stops.forEach((stop) => gradient.addColorStop(stop[0], stop[1]));
    return gradient;
  }

  function createRadialGradient(ctx, x0, y0, r0, x1, y1, r1, stops) {
    const gradient = ctx.createRadialGradient(x0, y0, r0, x1, y1, r1);
    stops.forEach((stop) => gradient.addColorStop(stop[0], stop[1]));
    return gradient;
  }

  function drawRoundRect(ctx, x, y, width, height, radius) {
    const r = Math.min(radius, width / 2, height / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + width, y, x + width, y + height, r);
    ctx.arcTo(x + width, y + height, x, y + height, r);
    ctx.arcTo(x, y + height, x, y, r);
    ctx.arcTo(x, y, x + width, y, r);
    ctx.closePath();
  }

  function drawText(ctx, text, x, y, options = {}) {
    const {
      size = 32,
      color = C.COLORS.text,
      align = "left",
      baseline = "alphabetic",
      weight = "700",
      family = "Arial, Helvetica, sans-serif",
      stroke = null,
      strokeWidth = 0,
      shadow = null
    } = options;

    ctx.save();
    ctx.font = `${weight} ${size}px ${family}`;
    ctx.textAlign = align;
    ctx.textBaseline = baseline;
    if (shadow) {
      ctx.shadowColor = shadow.color;
      ctx.shadowBlur = shadow.blur;
      ctx.shadowOffsetX = shadow.x || 0;
      ctx.shadowOffsetY = shadow.y || 0;
    }
    if (stroke && strokeWidth > 0) {
      ctx.lineWidth = strokeWidth;
      ctx.strokeStyle = stroke;
      ctx.strokeText(text, x, y);
    }
    ctx.fillStyle = color;
    ctx.fillText(text, x, y);
    ctx.restore();
  }

  function pointerFromEvent(event, canvas) {
    const rect = canvas.getBoundingClientRect();
    const clientX = event.touches ? event.touches[0].clientX : event.clientX;
    const clientY = event.touches ? event.touches[0].clientY : event.clientY;
    return {
      x: ((clientX - rect.left) / rect.width) * C.WIDTH,
      y: ((clientY - rect.top) / rect.height) * C.HEIGHT
    };
  }

  // ---------------------------------------------------------------------------
  // Event system and state managers
  // ---------------------------------------------------------------------------
  class EventBus {
    constructor() {
      this.listeners = new Map();
    }

    on(eventName, handler) {
      if (!this.listeners.has(eventName)) {
        this.listeners.set(eventName, new Set());
      }
      this.listeners.get(eventName).add(handler);
      return () => this.off(eventName, handler);
    }

    off(eventName, handler) {
      const handlers = this.listeners.get(eventName);
      if (handlers) {
        handlers.delete(handler);
      }
    }

    emit(eventName, payload) {
      const handlers = this.listeners.get(eventName);
      if (!handlers) {
        return;
      }
      handlers.forEach((handler) => {
        try {
          handler(payload);
        } catch (error) {
          console.error(`Roulette Royale event error: ${eventName}`, error);
        }
      });
    }
  }

  class BalanceManager {
    constructor(startingBalance) {
      this.startingBalance = startingBalance;
      this.balance = startingBalance;
    }

    canDebit(amount) {
      return Number.isFinite(amount) && amount > 0 && this.balance >= amount;
    }

    debit(amount) {
      if (!this.canDebit(amount)) {
        return false;
      }
      this.balance -= amount;
      return true;
    }

    credit(amount) {
      if (!Number.isFinite(amount) || amount <= 0) {
        return;
      }
      this.balance += amount;
    }

    reset() {
      this.balance = this.startingBalance;
    }
  }

  class RouletteEngine {
    constructor(randomSource = Math.random) {
      this.randomSource = randomSource;
    }

    spin() {
      const index = Math.floor(this.randomSource() * C.NUMBERS.length);
      return C.NUMBERS[index];
    }

    matchesBet(bet, winningNumber) {
      switch (bet.type) {
        case C.BET_TYPES.SINGLE:
          return bet.value === winningNumber;
        case C.BET_TYPES.RED:
          return winningNumber !== 0 && numberColor(winningNumber) === "red";
        case C.BET_TYPES.BLACK:
          return winningNumber !== 0 && numberColor(winningNumber) === "black";
        case C.BET_TYPES.EVEN:
          return winningNumber !== 0 && winningNumber % 2 === 0;
        case C.BET_TYPES.ODD:
          return winningNumber !== 0 && winningNumber % 2 === 1;
        case C.BET_TYPES.LOW:
          return winningNumber >= 1 && winningNumber <= 18;
        case C.BET_TYPES.HIGH:
          return winningNumber >= 19 && winningNumber <= 36;
        default:
          return false;
      }
    }

    resolveBets(bets, winningNumber) {
      return bets.reduce((summary, bet) => {
        const isWin = this.matchesBet(bet, winningNumber);
        const multiplier = C.PAYOUTS[bet.type] || 0;
        if (isWin) {
          const credit = bet.amount * (multiplier + 1);
          summary.credit += credit;
          summary.profit += bet.amount * multiplier;
          summary.winningBets.push({ ...bet, credit, profit: bet.amount * multiplier });
        } else {
          summary.losingBets.push({ ...bet });
        }
        return summary;
      }, { credit: 0, profit: 0, winningBets: [], losingBets: [] });
    }
  }

  class BetManager {
    constructor(balanceManager, eventBus) {
      this.balanceManager = balanceManager;
      this.eventBus = eventBus;
      this.activeChip = C.CHIP_VALUES[0];
      this.bets = [];
    }

    setActiveChip(value) {
      if (!C.CHIP_VALUES.includes(value)) {
        return false;
      }
      this.activeChip = value;
      this.eventBus.emit("chip:selected", value);
      return true;
    }

    placeBet(type, value, label) {
      const amount = this.activeChip;
      if (!this.balanceManager.debit(amount)) {
        this.eventBus.emit("bet:rejected", { reason: "INSUFFICIENT_BALANCE", amount });
        return false;
      }

      const existing = this.bets.find((bet) => bet.type === type && bet.value === value);
      if (existing) {
        existing.amount += amount;
      } else {
        this.bets.push({ type, value, amount, label });
      }

      this.eventBus.emit("bet:placed", { type, value, amount, label });
      return true;
    }

    clearBets({ refund = true } = {}) {
      const total = this.totalBet();
      if (refund && total > 0) {
        this.balanceManager.credit(total);
      }
      this.bets = [];
      this.eventBus.emit("bet:cleared", { refunded: refund ? total : 0 });
    }

    totalBet() {
      return this.bets.reduce((sum, bet) => sum + bet.amount, 0);
    }

    snapshot() {
      return this.bets.map((bet) => ({ ...bet }));
    }
  }

  class SettingsManager {
    constructor() {
      const stored = safeStorageGet("roulette-royale-settings", null);
      this.values = {
        sound: stored && typeof stored.sound === "boolean" ? stored.sound : true,
        fastAnimations: stored && typeof stored.fastAnimations === "boolean" ? stored.fastAnimations : false,
        showHints: stored && typeof stored.showHints === "boolean" ? stored.showHints : true
      };
    }

    toggle(key) {
      if (!(key in this.values)) {
        return;
      }
      this.values[key] = !this.values[key];
      safeStorageSet("roulette-royale-settings", this.values);
    }

    get(key) {
      return this.values[key];
    }
  }

  // ---------------------------------------------------------------------------
  // Reusable UI controls
  // ---------------------------------------------------------------------------
  class Button {
    constructor({ id, x, y, width, height, label, onClick, variant = "gold" }) {
      this.id = id;
      this.x = x;
      this.y = y;
      this.width = width;
      this.height = height;
      this.label = label;
      this.onClick = onClick;
      this.variant = variant;
      this.hover = false;
      this.disabled = false;
    }

    contains(point) {
      return point.x >= this.x && point.x <= this.x + this.width &&
        point.y >= this.y && point.y <= this.y + this.height;
    }

    draw(ctx, alpha = 1) {
      const isGold = this.variant === "gold";
      const isDanger = this.variant === "danger";
      const top = isGold ? "#ffe29a" : isDanger ? "#b52a2a" : "#1f5f43";
      const bottom = isGold ? "#9f6f20" : isDanger ? "#5b1111" : "#0b2f21";
      const stroke = isGold ? C.COLORS.goldBright : isDanger ? "#ff7777" : "#61c995";

      ctx.save();
      ctx.globalAlpha *= this.disabled ? alpha * 0.45 : alpha;
      ctx.shadowColor = this.hover && !this.disabled ? "rgba(255, 220, 132, 0.85)" : "rgba(0, 0, 0, 0.55)";
      ctx.shadowBlur = this.hover && !this.disabled ? 28 : 12;
      ctx.shadowOffsetY = 6;
      drawRoundRect(ctx, this.x, this.y, this.width, this.height, 18);
      ctx.fillStyle = createLinearGradient(ctx, this.x, this.y, this.x, this.y + this.height, [
        [0, top],
        [0.42, isGold ? C.COLORS.gold : top],
        [1, bottom]
      ]);
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = stroke;
      ctx.stroke();

      drawText(ctx, this.label, this.x + this.width / 2, this.y + this.height / 2 + 2, {
        size: 30,
        align: "center",
        baseline: "middle",
        color: isGold ? "#241708" : C.COLORS.text,
        stroke: isGold ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.5)",
        strokeWidth: 2
      });
      ctx.restore();
    }
  }

  class Popup {
    constructor({ title, lines, actions = [] }) {
      this.title = title;
      this.lines = lines;
      this.actions = actions;
      this.buttons = [];
      this.visible = false;
    }

    open() {
      this.visible = true;
      this.layoutButtons();
    }

    close() {
      this.visible = false;
    }

    layoutButtons() {
      const actionStartY = this.actions.length > 2 ? 610 : 705;
      const actionGap = this.actions.length > 2 ? 82 : 88;
      this.buttons = this.actions.map((action, index) => new Button({
        id: action.id,
        x: 720,
        y: actionStartY + index * actionGap,
        width: 480,
        height: 64,
        label: action.label,
        variant: action.variant || "green",
        onClick: action.onClick
      }));
      this.buttons.push(new Button({
        id: "closePopup",
        x: 720,
        y: this.actions.length > 2 ? 880 : 900,
        width: 480,
        height: 64,
        label: "CLOSE",
        variant: "gold",
        onClick: () => this.close()
      }));
    }

    handlePointerMove(point) {
      if (!this.visible) {
        return false;
      }
      this.buttons.forEach((button) => {
        button.hover = button.contains(point);
      });
      return true;
    }

    handlePointerDown(point) {
      if (!this.visible) {
        return false;
      }
      const button = this.buttons.find((candidate) => candidate.contains(point));
      if (button && !button.disabled) {
        button.onClick();
      }
      return true;
    }

    draw(ctx) {
      if (!this.visible) {
        return;
      }

      ctx.save();
      ctx.fillStyle = "rgba(0, 0, 0, 0.68)";
      ctx.fillRect(0, 0, C.WIDTH, C.HEIGHT);
      ctx.shadowColor = "rgba(255, 220, 132, 0.35)";
      ctx.shadowBlur = 32;
      drawRoundRect(ctx, 560, 170, 800, 790, 28);
      ctx.fillStyle = createLinearGradient(ctx, 560, 170, 560, 960, [
        [0, "#21170c"],
        [0.55, "#090807"],
        [1, "#171007"]
      ]);
      ctx.fill();
      ctx.lineWidth = 4;
      ctx.strokeStyle = C.COLORS.gold;
      ctx.stroke();

      drawText(ctx, this.title, 960, 260, {
        size: 52,
        align: "center",
        color: C.COLORS.goldBright,
        shadow: { color: "rgba(255, 210, 107, 0.45)", blur: 20 }
      });

      this.lines.forEach((line, index) => {
        drawText(ctx, line, 640, 350 + index * 48, {
          size: 28,
          weight: "500",
          color: C.COLORS.cream
        });
      });

      this.buttons.forEach((button) => button.draw(ctx));
      ctx.restore();
    }
  }

  // ---------------------------------------------------------------------------
  // Scene management
  // ---------------------------------------------------------------------------
  class Scene {
    constructor(app) {
      this.app = app;
      this.buttons = [];
    }

    enter() {}

    exit() {}

    update() {}

    draw() {}

    handlePointerDown(point) {
      const button = this.buttons.find((candidate) => candidate.contains(point));
      if (button && !button.disabled) {
        button.onClick();
        return true;
      }
      return false;
    }

    handlePointerMove(point) {
      this.buttons.forEach((button) => {
        button.hover = button.contains(point);
      });
      return false;
    }
  }

  class SceneManager {
    constructor(app) {
      this.app = app;
      this.scenes = new Map();
      this.current = null;
    }

    register(name, scene) {
      this.scenes.set(name, scene);
    }

    goTo(name) {
      const next = this.scenes.get(name);
      if (!next) {
        throw new Error(`Scene not registered: ${name}`);
      }
      if (this.current) {
        this.current.exit();
      }
      this.current = next;
      this.current.enter();
    }

    update(delta) {
      if (this.current) {
        this.current.update(delta);
      }
    }

    draw(ctx) {
      if (this.current) {
        this.current.draw(ctx);
      }
    }

    handlePointerDown(point) {
      return this.current ? this.current.handlePointerDown(point) : false;
    }

    handlePointerMove(point) {
      return this.current ? this.current.handlePointerMove(point) : false;
    }
  }

  // ---------------------------------------------------------------------------
  // Shared casino art drawing
  // ---------------------------------------------------------------------------
  class CasinoArt {
    static drawBackground(ctx, intensity = 1) {
      ctx.save();
      ctx.fillStyle = createRadialGradient(ctx, 960, 380, 80, 960, 540, 1180, [
        [0, `rgba(72, 38, 14, ${0.62 * intensity})`],
        [0.45, "#0a100b"],
        [1, "#020202"]
      ]);
      ctx.fillRect(0, 0, C.WIDTH, C.HEIGHT);

      ctx.globalAlpha = 0.16 * intensity;
      ctx.strokeStyle = C.COLORS.gold;
      ctx.lineWidth = 2;
      for (let x = -220; x < C.WIDTH + 220; x += 110) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x + 420, C.HEIGHT);
        ctx.stroke();
      }
      for (let x = 0; x < C.WIDTH + 440; x += 110) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x - 420, C.HEIGHT);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      ctx.fillStyle = createLinearGradient(ctx, 0, 0, 0, C.HEIGHT, [
        [0, "rgba(255, 222, 132, 0.09)"],
        [0.18, "rgba(255, 222, 132, 0)"],
        [0.78, "rgba(0, 0, 0, 0.18)"],
        [1, "rgba(0, 0, 0, 0.7)"]
      ]);
      ctx.fillRect(0, 0, C.WIDTH, C.HEIGHT);
      ctx.restore();
    }

    static drawPanel(ctx, x, y, width, height, title = "") {
      ctx.save();
      ctx.shadowColor = "rgba(0,0,0,0.55)";
      ctx.shadowBlur = 18;
      ctx.shadowOffsetY = 8;
      drawRoundRect(ctx, x, y, width, height, 24);
      ctx.fillStyle = createLinearGradient(ctx, x, y, x, y + height, [
        [0, "rgba(26, 21, 14, 0.94)"],
        [0.6, "rgba(5, 20, 12, 0.92)"],
        [1, "rgba(7, 7, 7, 0.94)"]
      ]);
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = "rgba(216, 173, 73, 0.85)";
      ctx.stroke();
      if (title) {
        drawText(ctx, title, x + width / 2, y + 42, {
          size: 27,
          align: "center",
          color: C.COLORS.goldBright
        });
      }
      ctx.restore();
    }

    static drawChip(ctx, x, y, radius, value, selected = false) {
      const colors = {
        10: ["#245bff", "#0a1f7d"],
        50: ["#efefef", "#9f9f9f"],
        100: ["#d82727", "#721111"],
        500: ["#4f1a8d", "#220837"]
      };
      const palette = colors[value] || ["#d8ad49", "#80591d"];

      ctx.save();
      ctx.shadowColor = selected ? "rgba(255, 225, 137, 0.95)" : "rgba(0, 0, 0, 0.6)";
      ctx.shadowBlur = selected ? 30 : 12;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, TAU);
      ctx.fillStyle = createRadialGradient(ctx, x - radius * 0.3, y - radius * 0.35, 4, x, y, radius, [
        [0, "#ffffff"],
        [0.22, palette[0]],
        [1, palette[1]]
      ]);
      ctx.fill();
      ctx.lineWidth = selected ? 6 : 4;
      ctx.strokeStyle = selected ? C.COLORS.goldBright : C.COLORS.cream;
      ctx.stroke();

      ctx.lineWidth = 7;
      ctx.strokeStyle = "rgba(255, 255, 255, 0.85)";
      for (let i = 0; i < 8; i += 1) {
        const angle = (i / 8) * TAU;
        ctx.beginPath();
        ctx.arc(x, y, radius - 8, angle, angle + 0.2);
        ctx.stroke();
      }

      drawText(ctx, String(value), x, y + 1, {
        size: radius * 0.62,
        align: "center",
        baseline: "middle",
        color: value === 50 ? "#111111" : "#ffffff",
        stroke: value === 50 ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.6)",
        strokeWidth: 3
      });
      ctx.restore();
    }

    static drawStatusBadge(ctx, x, y, width, label, value, valueColor = C.COLORS.text) {
      drawRoundRect(ctx, x, y, width, 72, 14);
      ctx.fillStyle = "rgba(0, 0, 0, 0.62)";
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = "rgba(216, 173, 73, 0.72)";
      ctx.stroke();
      drawText(ctx, label, x + 24, y + 26, {
        size: 19,
        weight: "700",
        color: C.COLORS.muted
      });
      drawText(ctx, value, x + 24, y + 56, {
        size: 29,
        weight: "800",
        color: valueColor
      });
    }
  }

  // ---------------------------------------------------------------------------
  // Scene 1: Main Menu
  // ---------------------------------------------------------------------------
  class MainMenuScene extends Scene {
    constructor(app) {
      super(app);
      this.fade = 0;
      this.settingsPopup = null;
      this.infoPopup = null;
      this.configurePopups();
      this.buttons = [
        new Button({ id: "btnPlay", x: 760, y: 520, width: 400, height: 78, label: "PLAY", onClick: () => app.sceneManager.goTo("game") }),
        new Button({ id: "btnSettings", x: 760, y: 620, width: 400, height: 72, label: "SETTINGS", variant: "green", onClick: () => this.settingsPopup.open() }),
        new Button({ id: "btnInfo", x: 760, y: 710, width: 400, height: 72, label: "INFORMATION", variant: "green", onClick: () => this.infoPopup.open() }),
        new Button({ id: "btnExit", x: 760, y: 800, width: 400, height: 72, label: "EXIT", variant: "danger", onClick: () => app.exitGame() })
      ];
    }

    configurePopups() {
      this.settingsPopup = new Popup({
        title: "SETTINGS",
        lines: [
          "Configure the table presentation for this session.",
          "Sound toggles are stored locally when browser storage is available.",
          "Fast animations shorten spin duration for quick testing."
        ],
        actions: [
          {
            id: "toggleSound",
            label: () => `SOUND: ${this.app.settings.get("sound") ? "ON" : "OFF"}`,
            variant: "green",
            onClick: () => this.app.settings.toggle("sound")
          },
          {
            id: "toggleFastAnimations",
            label: () => `FAST ANIMATIONS: ${this.app.settings.get("fastAnimations") ? "ON" : "OFF"}`,
            variant: "green",
            onClick: () => this.app.settings.toggle("fastAnimations")
          },
          {
            id: "toggleHints",
            label: () => `TABLE HINTS: ${this.app.settings.get("showHints") ? "ON" : "OFF"}`,
            variant: "green",
            onClick: () => this.app.settings.toggle("showHints")
          }
        ]
      });
      const originalLayout = this.settingsPopup.layoutButtons.bind(this.settingsPopup);
      this.settingsPopup.layoutButtons = () => {
        originalLayout();
        this.settingsPopup.buttons.forEach((button) => {
          const action = this.settingsPopup.actions.find((candidate) => candidate.id === button.id);
          if (action && typeof action.label === "function") {
            button.label = action.label();
            const originalClick = button.onClick;
            button.onClick = () => {
              originalClick();
              button.label = action.label();
            };
          }
        });
      };

      this.infoPopup = new Popup({
        title: "HOW TO PLAY",
        lines: [
          "Start with 1000 Credits and choose a chip value.",
          "Place bets on single numbers or outside betting zones.",
          "Single number pays 35:1. Red, Black, Even, Odd, Low, High pay 1:1.",
          "The European wheel uses one zero. Zero loses outside bets.",
          "Press SPIN to launch the wheel and ball animation."
        ]
      });
    }

    enter() {
      this.fade = 0;
      this.settingsPopup.close();
      this.infoPopup.close();
    }

    update(delta) {
      this.fade = clamp(this.fade + delta * 1.35, 0, 1);
    }

    draw(ctx) {
      CasinoArt.drawBackground(ctx, this.fade);

      ctx.save();
      ctx.globalAlpha = this.fade;
      this.drawMenuHero(ctx);
      this.buttons.forEach((button) => button.draw(ctx, this.fade));
      this.settingsPopup.draw(ctx);
      this.infoPopup.draw(ctx);
      ctx.restore();
    }

    drawMenuHero(ctx) {
      ctx.save();
      ctx.translate(960, 330);
      ctx.shadowColor = "rgba(255, 216, 121, 0.78)";
      ctx.shadowBlur = 34;
      drawText(ctx, "ROULETTE", 0, -34, {
        size: 98,
        align: "center",
        color: C.COLORS.goldBright,
        stroke: "#3b2608",
        strokeWidth: 7
      });
      drawText(ctx, "ROYALE", 0, 62, {
        size: 104,
        align: "center",
        color: "#ffffff",
        stroke: C.COLORS.gold,
        strokeWidth: 5
      });
      ctx.restore();

      ctx.save();
      ctx.globalAlpha = 0.92;
      for (let i = 0; i < 10; i += 1) {
        const angle = (i / 10) * TAU + 0.1;
        const x = 960 + Math.cos(angle) * 530;
        const y = 500 + Math.sin(angle) * 260;
        CasinoArt.drawChip(ctx, x, y, 34, C.CHIP_VALUES[i % C.CHIP_VALUES.length], false);
      }
      ctx.restore();

      drawText(ctx, "European single-zero roulette table", 960, 462, {
        size: 28,
        align: "center",
        weight: "500",
        color: C.COLORS.cream
      });
    }

    handlePointerDown(point) {
      if (this.settingsPopup.handlePointerDown(point) || this.infoPopup.handlePointerDown(point)) {
        return true;
      }
      return super.handlePointerDown(point);
    }

    handlePointerMove(point) {
      if (this.settingsPopup.handlePointerMove(point) || this.infoPopup.handlePointerMove(point)) {
        return true;
      }
      return super.handlePointerMove(point);
    }
  }

  // ---------------------------------------------------------------------------
  // Scene 2: Game Scene
  // ---------------------------------------------------------------------------
  class GameScene extends Scene {
    constructor(app) {
      super(app);
      this.roulette = new RouletteEngine();
      this.balance = new BalanceManager(C.STARTING_BALANCE);
      this.bets = new BetManager(this.balance, app.eventBus);
      this.state = "idle";
      this.resultMessage = "Select a chip and place your bets.";
      this.resultNumber = null;
      this.winSummary = null;
      this.elapsedSpin = 0;
      this.spinDuration = 4.8;
      this.wheelAngle = -Math.PI / 2;
      this.ballAngle = -Math.PI / 2;
      this.spinStartWheel = 0;
      this.spinTargetWheel = 0;
      this.spinStartBall = 0;
      this.spinTargetBall = 0;
      this.targetNumber = null;
      this.hitAreas = [];
      this.chipAreas = [];
      this.buttons = [
        new Button({ id: "btnSpin", x: 1500, y: 844, width: 300, height: 76, label: "SPIN", onClick: () => this.startSpin() }),
        new Button({ id: "btnResetBets", x: 1500, y: 936, width: 300, height: 64, label: "RESET BETS", variant: "green", onClick: () => this.resetBets() }),
        new Button({ id: "btnBackMenu", x: 72, y: 50, width: 260, height: 62, label: "MENU", variant: "green", onClick: () => this.backToMenu() })
      ];
      this.createBettingLayout();
      this.bindEvents();
    }

    bindEvents() {
      this.app.eventBus.on("bet:rejected", () => {
        this.resultMessage = "Not enough credits for that chip.";
      });
      this.app.eventBus.on("bet:placed", (payload) => {
        this.resultMessage = `${payload.label} bet placed for ${payload.amount}.`;
      });
      this.app.eventBus.on("bet:cleared", (payload) => {
        this.resultMessage = payload.refunded > 0 ? `Returned ${payload.refunded} credits.` : "No active bets to reset.";
      });
    }

    enter() {
      this.state = "idle";
      this.resultMessage = "Select a chip and place your bets.";
      this.buttons.forEach((button) => {
        button.disabled = false;
      });
    }

    createBettingLayout() {
      this.hitAreas = [];
      const gridX = 820;
      const gridY = 168;
      const cellW = 86;
      const cellH = 54;
      const tableNumbers = [
        [3, 2, 1],
        [6, 5, 4],
        [9, 8, 7],
        [12, 11, 10],
        [15, 14, 13],
        [18, 17, 16],
        [21, 20, 19],
        [24, 23, 22],
        [27, 26, 25],
        [30, 29, 28],
        [33, 32, 31],
        [36, 35, 34]
      ];

      this.hitAreas.push({
        type: C.BET_TYPES.SINGLE,
        value: 0,
        label: "0",
        x: gridX - 92,
        y: gridY,
        width: 82,
        height: cellH * 12
      });

      tableNumbers.forEach((row, rowIndex) => {
        row.forEach((number, colIndex) => {
          this.hitAreas.push({
            type: C.BET_TYPES.SINGLE,
            value: number,
            label: String(number),
            x: gridX + colIndex * cellW,
            y: gridY + rowIndex * cellH,
            width: cellW,
            height: cellH
          });
        });
      });

      const outsideY = gridY + cellH * 12 + 22;
      [
        [C.BET_TYPES.LOW, null, "LOW 1-18"],
        [C.BET_TYPES.EVEN, null, "EVEN"],
        [C.BET_TYPES.RED, null, "RED"],
        [C.BET_TYPES.BLACK, null, "BLACK"],
        [C.BET_TYPES.ODD, null, "ODD"],
        [C.BET_TYPES.HIGH, null, "HIGH 19-36"]
      ].forEach((entry, index) => {
        this.hitAreas.push({
          type: entry[0],
          value: entry[1],
          label: entry[2],
          x: 730 + index * 185,
          y: outsideY,
          width: 172,
          height: 78
        });
      });

      this.chipAreas = C.CHIP_VALUES.map((value, index) => ({
        value,
        x: 150 + index * 142,
        y: 886,
        radius: 52
      }));
    }

    update(delta) {
      if (this.state === "spinning") {
        this.elapsedSpin += delta;
        const progress = clamp(this.elapsedSpin / this.spinDuration, 0, 1);
        const wheelEase = easeOutCubic(progress);
        const ballEase = easeInOutCubic(progress);
        this.wheelAngle = lerp(this.spinStartWheel, this.spinTargetWheel, wheelEase);
        this.ballAngle = lerp(this.spinStartBall, this.spinTargetBall, ballEase);

        if (progress >= 1) {
          this.finishSpin();
        }
      } else {
        this.wheelAngle += delta * 0.08;
      }

      this.buttons.find((button) => button.id === "btnSpin").disabled = this.state === "spinning" || this.bets.totalBet() <= 0;
      this.buttons.find((button) => button.id === "btnResetBets").disabled = this.state === "spinning" || this.bets.totalBet() <= 0;
    }

    draw(ctx) {
      CasinoArt.drawBackground(ctx, 1);
      this.drawTopStatus(ctx);
      this.drawWheelPanel(ctx);
      this.drawBettingPanel(ctx);
      this.drawChipSelector(ctx);
      this.drawResultPanel(ctx);
      this.buttons.forEach((button) => button.draw(ctx));
    }

    drawTopStatus(ctx) {
      CasinoArt.drawStatusBadge(ctx, 380, 40, 300, "BALANCE", formatCredits(this.balance.balance), C.COLORS.goldBright);
      CasinoArt.drawStatusBadge(ctx, 706, 40, 300, "CURRENT BET", formatCredits(this.bets.totalBet()), C.COLORS.text);
      CasinoArt.drawStatusBadge(ctx, 1032, 40, 420, "LAST RESULT", this.resultNumber === null ? "--" : `Number ${this.resultNumber}`, this.colorForNumber(this.resultNumber));
    }

    drawWheelPanel(ctx) {
      CasinoArt.drawPanel(ctx, 58, 135, 638, 682, "EUROPEAN WHEEL");
      this.drawRouletteWheel(ctx, 377, 478, 272);
      drawText(ctx, "Single Zero", 377, 773, {
        size: 24,
        align: "center",
        weight: "500",
        color: C.COLORS.muted
      });
    }

    drawRouletteWheel(ctx, cx, cy, radius) {
      const order = C.EUROPEAN_WHEEL_ORDER;
      const segment = TAU / order.length;

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(this.wheelAngle);
      ctx.shadowColor = "rgba(0,0,0,0.8)";
      ctx.shadowBlur = 18;

      for (let i = 0; i < order.length; i += 1) {
        const start = i * segment;
        const end = start + segment;
        const number = order[i];
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, radius, start, end);
        ctx.closePath();
        ctx.fillStyle = number === 0 ? C.COLORS.green : C.RED_NUMBERS.has(number) ? C.COLORS.red : C.COLORS.black;
        ctx.fill();
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = "rgba(247, 233, 193, 0.7)";
        ctx.stroke();

        ctx.save();
        ctx.rotate(start + segment / 2);
        drawText(ctx, String(number), radius - 38, 6, {
          size: 18,
          align: "center",
          baseline: "middle",
          color: "#ffffff",
          stroke: "rgba(0,0,0,0.7)",
          strokeWidth: 3
        });
        ctx.restore();
      }

      ctx.beginPath();
      ctx.arc(0, 0, radius * 0.64, 0, TAU);
      ctx.fillStyle = createRadialGradient(ctx, -40, -60, 8, 0, 0, radius * 0.64, [
        [0, "#ffe9a9"],
        [0.28, C.COLORS.gold],
        [1, "#4f2e0a"]
      ]);
      ctx.fill();
      ctx.lineWidth = 10;
      ctx.strokeStyle = "#2a1706";
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(0, 0, radius * 0.24, 0, TAU);
      ctx.fillStyle = "#14100d";
      ctx.fill();
      ctx.lineWidth = 5;
      ctx.strokeStyle = C.COLORS.goldBright;
      ctx.stroke();
      drawText(ctx, "RR", 0, 2, {
        size: 45,
        align: "center",
        baseline: "middle",
        color: C.COLORS.goldBright,
        stroke: "#000000",
        strokeWidth: 3
      });
      ctx.restore();

      ctx.save();
      const ballRadius = radius * 0.86;
      const bx = cx + Math.cos(this.ballAngle) * ballRadius;
      const by = cy + Math.sin(this.ballAngle) * ballRadius;
      ctx.shadowColor = "rgba(255,255,255,0.95)";
      ctx.shadowBlur = this.state === "spinning" ? 24 : 12;
      ctx.beginPath();
      ctx.arc(bx, by, 13, 0, TAU);
      ctx.fillStyle = createRadialGradient(ctx, bx - 5, by - 6, 1, bx, by, 13, [
        [0, "#ffffff"],
        [0.7, "#dadada"],
        [1, "#777777"]
      ]);
      ctx.fill();
      ctx.restore();
    }

    drawBettingPanel(ctx) {
      CasinoArt.drawPanel(ctx, 700, 135, 720, 810, "BETTING TABLE");
      const totalByKey = new Map();
      this.bets.bets.forEach((bet) => {
        totalByKey.set(`${bet.type}:${bet.value}`, bet.amount);
      });

      this.hitAreas.forEach((area) => {
        const isOutside = area.type !== C.BET_TYPES.SINGLE;
        ctx.save();
        drawRoundRect(ctx, area.x, area.y, area.width, area.height, isOutside ? 12 : 4);
        if (area.type === C.BET_TYPES.RED) {
          ctx.fillStyle = C.COLORS.red;
        } else if (area.type === C.BET_TYPES.BLACK) {
          ctx.fillStyle = C.COLORS.black;
        } else if (area.value === 0) {
          ctx.fillStyle = C.COLORS.green;
        } else if (area.type === C.BET_TYPES.SINGLE) {
          ctx.fillStyle = numberColor(area.value) === "red" ? C.COLORS.red : C.COLORS.black;
        } else {
          ctx.fillStyle = "rgba(13, 77, 44, 0.92)";
        }
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = "rgba(247, 233, 193, 0.86)";
        ctx.stroke();

        drawText(ctx, area.label, area.x + area.width / 2, area.y + area.height / 2 + 1, {
          size: isOutside ? 24 : 21,
          align: "center",
          baseline: "middle",
          color: "#ffffff",
          stroke: "rgba(0,0,0,0.65)",
          strokeWidth: 3
        });

        const total = totalByKey.get(`${area.type}:${area.value}`);
        if (total) {
          CasinoArt.drawChip(ctx, area.x + area.width - 21, area.y + 22, 22, this.displayChipValue(total), true);
          drawText(ctx, String(total), area.x + area.width - 21, area.y + 52, {
            size: 16,
            align: "center",
            color: C.COLORS.goldBright,
            stroke: "rgba(0,0,0,0.8)",
            strokeWidth: 3
          });
        }
        ctx.restore();
      });

      if (this.app.settings.get("showHints")) {
        drawText(ctx, "Outside bets exclude zero. Click any zone to wager the selected chip.", 1060, 914, {
          size: 20,
          align: "center",
          color: C.COLORS.muted,
          weight: "500"
        });
      }
    }

    drawChipSelector(ctx) {
      CasinoArt.drawPanel(ctx, 58, 842, 638, 178, "CHIP VALUE");
      this.chipAreas.forEach((chip) => {
        CasinoArt.drawChip(ctx, chip.x, chip.y, chip.radius, chip.value, chip.value === this.bets.activeChip);
      });
    }

    drawResultPanel(ctx) {
      CasinoArt.drawPanel(ctx, 1445, 135, 415, 665, "RESULT");
      const resultColor = this.resultNumber === null ? C.COLORS.cream : this.colorForNumber(this.resultNumber);
      drawText(ctx, this.resultNumber === null ? "--" : String(this.resultNumber), 1652, 295, {
        size: 136,
        align: "center",
        baseline: "middle",
        color: resultColor,
        stroke: "#000000",
        strokeWidth: 8,
        shadow: { color: "rgba(255, 220, 132, 0.28)", blur: 25 }
      });

      drawText(ctx, this.resultNumber === null ? "Awaiting Spin" : numberColor(this.resultNumber).toUpperCase(), 1652, 392, {
        size: 34,
        align: "center",
        color: C.COLORS.goldBright
      });

      const wrapped = this.wrapText(ctx, this.resultMessage, 330, 25);
      wrapped.forEach((line, index) => {
        drawText(ctx, line, 1652, 494 + index * 36, {
          size: 25,
          align: "center",
          weight: "600",
          color: C.COLORS.cream
        });
      });

      if (this.winSummary) {
        drawText(ctx, `Paid: ${this.winSummary.credit} Credits`, 1652, 660, {
          size: 28,
          align: "center",
          color: this.winSummary.credit > 0 ? "#85ff9e" : "#ff9b9b"
        });
      }
    }

    colorForNumber(number) {
      if (number === null || number === undefined) {
        return C.COLORS.cream;
      }
      const color = numberColor(number);
      if (color === "green") {
        return "#62ff9f";
      }
      return color === "red" ? "#ff5959" : "#f3f3f3";
    }

    displayChipValue(total) {
      return C.CHIP_VALUES.slice().reverse().find((value) => total >= value) || C.CHIP_VALUES[0];
    }

    wrapText(ctx, text, maxWidth, size) {
      ctx.save();
      ctx.font = `600 ${size}px Arial, Helvetica, sans-serif`;
      const words = text.split(" ");
      const lines = [];
      let line = "";
      words.forEach((word) => {
        const testLine = line ? `${line} ${word}` : word;
        if (ctx.measureText(testLine).width > maxWidth && line) {
          lines.push(line);
          line = word;
        } else {
          line = testLine;
        }
      });
      if (line) {
        lines.push(line);
      }
      ctx.restore();
      return lines.slice(0, 5);
    }

    startSpin() {
      if (this.state === "spinning" || this.bets.totalBet() <= 0) {
        return;
      }

      this.state = "spinning";
      this.winSummary = null;
      this.resultNumber = null;
      this.targetNumber = this.roulette.spin();
      this.elapsedSpin = 0;
      this.spinDuration = this.app.settings.get("fastAnimations") ? 2.2 : 4.8;
      this.resultMessage = "Wheel spinning...";

      const targetSlotIndex = C.EUROPEAN_WHEEL_ORDER.indexOf(this.targetNumber);
      const segment = TAU / C.EUROPEAN_WHEEL_ORDER.length;
      const finalWheelExtra = TAU * 8 + Math.random() * TAU;
      this.spinStartWheel = this.wheelAngle;
      this.spinTargetWheel = this.wheelAngle + finalWheelExtra;

      const finalSlotWorldAngle = this.spinTargetWheel + targetSlotIndex * segment + segment / 2;
      this.spinStartBall = this.ballAngle;
      this.spinTargetBall = finalSlotWorldAngle - TAU * 12;
      while (this.spinTargetBall > this.spinStartBall - TAU) {
        this.spinTargetBall -= TAU;
      }
    }

    finishSpin() {
      this.state = "idle";
      this.resultNumber = this.targetNumber;
      const activeBets = this.bets.snapshot();
      this.winSummary = this.roulette.resolveBets(activeBets, this.resultNumber);
      this.balance.credit(this.winSummary.credit);
      this.bets.clearBets({ refund: false });

      const color = numberColor(this.resultNumber);
      if (this.winSummary.credit > 0) {
        this.resultMessage = `Winning number ${this.resultNumber} ${color}. You won ${this.winSummary.profit} credits.`;
      } else {
        this.resultMessage = `Winning number ${this.resultNumber} ${color}. No winning bets this round.`;
      }

      if (this.balance.balance <= 0) {
        this.balance.reset();
        this.resultMessage += " Balance reset to 1000 credits for a new table session.";
      }
    }

    resetBets() {
      if (this.state !== "spinning") {
        this.bets.clearBets({ refund: true });
      }
    }

    backToMenu() {
      if (this.state === "spinning") {
        return;
      }
      this.resetBets();
      this.app.sceneManager.goTo("menu");
    }

    handlePointerDown(point) {
      if (super.handlePointerDown(point)) {
        return true;
      }
      if (this.state === "spinning") {
        return false;
      }

      const chip = this.chipAreas.find((candidate) => {
        const dx = point.x - candidate.x;
        const dy = point.y - candidate.y;
        return Math.sqrt(dx * dx + dy * dy) <= candidate.radius;
      });
      if (chip) {
        this.bets.setActiveChip(chip.value);
        this.resultMessage = `${chip.value} credit chip selected.`;
        return true;
      }

      const area = this.hitAreas.find((candidate) => point.x >= candidate.x && point.x <= candidate.x + candidate.width &&
        point.y >= candidate.y && point.y <= candidate.y + candidate.height);
      if (area) {
        this.bets.placeBet(area.type, area.value, area.label);
        return true;
      }

      return false;
    }

    handlePointerMove(point) {
      super.handlePointerMove(point);
      return true;
    }
  }

  // ---------------------------------------------------------------------------
  // Application bootstrap and game loop
  // ---------------------------------------------------------------------------
  class GameApp {
    constructor({ canvasId, containerId, overlayId }) {
      this.canvas = document.getElementById(canvasId);
      this.container = document.getElementById(containerId);
      this.overlay = document.getElementById(overlayId);
      if (!this.canvas || !this.canvas.getContext) {
        throw new Error("Roulette Royale requires a valid HTML5 canvas.");
      }
      this.ctx = this.canvas.getContext("2d");
      this.eventBus = new EventBus();
      this.settings = new SettingsManager();
      this.sceneManager = new SceneManager(this);
      this.lastTime = 0;
      this.running = false;
      this.registerScenes();
      this.registerInput();
      this.registerErrorHandling();
    }

    registerScenes() {
      this.sceneManager.register("menu", new MainMenuScene(this));
      this.sceneManager.register("game", new GameScene(this));
      this.sceneManager.goTo("menu");
    }

    registerInput() {
      const onPointerDown = (event) => {
        event.preventDefault();
        const point = pointerFromEvent(event, this.canvas);
        this.sceneManager.handlePointerDown(point);
      };
      const onPointerMove = (event) => {
        const point = pointerFromEvent(event, this.canvas);
        this.sceneManager.handlePointerMove(point);
      };

      this.canvas.addEventListener("mousedown", onPointerDown);
      this.canvas.addEventListener("mousemove", onPointerMove);
      this.canvas.addEventListener("touchstart", onPointerDown, { passive: false });
      this.canvas.addEventListener("touchmove", onPointerMove, { passive: true });
    }

    registerErrorHandling() {
      global.addEventListener("error", (event) => {
        console.error("Roulette Royale runtime error", event.error || event.message);
      });
      global.addEventListener("unhandledrejection", (event) => {
        console.error("Roulette Royale promise rejection", event.reason);
      });
    }

    start() {
      if (this.running) {
        return;
      }
      this.running = true;
      this.lastTime = performance.now();
      requestAnimationFrame((time) => this.loop(time));
    }

    loop(time) {
      if (!this.running) {
        return;
      }
      const delta = clamp((time - this.lastTime) / 1000, 0, 1 / 20);
      this.lastTime = time;
      this.sceneManager.update(delta);
      this.ctx.clearRect(0, 0, C.WIDTH, C.HEIGHT);
      this.sceneManager.draw(this.ctx);
      requestAnimationFrame((nextTime) => this.loop(nextTime));
    }

    exitGame() {
      try {
        global.close();
      } catch (error) {
        // Browsers usually block scripted close unless the window was opened by script.
      }
      const current = this.sceneManager.current;
      if (current instanceof MainMenuScene) {
        current.infoPopup.title = "EXIT";
        current.infoPopup.lines = [
          "Your browser does not allow this page to close itself.",
          "Use the browser tab or host application controls to exit."
        ];
        current.infoPopup.open();
      }
    }
  }

  RR.bootstrap = function bootstrap(options) {
    const app = new GameApp(options);
    app.start();
    global.RouletteRoyaleApp = app;
    return app;
  };

  RR.Classes = Object.freeze({
    RouletteEngine,
    BalanceManager,
    BetManager,
    EventBus,
    SettingsManager,
    SceneManager,
    MainMenuScene,
    GameScene,
    Button,
    Popup,
    CasinoArt
  });

  RR.TestHooks = Object.freeze({
    RouletteEngine,
    BalanceManager,
    BetManager,
    EventBus,
    numberColor,
    constants: C
  });

  global.RouletteRoyale = RR;
}(window));
