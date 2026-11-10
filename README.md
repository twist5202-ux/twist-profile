# TWIST — Beyond the Void

Personal portfolio for TWIST, showcasing AI agents, automation, creative technology, and design work.

## Live website

https://twist5202-ux.github.io/twist-profile/

## Project structure

```text
twist-profile/
├── index.html                 # Main portfolio page (GitHub Pages entry point)
├── creative-archive.html      # Creative work/archive page
├── preview-tw.html           # Existing design preview; kept for reference
├── dark-cyberpunk-audio.css  # Audio controller styles
├── dark-cyberpunk-audio.js   # Audio controller behavior
└── assets/
    ├── silver-symbol.png
    ├── twist-neon-abyss-v2.mp3
    └── creative-archive/     # Archive image assets
```

## Local preview

You can open `index.html` in a browser. For testing relative assets and links, use a local HTTP server:

```bash
python -m http.server 8000
```

Then visit http://localhost:8000/.

## Deployment

This is a static HTML/CSS/JavaScript website published using GitHub Pages. Keep `index.html` at the repository root to preserve the current GitHub Pages URL.

## Maintenance notes

- The current website uses embedded CSS/JavaScript as well as separate audio-controller files. Do not move them without verifying script order, asset paths, animations, and mobile behavior.
- `preview-tw.html` is deliberately retained; confirm it is unused before removing it.
- Do not commit tokens, API keys, or private credentials.
- Changes to the visual design and animations should be tested on desktop and mobile before deployment.

