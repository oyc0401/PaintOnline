

export const index = 1;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/fallbacks/error.svelte.js')).default;
export const imports = ["_app/immutable/nodes/1.b3eef8ea.js","_app/immutable/chunks/scheduler.e108d1fd.js","_app/immutable/chunks/index.4caa8398.js","_app/immutable/chunks/singletons.9036178a.js"];
export const stylesheets = [];
export const fonts = [];
