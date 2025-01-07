import $ from "jquery";

import { PaintJSState } from "./state.js";
import { keyStore } from "./repository/keyStorage.js";
import { layerRepository } from "./repository/layerRepository.js";
import { canvasRepository } from "./repository/canvasRepository.js";
import { localize } from "../localize/localize.js";
import { debounce } from "./src/helpers.js";

import {
  make_or_update_undoable,
  reset_file,
  reset_selected_colors,
  set_magnification,
  reset_history,
} from "./src/functions.js";

import {
  crateDefaultCanvas,
  createDefaultLayer,
  layerListToLayerCanvas,
  setLayer,
} from "./layer.js";

export function initSession() {
  console.log("initSession");

  // 레이어 변경(그리기 등) 시에 저장
  $(window).on("session-update.session-hook", () => {
    // 디바운스로, 여러 번 연속으로 발생해도 일정 시간 뒤에 한 번만 저장
    saveFileSoon();
  });
}

let currentFileId = null;

export async function getDBCanvas() {
  // 최근 파일 키 불러오기
  const key = await getRecentKey();
  if (!key) {
    createNewFile();
    return;
  }

  // 파일키를 통해 파일 불러오기
  const canvasInfo = await getCanvas(key);
  console.log("canvasInfo:", canvasInfo);
  currentFileId = canvasInfo.fileId;
  if (!canvasInfo) {
    // await deleteCanvas(key);
    //await deleteLayers(key);
    createNewFile();
    return;
  }

  // 파일에 있는 레이어 불러오기
  const layerList = await getLayers(key);
  console.log("layerList:", layerList);
  if (!layerList || layerList.length == 0) {
    //await deleteCanvas(key);
    //await deleteLayers(key);
    createNewFile();
    return;
  }

  console.log("파일 불러오기 완료!");

  // 레이어 데이터를 캔버스UI로 바꾸기
  const layers = await layerListToLayerCanvas(canvasInfo, layerList);
  console.log("레이어 바꾸기 완료");

  // 레이어를 레이어영역에 추가
  setLayer(layers);
  console.log("레이어 추가 완료");

  // 기본세팅 하기
  initSetting();
  console.log("캔버스 제작 완료!");
}

async function createNewFile() {
  // 새로운 키 만들기
  const key = generateFileId();
  currentFileId = key;

  // 키 저장
  await keyStore.set("recent_key", currentFileId);

  // 새로운 파일 만들기
  const canvasInfo = crateDefaultCanvas(key);
  currentFileId = canvasInfo.fileId;

  // 새로운 레이어 만들기
  const layers = createDefaultLayer(canvasInfo);

  // 레이어를 레이어영역에 추가
  setLayer(layers);

  // 기본세팅 하기
  initSetting();

  //현재 상태를 DB에 저장
  await saveFileImmediately();
}

function initSetting() {
  reset_file();
  reset_selected_colors();
  reset_history();
  set_magnification(PaintJSState.default_magnification);
}

// --------------------------- 저장 로직 ---------------------------

async function getRecentKey() {
  return await keyStore.get("recent_key");
}

async function getCanvas(key) {
  let canvasInfo = await canvasRepository.getCanvas(key);
  return canvasInfo;
}

async function getLayers(key) {
  let layerList = await layerRepository.getLayers(key);
  return layerList;
}

const saveFileSoon = debounce(saveFileImmediately, 100);

async function saveFileImmediately() {
  try {
    console.log("saveFileImmediately for fileId =", currentFileId);

    // 1) 캔버스 정보 저장
    const activeCanvas = PaintJSState.layers[0]; // 예: 첫 번째 레이어가 배경 캔버스
    console.log("activeCanvas", activeCanvas);
    if (!activeCanvas) {
      console.error("No active canvas found in PaintJSState.layers.");
      return;
    }

    await canvasRepository.setCanvas(currentFileId, {
      width: activeCanvas.canvas.width,
      height: activeCanvas.canvas.height,
    });
    console.log("Canvas info saved.");

    // 2) 레이어 메타데이터 저장
    const layerList = PaintJSState.layers.map((layer) => ({
      layerId: layer.layerId,
      name: layer.name,
      fileId: currentFileId,
      dataURL: layer.canvas.toDataURL("image/png"),
      priority: layer.priority,
    }));

    await layerRepository.setLayers(currentFileId, layerList);
    console.log("Layers metadata saved.");
  } catch (error) {
    console.error(
      "An unexpected error occurred in saveFileImmediately:",
      error,
    );
  }
}

// --------------------------- 세션 종료 / 새 파일 ---------------------------

export async function newLocalFile() {
  endSession();
  console.log("Creating new file...");
  await createNewFile();
}

export function endSession() {
  saveFileSoon.cancel();
  saveFileImmediately();
  console.log("Session ended.");
}

/**
 * 새 fileId 생성
 */
function generateFileId() {
  return Math.random().toString(36).substr(2, 9);
}

// --------------------------- function.js ---------------------------

export function reset_canvas() {
  const canvasInfo = crateDefaultCanvas(currentFileId);
  currentFileId = canvasInfo.fileId;

  // 새로운 레이어 만들기
  const layers = createDefaultLayer(canvasInfo);

  // 레이어를 레이어영역에 추가
  setLayer(layers);
}
