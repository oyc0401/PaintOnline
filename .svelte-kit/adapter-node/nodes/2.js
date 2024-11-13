import * as universal from '../entries/pages/_page.js';

export const index = 2;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/_page.svelte.js')).default;
export { universal };
export const universal_id = "src/routes/+page.js";
export const imports = ["_app/immutable/nodes/2.0b2ba25c.js","_app/immutable/chunks/scheduler.e108d1fd.js","_app/immutable/chunks/index.4caa8398.js"];
export const stylesheets = ["_app/immutable/assets/2.532cbd7c.css"];
export const fonts = [];
