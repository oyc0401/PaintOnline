console.log('JS 실행:','menus.js')
// @ts-check
/* global tool_transparent_mode:writable, palette:writable */
/* global $canvas_area, $colorbox, $status_area, $toolbox, available_languages, get_iso_language_name, get_language, get_language_emoji, get_language_endonym, localize, magnification, main_canvas, menu_bar, MENU_DIVIDER, redos, selection, set_language, show_grid, show_thumbnail, systemHooks, undos */
// import { available_languages, get_iso_language_name, get_language, get_language_emoji, get_language_endonym, localize, set_language } from "./app-localization.js";
import { localize,available_languages,get_language_emoji,language_to_default_region,get_language_endonym ,get_iso_language_name } from "../../localize/localize.js";
import {
	are_you_sure,
	choose_file_to_paste,
	clear,
	delete_selection,
	edit_copy,
	edit_cut,
	edit_paste,
	file_new,
	file_open,
	file_save,
	file_save_as,
	image_attributes,
	redo,
	save_selection_to_file,
	select_all,
	set_magnification,
	show_about_paint,
	undo,
	view_bitmap,
} from "./functions.js";
import { $G} from "./helpers.js";
//import {MENU_DIVIDER} from'../lib/os-gui/MenuBar.js'

const looksLikeChrome = !!(
	window.chrome &&
	(window.chrome.loadTimes || window.chrome.csi)
);
// NOTE: Microsoft Edge includes window.chrome.app
// (also this browser detection logic could likely use some more nuance)

