import * as universal from '../entries/pages/_page.js';

export const index = 2;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/_page.svelte.js')).default;
export { universal };
export const universal_id = "src/routes/+page.js";
export const imports = ["_app/immutable/nodes/2.CD8G8wTZ.js","_app/immutable/chunks/preload-helper.ByfuBGnE.js","_app/immutable/chunks/runtime.DCdVpe8j.js","_app/immutable/chunks/disclose-version.Ei9clQkr.js","_app/immutable/chunks/legacy.N_uNbHf0.js","_app/immutable/chunks/svelte-head.BDFL1Nv6.js","_app/immutable/chunks/lifecycle.DMWGJWsp.js"];
export const stylesheets = ["_app/immutable/assets/2.BRvzpkHI.css"];
export const fonts = [];
