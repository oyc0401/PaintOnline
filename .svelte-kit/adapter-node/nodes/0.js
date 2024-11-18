

export const index = 0;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/_layout.svelte.js')).default;
export const imports = ["_app/immutable/nodes/0.MOqtJYfA.js","_app/immutable/chunks/disclose-version.Ei9clQkr.js","_app/immutable/chunks/runtime.DCdVpe8j.js","_app/immutable/chunks/legacy.N_uNbHf0.js"];
export const stylesheets = ["_app/immutable/assets/0.C7KhscgV.css"];
export const fonts = [];