/** @type {OSGUITopLevelMenus} */
const menus = {
	[localize("&File")]: [
		{
			label: localize("&New"),
			...shortcut(window.is_electron_app ? "Ctrl+N" : "Ctrl+Alt+N"), // Ctrl+N opens a new browser window
			speech_recognition: [],
			action: () => {
				file_new();
			},
			description: localize("Creates a new document."),
		},
		{
			label: localize("&Open"),
			...shortcut("Ctrl+O"),
			speech_recognition: [],
			action: () => {
				file_open();
			},
			description: localize("Opens an existing document."),
		},
		{
			label: localize("&Save"),
			...shortcut("Ctrl+S"),
			speech_recognition: [],
			action: () => {
				file_save();
			},
			description: localize("Saves the active document."),
		},
		{
			label: localize("Save &As"),
			// in mspaint, no shortcut is listed; it supports F12 (but in a browser that opens the dev tools)
			// it doesn't support Ctrl+Shift+S but that's a good & common modern shortcut
			...shortcut("Ctrl+Shift+S"),
			speech_recognition: [],
			action: () => {
				file_save_as();
			},
			description: localize("Saves the active document with a new name."),
		},
		{
			emoji_icon: "🌍",
			label: localize("&Language"),
			submenu: available_languages.map((available_language) => ({
				emoji_icon: get_language_emoji(available_language),
				label: get_language_endonym(available_language),
				action: () => {
					set_language(available_language);
				},
				enabled: () => get_language() != available_language,
				description: localize(
					"Changes the language to %1.",
					get_iso_language_name(available_language),
				),
			})),
		},
		{
			label: localize("&About Paint"),
			speech_recognition: [],
			action: () => {
				show_about_paint();
			},
			description: localize("Displays information about this application."),
			//description: localize("Displays program information, version number, and copyright."),
		},
		{
			label: localize("E&xit"),
			...shortcut(window.is_electron_app ? "Alt+F4" : ""), // Alt+F4 closes the browser window (in most window managers)
			speech_recognition:[],
			action: () => {
				are_you_sure(() => {
					// Note: For a Chrome PWA, window.close() is allowed only if there is only one history entry.
					// I could make it try to close the window and then navigate to the official web desktop if it fails,
					// but that would be inconsistent, as it wouldn't close the window after using File > New or File > Open.
					// I could make it so that it uses replaceState when opening a new document (starting a new session);
					// that would prevent you from using Alt+Left to go back to the previous document, but that may be acceptable
					// for a desktop app experience, where the back button is already hidden.
					// That said, if you just installed the PWA, it will have history already (even if just the New Tab page),
					// as the tab is converted to a window, and in that case,
					// it would be unable to close, again being inconsistent, but less so.
					// (If on PWA install, the app could open a fresh new window and close itself, it could work from the start,
					// but if we try to do that, we'll be back at square one, trying to close a window with history.)
					try {
						// API contract is containing page can override window.close()
						// Note that e.g. (()=>{}).bind().toString() gives "function () { [native code] }"
						// so the window.close() must not use bind() (not that that's common practice anyway)
						const close_overridden =
							frameElement &&
							window.close &&
							!/\{\s*\[native code\]\s*\}/.test(window.close.toString());
						if (close_overridden || window.is_electron_app) {
							window.close();
							return;
						}
					} catch (_error) {
						// In a cross-origin iframe, most likely
						// @TODO: establish postMessage API
					}
					// In a cross-origin iframe, or same origin but without custom close(), or top level:
					// Not all browsers support close() for closing a tab,
					// so redirect instead. Exit to the official web desktop.
					// @ts-ignore
					window.location = "https://98.js.org/";
				});
			},
			description: localize("Quits Paint."),
		},
	],
	[localize("&Edit")]: [
		{
			label: localize("&Undo"),
			...shortcut("Ctrl+Z"),
			speech_recognition: [],
			enabled: () => undos.length >= 1,
			action: () => {
				undo();
			},
			description: localize("Undoes the last action."),
		},
		{
			label: localize("&Repeat"),
			...shortcut("F4"), // also supported: Ctrl+Shift+Z, Ctrl+Y
			speech_recognition: [],
			enabled: () => redos.length >= 1,
			action: () => {
				redo();
			},
			description: localize("Redoes the previously undone action."),
		},
		//MENU_DIVIDER,
		{
			label: localize("Cu&t"),
			...shortcut("Ctrl+X"),
			speech_recognition: [],
			enabled: () =>
				// @TODO: support cutting text with this menu item as well (e.g. for the text tool)
				!!selection,
			action: () => {
				edit_cut(true);
			},
			description: localize("Cuts the selection and puts it on the Clipboard."),
		},
		{
			label: localize("&Copy"),
			...shortcut("Ctrl+C"),
			speech_recognition:[],
			enabled: () =>
				// @TODO: support copying text with this menu item as well (e.g. for the text tool)
				!!selection,
			action: () => {
				edit_copy(true);
			},
			description: localize(
				"Copies the selection and puts it on the Clipboard.",
			),
		},
		{
			label: localize("&Paste"),
			...shortcut("Ctrl+V"),
			speech_recognition: [],
			enabled: () =>
				// @TODO: disable if nothing in clipboard or wrong type (if we can access that)
				true,
			action: () => {
				edit_paste(true);
			},
			description: localize("Inserts the contents of the Clipboard."),
		},
		{
			label: localize("C&lear Selection"),
			...shortcut("Del"),
			speech_recognition: [],
			enabled: () => !!selection,
			action: () => {
				delete_selection();
			},
			description: localize("Deletes the selection."),
		},
		{
			label: localize("Select &All"),
			...shortcut("Ctrl+A"),
			speech_recognition:[],
			action: () => {
				select_all();
			},
			description: localize("Selects everything."),
		},
		{
			label: `${localize("C&opy To")}...`,
			speech_recognition: [],
			enabled: () => !!selection,
			action: () => {
				save_selection_to_file();
			},
			description: localize("Copies the selection to a file."),
		},
		{
			label: `${localize("Paste &From")}...`,
			speech_recognition:[],
			action: () => {
				choose_file_to_paste();
			},
			description: localize("Pastes a file into the selection."),
		},
	],
	[localize("&View")]: [
		{
			label: localize("Zoom To &Window"),
			speech_recognition: [],
			description: localize("Zooms the picture to fit within the view."),
			action: () => {
				const rect = $canvas_area[0].getBoundingClientRect();
				const margin = 30; // leave a margin so scrollbars won't appear
				let mag = Math.min(
					(rect.width - margin) / main_canvas.width,
					(rect.height - margin) / main_canvas.height,
				);
				// round to an integer percent for the View > Zoom > Custom... dialog, which shows non-integers as invalid
				mag = Math.floor(100 * mag) / 100;
				set_magnification(mag);
			},
		},
		{
			label: localize("&View Bitmap"),
			...shortcut("Ctrl+F"),
			speech_recognition: [],
			action: () => {
				view_bitmap();
			},
			description: localize("Displays the entire picture."),
		},
		{
			label: localize("&Fullscreen"),
			...shortcut("F11"), // relies on browser's shortcut
			speech_recognition: [
				// won't work with speech recognition, needs a user gesture
			],
			enabled: () => Boolean(document.fullscreenEnabled || document.webkitFullscreenEnabled),
			checkbox: {
				check: () => Boolean(document.fullscreenElement || document.webkitFullscreenElement),
				toggle: () => {
					if (document.fullscreenElement || document.webkitFullscreenElement) {
						if (document.exitFullscreen) {
							document.exitFullscreen();
						} else if (document.webkitExitFullscreen) {
							document.webkitExitFullscreen();
						}
					} else {
						if (document.documentElement.requestFullscreen) {
							document.documentElement.requestFullscreen();
						} else if (document.documentElement.webkitRequestFullscreen) {
							document.documentElement.webkitRequestFullscreen();
						}
					}
					// check() would need to be async or faked with a timeout,
					// if the menus stayed open. @TODO: make all checkboxes close menus
					menu_bar.closeMenus();
				},
			},
			description: localize("Makes the application take up the entire screen."),
		},
	],
	[localize("&Image")]: [
		{
			label: `${localize("&Attributes")}...`,
			...shortcut("Ctrl+E"),
			speech_recognition: [],
			action: () => {
				image_attributes();
			},
			description: localize("Changes the attributes of the picture."),
		},
		{
			label: localize("&Clear Image"),
			...shortcut(
				window.is_electron_app || !looksLikeChrome ? "Ctrl+Shift+N" : "",
			), // Ctrl+Shift+N opens incognito window in chrome
			speech_recognition: [],
			// (mspaint says "Ctrl+Shft+N")
			action: () => {
				if (!selection) {
					clear();
				}
			},
			enabled: () => !selection,
			description: localize("Clears the picture."),
			// action: ()=> {
			// 	if (selection) {
			// 		delete_selection();
			// 	} else {
			// 		clear();
			// 	}
			// },
			// mspaint says localize("Clears the picture or selection."), but grays out the option when there's a selection
		},
		{
			label: localize("&Draw Opaque"),
			speech_recognition: [],
			checkbox: {
				toggle: () => {
					tool_transparent_mode = !tool_transparent_mode;
					$G.trigger("option-changed");
				},
				check: () => !tool_transparent_mode,
			},
			description: localize(
				"Makes the current selection either opaque or transparent.",
			),
		},
	],
};

