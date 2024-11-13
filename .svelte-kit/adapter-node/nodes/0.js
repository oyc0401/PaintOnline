

export const index = 0;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/_layout.svelte.js')).default;
export const imports = ["_app/immutable/nodes/0.f5df8940.js","_app/immutable/chunks/scheduler.e108d1fd.js","_app/immutable/chunks/index.4caa8398.js"];
export const stylesheets = ["_app/immutable/assets/0.0ac3d66a.css"];
export const fonts = [];
