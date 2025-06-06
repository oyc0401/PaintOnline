import {
  clear,
  delete_selection,
  deselect,
  edit_copy,
  edit_cut,
  edit_paste,
  file_new,
  file_open,
  file_save,
  file_save_as,
  get_uris,
  image_attributes,
  image_invert_colors,
  load_image_from_uri,
  open_from_file,
  paste,
  paste_image_from_file,
  select_all,
  set_magnification,
  show_error_message,
  show_resource_load_error_message,
  update_canvas_rect,
  update_disable_aa,
  update_helper_layer,
  update_magnified_canvas_size,
  view_bitmap,
  setCanvasPosition,
  setMousePosition,
} from "./src/functions.js";

import { cancel, redo, undo } from "./src/history.js";
import $ from "jquery";
import {
  TAU,
  get_help_folder_icon,
  make_canvas,
  to_canvas_coords,
  to_canvas_coords_magnification,
} from "./src/helpers.js";
import { rotate } from "./src/image-manipulation.js";

import { localize } from "../localize/localize.js";

import {
  TOOL_AIRBRUSH,
  TOOL_BRUSH,
  TOOL_CURVE,
  TOOL_ELLIPSE,
  TOOL_ERASER,
  TOOL_LINE,
  TOOL_PENCIL,
  TOOL_POLYGON,
  TOOL_RECTANGLE,
  TOOL_ROUNDED_RECTANGLE,
} from "./src/tools.js";

import { PaintJSState } from "./state";

import { setDrawEvent } from "./event-draw.js";

const MIN_MAGNIFICATION = 0.12;
const MAX_MAGNIFICATION = 78;

let $canvas_area;
let $layer_area;

export function setEvent() {
  $canvas_area = PaintJSState.$canvas_area;
  $layer_area = PaintJSState.$layer_area;

  $canvas_area.on("resize", () => {
    update_magnified_canvas_size();
  });

  $(window).on("resize", () => {
    // for browser zoom, and in-app zoom of the canvas
    update_canvas_rect();
    update_disable_aa();
    update_magnified_canvas_size();
    setCanvasPosition(
      true,
      PaintJSState.paint.width,
      PaintJSState.paint.height,
    );
  });

  dragAndDropEvent();

  keyboardEvent();
  scrollEvent();

  copyPasteEvent();

  pointerEvent();

  setDrawEvent();

  pinchEvent();

  // Stop drawing (or dragging or whatever) if you Alt+Tab or whatever
  $(window).on("blur", () => {
    $(window).triggerHandler("pointerup");
  });

  $canvas_area.get(0).addEventListener("pointerdown", (event) => {
    if (
      document.activeElement instanceof HTMLElement && // exists and (for type checker:) has blur()
      document.activeElement !== document.body &&
      document.activeElement !== document.documentElement
    ) {
      // Allow unfocusing dialogs etc. in order to use keyboard shortcuts
      document.activeElement.blur();
    }
  });

  // 외부 누르면 선택창꺼지기
  $canvas_area.on("pointerdown", (e) => {
    if (e.button === 0) {
      if ($canvas_area.is(e.target) && !PaintJSState.pinchAllowed) {
        if (PaintJSState.selection) {
          deselect();
        }
      }
    }
  });

  // #region Fullscreen Handling for iOS
  // For Safari on iPad, Fullscreen mode overlays the system bar, completely obscuring our menu bar.
  // See CSS .fullscreen handling (and exit_fullscreen_if_ios) for more info.
  function iOS() {
    return (
      [
        "iPad Simulator",
        "iPhone Simulator",
        "iPod Simulator",
        "iPad",
        "iPhone",
        "iPod",
      ].includes(navigator.platform) ||
      // iPad on iOS 13 detection
      (navigator.userAgent.includes("Mac") && "ontouchend" in document)
    );
  }
  $("html").toggleClass("ios", iOS());
  $(window).on("fullscreenchange webkitfullscreenchange", () => {
    // const fullscreen = $(window).is(":fullscreen") || $(window).is(":-webkit-full-screen"); // gives "Script error."
    const fullscreen = !!(
      document.fullscreenElement || document.webkitFullscreenElement
    );
    // $status_text.text(`fullscreen: ${fullscreen}`);
    $("html").toggleClass("fullscreen", fullscreen);
  });
  // #endregion
}

