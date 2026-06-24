export interface ToolbarHandlers { onAdd: () => void; onToggle: (visible: boolean) => void }

export function renderToolbar(container: HTMLElement, handlers: ToolbarHandlers): { setVisible(v: boolean): void } {
  let visible = true;
  const bar = document.createElement("div"); bar.className = "postits-tb";

  const add = document.createElement("button");
  add.className = "postits-tb__add"; add.type = "button"; add.textContent = "＋ Note";
  add.addEventListener("click", () => handlers.onAdd());

  const toggle = document.createElement("button");
  toggle.className = "postits-tb__toggle"; toggle.type = "button"; toggle.textContent = "Hide";
  toggle.addEventListener("click", () => { visible = !visible; toggle.textContent = visible ? "Hide" : "Show"; handlers.onToggle(visible); });

  bar.append(add, toggle);
  container.appendChild(bar);
  return { setVisible(v: boolean) { visible = v; toggle.textContent = v ? "Hide" : "Show"; } };
}
