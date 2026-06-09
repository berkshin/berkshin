# Roulette Royale

Complete Adobe Animate 2022 HTML5 Canvas project package for a playable European roulette game.

## Document Target

- Platform: Adobe Animate 2022
- Document type: HTML5 Canvas
- Stage: 1920x1080
- FPS: 60
- Wheel: European single-zero roulette
- Runtime: Plain JavaScript on HTML5 Canvas, no build step required

## Folder Structure

```text
roulette-royale-animate-2022/
  index.html
  styles.css
  src/
    roulette-royale.js
  animate/
    FirstFrameActions.js
    project-manifest.json
    RouletteRoyale_Animate2022_XFL/
      DOMDocument.xml
      PublishSettings.xml
      META-INF/
        metadata.xml
      LIBRARY/
        *.xml
      scripts/
        roulette-royale.js
        FirstFrameActions.js
      assets/
        svg/
          *.svg
  tools/
    GenerateRouletteRoyaleFLA.jsfl
  deliverables/
    README.md
  assets/
    svg/
      betting_table_european.svg
      button_gold.svg
      casino_background.svg
      chip_10.svg
      chip_50.svg
      chip_100.svg
      chip_500.svg
      roulette_wheel_european.svg
  docs/
    ASSET_LIST.md
    SCENE_AND_LAYER_STRUCTURE.md
```

## Runtime Files

- `index.html` is a published-style HTML5 Canvas shell sized for 1920x1080.
- `styles.css` scales the fixed-resolution canvas responsively while preserving 16:9.
- `src/roulette-royale.js` contains the complete game in an Adobe Animate-friendly namespace:
  - `RouletteEngine`
  - `BetManager`
  - `BalanceManager`
  - `SettingsManager`
  - `SceneManager`
  - `MainMenuScene`
  - `GameScene`
  - reusable canvas UI controls
- `animate/FirstFrameActions.js` is the Scene 1 Frame 1 action script for Animate.
- `animate/project-manifest.json` defines stage settings, scene names, layer names, symbols, instance names, assets, and rules.
- `animate/RouletteRoyale_Animate2022_XFL/` is the uncompressed Animate/XFL source package.
- `tools/GenerateRouletteRoyaleFLA.jsfl` is the Adobe Animate script that creates and saves the native `.fla` file.

## Game Features

- Main Menu with dark casino background, gold title, Play, Settings, Information, Exit.
- Settings popup with sound, fast animation, and table hint toggles.
- Information popup with concise rules.
- Game Scene with roulette wheel, ball animation, table, chips, HUD, controls, and result panel.
- Starting balance: 1000 Credits.
- Chip values: 10, 50, 100, 500.
- Bets: single number, red, black, even, odd, low 1-18, high 19-36.
- Payouts: single number 35:1; outside bets 1:1.
- European wheel order:
  `0,32,15,19,4,21,2,25,17,34,6,27,13,36,11,30,8,23,10,5,24,16,33,1,20,14,31,9,22,18,29,7,28,12,35,3,26`

## Adobe Animate FLA Generation

Adobe Animate itself is required to write a native `.fla` file. To generate it:

1. Open Adobe Animate 2022.
2. Select `File > Scripts > Run Script...`.
3. Choose `tools/GenerateRouletteRoyaleFLA.jsfl`.
4. The script creates an HTML5 Canvas document and saves:

   ```text
   deliverables/RouletteRoyale_Animate2022.fla
   ```

The generated FLA embeds the complete game runtime in Scene 1, Frame 1 actions and creates the required stage, symbol names, instance names, and document settings.

## Adobe Animate Integration

Create an Adobe Animate 2022 HTML5 Canvas document with:

- Width: 1920
- Height: 1080
- FPS: 60
- Background: `#050505`

Use the scene, layer, symbol, and instance contract in `animate/project-manifest.json`.
Add `src/roulette-royale.js` to Publish Settings as an included JavaScript file and place the contents of `animate/FirstFrameActions.js` on Scene 1, Frame 1, `actions` layer.

The game also runs directly by opening `index.html` in a browser or serving this folder from a static web server.
