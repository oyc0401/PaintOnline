// @ts-check
/* global localize */

// Note that this API must be kept in sync with the version in 98.js.org,
// as 98.js.org will write the global `showMessageBox` to provide integration with the web desktop environment,
// i.e. windows that can go outside the iframe.
// We also need to accept the injected global `showMessageBox` function if it exists,
// and set `window.defaultMessageBoxTitle` which is used in 98.js.org to set the default title for message boxes...
// or, couldn't we just provide the default in a wrapper function, similar to how 98.js.org does it?

import { make_window_supporting_scale } from "./$ToolWindow.js";
// import { localize } from "./app-localization.js";

const exports = {};



/**
 * @typedef {Object} MessageBoxOptions
 * @property {string} [title]
 * @property {string} [message]
 * @property {string} [messageHTML]
 * @property {Array<{ label: string, value: string, default?: boolean, action?: () => void }>} [buttons]
 * @property {"error" | "warning" | "info" | "nuke"} [iconID]
 * @property {OSGUIWindowOptions} [windowOptions]
 *
 * @typedef {Promise<string> & { $window: JQuery<Window>, $message: JQuery<HTMLDivElement>, promise: MessageBoxPromise }} MessageBoxPromise
 *
 * @param {MessageBoxOptions} options
 * @returns {MessageBoxPromise} Resolves with the value of the button that was clicked. The promise has extra properties for convenience.
 */
function showMessageBox_implementation({
	title = window.defaultMessageBoxTitle ?? "Alert",
	message,
	messageHTML,
	buttons = [{ label: "OK", value: "ok", default: true }],
	iconID = "warning", // "error", "warning", "info", or "nuke" for deleting files/folders
	windowOptions = {}, // for controlling width, etc.
}) {
	let $window, $message;
	const promise = /** @type {MessageBoxPromise} */ (new Promise((resolve) => {
		$window = make_window_supporting_scale(Object.assign({
			title,
			resizable: false,
			innerWidth: 400,
			maximizeButton: false,
			minimizeButton: false,
		}, windowOptions));
		// $window.addClass("dialog-window horizontal-buttons");
		$message =
			$("<div>").css({
				textAlign: "left",
				fontFamily: "MS Sans Serif, Arial, sans-serif",
				fontSize: "14px",
				marginTop: "22px",
				flex: 1,
				minWidth: 0, // Fixes hidden overflow, see https://css-tricks.com/flexbox-truncated-text/
				whiteSpace: "normal", // overriding .window:not(.squish)
			});
		if (messageHTML) {
			$message.html(messageHTML);
		} else if (message) { // both are optional because you may populate later with dynamic content
			$message.text(message).css({
				whiteSpace: "pre-wrap",
				wordWrap: "break-word",
			});
		}
		$("<div>").append(
			$("<img width='32' height='32'>").attr("src", `images/${iconID}-32x32-8bpp.png`).css({
				margin: "16px",
				display: "block",
			}),
			$message
		).css({
			display: "flex",
			flexDirection: "row",
		}).appendTo($window.$content);

		$window.$content.css({
			textAlign: "center",
		});
		for (const button of buttons) {
			const $button = $window.$Button(button.label, () => {
				button.action?.(); // API may be required for using user gesture requiring APIs
				resolve(button.value);
				$window.close(); // actually happens automatically
			});
			if (button.default) {
				$button.addClass("default");
				$button.focus();
				setTimeout(() => $button.focus(), 0); // @TODO: why is this needed? does it have to do with the iframe window handling?
			}
			$button.css({
				minWidth: 75,
				height: 23,
				margin: "16px 2px",
			});
		}
		$window.on("focusin", "button", (event) => {
			$(event.currentTarget).addClass("default");
		});
		$window.on("focusout", "button", (event) => {
			$(event.currentTarget).removeClass("default");
		});
		$window.on("closed", () => {
			resolve("closed"); // or "cancel"? do you need to distinguish?
		});
		$window.center();
	}));
	promise.$window = $window;
	promise.$message = $message;
	promise.promise = promise; // for easy destructuring
	
	return promise;
}

// Prefer a function injected from outside an iframe,
// which will make dialogs that can go outside the iframe,
// for 98.js.org integration.
exports.showMessageBox = window.showMessageBox || showMessageBox_implementation;

// Note `defaultMessageBoxTitle` handling in make_iframe_window (or now function enhance_iframe) in 98.js.org
// https://github.com/1j01/98/blob/361bd759a6d9b71d0fad9e479840598dc0128bb6/src/iframe-windows.js#L111
// Any other default parameters need to be handled there (as it works now)

window.defaultMessageBoxTitle = localize("Paint");

// Don't override alert, because I only use it as a fallback for global error handling.
// If make_window_supporting_scale is not defined, then alert is used instead,
// so it must not also end up calling make_window_supporting_scale.
// More generally, if there's an error in showMessageBox, it must fall back to something that does not use showMessageBox.
// window.alert = (message) => {
// 	showMessageBox({ message });
// };

const { showMessageBox } = exports;
export { showMessageBox };
// Temporary globals until all dependent code is converted to ES Modules
window.showMessageBox = showMessageBox; // used by app-localization.js
