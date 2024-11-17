import * as universal from '../entries/pages/_page.js';

export const index = 2;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/_page.svelte.js')).default;
export { universal };
export const universal_id = "src/routes/+page.js";
export const imports = ["_app/immutable/nodes/2.4e35d716.js","_app/immutable/chunks/preload-helper.5c86ab27.js","_app/immutable/chunks/runtime.c4ca9175.js","_app/immutable/chunks/disclose-version.ea5a5213.js","_app/immutable/chunks/legacy.eadbc98f.js","_app/immutable/chunks/svelte-head.172123e7.js","_app/immutable/chunks/lifecycle.dabb59c6.js","_app/immutable/chunks/index-client.3558eb38.js"];
export const stylesheets = ["_app/immutable/assets/2.0cff32a5.css"];
export const fonts = [];
