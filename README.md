# Bhargav Sai K — Portfolio

A game developer and software engineer portfolio built with Vite, vanilla JavaScript, GSAP ScrollTrigger, and Three.js. The centered introduction takes inspiration from the Claypool reference, adapted to the portfolio’s existing dark mint theme and personal content.

## Development

```sh
npm install
npm run dev
```

## Production

```sh
npm run build
npm run preview
```

`dist/` contains the complete static site and can be deployed to a static host.

## Features

- Centered introduction, animated headline details, and links to projects, contact, résumé, and social profiles.
- Procedural 3D controller, code panel, orbital ring, crystal, and star field with pointer-responsive lighting. Mint, violet, and amber lighting controls change the scene.
- GSAP entrances, scroll reveals, project artwork parallax, a moving text band, and subtle button interactions.
- About, projects, experience, skills, and contact sections sharing the same visual system.
- Project filtering and native project detail dialogs with repository links. The Emoji Memory detail view opens a playable mini demo with a locally stored best score.
- Responsive layouts, native dialog keyboard behavior, visible focus states, and a persistent motion control that initially respects the system reduced-motion preference.

## Editing

- `src/index.html`: page content, navigation, project cards, and contact links
- `src/style.css`: theme, components, and responsive layouts
- `src/main.js`: GSAP motion, lighting controls, navigation, project details, filters, and memory game
- `src/world.js`: Three.js objects, materials, lighting, rendering lifecycle, and cleanup
- `public/professional.png`: supplied portrait
- `public/Bhargav_Sai_Resume.pdf`: supplied résumé

Existing employment and contact details are retained. Project visuals are stylized interface illustrations, not screenshots. The in-page memory game is a standalone adaptation of the linked React project. Wikipedia Search and Typing Speed Test link to their source repositories; their detail dialogs describe the existing projects.

## Rendering and motion

The WebGL scene is dynamically imported, uses a pixel ratio capped at 1.5, renders at approximately 30fps, and pauses when the tab is hidden or motion is disabled. A CSS scene remains available if WebGL initialization fails or its context is lost. All content and navigation work independently of WebGL. No external 3D assets are required. Google Fonts supplies the typefaces, with CSS fallbacks.

The production build may report a chunk-size advisory for the separately loaded Three.js bundle. This does not block building or serving the site.

## Validation

Production build and JavaScript syntax checks pass. Temporary DOM integration checks covered anchors and local assets, project filters and details, navigation, lighting selection, motion toggling, WebGL import failure, and memory game win/loss/reset flows. A renderer-mocked Three.js check covered procedural geometry, lighting changes, motion lifecycle, resizing, context restoration, and resource disposal. Visual browser and actual GPU validation were unavailable because computer-use permission was not granted in the editing session.