function scrollEvent() {
  $canvas_area.on("scroll", () => {
    update_canvas_rect();
  });
  $(window).on("scroll focusin", () => {
    window.scrollTo(0, 0);
  });

  addEventListener(
    "wheel",
    (e) => {
      //console.log(e);  || e.ctrlKey
      if (e.altKey || e.ctrlKey) {
        e.preventDefault();
        let new_magnification = PaintJSState.magnification;
        if (e.deltaY < 0) {
          new_magnification *= 1.125;
        } else {
          new_magnification /= 1.125;
        }
        //console.log("clientX, Y", e.clientX, e.clientY);
        //console.log("canvas_coordclientX,Y",  to_canvas_coords_magnification(e));

        const clamped_magnification = Math.min(
          MAX_MAGNIFICATION,
          Math.max(MIN_MAGNIFICATION, new_magnification),
        );
        set_magnification(
          clamped_magnification,
          to_canvas_coords_magnification(e),
          // {x:e.clientX,y:e.clientY}
        );
        return;
      }
    },
    { passive: false },
  );

  $canvas_area.on("scroll", function () {
    // 사용자가 직접 스크롤할 때는 실제 scrollLeft/scrollTop 값을 가져와
    // PaintJSState.scroll_x, scroll_y에 저장해둔다 (소수점은 없는 값이겠지만, 최대한 동기화)
    PaintJSState.scroll_x = this.scrollLeft;
    PaintJSState.scroll_y = this.scrollTop;
  });
}

function dragAndDropEvent() {
  // jQuery's multiple event handling is not that useful in the first place, but when adding type info... it's downright ugly.
  $("body").on("dragover dragenter", (event) => {
    const dt = event.originalEvent.dataTransfer;
    const has_files = dt && Array.from(dt.types).includes("Files");
    if (has_files) {
      event.preventDefault();
    }
  });

  $("body").on("drop", async (event) => {
    if (event.isDefaultPrevented()) {
      return;
    }
    const dt = event.originalEvent.dataTransfer;
    const has_files = dt && Array.from(dt.types).includes("Files");
    if (has_files) {
      event.preventDefault();
      // @TODO: sort files/items in priority of image, theme, palette
      // and then try loading them in series, with async await to avoid race conditions?
      // or maybe support opening multiple documents in tabs
      // Note: don't use FS Access API in Electron app because:
      // 1. it's faulty (permissions problems, 0 byte files maybe due to the perms problems)
      // 2. we want to save the file.path, which the dt.files code path takes care of
      if (window.FileSystemHandle) {
        for (const item of dt.items) {
          // kind will be "file" for file/directory entries.
          if (item.kind === "file") {
            let handle;
            try {
              // Experimental API, not supported on Firefox as of 2024-02-17
              if ("getAsFileSystemHandle" in item) {
                // @ts-ignore
                handle = await item.getAsFileSystemHandle();
              }
            } catch (error) {
              // I'm not sure when this happens.
              // should this use "An invalid file handle was associated with %1." message?
              show_error_message(localize("File not found."), error);
              return;
            }
            if (!handle || handle.kind === "file") {
              let file;
              try {
                // instanceof is for the type checker; it should be guaranteed since kind is "file"
                if (handle && handle instanceof FileSystemFileHandle) {
                  file = await handle.getFile();
                } else {
                  file = item.getAsFile();
                }
              } catch (error) {
                // NotFoundError can happen when the file was moved or deleted,
                // then dragged and dropped via the browser's downloads bar, or some other outdated file listing.
                show_error_message(localize("File not found."), error);
                return;
              }
              open_from_file(file, handle);
              if (window._open_images_serially) {
                // For testing a suite of files:
                await new Promise((resolve) => setTimeout(resolve, 500));
              } else {
                // Normal behavior: only open one file.
                return;
              }
            }
            // else if (handle.kind === "directory") {}
          }
        }
      } else if (dt.files && dt.files.length) {
        if (window._open_images_serially) {
          // For testing a suite of files, such as http://www.schaik.com/pngsuite/
          let i = 0;
          const iid = setInterval(() => {
            console.log("opening", dt.files[i].name);
            open_from_file(dt.files[i]);
            i++;
            if (i >= dt.files.length) {
              clearInterval(iid);
            }
          }, 1500);
        } else {
          // Normal behavior: only open one file.
          open_from_file(dt.files[0]);
        }
      }
    }
  });
}

