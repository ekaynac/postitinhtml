import { playhtml } from "playhtml";
import { createController, PostitsInstance } from "./controller";
import { PostitsConfig } from "./types";

export * from "./types";
export const VERSION = "0.0.0";
let instance: PostitsInstance | null = null;

export const Postits = {
  init(config: PostitsConfig = {}): PostitsInstance {
    if (instance) return instance;
    instance = createController(playhtml, config);
    return instance;
  },
  destroy() { instance?.destroy(); instance = null; },
};

export default Postits;
