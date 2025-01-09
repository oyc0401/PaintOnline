import $ from "jquery";

import { PaintJSState } from "./state.js";
import { keyStore } from "./repository/keyStorage.js";
import { layerRepository } from "./repository/layerRepository.js";
import { paintRepository } from "./repository/paintRepository.js";
import { localize } from "../localize/localize.js";
import { debounce } from "./src/helpers.js";

import {
  reset_file,
  reset_selected_colors,
  set_magnification,
  reset_history,
} from "./src/functions.js";

import {
  crateDefaultPaint,
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

let currentPaintId = null;

export async function getDBCanvas() {
  // 최근 파일 키 불러오기
  const key = await getRecentKey();
  if (!key) {
    createNewFile();
    return;
  }

  // 파일키를 통해 파일 불러오기
  const paintInfo = await getPaint(key);
  console.log("paintInfo:", paintInfo);

  if (!paintInfo) {
    // await deleteCanvas(key);
    //await deleteLayers(key);
    createNewFile();
    return;
  }
  currentPaintId = paintInfo.paintId;

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
  const layers = await layerListToLayerCanvas(paintInfo, layerList);
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
  const key = generatepaintId();
  currentPaintId = key;

  // 키 저장
  await keyStore.set("recent_key", currentPaintId);

  // 새로운 파일 만들기
  const paintInfo = crateDefaultPaint(key);
  currentPaintId = paintInfo.paintId;

  // 새로운 레이어 만들기
  const layers = await createDefaultLayer(paintInfo);

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

async function getPaint(key) {
  let paintInfo = await paintRepository.getPaint(key);
  return paintInfo;
}

async function getLayers(key) {
  let layerList = await layerRepository.getLayers(key);
  return layerList;
}

const saveFileSoon = debounce(saveFileImmediately, 100);

async function saveFileImmediately() {
  try {
  
    // 1) 캔버스 정보 저장
    const activeCanvas = PaintJSState.layers[0]; // 예: 첫 번째 레이어가 배경 캔버스
    if (!activeCanvas) {
      console.error("No active canvas found in PaintJSState.layers.");
      return;
    }

    await paintRepository.setPaint(currentPaintId, {
      width: activeCanvas.canvas.width,
      height: activeCanvas.canvas.height,
    });

    // 2) 레이어 메타데이터 저장
    const layerList = PaintJSState.layers.map((layer) => {
      if (PaintJSState.selection && PaintJSState.activeLayerIndex == layer.priority) {
        // 기존 canvas와 동일한 크기의 새로운 canvas 생성
        const temp_canvas = document.createElement("canvas");
        temp_canvas.width = layer.canvas.width;
        temp_canvas.height = layer.canvas.height;

        // 기존 canvas의 내용을 복사
        const temp_ctx = temp_canvas.getContext("2d");
        temp_ctx.drawImage(layer.canvas, 0, 0);

        temp_ctx.drawImage(
          PaintJSState.selection.canvas,
          PaintJSState.selection.x,
          PaintJSState.selection.y,
        );
        return {
          layerId: layer.layerId,
          name: layer.name,
          paintId: currentPaintId,
          dataURL: temp_canvas.toDataURL("image/png"),
          priority: layer.priority,
        };
      }
      return {
        layerId: layer.layerId,
        name: layer.name,
        paintId: currentPaintId,
        dataURL: layer.canvas.toDataURL("image/png"),
        priority: layer.priority,
      };
    });

    await layerRepository.setLayers(currentPaintId, layerList);
    
    console.warn("Paint saved. paintId =", currentPaintId);

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
 * 새 paintId 생성
 */
function generatepaintId() {
  return Math.random().toString(36).substr(2, 9);
}

// --------------------------- function.js ---------------------------

export async function reset_canvas() {
  const paintInfo = crateDefaultPaint(currentPaintId);
  currentPaintId = paintInfo.paintId;

  // 새로운 레이어 만들기
  const layers = await createDefaultLayer(paintInfo);

  // 레이어를 레이어영역에 추가
  setLayer(layers);
}
