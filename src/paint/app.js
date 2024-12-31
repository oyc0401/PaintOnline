import { Handles } from "./src/Handles.js";

import {
  cancel,
  change_url_param,
  clear,
  confirm_overwrite_capability,
  delete_selection,
  deselect,
  edit_copy,
  edit_cut,
  edit_paste,
  file_new,
  file_open,
  file_save,
  file_save_as,
  get_tool_by_id,
  get_uris,
  image_attributes,
  image_flip_and_rotate,
  image_invert_colors,
  image_stretch_and_skew,
  load_image_from_uri,
  make_or_update_undoable,
  open_from_file,
  paste,
  paste_image_from_file,
  redo,
  reset_canvas_and_history,
  reset_file,
  reset_selected_colors,
  resize_canvas_and_save_dimensions,
  resize_canvas_without_saving_dimensions,
  save_as_prompt,
  select_all,
  select_tool,
  select_tools,
  set_magnification,
  show_document_history,
  show_error_message,
  show_resource_load_error_message,
  undo,
  update_canvas_rect,
  update_disable_aa,
  update_helper_layer,
  update_magnified_canvas_size,
  view_bitmap,
  write_image_file,
} from "./src/functions.js";
import $ from "jquery";
import {
  TAU,
  get_help_folder_icon,
  make_canvas,
  to_canvas_coords,
  to_canvas_coords_magnification,
  make_css_cursor,
} from "./src/helpers.js";
import { init_webgl_stuff, rotate } from "./src/image-manipulation.js";

import { localStore } from "./src/storage.js";
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
  TOOL_SELECT,
  tools,
} from "./src/tools.js";

import { PaintJSState } from "./state.js";

const MIN_MAGNIFICATION = 0.12;
const MAX_MAGNIFICATION = 78;

