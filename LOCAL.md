# Local Preview Instructions

This is a static site redesign for nandanadileep.com. **DO NOT deploy or merge to main** — this is for local review only.

## Quick Start

You can preview the redesigned site locally using any static file server. Here are several options:

### Option 1: Python (simplest)

```bash
# Python 3
python -m http.server 8000

# Python 2 (if you only have that)
python -m SimpleHTTPServer 8000
```

Then open: http://localhost:8000

### Option 2: Node.js

```bash
# Using npx (no install needed)
npx serve

# Or install globally
npm install -g serve
serve
```

### Option 3: PHP

```bash
php -S localhost:8000
```

### Option 4: VS Code / Cursor

If you're using VS Code or Cursor, install the "Live Server" extension and right-click `index.html` → "Open with Live Server"

## What's New in the Redesign

### Visual Changes
- **Clean, minimal hero** with name, title, and simple CTA buttons
- **Colorful project cards** in a responsive grid (purple, blue, green, pink, etc.)
- **Dark skills card** with Hardware/Software/Infrastructure checklist (inspired by the mood board)
- **"Things I Love" wall** with framed interest cards (bento-style layout)
- **Floating dock navigation** at the bottom of the screen
- **Soft blob animation** in the background (subtle, interactive, follows cursor)

### Interactive Features
- **Sound toggle** (top right) — UI sounds are enabled by default
  - Tap sounds for cards and buttons
  - Paper-flip sound for writing links
  - Hover sounds for navigation
- **Chat FAQ widget** (bottom right) — expandable quick facts panel
  - Configured via `chatFAQ` array in `motion.js` (easily editable)
- **Tetris easter egg** (bottom left game icon) — playable mini-game at `/tetris.html`
- **Smooth scroll animations** and hover effects throughout

### Content
All content is pulled from real sources:
- Projects: Mycelium, Meridian, vLLM on Apple Silicon, Identiti, Auto-Agent, tictic
- Work: JLR, Amazon, IIT Madras
- Skills: Real tech stack from llms.txt
- Writing: Actual Medium articles and on-site essays

### Files Changed
- `index.html` — Completely redesigned structure
- `site.css` — New design system with modern colors, cards, and animations
- `motion.js` — Enhanced with blob canvas, sound effects (on by default), chat widget, and scroll animations
- `tetris.html` — New lightweight Tetris game

## Testing Checklist

- [ ] Homepage loads and looks clean
- [ ] Projects grid displays with colors
- [ ] Skills dark card is readable
- [ ] Things I Love wall shows 6 frames
- [ ] Floating dock navigation works
- [ ] Sound toggle available (sounds enabled by default)
- [ ] Chat FAQ widget opens and displays questions
- [ ] Tetris game is playable
- [ ] All links go to correct destinations
- [ ] Mobile responsive (test at 375px, 768px, 1024px widths)
- [ ] Smooth scrolling between sections
- [ ] Blob animation is subtle and not distracting

## Browser Compatibility

Tested in:
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

Should work in any modern browser with JavaScript enabled. The site respects `prefers-reduced-motion` for accessibility.

## Deployment Notes

**DO NOT DEPLOY THIS VERSION YET**

This redesign is on the `cursor/freeform-redesign-3529` branch. To deploy:

1. Review the PR carefully
2. Test locally on multiple devices
3. Get user approval
4. Only then merge to `main` (which deploys to GitHub Pages)

The CNAME, robots.txt, and other production files are unchanged — deployment settings remain safe.

## Customization

To edit the chat FAQ answers:
1. Open `motion.js`
2. Find the `chatFAQ` array (around line 100)
3. Edit questions and answers directly in the JSON structure
4. Refresh to see changes

To adjust colors:
1. Open `site.css`
2. Edit CSS variables in `:root` at the top
3. Colors use semantic names: `--purple`, `--blue`, `--green`, etc.

## Feedback

For questions or issues, contact: nandanadileep29@gmail.com
