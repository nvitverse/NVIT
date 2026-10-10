# Themes

| Theme | How | Palette |
|---|---|---|
| **yellow** (default, Drop1Taxi-style) | no attribute needed | black `#111`, yellow `#f5b800`, dark yellow `#d49e00`, slate neutrals, WhatsApp green `#25d366` (buttons use `#17803d` for contrast), font Outfit |
| **teal** (first version, kept as a copy) | `<html lang="en-IN" data-theme="teal">` in `src/index.html` | teal `#0b3d3a`/`#14605b`, amber `#f5a524`, beige backgrounds |

All colours are CSS variables at the top of `src/styles.css`. `design/themes/teal-amber.css` is the saved copy of the original teal palette.
Logo/favicons are generated from `design/mark.svg` (`node scripts/make-brand.mjs`), car photos from `design/src/vehicles/*.png` (`node scripts/make-images.mjs`), share image from `design/og.html` (`node scripts/make-og.mjs`).
