console.log('JS 실행:','$ToolWindow.js')
// @ts-check
/* global $Window */

import { E } from "./helpers.js";
// import $ from "jquery";
/**
 * @param {OSGUIWindowOptions} options
 * @returns {OSGUI$Window}
 */

/**
 * @param {JQuery<HTMLDivElement> & I$Component} [$component]
 * @returns {OSGUI$Window & I$ToolWindow}
 */
function $ToolWindow($component) {
	return make_window_supporting_scale({
		$component,
		toolWindow: true,
	});
}

/**
 * @param {string} [title]
 * @returns {OSGUI$Window & I$DialogWindow}
 */
function $DialogWindow(title) {
	const $w = /** @type {OSGUI$Window & I$DialogWindow} */ (make_window_supporting_scale({
		title,
		resizable: false,
		maximizeButton: false,
		minimizeButton: false,
		// helpButton: @TODO
	}));
	$w.addClass("dialog-window");

	// I don't know why type inference isn't working here. It seems to infer HTMLDivElement but not HTMLFormElement.
	// Both are in HTMLElementTagNameMap...
	$w.$form = /** @type {JQuery<HTMLFormElement>} */($(E("form"))).appendTo($w.$content);
	$w.$main = $(E("div")).appendTo($w.$form);
	$w.$buttons = $(E("div")).appendTo($w.$form).addClass("button-group");

	/**
	 * @param {string | Node} label
	 * @param {()=> void} action
	 * @param {object} [options]
	 * @param {string} [options.type]
	 * @returns {JQuery<HTMLButtonElement>}
	 */
	$w.$Button = (label, action, options = { type: "button" }) => {
		const $b = $(E("button")).appendTo($w.$buttons);

		// jQuery's append() is unsafe (text interpreted as HTML); native append() is safe,
		// and accepts text, DOM nodes, or DocumentFragments.
		$b[0].append(label);

		$b.on("click", () => {
			action();
		});

		$b.on("pointerdown", () => {
			$b.focus();
		});

		$b.attr({ type: options.type });

		return $b;
	};
	// Note: the "submit" event on the form element may not fire if the window is closed,
	// as the form element is removed from the DOM. You can test this by preventing the "close" event on $w.
	// But in case it does submit, prevent the default action of reloading the page.
	// In the future, this could be cleaner by using the <dialog> element.
	$w.$form.on("submit", (e) => {
		e.preventDefault();
	});

	// Highlight button that will be activated if you press Enter, if any.
	// - If there's any focused control that will handle Enter (highlight it if it's a button)
	// - Otherwise the default submit button according to HTML form semantics (highlight it if there is one)
	function updateDefaultHighlight() {
		$w.find("button, input").removeClass("default");
		let $default = $(document.activeElement).closest("button, input[type='submit'], input[type='button'], textarea, select");
		if ($default.length === 0) {
			// Buttons in forms default to type="submit" implicitly.
			$default = $w.$form.find('button[type="submit"], input[type="submit"], button:not([type])').first();
		}
		if ($default.is("button, input[type='submit'], input[type='button']")) {
			$default.addClass("default");
		}
	}
	$w.on("focusin", updateDefaultHighlight);
	$w.on("focusout", () => {
		$w.find("button, input").removeClass("default");
	});
	setTimeout(() => {
		updateDefaultHighlight();
	}, 0);

	return $w;
}

export { $DialogWindow, $ToolWindow };

