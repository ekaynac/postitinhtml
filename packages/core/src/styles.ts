export const STYLES = `
:host { all: initial; }
.notes, .toolbar { font-family: system-ui, sans-serif; }
.postit { position: absolute; top: 0; left: 0; width: 220px; min-height: 160px; padding: 24px 10px 10px;
  border-radius: 6px; box-shadow: 0 6px 16px rgba(0,0,0,.18); pointer-events: auto; box-sizing: border-box;
  display: flex; flex-direction: column; gap: 6px; cursor: grab; }
.postit:focus { outline: 2px solid #2563eb; }
.postit__text { border: 0; background: transparent; resize: none; font: inherit; flex: 1; min-height: 70px; outline: none; }
.postit__del { position: absolute; top: 4px; right: 6px; border: 0; background: transparent; font-size: 18px; line-height: 1; cursor: pointer; }
.postit__swatches { display: flex; gap: 4px; }
.postit__swatch { width: 14px; height: 14px; border-radius: 50%; border: 1px solid rgba(0,0,0,.2); cursor: pointer; padding: 0; }
.postit__meta { font-size: 11px; color: rgba(0,0,0,.55); }
.postits-tb { position: fixed; right: 16px; bottom: 16px; display: flex; gap: 8px; pointer-events: auto; }
.postits-tb button { font: inherit; padding: 8px 12px; border-radius: 999px; border: 0; box-shadow: 0 2px 8px rgba(0,0,0,.2); background: #111827; color: #fff; cursor: pointer; }
@media (prefers-reduced-motion: reduce) { .postit { transition: none; } }
`;