function copyPasteEvent() {
  $(window).on("cut copy paste", (e) => {
    if (e.isDefaultPrevented()) {
      return;
    }
    if (
      document.activeElement instanceof HTMLInputElement ||
      document.activeElement instanceof HTMLTextAreaElement ||
      !window.getSelection().isCollapsed
    ) {
      // Don't prevent cutting/copying/pasting within inputs or textareas, or if there's a selection
      return;
    }

    e.preventDefault();
    // @ts-ignore
    const cd = e.originalEvent.clipboardData || window.clipboardData;
    if (!cd) {
      return;
    }

    if (e.type === "copy" || e.type === "cut") {
      if (PaintJSState.selection && PaintJSState.selection.canvas) {
        const do_sync_clipboard_copy_or_cut = () => {
          // works only for pasting within a jspaint instance
          const data_url = PaintJSState.selection.canvas.toDataURL();
          cd.setData("text/x-data-uri; type=image/png", data_url);
          cd.setData("text/uri-list", data_url);
          cd.setData("URL", data_url);
          if (e.type === "cut") {
            delete_selection({
              name: localize("Cut"),
              icon: get_help_folder_icon("p_cut.png"),
            });
          }
        };
        if (!navigator.clipboard || !navigator.clipboard.write) {
          return do_sync_clipboard_copy_or_cut();
        }
        try {
          if (e.type === "cut") {
            edit_cut();
          } else {
            edit_copy();
          }
        } catch (_error) {
          do_sync_clipboard_copy_or_cut();
        }
      }
    } else if (e.type === "paste") {
      for (const item of cd.items) {
        if (item.type.match(/^text\/(?:x-data-uri|uri-list|plain)|URL$/)) {
          item.getAsString((text) => {
            const uris = get_uris(text);
            if (uris.length > 0) {
              load_image_from_uri(uris[0]).then(
                (info) => {
                  paste(info.image || make_canvas(info.image_data));
                },
                (error) => {
                  show_resource_load_error_message(error);
                },
              );
            } else {
              show_error_message(
                "The information on the Clipboard can't be inserted into Paint.",
              );
            }
          });
          break;
        } else if (item.type.match(/^image\//)) {
          paste_image_from_file(item.getAsFile());
          break;
        }
      }
    }
  });
  // #endregion
}

function keyboardEvent() {
  $(window).on("keydown", (e) => {
    // typecast to HTMLElement because e.target is incorrectly given as Window, due to wrapping window
    const target = /** @type {HTMLElement} */ (
      /** @type {unknown} */ (e.target)
    );

    if (e.isDefaultPrevented()) {
      return;
    }
    if (e.key === "Escape") {
      // Note: Escape handled below too! (after input/textarea return condition)
      // if (textbox && textbox.$editor.is(target)) {
      //   deselect();
      // }
    }
    if (
      // Ctrl+Shift+Y for history window,
      // chosen because it's related to the undo/redo shortcuts
      // and it looks like a branching symbol.
      (e.ctrlKey || e.metaKey) &&
      e.shiftKey &&
      !e.altKey &&
      e.key.toUpperCase() === "Y"
    ) {
      e.preventDefault();
      return;
    }
    // @TODO: return if menus/menubar focused or focus in dialog window
    // or maybe there's a better way to do this that works more generally
    // maybe it should only handle the event if document.activeElement is the body or html element?
    // (or $app could have a tabIndex and no focus style and be focused under various conditions,
    // if that turned out to make more sense for some reason)
    if (
      e.target instanceof HTMLInputElement ||
      e.target instanceof HTMLTextAreaElement
    ) {
      return;
    }

    // @TODO: preventDefault in all cases where the event is handled
    // also, ideally check that modifiers *aren't* pressed
    // probably best to use a library at this point!

    if (PaintJSState.selection) {
      const nudge_selection = (delta_x, delta_y) => {
        PaintJSState.selection.x += delta_x;
        PaintJSState.selection.y += delta_y;
        PaintJSState.selection.position();
      };
      switch (e.key) {
        case "ArrowLeft":
          nudge_selection(-1, 0);
          e.preventDefault();
          break;
        case "ArrowRight":
          nudge_selection(+1, 0);
          e.preventDefault();
          break;
        case "ArrowDown":
          nudge_selection(0, +1);
          e.preventDefault();
          break;
        case "ArrowUp":
          nudge_selection(0, -1);
          e.preventDefault();
          break;
      }
    }

    if (e.key === "Escape") {
      // Note: Escape handled above too!
      if (PaintJSState.selection) {
        deselect();
      } else {
        cancel(false, true);
      }
    } else if (e.key === "Enter") {
      if (PaintJSState.selection) {
        deselect();
      }
    } else if (e.key === "F4") {
      redo();
    } else if (e.key === "Delete" || e.key === "Backspace") {
      // alt+backspace: undo
      // shift+delete: cut
      // delete/backspace: delete selection
      if (e.key === "Delete" && e.shiftKey) {
        edit_cut();
      } else if (e.key === "Backspace" && e.altKey) {
        undo();
      } else {
        delete_selection();
      }
      e.preventDefault();
    } else if (e.key === "Insert") {
      // ctrl+insert: copy
      // shift+insert: paste
      if (e.ctrlKey) {
        edit_copy();
        e.preventDefault();
      } else if (e.shiftKey) {
        edit_paste();
        e.preventDefault();
      }
    } else if (
      e.code === "NumpadAdd" ||
      e.code === "NumpadSubtract" ||
      // normal + and - keys
      e.key === "+" ||
      e.key === "-" ||
      e.key === "="
    ) {
      const plus = e.code === "NumpadAdd" || e.key === "+" || e.key === "=";
      const minus = e.code === "NumpadSubtract" || e.key === "-";
      const delta = Number(plus) - Number(minus); // const delta = +plus++ -minus--; // Δ = ±±±±

      if (PaintJSState.selection) {
        PaintJSState.selection.scale(2 ** delta);
      } else {
        if (PaintJSState.selected_tool.id === TOOL_BRUSH) {
          PaintJSState.brush_size = Math.max(
            1,
            Math.min(PaintJSState.brush_size + delta, 500),
          );
        } else if (PaintJSState.selected_tool.id === TOOL_ERASER) {
          PaintJSState.eraser_size = Math.max(
            1,
            Math.min(PaintJSState.eraser_size + delta, 500),
          );
        } else if (PaintJSState.selected_tool.id === TOOL_AIRBRUSH) {
          PaintJSState.airbrush_size = Math.max(
            1,
            Math.min(PaintJSState.airbrush_size + delta, 500),
          );
        } else if (PaintJSState.selected_tool.id === TOOL_PENCIL) {
          PaintJSState.pencil_size = Math.max(
            1,
            Math.min(PaintJSState.pencil_size + delta, 50),
          );
        } else if (
          PaintJSState.selected_tool.id === TOOL_LINE ||
          PaintJSState.selected_tool.id === TOOL_CURVE ||
          PaintJSState.selected_tool.id === TOOL_RECTANGLE ||
          PaintJSState.selected_tool.id === TOOL_ROUNDED_RECTANGLE ||
          PaintJSState.selected_tool.id === TOOL_ELLIPSE ||
          PaintJSState.selected_tool.id === TOOL_POLYGON
        ) {
          PaintJSState.stroke_size = Math.max(
            1,
            Math.min(PaintJSState.stroke_size + delta, 500),
          );
        }

        $(window).trigger("option-changed");
        if (PaintJSState.button !== undefined && PaintJSState.pointer) {
          // pointer may only be needed for tests

          tool_go(PaintJSState.selected_tool);
        }
        update_helper_layer();
      }
      e.preventDefault();
      return;
    } else if (e.ctrlKey || e.metaKey) {
      // if (textbox) {
      //   switch (e.key.toUpperCase()) {
      //     case "A":
      //     case "Z":
      //     case "Y":
      //     case "I":
      //     case "B":
      //     case "U":
      //       // Don't prevent the default. Allow text editing commands.
      //       return;
      //   }
      // }
      // Ctrl+PageDown: zoom to 400%
      // Ctrl+PageUp: zoom to 100%
      // In Chrome and Firefox, these switch to the next/previous tab,
      // but it's allowed to be overridden in fullscreen in Chrome.
      if (e.key === "PageDown") {
        set_magnification(4);
        e.preventDefault();
        return;
      } else if (e.key === "PageUp") {
        set_magnification(1);
        e.preventDefault();
        return;
      }
      switch (e.key.toUpperCase()) {
        case ",": // "<" without Shift
        case "<":
        case "[":
        case "{":
          rotate(-TAU / 4);
          break;
        case ".": // ">" without Shift
        case ">":
        case "]":
        case "}":
          rotate(+TAU / 4);
          break;
        case "Z":
          if (e.shiftKey) {
            redo();
          } else {
            undo();
          }
          break;
        case "Y":
          // Ctrl+Shift+Y handled above
          redo();
          break;
        case "G":
          break;
        case "F":
          // @ts-ignore (repeat doesn't exist on jQuery.Event, I guess, but this is fine)
          if (!e.repeat && !e.originalEvent?.repeat) {
            view_bitmap();
          }
          break;
        case "O":
          file_open();
          break;
        case "S":
          if (e.shiftKey) {
            file_save_as();
          } else {
            file_save();
          }
          break;
        case "A":
          select_all();
          break;
        case "I":
          image_invert_colors();
          break;
        case "E":
          image_attributes();
          break;

        // These shortcuts are mostly reserved by browsers,
        // but they are allowed in Electron.
        // The shortcuts are hidden in the menus (or changed) when not in Electron,
        // to prevent accidental closing/refreshing.
        // I'm supporting Alt+<shortcut> here (implicitly) as a workaround (and showing this in the menus in some cases).
        // Also, note that Chrome allows some shortcuts to be overridden in fullscreen (but showing/hiding the shortcuts would be confusing).
        case "N":
          if (e.shiftKey) {
            clear();
          } else {
            file_new();
          }
          break;

        default:
          return; // don't preventDefault
      }
      e.preventDefault();
      // put nothing below! note return above
    }
  });
}

function pointerEvent() {
  // 현재 그림을 그리는 중 이면 포인터의 위치를 설정한다.
  $layer_area.on("pointermove", (e) => {
    if (!PaintJSState.init) return;
    setPrimaryPointPosition(e);
  });

  // 마우스가 캔버스 안에 들어오면 커서 위치에 헬퍼 레이어에 브러시 미리보기 위치 설정
  $layer_area.on("pointerenter", (e) => {
    if (!PaintJSState.init) return;
    PaintJSState.pointer_over_canvas = true;
    activateBrushPreview(e);
  });

  // 마우스가 캔버스를 벗어나면 브러시 미리보기 비활성화
  $layer_area.on("pointerleave", (e) => {
    if (!PaintJSState.init) return;
    PaintJSState.pointer_over_canvas = false;
    deactivateBrushPreview(e);
  });

  // 현재 그림을 그리는 중 이면 포인터의 위치를 설정한다.
  function setPrimaryPointPosition(e) {
    // ---- [중요 수정 1과 동일한 원리] pointer_active 아닌데 $canvas의 pointermove가 들어오면 그림 안 그리도록
    if (!PaintJSState.pointer_active) {
      const pointer = to_canvas_coords(e);

      setMousePosition(true, pointer.x, pointer.y);

      return;
    }

    if (PaintJSState.pointerId === e.pointerId) {
      // console.log(e.pointerId);

      const pointer = to_canvas_coords(e);
      PaintJSState.pointer = pointer;
      setMousePosition(true, pointer.x, pointer.y);
    }
  }

  // 마우스가 캔버스 안에 들어오면 커서 위치에 헬퍼 레이어에 브러시 미리보기 위치 설정
  function activateBrushPreview(e) {
    update_helper_layer(e);

    if (!PaintJSState.update_helper_layer_on_pointermove_active) {
      $(window).on("pointermove", update_helper_layer);
      PaintJSState.update_helper_layer_on_pointermove_active = true;
    }
  }

  // 마우스가 캔버스를 벗어나면 브러시 미리보기 비활성화
  function deactivateBrushPreview(e) {
    update_helper_layer(e);

    if (
      !PaintJSState.pointer_active &&
      PaintJSState.update_helper_layer_on_pointermove_active
    ) {
      $(window).off("pointermove", update_helper_layer);
      PaintJSState.update_helper_layer_on_pointermove_active = false;
    }
  }
}

function pinchEvent() {
  let last_zoom_pointer_distance;
  let pan_last_pos;

  PaintJSState.$canvas_area.get(0).addEventListener(
    "touchstart",
    (event) => {
      console.log("$canvas_area.touchstart - captured");

      if (event.touches.length === 1) {
        PaintJSState.first_pointer_time = performance.now();
      }
      if (event.touches.length === 2) {
        last_zoom_pointer_distance = Math.hypot(
          event.touches[0].clientX - event.touches[1].clientX,
          event.touches[0].clientY - event.touches[1].clientY,
        );

        pan_last_pos = average_touches(event.touches);
      }

      if (event.touches.length == 2) {
        const elapsed = performance.now() - PaintJSState.first_pointer_time;

        // 일정시간 이내에 그리면 지우기
        if (elapsed <= PaintJSState.discard_quick_undo_period) {
          $(window).trigger("touchend");

          // 500ms 이내 => 그림 cancel + pinchAllowed = true
          cancel(false, true);
        }
        $(window).trigger("pointerup");
        console.log("두손가락이면 핀치줌 허용");
        // 그림그리기 완료
        // pinchAllowed가 false일때만 그리기 완료됌..

        PaintJSState.pointer_active = false;
        // ---- [중요 수정 2] 그림 그리기를 중단하려면 pointer_active = false
        // 핀치 줌은 허용
        PaintJSState.pinchAllowed = true;
      }
    },
    true,
  );

  $(window).on("touchend", (event) => {
    console.log("touchend");

    // // 핀치줌을 하다가 떼면 핀치줌 꺼지게 하기
    if (event.touches === undefined || event.touches.length < 2) {
      PaintJSState.pinchAllowed = false;
    }
  });

  $(window).on("touchmove", (event) => {
    if (PaintJSState.pinchAllowed) {
      const current_pos = average_touches(event.touches);
      const distance = Math.hypot(
        event.touches[0].clientX - event.touches[1].clientX,
        event.touches[0].clientY - event.touches[1].clientY,
      );

      // (A) 배율 계산
      const scaleFactor = distance / last_zoom_pointer_distance;
      let new_magnification = PaintJSState.magnification * scaleFactor;

      last_zoom_pointer_distance = distance;

      const clamped_magnification = Math.min(
        MAX_MAGNIFICATION,
        Math.max(MIN_MAGNIFICATION, new_magnification),
      );
      set_magnification(
        clamped_magnification,
        to_canvas_coords_magnification({
          clientX: current_pos.x,
          clientY: current_pos.y,
        }),
      );

      const dx = pan_last_pos.x - current_pos.x;
      const dy = pan_last_pos.y - current_pos.y;
      const dpr = devicePixelRatio;

      // 스크롤을 할때 브라우저는 1만큼 이동하라고 시켰으면 실제론 1*dpr를 계산하고. 이를 내림한 값을 브라우저에 저장한다.
      // 따라서 1을 움직이라고 했을 때 dpr이 2.6이라면 실제로는 floor(1*2.6)을 한 2만큼 스크롤이 움직인다고 여기고.
      // scrollLeft()는 2/2.6 = 0.7692가 된다. 실제와 약 23%나 차이나는 것이다.
      // 이것이 프레임당 지속되면 누적이되어 크게 차이난다. 평균 (-0.5,-0.5) 만큼의 차이가 나므로 1초에 30픽셀만큼 오차가 생긴다.
      // 반올림 하면 오차를 반으로 줄일 수 있지만 완벽히 오차를 제거한 것은 아니다.

      // scaleFactor를 곱해야 제대로 되는것 같은데..?
      // 확대를 하기 전 거리기준이었으니깐 확대를 반영한 거리만큼 움직여야겠지..?
      // 계산해보면 그것도 아닌데..?

      PaintJSState.$canvas_area[0].scrollBy({
        left: Math.round(dx * scaleFactor * dpr) / dpr,
        top: Math.round(dy * scaleFactor * dpr) / dpr,
      });

      pan_last_pos = current_pos;
    }
  });

  function average_touches(points) {
    const average = { x: 0, y: 0 };
    for (const pointer of points) {
      average.x += pointer.clientX;
      average.y += pointer.clientY;
    }
    average.x /= points.length;
    average.y /= points.length;
    return average;
  }
}

// #endregion
export function update_fill_and_stroke_colors_and_lineWidth(selected_tool) {
  PaintJSState.main_ctx.lineWidth = PaintJSState.stroke_size;

  const reverse_because_fill_only = !!(
    selected_tool.$options &&
    selected_tool.$options.fill &&
    !selected_tool.$options.stroke
  );
  /** @type {ColorSelectionSlot} */
  const color_k =
    PaintJSState.ctrl &&
    PaintJSState.selected_colors.ternary &&
    PaintJSState.pointer_active
      ? "ternary"
      : PaintJSState.reverse !== reverse_because_fill_only
        ? "background"
        : "foreground";
  PaintJSState.main_ctx.fillStyle =
    PaintJSState.fill_color =
    PaintJSState.main_ctx.strokeStyle =
    PaintJSState.stroke_color =
      PaintJSState.selected_colors[color_k];

  /** @type {ColorSelectionSlot} */
  let fill_color_k = PaintJSState.ctrl
    ? "ternary"
    : PaintJSState.reverse !== reverse_because_fill_only
      ? "background"
      : "foreground";
  /** @type {ColorSelectionSlot} */
  let stroke_color_k = fill_color_k;

  if (selected_tool.shape || selected_tool.shape_colors) {
    if (!selected_tool.stroke_only) {
      if (PaintJSState.reverse !== reverse_because_fill_only) {
        fill_color_k = "foreground";
        stroke_color_k = "background";
      } else {
        fill_color_k = "background";
        stroke_color_k = "foreground";
      }
    }
    PaintJSState.main_ctx.fillStyle = PaintJSState.fill_color =
      PaintJSState.selected_colors[fill_color_k];
    PaintJSState.main_ctx.strokeStyle = PaintJSState.stroke_color =
      PaintJSState.selected_colors[stroke_color_k];
  }
  PaintJSState.pick_color_slot = fill_color_k;
}

export function tool_go(selected_tool, event_name) {
  //  console.warn("tool_go!");
  update_fill_and_stroke_colors_and_lineWidth(selected_tool);

  if (selected_tool[event_name]) {
    selected_tool[event_name](
      PaintJSState.main_ctx,
      PaintJSState.pointer.x,
      PaintJSState.pointer.y,
    );
  }
  if (selected_tool.paint) {
    selected_tool.paint(
      PaintJSState.main_ctx,
      PaintJSState.pointer.x,
      PaintJSState.pointer.y,
    );
  }
}
