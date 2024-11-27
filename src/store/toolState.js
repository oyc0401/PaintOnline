// src/stores/counters.js
import { writable } from "svelte/store";

const showMenu = writable(false); // 메뉴 열어야하는지
const selectedMenuId = writable(2); // 선택된 메뉴 id
const selectedTool = writable('TOOL_PENCIL'); // 현재 선택된 도구
const foregroundColor = writable('black'); // 현재 색깔
const backgroundColor = writable('white') // 현재 배경색
const lineWidth = writable(0); // 현재 브러시 두께



const toolLines={'pencil':1 }; // 도구의 브러시 두께 저장
const toolMenuId = 0; // 선택된 도구의 메뉴
const isFullScreen = false; // 전체화면인지


const tools=['pencil', 'eraser', ''];
const defaultColors=['red', 'white', 'black', 'green'];

export { selectedMenuId, foregroundColor, backgroundColor,toolMenuId,selectedTool };
