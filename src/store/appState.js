// src/stores/counters.js
import { writable } from 'svelte/store';

const counter = writable(0);
 const counter2 = writable(0);


export {counter,counter2};