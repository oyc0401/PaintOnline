

export const index = 1;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/fallbacks/error.svelte.js')).default;
export const imports = ["_app/immutable/nodes/1.5fc12da5.js","_app/immutable/chunks/disclose-version.ea5a5213.js","_app/immutable/chunks/runtime.c4ca9175.js","_app/immutable/chunks/legacy.eadbc98f.js","_app/immutable/chunks/store.fad3cbb0.js","_app/immutable/chunks/svelte-head.172123e7.js","_app/immutable/chunks/lifecycle.dabb59c6.js","_app/immutable/chunks/singletons.27bba699.js"];
export const stylesheets = [];
export const fonts = [];
