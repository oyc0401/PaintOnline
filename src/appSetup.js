import { Handles } from "./paint/src/Handles.js";
import { default_palette, get_winter_palette } from "./paint/src/color-data.js";
import { image_formats } from "./paint/src/file-format-data.js";
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
} from "./paint/src/functions.js";
import {
  $G,
  E,
  TAU,
  get_file_extension,
  get_help_folder_icon,
  make_canvas,
  to_canvas_coords,
  make_css_cursor
} from "./paint/src/helpers.js";
import { init_webgl_stuff, rotate } from "./paint/src/image-manipulation.js";
// import { menus } from "./paint/src/menus.js";
// import { showMessageBox } from "./paint/src/msgbox.js";
import { localStore } from "./paint/src/storage.js";

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
} from "./paint/src/tools.js";



export function setupApp() {
  

  const appState = window.globAppstate;

  const globApp = {};
   window.globApp = globApp;

  
  const $app = $(".jspaint");

  
  const $canvas_area = $(".canvas-area");

  const $canvas = $(appState.main_canvas).appendTo($canvas_area);
  const $mask_canvas = $(appState.mask_canvas).appendTo($canvas_area);
  
  $canvas.css("touch-action", "none");
  $canvas_area.css("touch-action", "none");
  $mask_canvas.css("touch-action", "none");
  $mask_canvas.css({pointerEvents: "none"});
  
  const canvas_handles = new Handles({
    $handles_container: $canvas_area,
    $object_container: $canvas_area,
    get_rect: () => ({
      x: 0,
      y: 0,
      width: appState.main_canvas.width,
      height: appState.main_canvas.height,
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

  // 위치
  const $status_position = $("status-text");
  const $status_size = $status_position;
  
  globApp.$app = $app;
  globApp.update_fill_and_stroke_colors_and_lineWidth = update_fill_and_stroke_colors_and_lineWidth;
  globApp.$canvas_area = $canvas_area;
  globApp.$canvas = $canvas;
  globApp.canvas_bounding_client_rect = appState.main_canvas.getBoundingClientRect(); // cached for performance, updated later
  globApp.canvas_handles = canvas_handles;
  globApp.$status_position = $status_position;
  globApp.$status_size = $status_size;

  $canvas.css({
     cursor: make_css_cursor(...window.globAppstate.default_tool.cursor),
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

    if (appState.selection) {
      const nudge_selection = (delta_x, delta_y) => {
        appState.selection.x += delta_x;
        appState.selection.y += delta_y;
        appState.selection.position();
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
      if (appState.selection) {
        deselect();
      } else {
        cancel();
      }
    } else if (e.key === "Enter") {
      if (appState.selection) {
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

      if (appState.selection) {
        appState.selection.scale(2 ** delta);
      } else {
        if (appState.selected_tool.id === TOOL_BRUSH) {
          appState.brush_size = Math.max(
            1,
            Math.min(appState.brush_size + delta, 500),
          );
        } else if (appState.selected_tool.id === TOOL_ERASER) {
          appState.eraser_size = Math.max(
            1,
            Math.min(appState.eraser_size + delta, 500),
          );
        } else if (appState.selected_tool.id === TOOL_AIRBRUSH) {
          appState.airbrush_size = Math.max(
            1,
            Math.min(appState.airbrush_size + delta, 500),
          );
        } else if (appState.selected_tool.id === TOOL_PENCIL) {
          appState.pencil_size = Math.max(
            1,
            Math.min(appState.pencil_size + delta, 50),
          );
        } else if (
          appState.selected_tool.id === TOOL_LINE ||
          appState.selected_tool.id === TOOL_CURVE ||
          appState.selected_tool.id === TOOL_RECTANGLE ||
          appState.selected_tool.id === TOOL_ROUNDED_RECTANGLE ||
          appState.selected_tool.id === TOOL_ELLIPSE ||
          appState.selected_tool.id === TOOL_POLYGON
        ) {
          appState.stroke_size = Math.max(
            1,
            Math.min(appState.stroke_size + delta, 500),
          );
        }

        $(window).trigger("option-changed");
        if (appState.button !== undefined && appState.pointer) {
          // pointer may only be needed for tests

          tool_go(appState.selected_tool);
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
  const zoomLevels = [0.5, 1, 2, 3, 4, 5, 6, 8, 10, 12, 15, 20, 25, 30, 40, 50, 60, 75, 100];

  const nextZoom = { 
      0.5: 1, 1: 2, 2: 3, 3: 4, 4: 5, 5: 6, 6: 8, 8: 10, 10: 12, 
      12: 15, 15: 20, 20: 25, 25: 30, 30: 40, 40: 50, 50: 60, 60: 75, 75: 100, 
      100: 100 
  };

  const nextout = { 
      100: 75, 75: 60, 60: 50, 50: 40, 40: 30, 30: 25, 25: 20, 20: 15, 15: 12, 
      12: 10, 10: 8, 8: 6, 6: 5, 5: 4, 4: 3, 3: 2, 2: 1, 1: 0.5, 
      0.5: 0.5 
  };



  function getClosestZoom(currentZoom) {
      const zoomLevels = Object.keys(nextZoom).map(Number).sort((a, b) => a - b);
      for (let i = zoomLevels.length - 1; i >= 0; i--) {
          if (currentZoom >= zoomLevels[i]) {
              return zoomLevels[i];
          }
      }
      return zoomLevels[0]; // 만약 currentZoom이 가장 낮은 줌보다 작다면 최소값 반환
  }

  addEventListener(
    "wheel",
    (e) => {
      //console.log(e);  || e.ctrlKey
      if (e.altKey || e.ctrlKey) {
        e.preventDefault();
        let new_magnification = appState.magnification;
        if (e.deltaY < 0) {
          new_magnification = nextZoom[getClosestZoom(window.globAppstate.magnification)]
        } else {
          new_magnification =nextout[getClosestZoom(window.globAppstate.magnification)]
        }
        set_magnification(new_magnification, to_canvas_coords(e));
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
      if (appState.selection && appState.selection.canvas) {
        const do_sync_clipboard_copy_or_cut = () => {
          // works only for pasting within a jspaint instance
          const data_url = appState.selection.canvas.toDataURL();
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

  reset_file();
  reset_selected_colors();
  reset_canvas_and_history(); // (with newly reset colors)
  set_magnification(appState.default_magnification);

  // this is synchronous for now, but @TODO: handle possibility of loading a document before callback
  // when switching to asynchronous storage, e.g. with localforage
  localStore.get(
    {
      width: appState.default_canvas_width,
      height: appState.default_canvas_height,
    },
    (err, stored_values) => {
      if (err) {
        return;
      }
      appState.my_canvas_width = Number(stored_values.width);
      appState.my_canvas_height = Number(stored_values.height);

      make_or_update_undoable(
        {
          match: (history_node) => history_node.name === localize("New"),
          name: "Resize Canvas For New Document",
          icon: get_help_folder_icon("p_stretch_both.png"),
        },
        () => {
          appState.main_canvas.width = Math.max(1, appState.my_canvas_width);
          appState.main_canvas.height = Math.max(1, appState.my_canvas_height);
          appState.main_ctx.disable_image_smoothing();
          if (!appState.transparency) {
            appState.main_ctx.fillStyle = appState.selected_colors.background;
            appState.main_ctx.fillRect(
              0,
              0,
              appState.main_canvas.width,
              appState.main_canvas.height,
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
  // #endregion

  // #region Palette Updating From Theme

  function update_fill_and_stroke_colors_and_lineWidth(selected_tooool) {
    appState.main_ctx.lineWidth = appState.stroke_size;

    const reverse_because_fill_only = !!(
      selected_tooool.$options &&
      selected_tooool.$options.fill &&
      !selected_tooool.$options.stroke
    );
    /** @type {ColorSelectionSlot} */
    const color_k =
      appState.ctrl &&
      appState.selected_colors.ternary &&
      appState.pointer_active
        ? "ternary"
        : appState.reverse !== reverse_because_fill_only
          ? "background"
          : "foreground";
    appState.main_ctx.fillStyle =
      appState.fill_color =
      appState.main_ctx.strokeStyle =
      appState.stroke_color =
        appState.selected_colors[color_k];

    /** @type {ColorSelectionSlot} */
    let fill_color_k = appState.ctrl
      ? "ternary"
      : appState.reverse !== reverse_because_fill_only
        ? "background"
        : "foreground";
    /** @type {ColorSelectionSlot} */
    let stroke_color_k = fill_color_k;

    if (selected_tooool.shape || selected_tooool.shape_colors) {
      if (!selected_tooool.stroke_only) {
        if (appState.reverse !== reverse_because_fill_only) {
          fill_color_k = "foreground";
          stroke_color_k = "background";
        } else {
          fill_color_k = "background";
          stroke_color_k = "foreground";
        }
      }
      appState.main_ctx.fillStyle = appState.fill_color =
        appState.selected_colors[fill_color_k];
      appState.main_ctx.strokeStyle = appState.stroke_color =
        appState.selected_colors[stroke_color_k];
    }
    appState.pick_color_slot = fill_color_k;
  }

  // #region Primary Canvas Interaction
  function tool_go(selected_tooool, event_name) {
    update_fill_and_stroke_colors_and_lineWidth(selected_tooool);

    if (selected_tooool[event_name]) {
      selected_tooool[event_name](
        appState.main_ctx,
        appState.pointer.x,
        appState.pointer.y,
      );
    }
    if (selected_tooool.paint) {
      selected_tooool.paint(
        appState.main_ctx,
        appState.pointer.x,
        appState.pointer.y,
      );
    }
  }
  function canvas_pointer_move(e) {
    appState.ctrl = e.ctrlKey;
    appState.shift = e.shiftKey;
    appState.pointer = to_canvas_coords(e);

    // Quick Undo (for mouse/pen)
    // (Note: pointermove also occurs when the set of buttons pressed changes,
    // except when another event would fire like pointerdown)
    if (appState.pointers.length && e.button != -1) {
      // compare buttons other than middle mouse button by using bitwise OR to make that bit of the number the same
      const MMB = 4;
      if (
        e.pointerType != appState.pointer_type ||
        (e.buttons | MMB) != (appState.pointer_buttons | MMB)
      ) {
        cancel();
        appState.pointer_active = false; // NOTE: appState.pointer_active used in cancel()
        return;
      }
    }

    if (e.shiftKey) {
      // TODO: snap to 45 degrees for Pencil and Polygon tools
      // TODO: manipulating the pointer object directly is a bit of a hack
      if (
        appState.selected_tool.id === TOOL_LINE ||
        appState.selected_tool.id === TOOL_CURVE
      ) {
        // snap to eight directions
        const dist = Math.sqrt(
          (appState.pointer.y - appState.pointer_start.y) *
            (appState.pointer.y - appState.pointer_start.y) +
            (appState.pointer.x - appState.pointer_start.x) *
              (appState.pointer.x - appState.pointer_start.x),
        );
        const eighth_turn = TAU / 8;
        const angle_0_to_8 =
          Math.atan2(
            appState.pointer.y - appState.pointer_start.y,
            appState.pointer.x - appState.pointer_start.x,
          ) / eighth_turn;
        const angle = Math.round(angle_0_to_8) * eighth_turn;
        appState.pointer.x = Math.round(
          appState.pointer_start.x + Math.cos(angle) * dist,
        );
        appState.pointer.y = Math.round(
          appState.pointer_start.y + Math.sin(angle) * dist,
        );
      } else if (appState.selected_tool.shape) {
        // snap to four diagonals
        const w = Math.abs(appState.pointer.x - appState.pointer_start.x);
        const h = Math.abs(appState.pointer.y - appState.pointer_start.y);
        if (w < h) {
          if (appState.pointer.y > appState.pointer_start.y) {
            appState.pointer.y = appState.pointer_start.y + w;
          } else {
            appState.pointer.y = appState.pointer_start.y - w;
          }
        } else {
          if (appState.pointer.x > appState.pointer_start.x) {
            appState.pointer.x = appState.pointer_start.x + h;
          } else {
            appState.pointer.x = appState.pointer_start.x - h;
          }
        }
      }
    }
    appState.selected_tools.forEach((selected_tool) => {
      tool_go(selected_tool);
    });
    appState.pointer_previous = appState.pointer;
  }
  
  $canvas.on("pointermove", (e) => {
    appState.pointer = to_canvas_coords(e);
    $status_position.text(`${appState.pointer.x}, ${appState.pointer.y} px`);
  });
  
  $canvas.on("pointerenter", (e) => {
    appState.pointer_over_canvas = true;

    update_helper_layer(e);

    if (!appState.update_helper_layer_on_pointermove_active) {
      $(window).on("pointermove", update_helper_layer);
      appState.update_helper_layer_on_pointermove_active = true;
    }
  });
  $canvas.on("pointerleave", (e) => {
    appState.pointer_over_canvas = false;

    $status_position.text("");

    update_helper_layer(e);

    if (
      !appState.pointer_active &&
      appState.update_helper_layer_on_pointermove_active
    ) {
      $(window).off("pointermove", update_helper_layer);
      appState.update_helper_layer_on_pointermove_active = false;
    }
  });
  // #endregion

  // #region Panning and Zooming
  let last_zoom_pointer_distance;
  let pan_last_pos;
  // let pan_start_magnification; // for panning and zooming in the same gesture (...was this ever used?)
  let first_pointer_time;
  const discard_quick_undo_period = 500; // milliseconds in which to treat gesture as just a pan/zoom if you use two fingers, rather than treating it as a brush stroke you might care about
  function average_points(points) {
    const average = { x: 0, y: 0 };
    for (const pointer of points) {
      average.x += pointer.x;
      average.y += pointer.y;
    }
    average.x /= points.length;
    average.y /= points.length;
    return average;
  }
  $canvas_area.on("pointerdown", (event) => {
    if (
      document.activeElement instanceof HTMLElement && // exists and (for type checker:) has blur()
      document.activeElement !== document.body &&
      document.activeElement !== document.documentElement
    ) {
      // Allow unfocusing dialogs etc. in order to use keyboard shortcuts
      document.activeElement.blur();
    }

    if (
      appState.pointers.every(
        (pointer) =>
          // prevent multitouch panning in case of synthetic events from eye gaze mode
          pointer.pointerId !== 1234567890 &&
          // prevent multitouch panning in case of dragging across iframe boundary with a mouse/pen
          // Note: there can be multiple active primary appState.pointers, one per pointer type
          !(
            pointer.isPrimary &&
            (pointer.pointerType === "mouse" || pointer.pointerType === "pen")
          ),
        // @TODO: handle case of dragging across iframe boundary with touch
      )
    ) {
      appState.pointers.push({
        pointerId: event.pointerId,
        pointerType: event.pointerType,
        // isPrimary not available on jQuery.Event, and originalEvent not available in synthetic case
        // @ts-ignore
        isPrimary:
          (event.originalEvent && event.originalEvent.isPrimary) ||
          event.isPrimary,
        x: event.clientX,
        y: event.clientY,
      });
    }
    if (appState.pointers.length === 1) {
      first_pointer_time = performance.now();
    }
    if (appState.pointers.length == 2) {
      last_zoom_pointer_distance = Math.hypot(
        appState.pointers[0].x - appState.pointers[1].x,
        appState.pointers[0].y - appState.pointers[1].y,
      );
      pan_last_pos = average_points(appState.pointers);
      // pan_start_magnification = magnification;
    }
    // Quick Undo when there are multiple appState.pointers (i.e. for touch)
    // See pointermove for other pointer types
    // SEE OTHER POINTERDOWN HANDLER ALSO
    if (appState.pointers.length >= 2) {
      // If you press two fingers quickly, it shouldn't make a new history entry.
      // But if you draw something and then press a second finger to clear it, it should let you redo.
      const discard_document_state =
        first_pointer_time &&
        performance.now() - first_pointer_time < discard_quick_undo_period;
      cancel(false, discard_document_state);
      appState.pointer_active = false; // NOTE: appState.pointer_active used in cancel(); must be set after cancel()
      return;
    }
  });
  $(window).on("pointerup pointercancel", (event) => {
    appState.pointers = appState.pointers.filter(
      (pointer) => pointer.pointerId !== event.pointerId,
    );
  });
  $(window).on("pointermove", (event) => {
    for (const pointer of appState.pointers) {
      if (pointer.pointerId === event.pointerId) {
        pointer.x = event.clientX;
        pointer.y = event.clientY;
      }
    }
    if (appState.pointers.length >= 2) {
      const current_pos = average_points(appState.pointers);
      const distance = Math.hypot(
        appState.pointers[0].x - appState.pointers[1].x,
        appState.pointers[0].y - appState.pointers[1].y,
      );
      const difference_in_distance = distance - last_zoom_pointer_distance;
      let new_magnification = appState.magnification;
       

      if (Math.abs(difference_in_distance) > 60) {
        last_zoom_pointer_distance = distance;
        if (difference_in_distance > 0) {
           new_magnification = nextZoom[getClosestZoom(window.globAppstate.magnification)];
        } else {
          new_magnification = nextout[getClosestZoom(window.globAppstate.magnification)];
        }
      }
      if (new_magnification != appState.magnification) {
        set_magnification(
          new_magnification,
          to_canvas_coords({ clientX: current_pos.x, clientY: current_pos.y }),
        );
      }
      const difference_in_x = current_pos.x - pan_last_pos.x;
      const difference_in_y = current_pos.y - pan_last_pos.y;
      $canvas_area.scrollLeft($canvas_area.scrollLeft() - difference_in_x);
      $canvas_area.scrollTop($canvas_area.scrollTop() - difference_in_y);
      pan_last_pos = current_pos;
    }
  });
  // #endregion

  // #region Primary Canvas Interaction (continued)
  $canvas.on("pointerdown", (e) => {
    //oyc0401
    $status_size.text("");
    update_canvas_rect();

    // Quick Undo when there are multiple appState.pointers (i.e. for touch)
    // see pointermove for other pointer types
    // SEE OTHER POINTERDOWN HANDLER ALSO
    // NOTE: this relies on event handler order for pointerdown
    // pointer is not added to appState.pointers yet
    if (appState.pointers.length >= 1) {
      // If you press two fingers quickly, it shouldn't make a new history entry.
      // But if you draw something and then press a second finger to clear it, it should let you redo.
      const discard_document_state =
        first_pointer_time &&
        performance.now() - first_pointer_time < discard_quick_undo_period;
      cancel(false, discard_document_state);
      appState.pointer_active = false; // NOTE: appState.pointer_active used in cancel(); must be set after cancel()

      // in eye gaze mode, allow drawing with mouse after canceling gaze gesture with mouse
      appState.pointers = appState.pointers.filter(
        (pointer) => pointer.pointerId !== 1234567890,
      );
      return;
    }

    appState.history_node_to_cancel_to = appState.current_history_node;

    appState.pointer_active = !!(e.buttons & (1 | 2)); // as far as tools are concerned
    appState.pointer_type = e.pointerType;
    appState.pointer_buttons = e.buttons;
    $(window).one("pointerup", (e) => {
      appState.pointer_active = false;
      update_helper_layer(e);

      if (
        !appState.pointer_over_canvas &&
        appState.update_helper_layer_on_pointermove_active
      ) {
        $(window).off("pointermove", update_helper_layer);
        appState.update_helper_layer_on_pointermove_active = false;
      }
    });

    if (e.button === 0) {
      appState.reverse = false;
    } else if (e.button === 2) {
      appState.reverse = true;
    } else {
      return;
    }

    appState.button = e.button;
    appState.ctrl = e.ctrlKey;
    appState.shift = e.shiftKey;
    appState.pointer_start =
      appState.pointer_previous =
      appState.pointer =
        to_canvas_coords(e);

    const pointerdown_action = () => {
      let interval_ids = [];
      appState.selected_tools.forEach((selected_tool) => {
        if (selected_tool.paint || selected_tool.pointerdown) {
          tool_go(selected_tool, "pointerdown");
        }
        if (selected_tool.paint_on_time_interval != null) {
          interval_ids.push(
            setInterval(() => {
              tool_go(selected_tool);
            }, selected_tool.paint_on_time_interval),
          );
        }
      });

      $(window).on("pointermove", canvas_pointer_move);

      $(window).one("pointerup", (e, canceling, no_undoable) => {
        appState.button = undefined;
        appState.reverse = false;

        if (e.clientX !== undefined) {
          // may be synthetic event without coordinates
          appState.pointer = to_canvas_coords(e);
          console.log('appState.pointer:',appState.pointer)
        }
        // don't create undoables if you're two-finger-panning
        // @TODO: do any tools use pointerup for cleanup?
        if (!no_undoable) {
          appState.selected_tools.forEach((selected_tool) => {
            selected_tool.pointerup?.(
              appState.main_ctx,
              appState.pointer.x,
              appState.pointer.y,
            );
          });
        }

        if (appState.selected_tools.length === 1) {
          if (appState.selected_tool.deselect) {
            select_tools(appState.return_to_tools);
          }
        }
        $(window).off("pointermove", canvas_pointer_move);
        for (const interval_id of interval_ids) {
          clearInterval(interval_id);
        }

        if (!canceling) {
          appState.history_node_to_cancel_to = null;
        }
      });
    };

    pointerdown_action();

    update_helper_layer(e);
  });
  // #endregion

  $canvas_area.on("pointerdown", (e) => {
    if (e.button === 0) {
      if ($canvas_area.is(e.target)) {
        if (appState.selection) {
          deselect();
        }
      }
    }
  });

  // function prevent_selection($el) {
  //   $el.on("mousedown selectstart contextmenu", (e) => {
  //     if (e.isDefaultPrevented()) {
  //       return;
  //     }
  //     if (
  //       e.target instanceof HTMLSelectElement ||
  //       e.target instanceof HTMLTextAreaElement ||
  //       (e.target instanceof HTMLLabelElement && e.type !== "contextmenu") ||
  //       (e.target instanceof HTMLInputElement && e.target.type !== "color")
  //     ) {
  //       return;
  //     }
  //     if (e.button === 1) {
  //       return; // allow middle-click scrolling
  //     }
  //     e.preventDefault();
  //     // we're just trying to prevent selection
  //     // but part of the default for mousedown is *deselection*
  //     // so we have to do that ourselves explicitly
  //     window.getSelection().removeAllRanges();
  //   });
  // }

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