export { menus };

/**
 * Expands a shortcut label into an object with the label and a corresponding ARIA key shortcuts value.
 * Could handle "CtrlOrCmd" like Electron does, here, or just treat "Ctrl" as control or command.
 * Of course it would be more ergonomic if OS-GUI.js handled this sort of thing,
 * and I have thought about rewriting the OS-GUI API to mimic Electron's.
 * I also have some munging logic in electron-main.js related to this.
 * @param {string} shortcutLabel
 * @returns {{shortcutLabel?: string, ariaKeyShortcuts?: string}}
 */
function shortcut(shortcutLabel) {
	if (!shortcutLabel) return {};
	const ariaKeyShortcuts = shortcutLabel
		.replace(/Ctrl/g, "Control")
		.replace(/\bDel\b/, "Delete"); //.replace(/\bEsc\b/, "Escape").replace(/\bIns\b/, "Insert");
	if (!validateAriaKeyshortcuts(ariaKeyShortcuts)) {
		console.error(
			`Invalid ARIA key shortcuts: ${JSON.stringify(ariaKeyShortcuts)} (from shortcut label: ${JSON.stringify(shortcutLabel)}) (or validator is incomplete)`,
		);
	}
	return {
		shortcutLabel,
		ariaKeyShortcuts,
	};
}

