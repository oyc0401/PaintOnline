import { showMessageBox } from "./src/msgbox.js";
import {
   show_error_message,
   change_url_param,
   get_uris,
   load_image_from_uri,
   show_resource_load_error_message,
   open_from_image_info,
} from "./src/functions.js";
import $ from "jquery";
import { debounce, make_canvas } from "./src/helpers.js";

import { localStore } from "./src/storage.js";
import { keyStore } from "./keyStorage.js";
import { PaintJSState } from "./state.js";
import { layerRepository } from "./layerRepository.js";
import { canvasRepository } from "./canvasRepository.js";

/**
 * 전역으로 현재 파일 ID
 */
let currentFileId = null;

// --------------------------- 세션 초기화 ---------------------------

/**
 * 헬퍼 함수: keyStore.get을 프로미스로 변환
 * @param {string} key
 * @returns {Promise<any>}
 */
function getKeyAsync(key) {
  return new Promise((resolve, reject) => {
    keyStore.get(key, (err, value) => {
      if (err) {
        reject(err);
      } else {
        resolve(value);
      }
    });
  });
}

/**
 * 헬퍼 함수: keyStore.set을 프로미스로 변환
 * @param {string} key
 * @param {any} value
 * @returns {Promise<void>}
 */
function setKeyAsync(key, value) {
  return new Promise((resolve, reject) => {
    keyStore.set(key, value, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

/**
 * 세션을 초기화하는 비동기 함수
 * @returns {Promise<void>}
 */
export async function initSession() {
  console.log("initSession");

  try {
    // 1) 최근에 사용하던 fileId 불러오기
    let storedFileId;
    try {
      storedFileId = await getKeyAsync("recent_key");
    } catch (err) {
      console.error("Failed to retrieve recent_key:", err);
      // 에러가 나면 새 파일 ID 만들어서 진행
      storedFileId = generateFileId();
    }

    if (!storedFileId) {
      // 저장된게 없으면 새 파일 ID
      storedFileId = generateFileId();
    }

    // 전역 변수에 현재 파일 ID 저장
    currentFileId = storedFileId;

    // 다시 recent_key 갱신
    try {
      await setKeyAsync("recent_key", currentFileId);
    } catch (setErr) {
      console.error("Failed to set recent_key:", setErr);
      // 필요에 따라 추가적인 에러 처리 로직을 여기에 추가할 수 있습니다.
    }

    // 2) 파일 로드
    await loadFileFromRepositories(currentFileId);

    // 레이어 변경(그리기 등) 시에 저장
    window.addEventListener("session-update", () => {
      // 디바운스로, 여러 번 연속으로 발생해도 일정 시간 뒤에 한 번만 저장
      saveFileSoon();
    });

  } catch (error) {
    console.error("An unexpected error occurred in initSession:", error);
  }
}

/**
 * 파일 ID에 해당하는 레이어 목록과 캔버스 데이터를 로드 후,
 * PaintJSState에 반영
 * @param {string} fileId
 */
async function loadFileFromRepositories(fileId) {
  try {
    // 1) 캔버스 정보 로드
    let canvasInfo;
    try {
      canvasInfo = await canvasRepository.getCanvas(fileId);
    } catch (canvasErr) {
      console.error("Failed to retrieve canvas info:", canvasErr);
      // 기본 캔버스 정보 설정
      canvasInfo = {
        width: PaintJSState.default_canvas_width,
        height: PaintJSState.default_canvas_height,
      };
      try {
        await canvasRepository.setCanvas(fileId, canvasInfo);
      } catch (setErr) {
        console.error("Failed to set default canvas info:", setErr);
      }
    }

    const width = canvasInfo.width || PaintJSState.default_canvas_width;
    const height = canvasInfo.height || PaintJSState.default_canvas_height;

    // 2) 레이어 메타데이터 로드
    let layerList;
    try {
      layerList = await layerRepository.getLayers(fileId);
      if (!layerList || layerList.length === 0) throw new Error("No layers found");
    } catch (layerErr) {
      console.error("Failed to retrieve layers:", layerErr);
      // 기본 레이어 생성
      createDefaultLayers();
      PaintJSState.activeLayerIndex = PaintJSState.layers.length - 1;
      return;
    }

    // 3) PaintJSState.layers 초기화
    PaintJSState.layers = [];

    // 4) 각 레이어 처리
    for (const layerMeta of layerList) {
      const layerWidth = layerMeta.width || width;
      const layerHeight = layerMeta.height || height;
      const canvas = make_canvas(layerWidth, layerHeight);
      const ctx = canvas.ctx;

      if (layerMeta.dataURL) {
        try {
          const image = await loadImage(layerMeta.dataURL);
          ctx.drawImage(image, 0, 0);
        } catch (imgErr) {
          console.error("Failed to load image:", imgErr);
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
      } else {
        // 기본 흰색으로 채우기
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      PaintJSState.layers.push({
        canvas,
        ctx,
        name: layerMeta.name,
        width: layerWidth,
        height: layerHeight,
      });
    }

    // 5) 레이어 설정 및 활성화
    setLayer();
    PaintJSState.activeLayerIndex = PaintJSState.layers.length - 1;
  } catch (error) {
    console.error("An unexpected error occurred:", error);
  }
}


// 이미지 로드를 위한 헬퍼 함수
function loadImage(dataURL) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = dataURL;
  });
}

/**
 * 화면에 레이어 canvas들을 배치
 */
function setLayer() {
   // console.log("viewLayers", PaintJSState.layers.length);
   // console.log('PaintJSState.$layer_area',PaintJSState.$layer_area)
   PaintJSState.$layer_area.empty();
   for (let i = 0; i < PaintJSState.layers.length; i++) {
      const layer = PaintJSState.layers[i];
      // console.log("layer", layer.canvas);
      const zIndex = i + 2; // zIndex는 2부터 시작 (1은 background-canvas)
      if (i == 0) {
         $(layer.canvas)
            .css({ zIndex })
            .addClass("layer background")
            .appendTo(PaintJSState.$layer_area);
      } else {
         $(layer.canvas)
            .css({ zIndex })
            .addClass("layer")
            .appendTo(PaintJSState.$layer_area);
      }
   }

   PaintJSState.main_canvas = PaintJSState.layers[1].canvas;
   PaintJSState.main_ctx = PaintJSState.layers[1].ctx;

   //PaintJSState.$canvas_area.trigger("resize");
}

// --------------------------- 기본 레이어 생성 ---------------------------

function createDefaultLayers() {
   console.log("createDefaultLayers");
   PaintJSState.layers.length = 0;

   addBackgroundLayer(PaintJSState.layers);
   addLayer(PaintJSState.layers);
   PaintJSState.activeLayerIndex = PaintJSState.layers.length-1;

   // 생성 직후 저장
   saveFileImmediately();
}

function addBackgroundLayer(layers) {
   const canvas = make_canvas(PaintJSState.default_canvas_width, PaintJSState.default_canvas_height);
   const ctx = canvas.ctx;
   ctx.fillStyle = "#ffffff";
   ctx.fillRect(0, 0, canvas.width, canvas.height);

   layers.push({
      canvas,
      ctx,
      name: "BackgroundLayer",
      width: PaintJSState.default_canvas_width,
      height: PaintJSState.default_canvas_height,
   });
}

function addLayer(layers) {
   const canvas = make_canvas(PaintJSState.default_canvas_width, PaintJSState.default_canvas_height);
   const ctx = canvas.ctx;
   ctx.fillStyle = "#ffffff";
   ctx.fillRect(0, 0, canvas.width, canvas.height);

   layers.push({
      canvas,
      ctx,
      name: "Layer1",
      width: PaintJSState.default_canvas_width,
      height: PaintJSState.default_canvas_height,
   });
}

// --------------------------- 저장 로직 ---------------------------

const saveFileSoon = debounce(saveFileImmediately, 100);


/**
 * 실제로 IndexedDB에 즉시 저장
 * - canvasRepository를 통해 캔버스 정보 저장
 * - layerRepository를 통해 각 레이어별 그림과 크기 저장
 * @returns {Promise<void>}
 */
async function saveFileImmediately() {
  try {
    // 현재 파일 ID가 없는 경우 생성 및 저장
    if (!currentFileId) {
      currentFileId = generateFileId();
      try {
        await setKeyAsync('recent_key', currentFileId);
      } catch (err) {
        console.error('Failed to set recent_key:', err);
        // 필요에 따라 추가적인 에러 처리 로직을 여기에 추가할 수 있습니다.
      }
    }

    console.log('saveFileImmediately for fileId =', currentFileId);

    // 1) 캔버스 정보 저장
    const activeCanvas = PaintJSState.layers[0]; // 예: 첫 번째 레이어가 배경 캔버스
    if (!activeCanvas) {
      console.error('No active canvas found in PaintJSState.layers.');
      return;
    }

    try {
      await canvasRepository.setCanvas(currentFileId, {
        width: activeCanvas.width,
        height: activeCanvas.height,
      });
      console.log('Canvas info saved.');
    } catch (err) {
      console.error('Failed to save canvas info:', err);
    }

    // 2) 레이어 메타데이터 저장
    const layerList = PaintJSState.layers.map((layer) => ({
      layerId: generateLayerId(),
      name: layer.name,
      fileId: currentFileId,
      dataURL: layer.canvas.toDataURL('image/png'),
      width: layer.width,
      height: layer.height,
    }));

    try {
      await layerRepository.setLayers(currentFileId, layerList);
      console.log('Layers metadata saved.');
    } catch (err) {
      console.error('Failed to save layers metadata:', err);
    }
  } catch (error) {
    console.error('An unexpected error occurred in saveFileImmediately:', error);
  }
}

// --------------------------- 세션 종료 / 새 파일 ---------------------------

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

/**
 * 고유한 layerId 생성
 */
function generateLayerId() {
   return `layer_${Math.random().toString(36).substr(2, 9)}`;
}

export function newLocalFile() {
   endSession();
   console.log("Creating new file...");
   currentFileId = generateFileId();
   keyStore.set("recent_key", currentFileId, (err) => {
      if (err) {
         console.error("Failed to set recent_key:", err);
      }
   });
   createDefaultLayers();
}

////////////////////////////////////////////////////////

// export function initSessions() {
//    console.log("initSesstion");

//    const log = (...args) => window.console?.log(...args);

//    let localStorageAvailable = false;
//    try {
//       localStorage._available = true;
//       localStorageAvailable = localStorage._available;
//       delete localStorage._available;
//    } catch (_error) {
//       /* ignore */
//    }

//    // @TODO: keep other data in addition to the image data
//    // such as the file_name and other state
//    // (maybe even whether it's considered saved? idk about that)
//    // I could have the image in one storage slot and the state in another

//    const match_threshold = 1; // 1 is just enough for a workaround for Brave browser's farbling: https://github.com/1j01/jspaint/issues/184
//    const canvas_has_any_apparent_image_data = () =>
//       PaintJSState.main_canvas.ctx
//          .getImageData(
//             0,
//             0,
//             PaintJSState.main_canvas.width,
//             PaintJSState.main_canvas.height,
//          )
//          .data.some((v) => v > match_threshold);

//    let $recovery_window;

//    let last_undos_length = PaintJSState.undos.length;
//    function handle_data_loss() {
//       const window_is_open = $recovery_window && !$recovery_window.closed;
//       let save_paused = false;
//       if (!canvas_has_any_apparent_image_data()) {
//          if (!window_is_open) {
//             alert("show_recovery_window();");
//          }
//          save_paused = true;
//       } else if (window_is_open) {
//          if (PaintJSState.undos.length > last_undos_length) {
//             alert("show_recovery_window(true);");
//          }
//          save_paused = true;
//       }
//       last_undos_length = PaintJSState.undos.length;
//       return save_paused;
//    }

//    class LocalSession {
//       constructor(session_id) {
//          this.id = session_id;
//          const ls_key = `image#${session_id}`;
//          log(`Local storage key: ${ls_key}`);
//          // save image to storage
//          this.save_image_to_storage_immediately = () => {
//             const save_paused = handle_data_loss();
//             if (save_paused) {
//                return;
//             }
//             log(`Saving image to storage: ${ls_key}`);
//             localStore.set(
//                ls_key,
//                PaintJSState.main_canvas.toDataURL("image/png"),
//                (err) => {
//                   if (err) {
//                      // @ts-ignore (quotaExceeded is added by storage.js)
//                      // if (err.quotaExceeded) {
//                      // 	storage_quota_exceeded();
//                      // } else {
//                      // 	// e.g. localStorage is disabled
//                      // 	// (or there's some other error?)
//                      // 	// @TODO: show warning with "Don't tell me again" type option
//                      // }
//                   }
//                },
//             );
//          };
//          this.save_image_to_storage_soon = debounce(
//             this.save_image_to_storage_immediately,
//             100,
//          );
//          localStore.get(ls_key, (err, uri) => {
//             if (err) {
//                if (localStorageAvailable) {
//                   show_error_message(
//                      "Failed to retrieve image from local storage.",
//                      err,
//                   );
//                } else {
//                   // @TODO: DRY with storage manager message
//                   showMessageBox({
//                      message:
//                         "Please enable local storage in your browser's settings for local backup. It may be called Cookies, Storage, or Site Data.",
//                   });
//                }
//             } else if (uri) {
//                load_image_from_uri(uri).then(
//                   (info) => {
//                      console.log("info");
//                      console.log(info);
//                      open_from_image_info(info, null, null, true, true);
//                   },
//                   (error) => {
//                      show_error_message(
//                         "Failed to open image from local storage.",
//                         error,
//                      );
//                   },
//                );
//             } else {
//                // no uri so lets save the blank canvas
//                this.save_image_to_storage_soon();
//             }
//          });
//          $(window).on("session-update.session-hook", () => {
//             this.save_image_to_storage_soon();
//          });
//       }
//       end() {
//          // Skip debounce and save immediately
//          this.save_image_to_storage_soon.cancel();
//          this.save_image_to_storage_immediately();
//          // Remove session-related hooks
//          $(window).off(".session-hook");
//       }
//    }

//    // Handle the starting, switching, and ending of sessions from the location.hash

//    const update_session_from_location_hash = () => {
//       const session_match = location.hash.match(
//          /^#?(?:.*,)?(session|local):(.*)$/i,
//       );
//       const load_from_url_match = location.hash.match(
//          /^#?(?:.*,)?(load):(.*)$/i,
//       );
//       if (session_match) {
//          const local = session_match[1].toLowerCase() === "local";
//          const session_id = session_match[2];
//          if (session_id === "") {
//             log("Invalid session ID; session ID cannot be empty");
//             end_current_session();
//          } else if (!local && session_id.match(/[./[\]#$]/)) {
//             log(
//                "Session ID is not a valid Firebase location; it cannot contain any of ./[]#$",
//             );
//             end_current_session();
//          } else if (
//             !session_id.match(
//                /[-0-9A-Za-z\u00c0-\u00d6\u00d8-\u00f6\u00f8-\u02af\u1d00-\u1d25\u1d62-\u1d65\u1d6b-\u1d77\u1d79-\u1d9a\u1e00-\u1eff\u2090-\u2094\u2184-\u2184\u2488-\u2490\u271d-\u271d\u2c60-\u2c7c\u2c7e-\u2c7f\ua722-\ua76f\ua771-\ua787\ua78b-\ua78c\ua7fb-\ua7ff\ufb00-\ufb06]+/,
//             )
//          ) {
//             log(
//                "Invalid session ID; it must consist of 'alphanumeric-esque' characters",
//             );
//             end_current_session();
//          } else if (
//             current_session &&
//             current_session.id === session_id &&
//             local === current_session instanceof LocalSession
//          ) {
//             log(
//                "Hash changed but the session ID and session type are the same",
//             );
//          } else {
//             // @TODO: Ask if you want to save before starting a new session
//             end_current_session();

//             if (local) {
//                log(`Starting a new LocalSession, ID: ${session_id}`);
//                current_session = new LocalSession(session_id);
//             }
//          }
//       } else if (load_from_url_match) {
//          const url = decodeURIComponent(load_from_url_match[2]);

//          const uris = get_uris(url);
//          if (uris.length === 0) {
//             show_error_message(
//                "Invalid URL to load (after #load: in the address bar). It must include a protocol (https:// or http://)",
//             );
//             return;
//          }

//          log(
//             "Switching to new session from #load: URL (to #local: URL with session ID)",
//          );
//          // Note: could use into_existing_session=false on open_from_image_info instead of creating the new session beforehand
//          end_current_session();
//          change_url_param("local", generate_session_id());

//          console.log("A");
//          load_image_from_uri(url).then((info) => {
//             open_from_image_info(info, null, null, true, true);
//          }, show_resource_load_error_message);
//       } else {
//          log("No session ID in hash");
//          const old_hash = location.hash;
//          end_current_session();
//          change_url_param("local", generate_session_id(), {
//             replace_history_state: true,
//          });
//          log("After replaceState:", location.hash);
//          if (old_hash === location.hash) {
//             // e.g. on Wayback Machine
//             show_error_message(
//                "Autosave is disabled. Failed to update URL to start session.",
//             );
//          } else {
//             update_session_from_location_hash();
//          }
//       }
//    };

//    $(window).on("hashchange popstate change-url-params", (e) => {
//       log(e.type, location.hash);
//       update_session_from_location_hash();
//    });

//    log("Initializing with location hash:", location.hash);
//    update_session_from_location_hash();
// }

// let current_session;
// const end_current_session = () => {
//    if (current_session) {
//       console.log("Ending current session");
//       current_session.end();
//       current_session = null;
//    }
// };
// const generate_session_id = () =>
//    (Math.random() * 2 ** 32).toString(16).replace(".", "");

// export const new_local_session = () => {
//    end_current_session();
//    console.log("Changing URL to start new session...");
//    change_url_param("local", generate_session_id());
// };
