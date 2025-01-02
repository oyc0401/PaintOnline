import { showMessageBox } from "./src/msgbox.js";
import {

   show_error_message,
   change_url_param,
   get_uris,
   load_image_from_uri,
   show_resource_load_error_message,
   open_from_image_info,

} from "./src/functions.js";
import $ from 'jquery'
import {debounce} from "./src/helpers.js";

import { localStore } from "./src/storage.js";
import { localize } from "../localize/localize.js";
import { PaintJSState } from "./state.js";


////////////////////////////////////////////////////////

export function initSesstion() {
   console.log("initSesstion");

   const log = (...args) => window.console?.log(...args);

   let localStorageAvailable = false;
   try {
      localStorage._available = true;
      localStorageAvailable = localStorage._available;
      delete localStorage._available;
   } catch (_error) {
      /* ignore */
   }

   // @TODO: keep other data in addition to the image data
   // such as the file_name and other state
   // (maybe even whether it's considered saved? idk about that)
   // I could have the image in one storage slot and the state in another

   const match_threshold = 1; // 1 is just enough for a workaround for Brave browser's farbling: https://github.com/1j01/jspaint/issues/184
   const canvas_has_any_apparent_image_data = () =>
      PaintJSState.main_canvas.ctx
         .getImageData(
            0,
            0,
            PaintJSState.main_canvas.width,
            PaintJSState.main_canvas.height,
         )
         .data.some((v) => v > match_threshold);

   let $recovery_window;

   let last_undos_length = PaintJSState.undos.length;
   function handle_data_loss() {
      const window_is_open = $recovery_window && !$recovery_window.closed;
      let save_paused = false;
      if (!canvas_has_any_apparent_image_data()) {
         if (!window_is_open) {
            alert('show_recovery_window();')
            
         }
         save_paused = true;
      } else if (window_is_open) {
         if (PaintJSState.undos.length > last_undos_length) {
            alert('show_recovery_window(true);')
         }
         save_paused = true;
      }
      last_undos_length = PaintJSState.undos.length;
      return save_paused;
   }

   class LocalSession {
      constructor(session_id) {
         this.id = session_id;
         const ls_key = `image#${session_id}`;
         log(`Local storage key: ${ls_key}`);
         // save image to storage
         this.save_image_to_storage_immediately = () => {
            const save_paused = handle_data_loss();
            if (save_paused) {
               return;
            }
            log(`Saving image to storage: ${ls_key}`);
            localStore.set(
               ls_key,
               PaintJSState.main_canvas.toDataURL("image/png"),
               (err) => {
                  if (err) {
                     // @ts-ignore (quotaExceeded is added by storage.js)
                     // if (err.quotaExceeded) {
                     // 	storage_quota_exceeded();
                     // } else {
                     // 	// e.g. localStorage is disabled
                     // 	// (or there's some other error?)
                     // 	// @TODO: show warning with "Don't tell me again" type option
                     // }
                  }
               },
            );
         };
         this.save_image_to_storage_soon = debounce(
            this.save_image_to_storage_immediately,
            100,
         );
         localStore.get(ls_key, (err, uri) => {
            if (err) {
               if (localStorageAvailable) {
                  show_error_message(
                     "Failed to retrieve image from local storage.",
                     err,
                  );
               } else {
                  // @TODO: DRY with storage manager message
                  showMessageBox({
                     message:
                        "Please enable local storage in your browser's settings for local backup. It may be called Cookies, Storage, or Site Data.",
                  });
               }
            } else if (uri) {
               load_image_from_uri(uri).then(
                  (info) => {
                     console.log('info')
                     console.log(info)
                     open_from_image_info(info, null, null, true, true);
                  },
                  (error) => {
                     show_error_message(
                        "Failed to open image from local storage.",
                        error,
                     );
                  },
               );
            } else {
               // no uri so lets save the blank canvas
               this.save_image_to_storage_soon();
            }
         });
         $(window).on("session-update.session-hook", () => {
            this.save_image_to_storage_soon();
         });
      }
      end() {
         // Skip debounce and save immediately
         this.save_image_to_storage_soon.cancel();
         this.save_image_to_storage_immediately();
         // Remove session-related hooks
         $(window).off(".session-hook");
      }
   }

   // Handle the starting, switching, and ending of sessions from the location.hash

   

   const update_session_from_location_hash = () => {
      const session_match = location.hash.match(
         /^#?(?:.*,)?(session|local):(.*)$/i,
      );
      const load_from_url_match = location.hash.match(
         /^#?(?:.*,)?(load):(.*)$/i,
      );
      if (session_match) {
         const local = session_match[1].toLowerCase() === "local";
         const session_id = session_match[2];
         if (session_id === "") {
            log("Invalid session ID; session ID cannot be empty");
            end_current_session();
         } else if (!local && session_id.match(/[./[\]#$]/)) {
            log(
               "Session ID is not a valid Firebase location; it cannot contain any of ./[]#$",
            );
            end_current_session();
         } else if (
            !session_id.match(
               /[-0-9A-Za-z\u00c0-\u00d6\u00d8-\u00f6\u00f8-\u02af\u1d00-\u1d25\u1d62-\u1d65\u1d6b-\u1d77\u1d79-\u1d9a\u1e00-\u1eff\u2090-\u2094\u2184-\u2184\u2488-\u2490\u271d-\u271d\u2c60-\u2c7c\u2c7e-\u2c7f\ua722-\ua76f\ua771-\ua787\ua78b-\ua78c\ua7fb-\ua7ff\ufb00-\ufb06]+/,
            )
         ) {
            log(
               "Invalid session ID; it must consist of 'alphanumeric-esque' characters",
            );
            end_current_session();
         } else if (
            current_session &&
            current_session.id === session_id &&
            local === current_session instanceof LocalSession
         ) {
            log(
               "Hash changed but the session ID and session type are the same",
            );
         } else {
            // @TODO: Ask if you want to save before starting a new session
            end_current_session();

            if (local) {
               log(`Starting a new LocalSession, ID: ${session_id}`);
               current_session = new LocalSession(session_id);
            } 
         }
      } else if (load_from_url_match) {
         const url = decodeURIComponent(load_from_url_match[2]);

         const uris = get_uris(url);
         if (uris.length === 0) {
            show_error_message(
               "Invalid URL to load (after #load: in the address bar). It must include a protocol (https:// or http://)",
            );
            return;
         }

         log(
            "Switching to new session from #load: URL (to #local: URL with session ID)",
         );
         // Note: could use into_existing_session=false on open_from_image_info instead of creating the new session beforehand
         end_current_session();
         change_url_param("local", generate_session_id());

         console.log('A')
         load_image_from_uri(url).then((info) => {
            open_from_image_info(info, null, null, true, true);
         }, show_resource_load_error_message);
      } else {
         log("No session ID in hash");
         const old_hash = location.hash;
         end_current_session();
         change_url_param("local", generate_session_id(), {
            replace_history_state: true,
         });
         log("After replaceState:", location.hash);
         if (old_hash === location.hash) {
            // e.g. on Wayback Machine
            show_error_message(
               "Autosave is disabled. Failed to update URL to start session.",
            );
         } else {
            update_session_from_location_hash();
         }
      }
   };

   $(window).on("hashchange popstate change-url-params", (e) => {
      log(e.type, location.hash);
      update_session_from_location_hash();
   });

   log("Initializing with location hash:", location.hash);
   update_session_from_location_hash();
}

let current_session;
const end_current_session = () => {
   if (current_session) {
      console.log("Ending current session");
      current_session.end();
      current_session = null;
   }
};
const generate_session_id = () =>
   (Math.random() * 2 ** 32).toString(16).replace(".", "");

export const new_local_session = () => {
   end_current_session();
   console.log("Changing URL to start new session...");
   change_url_param("local", generate_session_id());
};