/**
 * Validates an aria-keyshortcuts value.
 *
 * AI-generated code (ChatGPT), prompted with the spec section: https://w3c.github.io/aria/#aria-keyshortcuts
 *
 * @param {string} value
 * @returns {boolean} valid
 */
function validateAriaKeyshortcuts(value) {
	// Define valid modifier and non-modifier keys based on UI Events KeyboardEvent key Values spec
	const modifiers = ["Alt", "Control", "Shift", "Meta", "AltGraph"];
	const nonModifiers = [
		"A",
		"B",
		"C",
		"D",
		"E",
		"F",
		"G",
		"H",
		"I",
		"J",
		"K",
		"L",
		"M",
		"N",
		"O",
		"P",
		"Q",
		"R",
		"S",
		"T",
		"U",
		"V",
		"W",
		"X",
		"Y",
		"Z",
		"1",
		"2",
		"3",
		"4",
		"5",
		"6",
		"7",
		"8",
		"9",
		"0",
		"Delete",
		"Enter",
		"Tab",
		"ArrowRight",
		"ArrowLeft",
		"ArrowUp",
		"ArrowDown",
		"PageUp",
		"PageDown",
		"End",
		"Home",
		"Escape",
		"Space",
		"Plus",
		"Minus",
		"Comma",
		"Period",
		"Slash",
		"Backslash",
		"Quote",
		"Semicolon",
		"BracketLeft",
		"BracketRight",
		"F1",
		"F2",
		"F3",
		"F4",
		"F5",
		"F6",
		"F7",
		"F8",
		"F9",
		"F10",
		"F11",
		"F12",
		// Add more non-modifier keys as needed
	];

	// Split the value into individual shortcuts
	const shortcuts = value.split(" ");

	// Function to validate a single shortcut
	function validateShortcut(shortcut) {
		const keys = shortcut.split("+");

		if (keys.length === 0) {
			return false;
		}

		let nonModifierFound = false;

		// Check each key in the shortcut
		for (let i = 0; i < keys.length; i++) {
			const key = keys[i];

			if (modifiers.includes(key)) {
				if (nonModifierFound) {
					// Modifier key found after a non-modifier key
					return false;
				}
			} else if (nonModifiers.includes(key)) {
				if (nonModifierFound) {
					// Multiple non-modifier keys found
					return false;
				}
				nonModifierFound = true;
			} else {
				// Invalid key
				return false;
			}
		}

		// Ensure at least one non-modifier key is present
		return nonModifierFound;
	}

	// Validate all shortcuts
	for (let i = 0; i < shortcuts.length; i++) {
		if (!validateShortcut(shortcuts[i])) {
			return false;
		}
	}

	return true;
}

/** @type {[string, boolean][]} */
const ariaKeyShortcutsTestCases = [
	["Control+A Shift+Alt+B", true],
	["Control+Shift+1", true],
	["Shift+Alt+T Control+5", true],
	["T", true],
	["ArrowLeft", true],
	["Shift+T Alt+Control", false],
	["T+Shift", false],
	["Alt", false],
	["IncredibleKey", false],
	["Ctrl+Shift+A", false],
];
for (const [ariaKeyShortcuts, expectedValidity] of ariaKeyShortcutsTestCases) {
	const returnedValidity = validateAriaKeyshortcuts(ariaKeyShortcuts);
	if (returnedValidity !== expectedValidity) {
		console.error(
			`validateAriaKeyshortcuts("${ariaKeyShortcuts}") returned ${returnedValidity} but expected ${expectedValidity}`,
		);
	}
}
