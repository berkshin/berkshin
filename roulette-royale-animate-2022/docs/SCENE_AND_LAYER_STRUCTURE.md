# Scene, Layer, Symbol, and Instance Structure

## Global Document Settings

| Setting | Value |
| --- | --- |
| Adobe Animate version | 2022 |
| Document type | HTML5 Canvas |
| Resolution | 1920x1080 |
| FPS | 60 |
| Background | `#050505` |
| Main runtime | `src/roulette-royale.js` |

## Scene 1: Main Menu

Timeline label: `scene_main_menu`

| Layer Name | Purpose | Symbols / Instances |
| --- | --- | --- |
| `actions` | Bootstraps runtime | Frame 1 uses `animate/FirstFrameActions.js` |
| `ui_popups` | Modal overlays | `Popup_Settings`, `Popup_Information` |
| `menu_buttons` | Primary menu controls | `btnPlay`, `btnSettings`, `btnInfo`, `btnExit` |
| `title_glow` | Title text and glow effects | `txtTitleRoulette`, `txtTitleRoyale`, `mcTitleGlow` |
| `background` | Casino art and decorative chips | `bgCasinoDark`, `mcMenuChipRing` |

### Main Menu Behavior

- `btnPlay` opens Scene 2 / Game Scene.
- `btnSettings` opens the settings popup.
- `btnInfo` opens the information popup.
- `btnExit` calls `window.close()` when supported and otherwise displays an exit message.
- Fade-in is handled by `MainMenuScene.fade` in the runtime.

## Scene 2: Game Scene

Timeline label: `scene_game`

| Layer Name | Purpose | Symbols / Instances |
| --- | --- | --- |
| `actions` | Runtime control layer | `RouletteRoyale.Classes.GameScene` runtime state |
| `result_overlay` | Win/loss display | `panelResult`, `txtWinningNumber`, `txtWinLoss` |
| `controls` | Action buttons | `btnSpin`, `btnResetBets`, `btnBackMenu` |
| `chip_selector` | Selectable chips | `chip10`, `chip50`, `chip100`, `chip500` |
| `betting_table` | Interactive betting zones | `betZero`, `betNumber01` through `betNumber36`, `betLow`, `betEven`, `betRed`, `betBlack`, `betOdd`, `betHigh` |
| `wheel_and_ball` | Roulette animation | `mcRouletteWheel`, `mcBall`, `mcWheelHub` |
| `hud` | Balance and current bet display | `txtBalance`, `txtCurrentBet`, `txtLastResult` |
| `background` | Panels and casino backdrop | `bgCasinoDark`, `panelWheel`, `panelBettingTable`, `panelChips` |

### Game Scene Behavior

- Click a chip to set the active chip value.
- Click a single number or outside betting zone to place the active chip.
- Balance is debited immediately on each bet.
- `btnSpin` starts a randomized European roulette spin.
- The wheel and ball animate to the winning slot.
- Payouts are credited after the ball lands.
- `btnResetBets` refunds unspun bets.
- `btnBackMenu` returns to Scene 1 after refunding unspun bets.

## Symbol Naming

| Symbol | Type | Notes |
| --- | --- | --- |
| `Button_Gold` | Button | Main call-to-action style |
| `Button_Green` | Button | Secondary action style |
| `Button_Danger` | Button | Exit/destructive action style |
| `RouletteWheel_European` | MovieClip | Center registration; runtime rotates this visual |
| `RouletteBall` | MovieClip | Center registration; runtime places on wheel orbit |
| `BettingTable_European` | MovieClip | Full 0-36 European betting table |
| `Chip_10` | MovieClip | Blue chip, center registration |
| `Chip_50` | MovieClip | White chip, center registration |
| `Chip_100` | MovieClip | Red chip, center registration |
| `Chip_500` | MovieClip | Purple chip, center registration |
| `Popup_Settings` | MovieClip | Settings modal |
| `Popup_Information` | MovieClip | Information modal |

## Runtime Architecture

| Class | Responsibility |
| --- | --- |
| `EventBus` | Internal event handling |
| `BalanceManager` | Credit debit, credit, and reset operations |
| `BetManager` | Active chip, bet placement, refund, bet snapshots |
| `RouletteEngine` | Random result generation and payout resolution |
| `SettingsManager` | Persisted settings and toggles |
| `SceneManager` | Scene transitions and input forwarding |
| `MainMenuScene` | Menu layout, fade-in, settings/info popups |
| `GameScene` | Wheel animation, table interaction, HUD, result flow |
| `Button` | Reusable interactive canvas button |
| `Popup` | Reusable modal popup |
| `CasinoArt` | Shared vector drawing helpers |
