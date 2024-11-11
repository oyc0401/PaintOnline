// src/stores/counters.js
import { writable } from "svelte/store";

const selectionId = writable(0);
const toolId = writable(0);
const brushId = writable(0);
const color = writable(0);
const lineWidth = writable(0);
const isFullScreen = writable(false);



const tools=['pencil', 'eraser', '']

export { selectionId, toolId };
