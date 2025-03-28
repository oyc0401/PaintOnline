import $ from "jquery";

import { PaintJSState, PaintMobXState } from "./state";
import { keyStore } from "./repository/keyStorage.js";
import { layerRepository } from "./repository/layerRepository.js";
import { paintRepository } from "./repository/paintRepository.js";
import { localize } from "../localize/localize.js";
import { debounce } from "./src/helpers.js";

import {
  reset_file,
  reset_selected_colors,
  set_magnification,
} from "./src/functions.js";
import { reset_history } from "./src/history.js";

import {
  crateDefaultPaint,
  createDefaultLayer,
  createLayerfromLayerList,
  setActiveLayerId,
  make_paint,
} from "./layer";

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
  const paint = make_paint(paintInfo);
  currentPaintId = paint.paintId;

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

  // 레이어 데이터를 통해 레이어 객체 추가하기
  await createLayerfromLayerList(paint, layerList);
  console.log("레이어객체 추가 완료");

  setActiveLayerId();

  // 기본세팅 하기
  initSetting();

  console.log("캔버스 제작 완료!");

  saveFileSoon();
}

async function createNewFile() {
  // 새로운 키 만들기
  const key = generatePaintId();
  currentPaintId = key;
  console.log("generate key:", key);

  // 키 저장
  await keyStore.set("recent_key", currentPaintId);

  // 새로운 파일 만들기
  const paint = crateDefaultPaint(key);
  console.log(paint);
  currentPaintId = paint.paintId;

  // 새로운 레이어 만들기
  await createDefaultLayer(paint);

  setActiveLayerId();

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

export function initSession() {
  console.log("initSession");

  // 레이어 변경(그리기 등) 시에 저장
  $(window).on("session-update.session-hook", () => {
    // 디바운스로, 여러 번 연속으로 발생해도 일정 시간 뒤에 한 번만 저장
    saveFileSoon();
  });
}

// 큐에 저장 요청을 추가하고 큐를 처리하는 함수
function enqueueSave() {
  saveQueue.push(saveFileImmediately);
  processQueue();
}

// 큐를 처리하는 함수
async function processQueue() {
  if (isSaving) return; // 현재 저장 중이면 대기
  if (saveQueue.length === 0) return; // 큐가 비어있으면 대기

  isSaving = true;
  const saveTask = saveQueue.shift(); // 큐에서 첫 번째 작업을 가져옴

  try {
    await saveTask(); // 저장 작업 수행
  } catch (error) {
    console.error("저장 중 오류 발생:", error);
    // 오류 처리 로직을 추가할 수 있습니다.
  } finally {
    isSaving = false;
    processQueue(); // 다음 작업을 처리
  }
}

const saveQueue = [];
let isSaving = false;

const saveFileSoon = debounce(enqueueSave, 300);

async function saveFileImmediately() {
  try {
    // 1) 캔버스 정보 저장
    const paint = PaintJSState.paint;

    await paintRepository.setPaint(paint.paintId, paint);

    // 2) 레이어 메타데이터 저장
    const layerList = [];

    for (const layer of PaintJSState.getLayers()) {
      if (
        PaintJSState.selection &&
        PaintJSState.activeLayerId == layer.layerId
      ) {
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

        layerList.push({
          layerId: layer.layerId,
          name: layer.name,
          paintId: currentPaintId,
          dataBlob: await toBlobAsync(temp_canvas),
          priority: layer.priority,
        });
      } else {
        layerList.push({
          layerId: layer.layerId,
          name: layer.name,
          paintId: currentPaintId,
          dataBlob: await toBlobAsync(layer.canvas),
          priority: layer.priority,
        });
      }
    }

    await layerRepository.setLayers(currentPaintId, layerList);

    //PaintJSState.layerStore = [];
    for (let layerObj of layerList) {
      let { layerId, dataBlob } = layerObj;
      const url = URL.createObjectURL(dataBlob);
      PaintJSState.layerStore[layerId].imageUrl = url;
    }

    const now = new Date();
    PaintMobXState.lastChanged = now.getTime();

    console.warn("Paint saved. paintId =", currentPaintId);
  } catch (error) {
    console.error(
      "An unexpected error occurred in saveFileImmediately:",
      error,
    );
  }
}

function toBlobAsync(canvas, mimeType = "image/png", qualityArgument) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("Failed to create Blob from canvas."));
        }
      },
      mimeType,
      qualityArgument,
    );
  });
}

// --------------------------- 세션 종료 / 새 파일 ---------------------------

export async function newLocalFile() {
  await endSession();
  console.log("Creating new file...");
  await createNewFile();
}

export async function endSession() {
  saveFileSoon.cancel();
  await saveFileImmediately();
  console.log("Session ended.", currentPaintId);
}

/**
 * 새 paintId 생성
 */
function generatePaintId() {
  return Math.random().toString(36).substr(2, 9);
}

// --------------------------- function.js ---------------------------

export async function reset_canvas() {
  const paint = crateDefaultPaint(currentPaintId);
  currentPaintId = paint.paintId;

  // 새로운 레이어 만들기
  await createDefaultLayer(paint);

  // 레이어를 레이어영역에 추가
  setActiveLayerId();
}
