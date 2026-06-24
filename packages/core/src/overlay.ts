import { OVERLAY_Z_INDEX } from "./types";
import { STYLES } from "./styles";

export function createOverlay(host: HTMLElement = document.body) {
  const hostEl = document.createElement("div");
  hostEl.className = "postits-overlay-host";
  Object.assign(hostEl.style, {
    position: "fixed", inset: "0", zIndex: String(OVERLAY_Z_INDEX), pointerEvents: "none",
  } as CSSStyleDeclaration);
  host.appendChild(hostEl);

  const root = hostEl.attachShadow({ mode: "open" });
  const style = document.createElement("style"); style.textContent = STYLES;
  const notesLayer = document.createElement("div"); notesLayer.className = "notes";
  const toolbarLayer = document.createElement("div"); toolbarLayer.className = "toolbar";
  root.append(style, notesLayer, toolbarLayer);

  return {
    root, notesLayer, toolbarLayer,
    setBoardVisible(v: boolean) { notesLayer.style.display = v ? "" : "none"; },
    destroy() { hostEl.remove(); },
  };
}