export function initApp(canvasAreaQuery) {
  const $canvas_area = $(canvasAreaQuery);

  const $canvas = $(PaintJSState.main_canvas).appendTo($canvas_area);

  $canvas.css("touch-action", "none");
  $canvas_area.css("touch-action", "none");

  const canvas_handles = new Handles({
    $handles_container: $canvas_area,
    $object_container: $canvas_area,
    get_rect: () => ({
      x: 0,
      y: 0,
      width: PaintJSState.main_canvas.width,
      height: PaintJSState.main_canvas.height,
    }),
    set_rect: ({ width, height }) =>
      resize_canvas_and_save_dimensions(width, height),
    outset: 4,
    get_handles_offset_left: () =>
      parseFloat($canvas_area.css("padding-left")) + 1,
    get_handles_offset_top: () =>
      parseFloat($canvas_area.css("padding-top")) + 1,
    get_ghost_offset_left: () =>
      parseFloat($canvas_area.css("padding-left")) + 1,
    get_ghost_offset_top: () => parseFloat($canvas_area.css("padding-top")) + 1,
    size_only: true,
  });

  PaintJSState.update_fill_and_stroke_colors_and_lineWidth =
    update_fill_and_stroke_colors_and_lineWidth;
  PaintJSState.$canvas_area = $canvas_area;
  PaintJSState.$canvas = $canvas;
  PaintJSState.canvas_bounding_client_rect =
    PaintJSState.main_canvas.getBoundingClientRect(); // cached for performance, updated later
  PaintJSState.canvas_handles = canvas_handles;

  //console.log(PaintJSState);
  $canvas.css({
    cursor: make_css_cursor(...PaintJSState.default_tool.cursor),
  });

  $(window).on("resize", () => {
    // for browser zoom, and in-app zoom of the canvas

    update_canvas_rect();
    update_disable_aa();
    update_magnified_canvas_size();
  });
  $canvas_area.on("scroll", () => {
    update_canvas_rect();
  });
  $canvas_area.on("resize", () => {
    update_magnified_canvas_size();
  });

  $(window).on("scroll focusin", () => {
    window.scrollTo(0, 0);
  });

  // jQuery's multiple event handling is not that useful in the first place, but when adding type info... it's downright ugly.
  $("body")
    .on(
      "dragover dragenter",
      (/** @type {JQuery.DragOverEvent | JQuery.DragEnterEvent} */ event) => {
        const dt = event.originalEvent.dataTransfer;
        const has_files = dt && Array.from(dt.types).includes("Files");
        if (has_files) {
          event.preventDefault();
        }
      },
    )
    .on("drop", async (event) => {
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

  // #endregion

  function manageKeyboard() {
    // #region Keyboard Shortcuts
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
        show_document_history();
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
          cancel();
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
          case "R":
            image_flip_and_rotate();
            break;
          case "W":
            image_stretch_and_skew();
            break;

          default:
            return; // don't preventDefault
        }
        e.preventDefault();
        // put nothing below! note return above
      }
    });

    //console.log('dpr:',window.devicePixelRatio)
    // #endregion

    window.PaintJSState = PaintJSState;

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
            Math.max(MIN_MAGNIFICATION, new_magnification)
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
    // #endregion

    // #region Clipboard Handling
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
  manageKeyboard();

  reset_file();
  reset_selected_colors();
  reset_canvas_and_history(); // (with newly reset colors)
  set_magnification(PaintJSState.default_magnification);

  function manageStorage() {
    // this is synchronous for now, but @TODO: handle possibility of loading a document before callback
    // when switching to asynchronous storage, e.g. with localforage

    localStore.get(
      {
        width: PaintJSState.default_canvas_width,
        height: PaintJSState.default_canvas_height,
      },
      (err, stored_values) => {
        if (err) {
          return;
        }
        PaintJSState.my_canvas_width = Number(stored_values.width);
        PaintJSState.my_canvas_height = Number(stored_values.height);

        make_or_update_undoable(
          {
            match: (history_node) => history_node.name === localize("New"),
            name: "Resize Canvas For New Document",
            icon: get_help_folder_icon("p_stretch_both.png"),
          },
          () => {
            PaintJSState.main_canvas.width = Math.max(
              1,
              PaintJSState.my_canvas_width,
            );
            PaintJSState.main_canvas.height = Math.max(
              1,
              PaintJSState.my_canvas_height,
            );
            PaintJSState.main_ctx.disable_image_smoothing();
            if (!PaintJSState.transparency) {
              PaintJSState.main_ctx.fillStyle =
                PaintJSState.selected_colors.background;
              PaintJSState.main_ctx.fillRect(
                0,
                0,
                PaintJSState.main_canvas.width,
                PaintJSState.main_canvas.height,
              );
            }
            $canvas_area.trigger("resize");
          },
        );
      },
    );

    if (window.initial_system_file_handle) {
      systemHooks.readBlobFromHandle(window.initial_system_file_handle).then(
        (file) => {
          if (file) {
            open_from_file(file, window.initial_system_file_handle);
          }
        },
        (error) => {
          // this handler is not always called, sometimes error message is shown from readBlobFromHandle
          show_error_message(
            `Failed to open file ${window.initial_system_file_handle}`,
            error,
          );
        },
      );
    }
  }
  manageStorage();

  $canvas_area.on("scroll", function () {
    // 사용자가 직접 스크롤할 때는 실제 scrollLeft/scrollTop 값을 가져와
    // PaintJSState.scroll_x, scroll_y에 저장해둔다 (소수점은 없는 값이겠지만, 최대한 동기화)
    PaintJSState.scroll_x = this.scrollLeft;
    PaintJSState.scroll_y = this.scrollTop;
  });

  // #endregion
  function update_fill_and_stroke_colors_and_lineWidth(selected_tool) {
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

  function managePointer() {
    // #region Palette Updating From Theme

    ////////////////////////////////////
    // #region Primary Canvas Interaction
    function tool_go(selected_tool, event_name) {
      console.warn("tool_go!");
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

    function canvas_pointer_move(e) {
      // ---- [중요 수정 1] pointer_active가 아니면 바로 return → 그림 안 그려짐
      if (!PaintJSState.pointer_active) {
        return;
      }

      PaintJSState.ctrl = e.ctrlKey;
      PaintJSState.shift = e.shiftKey;

      // Quick Undo (for mouse/pen)
      if (PaintJSState.touchCount && e.button !== -1) {
        const MMB = 4;
        if (
          e.pointerType !== PaintJSState.pointer_type ||
          (e.buttons | MMB) !== (PaintJSState.pointer_buttons | MMB)
        ) {
          cancel();
          PaintJSState.pointer_active = false;
          return;
        }
      }

      // SHIFT 스냅(도형 그리기) 로직 (원본 코드와 동일)
      if (e.shiftKey) {
        if (
          PaintJSState.selected_tool.id === TOOL_LINE ||
          PaintJSState.selected_tool.id === TOOL_CURVE
        ) {
          const dist = Math.hypot(
            PaintJSState.pointer.y - PaintJSState.pointer_start.y,
            PaintJSState.pointer.x - PaintJSState.pointer_start.x,
          );
          const eighth_turn = TAU / 8;
          const angle_0_to_8 =
            Math.atan2(
              PaintJSState.pointer.y - PaintJSState.pointer_start.y,
              PaintJSState.pointer.x - PaintJSState.pointer_start.x,
            ) / eighth_turn;
          const angle = Math.round(angle_0_to_8) * eighth_turn;
          PaintJSState.pointer.x = Math.round(
            PaintJSState.pointer_start.x + Math.cos(angle) * dist,
          );
          PaintJSState.pointer.y = Math.round(
            PaintJSState.pointer_start.y + Math.sin(angle) * dist,
          );
        } else if (PaintJSState.selected_tool.shape) {
          const w = Math.abs(
            PaintJSState.pointer.x - PaintJSState.pointer_start.x,
          );
          const h = Math.abs(
            PaintJSState.pointer.y - PaintJSState.pointer_start.y,
          );
          if (w < h) {
            if (PaintJSState.pointer.y > PaintJSState.pointer_start.y) {
              PaintJSState.pointer.y = PaintJSState.pointer_start.y + w;
            } else {
              PaintJSState.pointer.y = PaintJSState.pointer_start.y - w;
            }
          } else {
            if (PaintJSState.pointer.x > PaintJSState.pointer_start.x) {
              PaintJSState.pointer.x = PaintJSState.pointer_start.x + h;
            } else {
              PaintJSState.pointer.x = PaintJSState.pointer_start.x - h;
            }
          }
        }
      }

      // 실제 도구 paint
      PaintJSState.selected_tools.forEach((selected_tool) => {
        tool_go(selected_tool);
      });

      PaintJSState.pointer_previous = PaintJSState.pointer;
    }

    // 현재 그림을 그리는 중 이면 포인터의 위치를 설정한다.
    function setPrimaryPointPosition() {
      $canvas.on("pointermove", (e) => {
        // ---- [중요 수정 1과 동일한 원리] pointer_active 아닌데 $canvas의 pointermove가 들어오면 그림 안 그리도록
        if (!PaintJSState.pointer_active) {
          return;
        }

        if (PaintJSState.pointerId === e.pointerId) {
          PaintJSState.pointer = to_canvas_coords(e);
        }
      });
    }
    setPrimaryPointPosition();

    // 마우스가 캔버스 안에 들어오면 커서위치에 헬퍼레이어에 브러쉬 미리보기 위치 잡는거
    function setBrushPreview() {
      $canvas.on("pointerenter", (e) => {
        PaintJSState.pointer_over_canvas = true;
        update_helper_layer(e);

        if (!PaintJSState.update_helper_layer_on_pointermove_active) {
          $(window).on("pointermove", update_helper_layer);
          PaintJSState.update_helper_layer_on_pointermove_active = true;
        }
      });

      $canvas.on("pointerleave", (e) => {
        PaintJSState.pointer_over_canvas = false;
        update_helper_layer(e);

        if (
          !PaintJSState.pointer_active &&
          PaintJSState.update_helper_layer_on_pointermove_active
        ) {
          $(window).off("pointermove", update_helper_layer);
          PaintJSState.update_helper_layer_on_pointermove_active = false;
        }
      });
    }
    setBrushPreview();

    ////////////////////////////////////
    // #region Panning and Zooming


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

    touchEventSetting();
    // #endregion

    
    ////////////////////////////////////
    // #region Primary Canvas Interaction (continued)

    $canvas.on("pointerdown", (e) => {
      console.log("$canvas.pointerdown");
      update_canvas_rect();

      const elapsed = performance.now() - PaintJSState.first_pointer_time;

      // "pointer_active가 없으면" => 첫 번째 포인터로 간주  // 이였는데, 2개캡쳐되면 알아서 pointer_active를 false로 바꿈.
      // 그래서 pinchAllowed인지도 같이 감지함
      //그러면 !PaintJSState.pointer_active 이거 빼도 되지 않으려나?
      // 그러면 안돼 왜나면 다른곳을 클릭하고 캔버스를 클릭하면 정상작동해야해
      if (!PaintJSState.pointer_active && !PaintJSState.pinchAllowed) {
        console.log("첫 번째 터치로 그림 시작:", e.pointerId);
        PaintJSState.pointer_active = true;
        PaintJSState.pointerId = e.pointerId;
        PaintJSState.pinchAllowed = false; // 초기값 false
      } else {
        // 이미 포인터가 있음 => 두 번째 터치
        if (
          PaintJSState.pointerId !== e.pointerId &&
          elapsed > PaintJSState.discard_quick_undo_period
        ) {
          // 500ms 이후 => 무시 (그림X, 핀치X)
          console.log("두 번째 터치(500ms이후), 무시 + 핀치줌 불가");
        }
        return;
      }

      // ------ 첫 번째 포인터로 그림 그리는 로직 ------
      PaintJSState.history_node_to_cancel_to =
        PaintJSState.current_history_node;
      PaintJSState.pointer_type = e.pointerType;
      PaintJSState.pointer_buttons = e.buttons;

      // pointerup 핸들러
      const pointerUpHandler = (eUp, canceling, no_undoable) => {
        if (PaintJSState.pointerId !== eUp.pointerId) {
          return;
        }
        PaintJSState.pointer_active = false;

        update_helper_layer(eUp);

        if (
          !PaintJSState.pointer_over_canvas &&
          PaintJSState.update_helper_layer_on_pointermove_active
        ) {
          $(window).off("pointermove", update_helper_layer);
          PaintJSState.update_helper_layer_on_pointermove_active = false;
        }
        $(window).off("pointerup pointercancel", pointerUpHandler);
      };
      $(window).on("pointerup pointercancel", pointerUpHandler);

      if (e.button === 0) {
        PaintJSState.reverse = false;
      } else if (e.button === 2) {
        PaintJSState.reverse = true;
      } else {
        return;
      }

      // 초기화
      console.log("포인터 초기화");
      PaintJSState.button = e.button;
      PaintJSState.ctrl = e.ctrlKey;
      PaintJSState.shift = e.shiftKey;
      PaintJSState.pointer_start =
        PaintJSState.pointer_previous =
        PaintJSState.pointer =
          to_canvas_coords(e);

      // 실제 펜/브러시/도구 pointerdown_action
      const pointerdown_action = () => {
        // let interval_ids = [];
        PaintJSState.selected_tools.forEach((selected_tool) => {
          if (selected_tool.paint || selected_tool.pointerdown) {
            tool_go(selected_tool, "pointerdown");
          }
        });

        $(window).on("pointermove", canvas_pointer_move);

        // 툴별 pointerup
        const onWindowPointerup = (eUp, canceling, no_undoable) => {
          if (PaintJSState.pointerId !== eUp.pointerId) {
            return;
          }
          PaintJSState.button = undefined;
          PaintJSState.reverse = false;

          if (eUp.clientX !== undefined) {
            if (PaintJSState.pointerId === eUp.pointerId) {
              // PaintJSState.pointer = to_canvas_coords(eUp);
            }
          }
          if (!PaintJSState.pinchAllowed) {
            PaintJSState.selected_tools.forEach((selected_tool) => {
              selected_tool.pointerup?.(
                PaintJSState.main_ctx,
                PaintJSState.pointer.x,
                PaintJSState.pointer.y,
              );
            });
          }

          if (PaintJSState.selected_tools.length === 1) {
            if (PaintJSState.selected_tool.deselect) {
              select_tools(PaintJSState.return_to_tools);
            }
          }

          $(window).off("pointermove", canvas_pointer_move);
          // for (const interval_id of interval_ids) {
          //   clearInterval(interval_id);
          // }
          if (!canceling) {
            PaintJSState.history_node_to_cancel_to = null;
          }
          $(window).off("pointerup pointercancel", onWindowPointerup);
        };

        $(window).on("pointerup pointercancel", onWindowPointerup);
      };

      pointerdown_action();
      update_helper_layer(e);
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
    // #endregion
  }
  managePointer();

  // Stop drawing (or dragging or whatever) if you Alt+Tab or whatever
  $(window).on("blur", () => {
    $(window).triggerHandler("pointerup");
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

  // #region Testing Helpers
  // Note: this is defined here so the app is loaded when this is defined.

  // #endregion

  init_webgl_stuff();
}

















let last_zoom_pointer_distance;
let pan_last_pos;


function touchEventSetting(){
 


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
        if (elapsed <= PaintJSState.discard_quick_undo_period) {
          //  핀지줌 허용
          // 아래코드 중복임, 리팩토링 필요
          console.log("500ms이내에 두개의 클릭이 감지되면, 핀치줌 허용");

          $(window).trigger("touchend");
          // 500ms 이내 => 그림 cancel + pinchAllowed = true
          cancel(false, true);
          PaintJSState.pointer_active = false;
          // ---- [중요 수정 2] 그림 그리기를 중단하려면 pointer_active = false
          // 핀치 줌은 허용
          PaintJSState.pinchAllowed = true;
        }
      }
    },
    true,
  );

  $(window).on("touchend", (event) => {
    console.log("touchend");
    
    // // 핀치줌을 하다가 떼면 핀치줌 꺼지게 하기
    if(event.touches === undefined || event.touches.length < 2){
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
        Math.max(MIN_MAGNIFICATION, new_magnification)
      );
      set_magnification(
        clamped_magnification,
        to_canvas_coords_magnification({
          clientX: current_pos.x,
          clientY: current_pos.y,
        }),
      );
      
      const dx = pan_last_pos.x - current_pos.x;
      const dy = pan_last_pos.y - current_pos.y ;

      // 스크롤을 할때 브라우저는 1만큼 이동하라고 시켰으면 실제론 1*dpr를 계산하고. 이를 내림한 값을 브라우저에 저장한다.
      // 따라서 1을 움직이라고 했을 때 dpr이 2.6이라면 실제로는 floor(1*2.6)을 한 2만큼 스크롤이 움직인다고 여기고. 
      // scrollLeft()는 2/2.6 = 0.7692가 된다. 실제와 약 23%나 차이나는 것이다.
      // 이것이 프레임당 지속되면 누적이되어 크게 차이난다. 평균 (-0.5,-0.5) 만큼의 차이가 나므로 1초에 30픽셀만큼 오차가 생긴다.
      // 반올림 하면 오차를 반으로 줄일 수 있지만 완벽히 오차를 제거한 것은 아니다.
      PaintJSState.$canvas_area[0].scrollBy({
        left: Math.round(dx*scaleFactor*devicePixelRatio)/devicePixelRatio,
        top: Math.round(dy*scaleFactor*devicePixelRatio)/devicePixelRatio,
      });
 
      pan_last_pos = current_pos;
    }
  });
}