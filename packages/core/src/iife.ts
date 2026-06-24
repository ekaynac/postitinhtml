import Postits from "./index";

// IIFE/<script>-tag entry. Assign the Postits API object DIRECTLY as the global
// so a script-tag consumer calls `Postits.init(...)`. (Using tsup's globalName
// over ./index would instead expose the whole module namespace, forcing the
// awkward `Postits.Postits.init(...)`.)
(globalThis as Record<string, unknown>).Postits = Postits;
