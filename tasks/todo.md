# Plan: remove red/green/yellow/dark line artifacts on cell edges (Renderer)

## Symptom
After a few rounds, thin 1-device-pixel lines in red, green, yellow (and some dark ones) stay on
cell edges. Their colours match the flash colours (combat / reproduction+birth / eating) and the
edges of emoji sprites. They never disappear, because nothing redraws those pixels completely.

## Root cause
`Renderer` draws in CSS px with `ctx.setTransform(dpr, …)`. `cellSize` is a whole number of CSS px,
but `devicePixelRatio` on Windows/WSL laptops is often 1.25 or 1.5. So **cell edges land on fractional
device pixels** (e.g. 22 px × 1.25 = 27.5). Every `fillRect` / `drawImage` for one cell is
antialiased, so the device pixel on the shared edge is only *partly* covered:

1. A flash `fillRect(x*s, y*s, s, s)` (`drawVisualEffects`, Renderer.ts:421) blends its colour into the
   edge pixel shared with the next cell.
2. When the flash expires, `drawBackground` redraws the cell with `drawImage(tile, x*s, y*s, s, s)`,
   which also covers the edge pixel only partly: `new = c·bg + (1−c)·old`. Some flash colour stays.
   Redrawing the neighbour cell covers the rest of that pixel only partly too, so the residue never
   fully goes away.
3. The same happens with moving sprites: `drawMover` snaps them to device pixels, but static cell
   redraws do not. This leaves dark/orange emoji edge fragments (the dark lines in the screenshot).

With dpr = 1 or 2 the edges are whole numbers, so the bug does not show there. That is why the tests
(dpr 1/2) miss it.

## Fix: draw in whole device pixels
Every cell rectangle must cover exactly a whole number of device pixels, so each redraw fully
replaces the old pixels.

- [x] **Test first** (`tests/rendering/Renderer.test.ts`): with `devicePixelRatio = 1.25` and cell 22,
      render a board, add a combat flash, expire it, render again. Check that every `drawImage` /
      `fillRect` call on the board canvas uses whole numbers in device space
      (the transform × the arguments). This must fail on `main`.
- [x] `Renderer.applyCanvasSize()`: compute `cellPx = max(1, floor(cellSize * dpr))` (device px per cell);
      `canvas.width = gridWidth * cellPx`, `canvas.height = gridHeight * cellPx`;
      CSS size = `canvas.width / dpr` px; `ctx.setTransform(1,0,0,1,0,0)` (draw in device px).
- [x] Use `cellPx` for all board drawing: `drawBackground`, `drawSprite`/`drawCell` (sprite + 💔 icon
      position rounded), `drawVisualEffects` fillRect, `drawMover` (`round(visualX * cellPx)`).
      Size the emoji sprites, heart icon and background tile for `cellPx` (drawn 1:1, no scaling →
      also slightly sharper).
- [x] `getCellSize()` returns the **effective CSS cell size** `cellPx / dpr` (may be fractional), so
      `SetupView.placeBox` / `cellFromEvent` stay aligned with the canvas. Check the debug log text.
- [x] Update the existing HiDPI tests in `Renderer.test.ts` (backing store = grid × round(cell×dpr)).
- [x] Check `ClassicRenderer`: it redraws the whole canvas every frame, so there is no residue. No change
      unless the check shows otherwise (note in the review).
- [x] Verify: `npm run test:run`, `npm run typecheck`, `npm run lint`, `npm run test:coverage`;
      then manual run in Chrome with browser zoom 125% / 150% (simulates dpr 1.25 / 1.5).
      Play 20+ rounds with animation on and off, with no lines left on the edges. Also check that
      the setup editor hit-testing still lands on the clicked cell.

## Alternatives rejected
- Clear/redraw a 1 px margin around each dirty cell: treats the symptom, and overdraws neighbours.
- Force `cellSize` so that `cellSize × dpr` is a whole number: not possible for every dpr
  (e.g. 1.1, 1.33).
- Full redraw every frame: removes the dirty-rectangle optimisation (CLAUDE.md performance target).

## Review
- Regression tests (`Renderer device-pixel alignment …` in `tests/rendering/Renderer.test.ts`) failed on
  `main` (dpr 1.25 / 1.1 / 1.75, flash redraw, mover, getCellSize) and pass after the fix. dpr 1.5 with
  cell 22 already passed on `main` (22 × 1.5 = 33 is a whole number), which confirms the cause.
- Fix: `Renderer` draws with an identity transform in device px; `cellPx = floor(cellSize × dpr)` (floor, not round, so the board never outgrows the area `boardCellSize` fitted it to); canvas
  backing store = grid × cellPx; CSS size = backing / dpr; `getCellSize()` = cellPx / dpr. Sprites, 💔
  icon and background tile are pre-rendered at cellPx and drawn 1:1.
- Two old HiDPI tests updated to the new contract (transform 1, sprites drawn at device px).
- Browser check (Playwright Chromium, 8 stepped rounds, flashes expired, then a forced full redraw;
  count of pixels that changed = residue): `main` dpr 1.25 → **10 130** residue pixels (screenshot shows
  the red/green/yellow/dark lines); fix dpr 1.25 → **0**, dpr 1.5 → **0**.
- `ClassicRenderer` repaints the whole canvas every frame: no residue possible, unchanged.
- Setup editor: `placeBox` / `cellFromEvent` use `getCellSize()`, which now equals the CSS width / board
  width exactly (unit test); SetupView tests pass.
