console.log("JS 실행:", "functions.js");

import UPNG from "../lib/UPNG.js";
import { OnCanvasHelperLayer } from "./OnCanvasHelperLayer.js";
import { OnCanvasSelection } from "./OnCanvasSelection.js";
import { localize } from "../../localize/localize.js";
import { image_formats } from "./file-format-data.js";
import {
	E,
	get_help_folder_icon,
	get_icon_for_tool,
	make_canvas,
	to_canvas_coords_magnification,
	drawcopy,
	make_css_cursor,
} from "./helpers.js";
import {
	apply_image_transformation,
	invert_rgb,
} from "./image-manipulation.js";
import { showMessageBox } from "./msgbox.js";
import {
	TOOL_CURVE,
	TOOL_FREE_FORM_SELECT,
	TOOL_POLYGON,
	TOOL_SELECT,
	tools,
} from "./tools.js";
import $ from "jquery";

import { update_fill_and_stroke_colors_and_lineWidth } from "../event.js";
import { PaintJSState, PaintMobXState } from "../state";
// `sessions.js` must be loaded after `app.js`
// This would cause it to be loaded earlier, and error trying to access `undos`
// I'm surprised I haven't been bitten by this sort of bug, and I've
// mostly converted the whole app to ES Modules!
// TODO: make sessions.js export function to initialize it
import { newLocalFile } from "../session.js";

import { reset_history, undoable, cancel } from "./history.js";

export function setMousePosition(move, x, y) {
	PaintMobXState.position_mouse_active = move;
	PaintMobXState.position_mouse_x = x;
	PaintMobXState.position_mouse_y = y;
}

export function setCanvasPosition(move, x, y) {
	PaintMobXState.position_canvas_active = move;
	PaintMobXState.position_canvas_x = x;
	PaintMobXState.position_canvas_y = y;
}

export function setObjectPosition(move, x, y) {
	PaintMobXState.position_object_active = move;
	PaintMobXState.position_object_x = x;
	PaintMobXState.position_object_y = y;
}

function update_magnified_canvas_size() {
	PaintJSState.$layer_area.css(
		"width",
		PaintJSState.main_canvas.width * PaintJSState.magnification,
	);
	PaintJSState.$layer_area.css(
		"height",
		PaintJSState.main_canvas.height * PaintJSState.magnification,
	);

	update_canvas_rect();
}

function update_canvas_rect() {
	PaintJSState.canvas_bounding_client_rect =
		PaintJSState.main_canvas.getBoundingClientRect();

	update_helper_layer();
}

let helper_layer_update_queued = false;
/**
 * for updating the brush preview when the mouse stays in the same place,
 * but its coordinates in the document change due to scrolling or browser zooming (handled with scroll and resize events)
 * @type {{ clientX: number, clientY: number, devicePixelRatio: number }}
 */
let info_for_updating_pointer;
/** @param {{ clientX: number, clientY: number }} [e] */
function update_helper_layer(e) {
	//console.log('update_helper_layer()',e)
	// e should be passed for pointer events, but not scroll or resize events
	// e may be a synthetic event without clientX/Y, so ignore that (using isFinite)
	// e may also be a timestamp from requestAnimationFrame callback; ignore that
	if (e && isFinite(e.clientX)) {
		info_for_updating_pointer = {
			clientX: e.clientX,
			clientY: e.clientY,
			devicePixelRatio,
		};
	}
	if (helper_layer_update_queued) {
		//window.console?.log("update_helper_layer - nah, already queued");
		return;
	} else {
		// window.console?.log("update_helper_layer");
	}
	helper_layer_update_queued = true;
	// requestAnimationFrame(() => {
	// 	helper_layer_update_queued = false;
	// 	update_helper_layer_immediately();
	// });
}

let lastTime = 0;

function update_helper_layer_immediately() {
	// window.console.log("Update helper layer NOW");

	// [comment] 24.12.28
	// 아래 코드는 마우스에서 미리 그림 보여주는 위치를 잡는 코드인데, 이게 모바일버전에서 더블터치할때 오류가 생김.
	// 그래서 마우스에 따라가는거 만들려면 코드 다시짜야할 듯
	// PaintJSState.pointer를 같이 공유하면 안되고 따로 분리해야할 듯

	if (info_for_updating_pointer) {
		const rescale =
			info_for_updating_pointer.devicePixelRatio / devicePixelRatio;
		info_for_updating_pointer.clientX *= rescale;
		info_for_updating_pointer.clientY *= rescale;
		info_for_updating_pointer.devicePixelRatio = devicePixelRatio;
		//	console.log('func');
		PaintJSState.pointer = to_canvas_coords_magnification(
			info_for_updating_pointer,
		);
	}

	const scale = PaintJSState.magnification;

	if (!PaintJSState.helper_layer) {
		//console.log('make helper-layer')
		PaintJSState.helper_layer = new OnCanvasHelperLayer(
			0,
			0,
			PaintJSState.main_canvas.width,
			PaintJSState.main_canvas.height,
			false,
			scale,
		);
	}

	if (
		PaintJSState.helper_layer.canvas.width != PaintJSState.main_canvas.width ||
		PaintJSState.helper_layer.canvas.height != PaintJSState.main_canvas.height
	) {
		//console.log('같지않음')

		PaintJSState.helper_layer.canvas.width = PaintJSState.main_canvas.width;
		PaintJSState.helper_layer.canvas.height = PaintJSState.main_canvas.height;
		PaintJSState.helper_layer.width = PaintJSState.main_canvas.width;
		PaintJSState.helper_layer.height = PaintJSState.main_canvas.height;
		PaintJSState.helper_layer.x = 0;
		PaintJSState.helper_layer.y = 0;
		PaintJSState.helper_layer.position();
	}

	// TODO: 이거 나중에 꼭 지워야함!!
	render_canvas_view(PaintJSState.helper_layer.canvas, 1, 0, 0, true);

	if (
		PaintJSState.thumbnail_canvas &&
		PaintJSState.$thumbnail_window.is(":visible")
	) {
		// The thumbnail can be bigger or smaller than the viewport, depending on the magnification and thumbnail window size.
		// So can the document.
		// Ideally it should show the very corner if scrolled all the way to the corner,
		// so that you can get a thumbnail of any location just by scrolling.
		// But it's impossible if the thumbnail is smaller than the viewport. You have to resize the thumbnail window in that case.
		// (And if the document is smaller than the viewport, there's no scrolling to indicate where you want to get a thumbnail of.)
		// It gets clipped to the top left portion of the viewport if the thumbnail is too small.

		// This works except for if there's a selection, it affects the scrollable area, and it shouldn't affect this calculation.
		// const scroll_width = PaintJSState.$canvas_area[0].scrollWidth - PaintJSState.$canvas_area[0].clientWidth;
		// const scroll_height = PaintJSState.$canvas_area[0].scrollHeight - PaintJSState.$canvas_area[0].clientHeight;

		// These padding terms are negligible in comparison to the margin reserved for canvas handles,
		// which I'm not accounting for (except for clamping below).
		const padding_left = parseFloat(
			PaintJSState.$canvas_area.css("padding-left"),
		);
		const padding_top = parseFloat(
			PaintJSState.$canvas_area.css("padding-top"),
		);
		const scroll_width =
			PaintJSState.main_canvas.clientWidth +
			padding_left -
			PaintJSState.$canvas_area[0].clientWidth;
		const scroll_height =
			PaintJSState.main_canvas.clientHeight +
			padding_top -
			PaintJSState.$canvas_area[0].clientHeight;
		// Don't divide by less than one, or the thumbnail with disappear off to the top/left (or completely for NaN).
		let scroll_x_fraction =
			PaintJSState.$canvas_area[0].scrollLeft / Math.max(1, scroll_width);
		let scroll_y_fraction =
			PaintJSState.$canvas_area[0].scrollTop / Math.max(1, scroll_height);
		// If the canvas is larger than the document view, but not by much, and you scroll to the bottom or right,
		// the margin for the canvas handles can lead to the thumbnail being cut off or even showing
		// just blank space without this clamping (due to the not quite accurate scrollable area calculation).
		scroll_x_fraction = Math.min(scroll_x_fraction, 1);
		scroll_y_fraction = Math.min(scroll_y_fraction, 1);

		let viewport_x = Math.floor(
			Math.max(
				scroll_x_fraction *
					(PaintJSState.main_canvas.width -
						PaintJSState.thumbnail_canvas.width),
				0,
			),
		);
		let viewport_y = Math.floor(
			Math.max(
				scroll_y_fraction *
					(PaintJSState.main_canvas.height -
						PaintJSState.thumbnail_canvas.height),
				0,
			),
		);

		render_canvas_view(
			PaintJSState.thumbnail_canvas,
			1,
			viewport_x,
			viewport_y,
			false,
		); // devicePixelRatio?
	}
}

/**
 * @param {PixelCanvas} hcanvas
 * @param {number} scale
 * @param {number} viewport_x
 * @param {number} viewport_y
 * @param {boolean} is_helper_layer
 */
function render_canvas_view(
	hcanvas,
	scale,
	viewport_x,
	viewport_y,
	is_helper_layer,
) {
	//console.log('render',is_helper_layer);
	update_fill_and_stroke_colors_and_lineWidth(PaintJSState.selected_tool);

	const grid_visible = false;

	const hctx = hcanvas.ctx;

	hctx.clearRect(0, 0, hcanvas.width, hcanvas.height);

	if (!is_helper_layer) {
		// Draw the actual document canvas (for the thumbnail)
		// (For the main canvas view, the helper layer is separate from (and overlaid on top of) the document canvas)
		hctx.drawImage(
			PaintJSState.main_canvas,
			viewport_x,
			viewport_y,
			hcanvas.width,
			hcanvas.height,
			0,
			0,
			hcanvas.width,
			hcanvas.height,
		);
	}

	let tool_to_preview = PaintJSState.selected_tool;
	// Don't preview tools while dragging components/component windows
	// (The magnifier preview is especially confusing looking together with the component preview!)
	if ($("body").hasClass("dragging") && !PaintJSState.pointer_active) {
		if (
			PaintJSState.selected_tool.id === TOOL_CURVE ||
			PaintJSState.selected_tool.id === TOOL_POLYGON
		) {
			tool_to_preview = PaintJSState.selected_tool;
		} else {
			tool_to_preview = null;
		}
	}

	if (
		tool_to_preview &&
		tool_to_preview.drawPreviewUnderGrid &&
		PaintJSState.pointer &&
		PaintJSState.pointers.length < 2
	) {
		hctx.save();
		tool_to_preview.drawPreviewUnderGrid(
			hctx,
			PaintJSState.pointer.x,
			PaintJSState.pointer.y,
			grid_visible,
			scale,
			-viewport_x,
			-viewport_y,
		);
		hctx.restore();
	}

	if (
		tool_to_preview &&
		tool_to_preview.drawPreviewAboveGrid &&
		PaintJSState.pointer &&
		PaintJSState.pointers.length < 2
	) {
		hctx.save();
		tool_to_preview.drawPreviewAboveGrid(
			hctx,
			PaintJSState.pointer.x,
			PaintJSState.pointer.y,
			grid_visible,
			scale,
			-viewport_x,
			-viewport_y,
		);
		hctx.restore();
	}
}

function update_disable_aa() {
	const dots_per_canvas_px =
		window.devicePixelRatio * PaintJSState.magnification;
	if (dots_per_canvas_px >= 1) {
		PaintJSState.$canvas_area
			.addClass("pixeled-canvas")
			.removeClass("smooth-canvas");
	} else {
		PaintJSState.$canvas_area
			.addClass("smooth-canvas")
			.removeClass("pixeled-canvas");
	}
}

/**
 * @param {number} new_scale
 * @param {{x: number, y: number}} [anchor_point] - uses canvas coordinates; default is the top-left of the PaintJSState.$canvas_area viewport
 */
function set_magnification(new_scale, anchor_point) {
	// anchor_point를 지정하지 않았다면, 스크롤의 좌상단을 기준으로
	// '현재 배율 기준'의 캔버스 좌표로 환산
	anchor_point = anchor_point ?? {
		x: PaintJSState.$canvas_area.scrollLeft() / PaintJSState.magnification,
		y: PaintJSState.$canvas_area.scrollTop() / PaintJSState.magnification,
	};

	// 확대/축소 w��(old) 앵커의 픽셀 좌표 (스크롤 기준)
	const anchor_old_x_px = anchor_point.x * PaintJSState.magnification;
	const anchor_old_y_px = anchor_point.y * PaintJSState.magnification;

	//console.log('new_scale',new_scale)

	// 배율 적용
	PaintJSState.magnification = new_scale;
	if (new_scale !== 1) {
		PaintJSState.return_to_magnification = new_scale;
	}

	// 캔버스 크기나 기타 요소를 새 배율에 맞게 갱신
	update_magnified_canvas_size();

	// 확대/축소 후(new) 앵커의 픽셀 좌표 (스크롤 기준)
	const anchor_new_x_px = anchor_point.x * PaintJSState.magnification;
	const anchor_new_y_px = anchor_point.y * PaintJSState.magnification;
	//console.log('new',anchor_new_x_px,anchor_new_y_px)

	// (new - old) 만큼 스크롤을 이동해서
	// 화면상에서 앵커가 동일 위치에 머무르도록 보정
	const diff_x = anchor_new_x_px - anchor_old_x_px;
	const diff_y = anchor_new_y_px - anchor_old_y_px;

	const dpr = devicePixelRatio;

	// 스크롤을 할때 브라우저는 1만큼 이동하라고 시켰으면 실제론 1*dpr를 계산하고. 이를 내림한 값을 브라우저에 저장한다.
	// 따라서 1을 움직이라고 했을 때 dpr이 2.6이라면 실제로는 floor(1*2.6)을 한 2만큼 스크롤이 움직인다고 여기고.
	// scrollLeft()는 2/2.6 = 0.7692가 된다. 실제와 약 23%나 차이나는 것이다.
	PaintJSState.$canvas_area[0].scrollBy({
		left: Math.round(diff_x * dpr) / dpr,
		top: Math.round(diff_y * dpr) / dpr,
	});

	// 이후 UI 갱신 이벤트들
	$(window).triggerHandler("resize");
	$(window).trigger("option-changed");
	$(window).trigger("magnification-changed");
}

function reset_selected_colors() {
	PaintJSState.selected_colors = {
		foreground: "#000000",
		background: "#ffffff",
		ternary: "",
	};
	$(window).trigger("option-changed");
}

function reset_file() {
	PaintJSState.system_file_handle = null;
	PaintJSState.file_name = localize("untitled");
	PaintJSState.file_format = "image/png";
	PaintJSState.saved = true;
	update_title();
}

function update_title() {
	// 이게 브라우저 상단 타이틀 수정하는거임 꼭 여기서 수정해야할까?
	// 동적으로 수정해도 seo에 다 잡히는 것 같음.
	//document.title = `${PaintJSState.file_name} - ${localize("Paint")}`;
}

/**
 * Parse text/uri-list format
 * @param {string} text
 * @returns {string[]} URLs
 */
function get_uris(text) {
	// get lines, discarding comments
	const lines = text.split(/[\n\r]+/).filter((line) => line[0] !== "#" && line);
	// discard text with too many lines (likely pasted HTML or something) - may want to revisit this
	if (lines.length > 15) {
		return [];
	}
	// parse URLs, discarding anything that parses as a relative URL
	const uris = [];
	for (let i = 0; i < lines.length; i++) {
		// Relative URLs will throw when no base URL is passed to the URL constructor.
		try {
			const url = new URL(lines[i]);
			uris.push(url.href);
		} catch (_error) {
			/* ignore */
		}
	}
	return uris;
}

/**
 * Load an image file from a URL by any means necessary.
 * For basic image loading, see `load_image_simple` instead.
 * @param {string} uri
 * @returns {Promise<ImageInfo>}
 * @throws {Error & { code?: string }}
 */
async function load_image_from_uri(uri) {
	// Cases to consider:
	// - data URI
	// - blob URI
	//   - blob URI from another domain
	// - file URI
	// - http URI
	// - https URI
	// - unsupported protocol, e.g. "ftp://example.com/image.png"
	// - invalid URI
	//   - no protocol specified, e.g. "example.com/image.png"
	//     --> We can fix these up!
	//   - The user may be just trying to paste text, not an image.
	// - non-CORS-enabled URI
	//   --> Use a CORS proxy! :)
	//   - In electron, using a CORS proxy 1. is silly, 2. maybe isn't working.
	//     --> Either proxy requests to the main process,
	//         or configure headers in the main process to make requests work.
	//         Probably the latter. @TODO
	//         https://stackoverflow.com/questions/51254618/how-do-you-handle-cors-in-an-electron-app
	// - invalid image / unsupported image format
	// - image is no longer available on the live web
	//   --> try loading from WayBack Machine :)
	//   - often swathes of URLs are redirected to a new site, and do not give a 404.
	//     --> make sure the flow of fallbacks accounts for this, and doesn't just see it as an unsupported file format.
	// - localhost URI, e.g. "http://127.0.0.1/" or "http://localhost/"
	//   --> Don't try to proxy these, as it will just fail.
	//   - Some domain extensions are reserved, e.g. .localdomain (how official is this?)
	//   - There can also be arbitrary hostnames mapped to local servers, which we can't test for
	// - already a proxy URI, e.g. "https://cors.bridged.cc/https://example.com/image.png"
	// - file already downloaded
	//   --> maybe should cache downloads? maybe HTTP caching is good enough? maybe uncommon enough that it doesn't matter.
	// - Pasting (Edit > Paste or Ctrl+V) vs Opening (drag & drop, File > Open, Ctrl+O, or File > Load From URL)
	//   --> make wording generic or specific to the context

	const is_blob_uri = uri.match(/^blob:/i);
	const is_download = !uri.match(/^(blob|data|file):/i);
	const is_localhost = uri.match(
		/^(http|https):\/\/((127\.0\.0\.1|localhost)|.*(\.(local|localdomain|domain|lan|home|host|corp|invalid)))\b/i,
	);

	if (is_blob_uri && uri.indexOf(`blob:${location.origin}`) === -1) {
		const error = new Error("can't load blob: URI from another domain");
		// @ts-ignore
		error.code = "cross-origin-blob-uri";
		throw error;
	}

	const uris_to_try =
		is_download && !is_localhost
			? [
					uri,
					// work around CORS headers not sent by whatever server
					`https://cors.bridged.cc/${uri}`,
					`https://jspaint-cors-proxy.herokuapp.com/${uri}`,
					// if the image isn't available on the live web, see if it's archived
					`https://web.archive.org/${uri}`,
				]
			: [uri];
	const fails = [];

	for (
		let index_to_try = 0;
		index_to_try < uris_to_try.length;
		index_to_try += 1
	) {
		const uri_to_try = uris_to_try[index_to_try];
		try {
			if (is_download) {
			}

			const show_progress = ({ loaded, total }) => {
				if (is_download) {
				}
			};

			if (is_download) {
				console.log(
					`Try loading image from URI (${index_to_try + 1}/${uris_to_try.length}): "${uri_to_try}"`,
				);
			}

			const original_response = await fetch(uri_to_try);
			let response_to_read = original_response;
			if (!original_response.ok) {
				fails.push({
					status: original_response.status,
					statusText: original_response.statusText,
					url: uri_to_try,
				});
				continue;
			}
			if (!original_response.body) {
				if (is_download) {
					console.log(
						"ReadableStream not yet supported in this browser. Progress won't be shown for image requests.",
					);
				}
			} else {
				// to access headers, server must send CORS header "Access-Control-Expose-Headers: content-encoding, content-length x-file-size"
				// server must send custom x-file-size header if gzip or other content-encoding is used
				const contentEncoding =
					original_response.headers.get("content-encoding");
				const contentLength = original_response.headers.get(
					contentEncoding ? "x-file-size" : "content-length",
				);
				if (contentLength === null) {
					if (is_download) {
						console.log(
							"Response size header unavailable. Progress won't be shown for this image request.",
						);
					}
				} else {
					const total = parseInt(contentLength, 10);
					let loaded = 0;
					response_to_read = new Response(
						new ReadableStream({
							start(controller) {
								const reader = original_response.body.getReader();

								read();
								function read() {
									reader
										.read()
										.then(({ done, value }) => {
											if (done) {
												controller.close();
												return;
											}
											loaded += value.byteLength;
											show_progress({ loaded, total });
											controller.enqueue(value);
											read();
										})
										.catch((error) => {
											console.error(error);
											controller.error(error);
										});
								}
							},
						}),
					);
				}
			}

			const blob = await response_to_read.blob();
			if (is_download) {
				console.log("Download complete.");
			}
			// @TODO: use headers to detect HTML, since a doctype is not guaranteed
			// @TODO: fall back to WayBack Machine still for decode errors,
			// since a website might start redirecting swathes of URLs regardless of what they originally pointed to,
			// at which point they would likely point to a web page instead of an image.
			// (But still show an error about it not being an image, if WayBack also fails.)
			const info = await new Promise((resolve, reject) => {
				read_image_file(blob, (error, info) => {
					if (error) {
						reject(error);
					} else {
						resolve(info);
					}
				});
			});
			return info;
		} catch (error) {
			fails.push({ url: uri_to_try, error });
		}
	}
	if (is_download) {
	}
	const error = new Error(
		`failed to fetch image from any of ${uris_to_try.length} URI(s):\n  ${fails
			.map(
				(fail) =>
					(fail.statusText ? `${fail.status} ${fail.statusText} ` : "") +
					fail.url +
					(fail.error ? `\n    ${fail.error}` : ""),
			)
			.join("\n  ")}`,
	);
	// @ts-ignore
	error.code = "access-failure";
	// @ts-ignore
	error.fails = fails;
	throw error;
}

async function open_from_file(file, source_file_handle) {
	console.warn("파일 열기!!", source_file_handle);

	try {
		const imageInfo = await readImageFile(file);
		console.log("이미지 정보:", imageInfo);
		imageInfo.source_file_handle = source_file_handle;
		open_from_image_info(imageInfo);
	} catch (error) {
		console.error("이미지 처리 중 에러 발생:", error);
	}
}

function open_from_image_info(info) {
	are_you_sure(
		async () => {
			deselect();
			cancel();

			console.log("open_from_image_info");

			await newLocalFile();
			// await newLocalFile(info.image); // 나중에 이렇게 만들어야함..!!!!

			console.log(info);
			const image = info.image || info.image_data;
			console.log("image", image);

			resize_canvas(image.width, image.height);

			drawcopy(PaintJSState.main_ctx, image);

			// 히스토리를 현재 레이어로 초기화
			reset_history();

			$(window).triggerHandler("resize"); // 확대 설정
			$(window).triggerHandler("session-update"); // 저장

			if (info.source_blob instanceof File) {
				PaintJSState.file_name = info.source_blob.name;
				PaintJSState.system_file_handle = info.source_blob.path;
			}
			if (info.source_file_handle) {
				PaintJSState.system_file_handle = info.source_file_handle;
			}

			PaintJSState.saved = true;
		},
		false, // 이 두게 꼭 있어야함?
		false,
	);
}

// 새 이미지
async function file_new() {
	deselect();
	cancel();

	await newLocalFile();
}

// 파일 열기
async function file_open() {
	const input = document.createElement("input");
	input.type = "file";
	input.accept = image_formats
		.map((format) => format.extensions.map((ext) => `.${ext}`).join(","))
		.join(",");

	input.click();

	const file = await new Promise((resolve, reject) => {
		input.onchange = (event) => {
			const selectedFile = event.target.files[0];
			if (selectedFile) {
				resolve(selectedFile);
			} else {
				reject(new Error("No file selected"));
			}
		};
	});

	const fileHandle = { getFile: () => Promise.resolve(file) };
	open_from_file(file, fileHandle);
}

// Native FS API / File Access API allows you to overwrite files, but people are not used to it.
// So we ask them to confirm it the first time.
let acknowledged_overwrite_capability = false;
const confirmed_overwrite_key = "jspaint confirmed overwrite capable";
try {
	acknowledged_overwrite_capability =
		localStorage[confirmed_overwrite_key] === "true";
} catch (_error) {
	// no localStorage
	// In the year 2033, people will be more used to it, right?
	// This will be known as the "Y2T bug"
	acknowledged_overwrite_capability = Date.now() >= 2000000000000;
}
async function confirm_overwrite_capability() {
	if (acknowledged_overwrite_capability) {
		return true;
	}
	const { $window, promise } = showMessageBox({
		messageHTML: `
			<p>JS Paint can now save over existing files.</p>
			<p>Do you want to overwrite the file?</p>
			<p>
				<input type="checkbox" id="do-not-ask-me-again-checkbox"/>
				<label for="do-not-ask-me-again-checkbox">Don't ask me again</label>
			</p>
		`,
		buttons: [
			{ label: localize("Yes"), value: "overwrite", default: true },
			{ label: localize("Cancel"), value: "cancel" },
		],
	});
	const result = await promise;
	if (result === "overwrite") {
		acknowledged_overwrite_capability = $window.$content
			.find("#do-not-ask-me-again-checkbox")
			.prop("checked");
		try {
			localStorage[confirmed_overwrite_key] = acknowledged_overwrite_capability;
		} catch (_error) {
			// no localStorage... @TODO: don't show the checkbox in this case
		}
		return true;
	}
	return false;
}

// 저장
function file_save() {
	deselect();

	downloadPaint(localize("untitled"));
	return;
}

function downloadPaint(name) {
	const sortedLayer = PaintJSState.getLayers();

	const length = sortedLayer.length;
	const topCanvas = sortedLayer[length - 1].canvas;
	const canvas = make_canvas(topCanvas.width, topCanvas.height);

	for (const layer of sortedLayer) {
		canvas.ctx.drawImage(layer.canvas, 0, 0);
	}

	canvas.toBlob((blob) => {
		if (blob) {
			const a = document.createElement("a");
			const url = URL.createObjectURL(blob);
			a.href = url;
			a.download = `${name}.png`;
			a.click();
			URL.revokeObjectURL(url);
		} else {
			console.error("Failed to create PNG blob.");
		}
	}, "image/png");
}

function file_save_as(
	maybe_saved_callback = () => {},
	update_from_saved = true,
) {
	deselect();
	systemHooks.showSaveFileDialog({
		dialogTitle: localize("Save As"),
		formats: image_formats,
		defaultFileName: PaintJSState.file_name,
		defaultPath:
			typeof PaintJSState.system_file_handle === "string"
				? PaintJSState.system_file_handle
				: null,
		defaultFileFormatID: PaintJSState.file_format,
		getBlob: (new_file_type) => {
			return new Promise((resolve) => {
				write_image_file(PaintJSState.main_canvas, new_file_type, (blob) => {
					resolve(blob);
				});
			});
		},
		savedCallbackUnreliable: ({
			newFileName,
			newFileFormatID,
			newFileHandle,
			newBlob,
		}) => {
			PaintJSState.saved = true;
			PaintJSState.system_file_handle = newFileHandle;
			PaintJSState.file_name = newFileName;
			PaintJSState.file_format = newFileFormatID;
			update_title();
			maybe_saved_callback();
			if (update_from_saved) {
				update_from_saved_file(newBlob);
			}
		},
	});
}

function file_print() {
	print();
}

/**
 * Prompts the user to save changes to the document.
 * @param {(info?: { canvas_modified_while_loading?: boolean }) => void} action
 * @param {() => void} [canceled]
 * @param {boolean} [from_session_load]
 */
function are_you_sure(action, canceled, from_session_load) {
	if (PaintJSState.saved) {
		action();
	} else if (from_session_load) {
		const stack = new Error().stack;
		console.log("현재 호출 스택:\n", stack);
		// @FIXME: this dialog is confusingly worded in the best case.
		// It's intended for when the user edits the document while the initial document is loading,
		// which is hard to do, at least for local sessions on my fast new computer.
		// However it's also shown inappropriately if you edit the document and then either:
		// - type a #load: URL into the address bar such as
		//   http://127.0.0.1:1999/#load:https://i.imgur.com/M5zcPuk.jpeg
		// - click an Open link in the Manage Storage dialog in the Electron app
		showMessageBox({
			message: localize(
				"You've modified the document while an existing document was loading.\nSave the new document?",
				PaintJSState.file_name,
			),
			buttons: [
				{
					// label: localize("Save"),
					label: localize("Yes"),
					value: "save",
					default: true,
				},
				{
					// label: "Discard",
					label: localize("No"),
					value: "discard",
				},
			],
			// @TODO: not closable with Escape or close button
		}).then((result) => {
			if (result === "save") {
				file_save(() => {
					action();
				}, false);
			} else if (result === "discard") {
				action({ canvas_modified_while_loading: true });
			} else {
				// should not ideally happen
				// but prefer to preserve the previous document,
				// as the user has only (probably) as small window to make changes while loading,
				// whereas there could be any amount of work put into the document being loaded.
				// @TODO: could show dialog again, but making it un-cancelable would be better.
				action();
			}
		});
	} else {
		showMessageBox({
			message: localize("Save changes to %1?", PaintJSState.file_name),
			buttons: [
				{
					// label: localize("Save"),
					label: localize("Yes"),
					value: "save",
					default: true,
				},
				{
					// label: "Discard",
					label: localize("No"),
					value: "discard",
				},
				{
					label: localize("Cancel"),
					value: "cancel",
				},
			],
		}).then((result) => {
			if (result === "save") {
				file_save(() => {
					action();
				}, false);
			} else if (result === "discard") {
				action();
			} else {
				canceled?.();
			}
		});
	}
}

function please_enter_a_number() {
	showMessageBox({
		// title: "Invalid Value",
		message: localize("Please enter a number."),
	});
}

// Note: This function is part of the API.
/**
 * @param {string} message
 * @param {Error | string} [error]
 */
function show_error_message(message, error) {
	// Test global error handling resiliency by enabling one or both of these:
	// Promise.reject(new Error("EMIT EMIT EMIT"));
	// throw new Error("EMIT EMIT EMIT");
	// It should fall back to an alert.
	// EMIT stands for "Error Message Itself Test".

	const { $message } = showMessageBox({
		iconID: "error",
		message,
		// windowOptions: {
		// 	innerWidth: 600,
		// },
	});
	// $message.css("max-width", "600px");
	if (error) {
		const $details = $(
			"<details><summary><span>Details</span></summary></details>",
		).appendTo($message);

		// Chrome includes the error message in the error.stack string, whereas Firefox doesn't.
		// Also note that there can be Exception objects that don't have a message (empty string) but a name,
		// for instance Exception { message: "", name: "NS_ERROR_FAILURE", ... } for out of memory when resizing the canvas too large in Firefox.
		// Chrome just lets you bring the system to a grating halt by trying to grab too much memory.
		// Firefox does too sometimes.
		const e = /** @type {Error} */ (error);
		let error_string = e.stack;
		if (!error_string) {
			error_string = error.toString();

			if (error_string === "[object Object]") {
				try {
					error_string = JSON.stringify(error, null, 2);
				} catch (e) {
					error_string = "Error details could not be stringified: " + e;
				}
			}
		} else if (e.message && error_string.indexOf(e.message) === -1) {
			error_string = `${error.toString()}\n\n${error_string}`;
		} else if (e.name && error_string.indexOf(e.name) === -1) {
			error_string = `${e.name}\n\n${error_string}`;
		}
		$(E("pre")).text(error_string).appendTo($details).css({
			background: "white",
			color: "#333",
			// background: "#A00",
			// color: "white",
			fontFamily: "monospace",
			width: "500px",
			maxWidth: "100%",
			overflow: "auto",
		});
	}
	if (error) {
		window.console?.error?.(message, error);
	} else {
		window.console?.error?.(message);
	}
}

// @TODO: close are_you_sure windows and these Error windows when switching sessions
// because it can get pretty confusing
/** @param {Error & {code: string, fails?: {status: number, statusText: string, url: string}[]}} error */
function show_resource_load_error_message(error) {
	const { $window, $message } = showMessageBox({});
	const firefox = navigator.userAgent.toLowerCase().indexOf("firefox") > -1;
	// @TODO: copy & paste vs download & open, more specific guidance
	if (error.code === "cross-origin-blob-uri") {
		$message.html(`
			<p>Can't load image from address starting with "blob:".</p>
			${
				firefox
					? `<p>Try "Copy Image" instead of "Copy Image Location".</p>`
					: `<p>Try "Copy image" instead of "Copy image address".</p>`
			}
		`);
	} else if (error.code === "html-not-image") {
		$message.html(`
			<p>Address points to a web page, not an image file.</p>
			<p>Try copying and pasting an image instead of a URL.</p>
		`);
	} else if (error.code === "decoding-failure") {
		$message.html(`
			<p>Address doesn't point to an image file of a supported format.</p>
			<p>Try copying and pasting an image instead of a URL.</p>
		`);
	} else if (error.code === "access-failure") {
		if (navigator.onLine) {
			$message.html(`
				<p>Failed to download image.</p>
				<p>Try copying and pasting an image instead of a URL.</p>
			`);
			if (error.fails) {
				$("<ul>")
					.append(
						error.fails.map(({ status, statusText, url }) =>
							$("<li>")
								.text(url)
								.prepend(
									$("<b>").text(`${status || ""} ${statusText || "Failed"} `),
								),
						),
					)
					.appendTo($message);
			}
		} else {
			$message.html(`
				<p>Failed to download image.</p>
				<p>You're offline. Connect to the internet and try again.</p>
				<p>Or copy and paste an image instead of a URL, if possible.</p>
			`);
		}
	} else {
		// TODO: what to do in Electron? also most users don't know how to check the console
		$message.html(`
			<p>Failed to load image from URL.</p>
			<p>Check your browser's devtools for details.</p>
		`);
	}
	$message.css({ maxWidth: "500px" });
	$window.center(); // after adding content
}
/**
 * @typedef {object} PaletteErrorGroup
 * @property {string} message
 * @property {PaletteErrorObject[]} errors
 *
 * @typedef {object} PaletteErrorObject
 * @property {Error} error
 * @property {{name: string}} __PATCHED_LIB_TO_ADD_THIS__format
 *
 * @param {object} options
 * @param {Error=} options.as_image_error
 * @param {Error|PaletteErrorGroup=} options.as_palette_error
 */
function show_file_format_errors({ as_image_error, as_palette_error }) {
	let html = `
		<p>${localize("Paint cannot open this file.")}</p>
	`;
	if (as_image_error) {
		// TODO: handle weird errors, only show invalid format error if that's what happened
		html += `
			<details>
				<summary>${localize("Bitmap Image")}</summary>
				<p>${localize("This is not a valid bitmap file, or its format is not currently supported.")}</p>
			</details>
		`;
	}
	var entity_map = {
		"&": "&amp;",
		"<": "&lt;",
		">": "&gt;",
		'"': "&quot;",
		"'": "&#39;",
		"/": "&#x2F;",
		"`": "&#x60;",
		"=": "&#x3D;",
	};
	const escape_html = (string) =>
		String(string).replace(/[&<>"'`=/]/g, (s) => entity_map[s]);
	const uppercase_first = (string) =>
		string.charAt(0).toUpperCase() + string.slice(1);

	const only_palette_error = as_palette_error && !as_image_error; // update me if there are more error types
	if (as_palette_error) {
		let details = "";
		if ("errors" in as_palette_error) {
			details = `<ul dir="ltr">${as_palette_error.errors
				.map((error) => {
					const format = error.__PATCHED_LIB_TO_ADD_THIS__format;
					if (format && error.error) {
						return `<li><b>${escape_html(`${format.name}`)}</b>: ${escape_html(uppercase_first(error.error.message))}</li>`;
					}
					// Fallback for unknown errors
					// @ts-ignore
					return `<li>${escape_html(error.message || error)}</li>`;
				})
				.join("\n")}</ul>`;
		} else {
			// Fallback for unknown errors
			details = `<p>${escape_html(as_palette_error.message || as_palette_error)}</p>`;
		}
		html += `
			<details>
				<summary>${only_palette_error ? "Details" : localize("Palette|*.pal|").split("|")[0]}</summary>
				<p>${localize("Unexpected file format.")}</p>
				${details}
			</details>
		`;
	}
	showMessageBox({
		messageHTML: html,
	});
}

function exit_fullscreen_if_ios() {
	if ($("body").hasClass("ios")) {
		try {
			if (document.exitFullscreen) {
				document.exitFullscreen();
			} else if (document.webkitExitFullscreen) {
				document.webkitExitFullscreen();
			} else if (document.mozCancelFullScreen) {
				document.mozCancelFullScreen();
			} else if (document.msExitFullscreen) {
				document.msExitFullscreen();
			}
		} catch (_error) {
			// not important, just trying to prevent broken fullscreen after refresh
			// (:fullscreen and document.fullscreenElement stops working because it's not "requested by the page" anymore)
			// (the fullscreen styling is not generally obtrusive, but it is obtrusive when it DOESN'T work)
			//
			// alternatives:
			// - detect reload-while-fullscreen by storing a timestamp on unload when fullscreen,
			//   and apply the fullscreen class if timestamp is within a few seconds during load.
			//   - This doesn't have an answer for detecting leaving fullscreen,
			//     and if it keeps thinking it's fullscreen, it'll keep storing the timestamp, and get stuck.
			//     Unless it only stores the timestamp if it knows it's fullscreen? (i.e. page-requested fullscreen)
			//     Then it would only work for one reload.
			//     So ideally it would have the below anyway, in which case this would be unnecessary.
			// - detect fullscreen state without fullscreen API, using viewport size
			//   - If this is possible, why don't browsers just expose this information in the fullscreen API? :(
			//   - iPad resets the zoom level when going fullscreen, and then when reloading,
			//     the zoom level is reset to the user-set zoom level.
			//     Safari doesn't update devicePixelRatio based on the zoom level,
			//     and doesn't support ResizeObserver for device pixels.
			//     It does support https://developer.mozilla.org/en-US/docs/Web/API/Visual_Viewport_API
			//     though, so maybe something can be done with that.
			// - prompt to add to homescreen
		}
	}
}

// show_about_paint(); // for testing

function update_css_classes_for_conditional_messages() {
	$(".on-dev-host, .on-third-party-host, .on-official-host").hide();
	if (location.hostname.match(/localhost|127.0.0.1/)) {
		$(".on-dev-host").show();
	} else if (location.hostname.match(/jspaint.app/)) {
		$(".on-official-host").show();
	} else {
		$(".on-third-party-host").show();
	}

	$(".navigator-online, .navigator-offline").hide();
	if (navigator.onLine) {
		$(".navigator-online").show();
	} else {
		$(".navigator-offline").show();
	}
}

/**
 * @param {Blob} blob
 */
function paste_image_from_file(blob) {
	read_image_file(blob, (error, info) => {
		if (error) {
			show_file_format_errors({ as_image_error: error });
			return;
		}
		paste(info.image || make_canvas(info.image_data));
	});
}

// Edit > Paste From
async function choose_file_to_paste() {
	const { file } = await systemHooks.showOpenFileDialog({
		formats: image_formats,
	});
	if (file.type.match(/^image|application\/pdf/)) {
		paste_image_from_file(file);
		return;
	}
	show_error_message(
		localize(
			"This is not a valid bitmap file, or its format is not currently supported.",
		),
	);
}

/**
 * @param {HTMLImageElement | HTMLCanvasElement} img_or_canvas
 */
function paste(img_or_canvas) {
	// The resize gets its own undoable, as in mspaint
	// resize_canvas_and_save_dimensions(
	// 	Math.max(PaintJSState.main_canvas.width, img_or_canvas.width),
	// 	Math.max(PaintJSState.main_canvas.height, img_or_canvas.height),
	// 	{
	// 		name: "Enlarge Canvas For Paste",
	// 		icon: get_help_folder_icon("p_stretch_both.png"),
	// 	},
	// );
	do_the_paste();
	PaintJSState.$canvas_area.trigger("resize"); // already taken care of by resize_canvas_and_save_dimensions? or does this hide the main canvas handles?

	function do_the_paste() {
		deselect();
		select_tool(get_tool_by_id(TOOL_SELECT));

		const x = Math.max(
			0,
			Math.ceil(
				PaintJSState.$canvas_area.scrollLeft() / PaintJSState.magnification,
			),
		);
		const y = Math.max(
			0,
			Math.ceil(
				PaintJSState.$canvas_area.scrollTop() / PaintJSState.magnification,
			),
		);

		undoable(
			{
				name: localize("Paste"),
				icon: get_help_folder_icon("p_paste.png"),
			},
			() => {
				console.log("AA");
				PaintJSState.selection = new OnCanvasSelection(
					x,
					y,
					img_or_canvas.width,
					img_or_canvas.height,
					img_or_canvas,
				);
				console.log("BB");
			},
		);
	}
}

/**
 * @param {boolean} [going_to_history_node]
 */
function meld_selection_into_canvas(going_to_history_node) {
	const moved = PaintJSState.selection.moved;

	PaintJSState.selection.draw();
	PaintJSState.selection.destroy();
	PaintJSState.selection = null;

	if (!going_to_history_node) {
		if (moved) {
			undoable(
				{
					name: "Deselect",
					icon: get_icon_for_tool(get_tool_by_id(TOOL_SELECT)),
				},
				() => {},
			);
		}
	}
}

/**
 * @param {boolean} [going_to_history_node]
 */
function deselect(going_to_history_node) {
	if (PaintJSState.selection) {
		meld_selection_into_canvas(going_to_history_node);
	}

	PaintJSState.selected_tool.end?.(PaintJSState.main_ctx);

	PaintJSState.position_object_active = false;
}

/**
 * @param {{name?: string, icon?: HTMLImageElement | HTMLCanvasElement}} [meta] - overrides certain properties of ActionMetadata
 */
function delete_selection(meta = {}) {
	if (PaintJSState.selection) {
		undoable(
			{
				name: meta.name || localize("Clear Selection"), //"Delete", (I feel like "Clear Selection" is unclear, could mean "Deselect")
				icon: meta.icon || get_help_folder_icon("p_delete.png"),
				// soft: @TODO: conditionally soft?,
			},
			() => {
				PaintJSState.selection.destroy();
				PaintJSState.selection = null;
			},
		);
	}
}
function select_all() {
	deselect();
	select_tool(get_tool_by_id(TOOL_SELECT));

	undoable(
		{
			name: localize("Select All"),
			icon: get_icon_for_tool(get_tool_by_id(TOOL_SELECT)),
			soft: true,
		},
		() => {
			PaintJSState.selection = new OnCanvasSelection(
				0,
				0,
				PaintJSState.main_canvas.width,
				PaintJSState.main_canvas.height,
			);
		},
	);
}

/**
 * @param {string} commandId
 */
function try_exec_command(commandId) {
	const ctrlOrCmd = /(Mac|iPhone|iPod|iPad)/i.test(navigator.platform)
		? "⌘"
		: "Ctrl";
	const recommendationForClipboardAccess = `Please use the keyboard: ${ctrlOrCmd}+C to copy, ${ctrlOrCmd}+X to cut, ${ctrlOrCmd}+V to paste. If keyboard is not an option, try using Chrome version 76 or higher.`;

	if (document.queryCommandEnabled(commandId)) {
		// not a reliable source for whether it'll work, if I recall
		document.execCommand(commandId);
		if (!navigator.userAgent.includes("Firefox") || commandId === "paste") {
			return show_error_message(
				`That ${commandId} probably didn't work. ${recommendationForClipboardAccess}`,
			);
		}
	} else {
		return show_error_message(
			`Cannot perform ${commandId}. ${recommendationForClipboardAccess}`,
		);
	}
}

function getSelectionText() {
	// instanceof might make this simpler, particularly with TypeScript JSDoc
	const activeEl = document.activeElement;
	const activeElTagName = activeEl ? activeEl.tagName.toLowerCase() : null;
	if (
		activeElTagName == "textarea" ||
		(activeElTagName == "input" &&
			/^(?:text|search|password|tel|url)$/i.test(
				/** @type {HTMLInputElement} */ (activeEl).type,
			))
	) {
		const textField = /** @type {HTMLInputElement | HTMLTextAreaElement} */ (
			activeEl
		);
		if (typeof textField.selectionStart == "number") {
			return textField.value.slice(
				textField.selectionStart,
				textField.selectionEnd,
			);
		}
	}
	if (window.getSelection) {
		return window.getSelection().toString();
	}
	return "";
}

/**
 * @param {boolean} [execCommandFallback]
 */
function edit_copy(execCommandFallback) {
	const ctrlOrCmd = /(Mac|iPhone|iPod|iPad)/i.test(navigator.platform)
		? "⌘"
		: "Ctrl";
	const recommendationForClipboardAccess = `Please use the keyboard: ${ctrlOrCmd}+C to copy, ${ctrlOrCmd}+X to cut, ${ctrlOrCmd}+V to paste. If keyboard is not an option, try using Chrome version 76 or higher.`;

	const text = getSelectionText();

	if (text.length > 0) {
		if (!navigator.clipboard || !navigator.clipboard.writeText) {
			if (execCommandFallback) {
				return try_exec_command("copy");
			} else {
				show_error_message(
					`${localize("Error getting the Clipboard Data!")} ${recommendationForClipboardAccess}`,
				);
				// show_error_message(`The Async Clipboard API is not supported by this browser. ${browserRecommendationForClipboardAccess}`);
				return;
			}
		}
		navigator.clipboard.writeText(text);
	} else if (PaintJSState.selection && PaintJSState.selection.canvas) {
		if (!navigator.clipboard || !navigator.clipboard.write) {
			if (execCommandFallback) {
				return try_exec_command("copy");
			} else {
				show_error_message(
					`${localize("Error getting the Clipboard Data!")} ${recommendationForClipboardAccess}`,
				);
				// show_error_message(`The Async Clipboard API is not supported by this browser. ${browserRecommendationForClipboardAccess}`);
				return;
			}
		}
		PaintJSState.selection.canvas.toBlob((blob) => {
			sanity_check_blob(blob, () => {
				navigator.clipboard
					.write([
						new ClipboardItem(
							Object.defineProperty({}, blob.type, {
								value: blob,
								enumerable: true,
							}),
						),
					])
					.then(
						() => {
							window.console?.log("Copied image to the clipboard.");
						},
						(error) => {
							show_error_message("Failed to copy to the Clipboard.", error);
						},
					);
			});
		});
	}
}
/**
 * @param {boolean} [execCommandFallback]
 */
function edit_cut(execCommandFallback) {
	const ctrlOrCmd = /(Mac|iPhone|iPod|iPad)/i.test(navigator.platform)
		? "u��"
		: "Ctrl";
	const recommendationForClipboardAccess = `Please use the keyboard: ${ctrlOrCmd}+C to copy, ${ctrlOrCmd}+X to cut, ${ctrlOrCmd}+V to paste. If keyboard is not an option, try using Chrome version 76 or higher.`;

	if (!navigator.clipboard || !navigator.clipboard.write) {
		if (execCommandFallback) {
			return try_exec_command("cut");
		} else {
			show_error_message(
				`${localize("Error getting the Clipboard Data!")} ${recommendationForClipboardAccess}`,
			);
			// show_error_message(`The Async Clipboard API is not supported by this browser. ${browserRecommendationForClipboardAccess}`);
			return;
		}
	}
	edit_copy();
	delete_selection({
		name: localize("Cut"),
		icon: get_help_folder_icon("p_cut.png"),
	});
}
/**
 * @param {boolean} [execCommandFallback]
 */
async function edit_paste(execCommandFallback) {
	const ctrlOrCmd = /(Mac|iPhone|iPod|iPad)/i.test(navigator.platform)
		? "⌘"
		: "Ctrl";
	const recommendationForClipboardAccess = `Please use the keyboard: ${ctrlOrCmd}+C to copy, ${ctrlOrCmd}+X to cut, ${ctrlOrCmd}+V to paste. If keyboard is not an option, try using Chrome version 76 or higher.`;

	if (
		document.activeElement instanceof HTMLInputElement ||
		document.activeElement instanceof HTMLTextAreaElement
	) {
		if (!navigator.clipboard || !navigator.clipboard.readText) {
			if (execCommandFallback) {
				return try_exec_command("paste");
			} else {
				show_error_message(
					`${localize("Error getting the Clipboard Data!")} ${recommendationForClipboardAccess}`,
				);
				// show_error_message(`The Async Clipboard API is not supported by this browser. ${browserRecommendationForClipboardAccess}`);
				return;
			}
		}
		const clipboardText = await navigator.clipboard.readText();
		document.execCommand("InsertText", false, clipboardText);
		return;
	}
	if (!navigator.clipboard || !navigator.clipboard.read) {
		if (execCommandFallback) {
			return try_exec_command("paste");
		} else {
			show_error_message(
				`${localize("Error getting the Clipboard Data!")} ${recommendationForClipboardAccess}`,
			);
			// show_error_message(`The Async Clipboard API is not supported by this browser. ${browserRecommendationForClipboardAccess}`);
			return;
		}
	}
	try {
		const clipboardItems = await navigator.clipboard.read();
		const blob = await clipboardItems[0].getType("image/png");
		paste_image_from_file(blob);
	} catch (error) {
		if (error.name === "NotFoundError") {
			try {
				const clipboardText = await navigator.clipboard.readText();
				if (clipboardText) {
					const uris = get_uris(clipboardText);
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
						// @TODO: should I just make a textbox instead?
						show_error_message(
							"The information on the Clipboard can't be inserted into Paint.",
						);
					}
				} else {
					show_error_message(
						"The information on the Clipboard can't be inserted into Paint.",
					);
				}
			} catch (error) {
				show_error_message(
					localize("Error getting the Clipboard Data!"),
					error,
				);
			}
		} else {
			show_error_message(localize("Error getting the Clipboard Data!"), error);
		}
	}
}

function image_invert_colors() {
	apply_image_transformation(
		{
			name: localize("Invert Colors"),
			icon: get_help_folder_icon("p_invert.png"),
		},
		(_original_canvas, original_ctx, _new_canvas, new_ctx) => {
			invert_rgb(original_ctx, new_ctx);
		},
	);
}

function clear() {
	deselect();
	cancel();
	undoable(
		{
			name: localize("Clear Image"),
			icon: get_help_folder_icon("p_blank.png"),
		},
		() => {
			PaintJSState.saved = false;
			update_title();

			// 캔버스 초기화
			for (const layer of PaintJSState.getLayers()) {
				const canvas = layer.canvas;
				const ctx = canvas.ctx;
				if (canvas.className == "layer background") {
					// 배경 레이어는 색칠
					ctx.fillStyle = PaintJSState.selected_colors.background;
					ctx.fillRect(0, 0, canvas.width, canvas.height);
				} else {
					// 일반 레이어는 다 투명하게
					PaintJSState.main_ctx.clearRect(
						0,
						0,
						PaintJSState.main_canvas.width,
						PaintJSState.main_canvas.height,
					);
				}
			}

			// if (PaintJSState.transparency) {
			// 	PaintJSState.main_ctx.clearRect(
			// 		0,
			// 		0,
			// 		PaintJSState.main_canvas.width,
			// 		PaintJSState.main_canvas.height,
			// 	);
			// } else {
			// 	PaintJSState.main_ctx.fillStyle =
			// 		PaintJSState.selected_colors.background;
			// 	PaintJSState.main_ctx.fillRect(
			// 		0,
			// 		0,
			// 		PaintJSState.main_canvas.width,
			// 		PaintJSState.main_canvas.height,
			// 	);
			// }
		},
	);
}

let cleanup_bitmap_view = () => {};
function view_bitmap() {
	cleanup_bitmap_view();

	const bitmap_view_div = document.createElement("div");
	bitmap_view_div.classList.add("bitmap-view", "inset-deep");
	document.body.appendChild(bitmap_view_div);
	$(bitmap_view_div).css({
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		position: "fixed",
		top: "0",
		left: "0",
		width: "100%",
		height: "100%",
		zIndex: "9999",
		background: "var(--Background)",
	});
	if (bitmap_view_div.requestFullscreen) {
		bitmap_view_div.requestFullscreen();
	} else if (bitmap_view_div.webkitRequestFullscreen) {
		bitmap_view_div.webkitRequestFullscreen();
	}

	let blob_url;
	let got_fullscreen = false;
	let iid = setInterval(() => {
		// In Chrome, if the page is already fullscreen, and you requestFullscreen,
		// hitting Esc will change document.fullscreenElement without triggering the fullscreenchange event!
		// It doesn't trigger a keydown either.
		if (
			document.fullscreenElement === bitmap_view_div ||
			document.webkitFullscreenElement === bitmap_view_div
		) {
			got_fullscreen = true;
		} else if (got_fullscreen) {
			cleanup_bitmap_view();
		}
	}, 100);
	cleanup_bitmap_view = () => {
		document.removeEventListener("fullscreenchange", onFullscreenChange);
		document.removeEventListener("webkitfullscreenchange", onFullscreenChange);
		document.removeEventListener("keydown", onKeyDown);
		document.removeEventListener("mousedown", onMouseDown);
		// If you have e.g. the Help window open,
		// and right click to close the View Bitmap, with the mouse over the window,
		// this needs a delay to cancel the context menu.
		setTimeout(() => {
			document.removeEventListener("contextmenu", onContextMenu);
		}, 100);
		URL.revokeObjectURL(blob_url);
		clearInterval(iid);
		if (
			document.fullscreenElement === bitmap_view_div ||
			document.webkitFullscreenElement === bitmap_view_div
		) {
			if (document.exitFullscreen) {
				document.exitFullscreen(); // avoid warning in Firefox
			} else if (document.msExitFullscreen) {
				document.msExitFullscreen();
			} else if (document.mozCancelFullScreen) {
				document.mozCancelFullScreen();
			} else if (document.webkitExitFullscreen) {
				document.webkitExitFullscreen();
			}
		}
		bitmap_view_div.remove();
		cleanup_bitmap_view = () => {};
	};
	document.addEventListener("fullscreenchange", onFullscreenChange, {
		once: true,
	});
	document.addEventListener("webkitfullscreenchange", onFullscreenChange, {
		once: true,
	});
	document.addEventListener("keydown", onKeyDown);
	document.addEventListener("mousedown", onMouseDown);
	document.addEventListener("contextmenu", onContextMenu);

	function onFullscreenChange() {
		if (
			document.fullscreenElement !== bitmap_view_div &&
			document.webkitFullscreenElement !== bitmap_view_div
		) {
			cleanup_bitmap_view();
		}
	}
	let repeating_f = false;
	function onKeyDown(event) {
		// console.log(event.key, event.repeat);
		repeating_f =
			repeating_f || (event.repeat && (event.key === "f" || event.key === "F"));
		if (event.repeat) {
			return;
		}
		if (repeating_f && (event.key === "f" || event.key === "F")) {
			repeating_f = false;
			return; // Chrome sends an F keydown with repeat=false if you release Ctrl before F, while repeating.
			// This is a slightly overkill, and slightly overzealous workaround (can ignore one normal F before handling F as exit)
		}
		// Prevent also toggling View Bitmap on while toggling off, with Ctrl+F+F.
		// That is, if you hold Ctrl and press F twice, the second F should close View Bitmap and not reopen it immediately.
		// This relies on the keydown handler handling event.defaultPrevented (or isDefaultPrevented() if it's using jQuery)
		event.preventDefault();
		// Note: in mspaint, Esc is the only key that DOESN'T close the bitmap view,
		// but it also doesn't do anything else — other than changing the cursor. Stupid.
		cleanup_bitmap_view();
	}
	function onMouseDown(_event) {
		// Note: in mspaint, only left click exits View Bitmap mode.
		// Right click can show a useless context menu.
		cleanup_bitmap_view();
	}
	function onContextMenu(event) {
		event.preventDefault();
		cleanup_bitmap_view(); // not needed
	}

	// @TODO: include selection in the bitmap
	// I believe mspaint uses a similar code path to the Thumbnail,
	// considering that if you right click on the image in View Bitmap mode,
	// it shows the silly "Thumbnail" context menu item.
	// (It also shows the selection, in a meaningless place, similar to the Thumbnail's bugs)
	PaintJSState.main_canvas.toBlob((blob) => {
		blob_url = URL.createObjectURL(blob);
		const img = document.createElement("img");
		img.src = blob_url;
		bitmap_view_div.appendChild(img);
	}, "image/png");
}

/**
 * @param {ToolID} id
 * @returns {Tool} tool object
 */
function get_tool_by_id(id) {
	for (let i = 0; i < tools.length; i++) {
		if (tools[i].id == id) {
			return tools[i];
		}
	}
}

/**
 * @param {Tool} tool
 * @param {boolean} [toggle]
 */
function select_tool(tool) {
	deselect();
	PaintJSState.$canvas.css({
		cursor: make_css_cursor(...tool.cursor),
	});

	if (!PaintJSState.selected_tool.deselect) {
		PaintJSState.return_to_tool = PaintJSState.selected_tool;
	}

	PaintJSState.selected_tool = tool;

	if (tool.preload) {
		tool.preload();
	}
}

function resize_canvas(width, height) {
	PaintJSState.paint.setSize(width, height);
}

/**
 * Resizes the canvas without saving the dimensions to local storage.
 *
 * @param {number} unclamped_width - The new width of the canvas. Will be clamped to a minimum of 1.
 * @param {number} unclamped_height - The new height of the canvas. Will be clamped to a minimum of 1.
 * @param {{name?: string, icon?: HTMLImageElement | HTMLCanvasElement}} [undoable_meta={}] - overrides certain properties of ActionMetadata
 */
function resize_canvas_without_saving_dimensions(
	unclamped_width,
	unclamped_height,
	undoable_meta = {},
) {
	const new_width = Math.max(1, unclamped_width);
	const new_height = Math.max(1, unclamped_height);
	if (
		PaintJSState.main_canvas.width !== new_width ||
		PaintJSState.main_canvas.height !== new_height
	) {
		undoable(
			{
				name: undoable_meta.name || "Resize Canvas",
				icon: undoable_meta.icon || get_help_folder_icon("p_stretch_both.png"),
			},
			() => {
				try {
					resize_canvas(new_width, new_height);
				} catch (exception) {
					if (exception.name === "NS_ERROR_FAILURE") {
						// or localize("There is not enough memory or resources to complete operation.")
						show_error_message(
							localize("Insufficient memory to perform operation."),
							exception,
						);
					} else {
						show_error_message(
							localize("An unknown error has occurred."),
							exception,
						);
					}
					// @TODO: undo and clean up undoable
					// maybe even keep Attributes dialog open if that's what's triggering the resize
					return;
				}
				//console.log("size:", new_width, new_height);

				PaintJSState.$canvas_area.trigger("resize");
			},
		);
	}
}

/**
 * Resizes the canvas and saves the dimensions to local storage as the new default.
 *
 * @param {number} unclamped_width - The new width of the canvas. Will be clamped to a minimum of 1.
 * @param {number} unclamped_height - The new height of the canvas. Will be clamped to a minimum of 1.
 * @param {{name?: string, icon?: HTMLImageElement | HTMLCanvasElement}} [undoable_meta={}] - overrides certain properties of ActionMetadata
 */
function resize_canvas_and_save_dimensions(
	unclamped_width,
	unclamped_height,
	undoable_meta = {},
) {
	resize_canvas_without_saving_dimensions(
		unclamped_width,
		unclamped_height,
		undoable_meta,
	);
	// localStore.set(
	// 	{
	// 		width: PaintJSState.main_canvas.width.toString(),
	// 		height: PaintJSState.main_canvas.height.toString(),
	// 	},
	// 	(_error) => {
	// 		// oh well
	// 	},
	// );
}

function image_attributes() {
	if (image_attributes.$window) {
		image_attributes.$window.close();
	}

	// Information

	handle_keyshortcuts($w);

	// Default focus

	$width.select();

	// Reposition the window

	image_attributes.$window.center();
}

// TODO: maybe don't tack properties onto functions so much!?
/**
 * @memberof image_attributes
 * @type {OSGUI$Window}
 */
image_attributes.$window = null;
/**
 * @memberof image_attributes
 * @type {string}
 */
image_attributes.unit = "px";

/**
 * @param {JQuery<HTMLElement>} $container
 */
function handle_keyshortcuts($container) {
	// This function implements shortcuts defined with aria-keyshortcuts.
	// It also modifies aria-keyshortcuts to remove shortcuts that don't
	// contain a modifier (other than shift) when an input field is focused,
	// in order to avoid conflicts with typing.
	// It stores the original aria-keyshortcuts (indefinitely), so if aria-keyshortcuts
	// is ever to be modified at runtime (externally), the code here may need to be changed.

	$container.on("keydown", (event) => {
		const $targets = $container.find("[aria-keyshortcuts]");
		for (let shortcut_target of $targets) {
			const shortcuts = $(shortcut_target).attr("aria-keyshortcuts").split(" ");
			for (const shortcut of shortcuts) {
				// TODO: should we use code instead of key? need examples
				if (
					!!shortcut.match(/Alt\+/i) === event.altKey &&
					!!shortcut.match(/Ctrl\+/i) === event.ctrlKey &&
					!!shortcut.match(/Meta\+/i) === event.metaKey &&
					!!shortcut.match(/Shift\+/i) === event.shiftKey &&
					shortcut.split("+").pop().toUpperCase() === event.key.toUpperCase()
				) {
					event.preventDefault();
					event.stopPropagation();
					// @ts-ignore
					if (shortcut_target.disabled) {
						shortcut_target = shortcut_target.closest(".radio-wrapper");
					}
					shortcut_target.click();
					shortcut_target.focus();
					return;
				}
			}
		}
	});

	// Prevent keyboard shortcuts from interfering with typing in text fields.
	// Rather than conditionally handling the shortcut, I'm conditionally removing it,
	// because _theoretically_ it's better for assistive technology to know that the shortcut isn't available.
	// (Theoretically I should also remove aria-keyshortcuts when the window isn't focused...)
	$container.on("focusin focusout", (event) => {
		if (
			$(event.target).is(
				'textarea, input:not([type="checkbox"]):not([type="radio"]):not([type="button"]):not([type="submit"]):not([type="reset"]):not([type="image"]):not([type="file"]):not([type="color"]):not([type="range"])',
			)
		) {
			for (const control of $container.find("[aria-keyshortcuts]")) {
				// @ts-ignore (could use a Map but that would be a little more complicated)
				control._original_aria_keyshortcuts =
					control._original_aria_keyshortcuts ??
					control.getAttribute("aria-keyshortcuts");
				// Remove shortcuts without modifiers.
				control.setAttribute(
					"aria-keyshortcuts",
					control
						.getAttribute("aria-keyshortcuts")
						.split(" ")
						.filter((shortcut) => shortcut.match(/(Alt|Ctrl|Meta)\+/i))
						.join(" "),
				);
			}
		} else {
			// Restore shortcuts.
			for (const control of $container.find("[aria-keyshortcuts]")) {
				// @ts-ignore
				if (control._original_aria_keyshortcuts) {
					// @ts-ignore
					control.setAttribute(
						"aria-keyshortcuts",
						control._original_aria_keyshortcuts,
					);
				}
			}
		}
	});
}

/**
 * Writes an image file to a blob, in the given format.
 * @param {HTMLCanvasElement} canvas - The canvas to export as an image file. Must have a 2d context.
 * @param {string} mime_type - The MIME type of the image file.
 * @param {(Blob)=> void} blob_callback - This function is called with the blob, or may never be called if there is an error.
 */
function write_image_file(canvas, mime_type, blob_callback) {
	const ctx = canvas.getContext("2d");
	const bmp_match = mime_type.match(/^image\/(?:x-)?bmp\s*(?:-(\d+)bpp)?/);
	if (bmp_match) {
		const file_content = encodeBMP(
			ctx.getImageData(0, 0, canvas.width, canvas.height),
			parseInt(bmp_match[1] || "24", 10),
		);
		const blob = new Blob([file_content]);
		sanity_check_blob(blob, () => {
			blob_callback(blob);
		});
	} else if (mime_type === "image/png") {
		// UPNG.js gives better compressed PNGs than the built-in browser PNG encoder
		// In fact you can use it as a minifier! http://upng.photopea.com/
		const image_data = ctx.getImageData(0, 0, canvas.width, canvas.height);
		const array_buffer = UPNG.encode(
			[image_data.data.buffer],
			image_data.width,
			image_data.height,
		);
		const blob = new Blob([array_buffer]);
		sanity_check_blob(blob, () => {
			blob_callback(blob);
		});
	} else if (mime_type === "image/tiff") {
		const image_data = ctx.getImageData(0, 0, canvas.width, canvas.height);
		const metadata = {
			t305: ["jspaint (UTIF.js)"],
		};
		const array_buffer = UTIF.encodeImage(
			image_data.data.buffer,
			image_data.width,
			image_data.height,
			metadata,
		);
		const blob = new Blob([array_buffer]);
		sanity_check_blob(blob, () => {
			blob_callback(blob);
		});
	} else {
		canvas.toBlob((blob) => {
			// Note: could check blob.type (mime type) instead
			const png_magic_bytes = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
			sanity_check_blob(
				blob,
				() => {
					blob_callback(blob);
				},
				png_magic_bytes,
				mime_type === "image/png",
			);
		}, mime_type);
	}
}

/**
 * @param {Blob} blob
 * @param {(error: Error|null, result?: ImageInfo) => void} callback
 */
function read_image_file(blob, callback) {
	// @TODO: handle SVG (might need to keep track of source URL, for relative resources)
	// @TODO: read palette from GIF files

	console.log("이미지 읽어오기!");

	let file_format;
	let palette;
	let monochrome = false;

	blob.arrayBuffer().then(
		(arrayBuffer) => {
			// Helpers:
			// "GIF".split("").map(c=>"0x"+c.charCodeAt(0).toString("16")).join(", ")
			// [0x47, 0x49, 0x46].map(c=>String.fromCharCode(c)).join("")
			const magics = {
				png: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
				bmp: [0x42, 0x4d], // "BM" in ASCII
				jpeg: [0xff, 0xd8, 0xff],
				gif: [0x47, 0x49, 0x46, 0x38], // "GIF8" in ASCII, fully either "GIF87a" or "GIF89a"
				webp: [0x57, 0x45, 0x42, 0x50], // "WEBP" in ASCII
				tiff_be: [0x4d, 0x4d, 0x0, 0x2a],
				tiff_le: [0x49, 0x49, 0x2a, 0x0],
				ico: [0x00, 0x00, 0x01, 0x00],
				cur: [0x00, 0x00, 0x02, 0x00],
				icns: [0x69, 0x63, 0x6e, 0x73], // "icns" in ASCII
			};
			const file_bytes = new Uint8Array(arrayBuffer);
			let detected_type_id;
			for (const [type_id, magic_bytes] of Object.entries(magics)) {
				const magic_found = magic_bytes.every(
					(byte, index) => byte === file_bytes[index],
				);
				if (magic_found) {
					detected_type_id = type_id;
				}
			}
			if (!detected_type_id) {
				if (
					String.fromCharCode(...file_bytes.slice(0, 1024)).includes("%PDF")
				) {
					detected_type_id = "pdf";
				}
			}
			if (detected_type_id === "bmp") {
				const { colorTable, bitsPerPixel, imageData } = decodeBMP(arrayBuffer);
				file_format =
					bitsPerPixel === 24 ? "image/bmp" : `image/bmp;bpp=${bitsPerPixel}`;
				if (colorTable.length >= 2) {
					palette = colorTable.map(
						(color) => `rgb(${color.r}, ${color.g}, ${color.b})`,
					);
					monochrome = false;
				}
				// if (bitsPerPixel !== 32 && bitsPerPixel !== 16) {
				// 	for (let i = 3; i < imageData.data.length; i += 4) {
				// 		imageData.data[i] = 255;
				// 	}
				// }
				callback(null, {
					file_format,
					monochrome,
					palette,
					image_data: imageData,
					source_blob: blob,
				});
			} else if (detected_type_id === "png") {
				const decoded = UPNG.decode(arrayBuffer);
				const rgba = UPNG.toRGBA8(decoded)[0];
				const { width, height, tabs, ctype } = decoded;
				// If it's a palettized PNG, load the palette for the Colors box.
				// Note: PLTE (palette) chunk must be present for palettized PNGs,
				// but can also be present as a recommended set of colors in true-color mode.
				// tRNs (transparency) chunk can provide alpha data associated with each color in the PLTE chunk.
				// It may contain as many transparency entries as there are palette entries, or as few as one.
				// tRNS chunk can also be used to specify a single color to be considered fully transparent in true-color mode.
				if (
					tabs.PLTE &&
					tabs.PLTE.length >= 3 * 2 &&
					ctype === 3 /* palettized */
				) {
					palette = new Array(tabs.PLTE.length / 3);
					for (let i = 0; i < palette.length; i++) {
						if (tabs.tRNS && tabs.tRNS.length >= i + 1) {
							palette[i] =
								`rgba(${tabs.PLTE[i * 3 + 0]}, ${tabs.PLTE[i * 3 + 1]}, ${tabs.PLTE[i * 3 + 2]}, ${tabs.tRNS[i] / 255})`;
						} else {
							palette[i] =
								`rgb(${tabs.PLTE[i * 3 + 0]}, ${tabs.PLTE[i * 3 + 1]}, ${tabs.PLTE[i * 3 + 2]})`;
						}
					}
					monochrome = false;
				}
				file_format = "image/png";
				const image_data = new ImageData(
					new Uint8ClampedArray(rgba),
					width,
					height,
				);
				callback(null, {
					file_format,
					monochrome,
					palette,
					image_data,
					source_blob: blob,
				});
			} else if (
				detected_type_id === "tiff_be" ||
				detected_type_id === "tiff_le"
			) {
				// IFDs = image file directories
				// VSNs = ???
				// This code is based on UTIF.bufferToURI
				var ifds = UTIF.decode(arrayBuffer);
				//console.log(ifds);
				var vsns = ifds,
					ma = 0,
					page = vsns[0];
				if (ifds[0].subIFD) {
					vsns = vsns.concat(ifds[0].subIFD);
				}
				for (var i = 0; i < vsns.length; i++) {
					var img = vsns[i];
					if (img["t258"] == null || img["t258"].length < 3) continue;
					var ar = img["t256"] * img["t257"];
					if (ar > ma) {
						ma = ar;
						page = img;
					}
				}
				UTIF.decodeImage(arrayBuffer, page, ifds);
				var rgba = UTIF.toRGBA8(page);

				var image_data = new ImageData(
					new Uint8ClampedArray(rgba.buffer),
					page.width,
					page.height,
				);

				file_format = "image/tiff";
				callback(null, {
					file_format,
					monochrome,
					palette,
					image_data,
					source_blob: blob,
				});
			} else if (detected_type_id === "pdf") {
				// file_format = "application/pdf";
				// pdfjs.GlobalWorkerOptions.workerSrc = "lib/pdf.js/build/pdf.worker.js";
				// const file_bytes = new Uint8Array(arrayBuffer);
				// const loadingTask = pdfjs.getDocument({
				// 	data: file_bytes,
				// 	cMapUrl: "lib/pdf.js/web/cmaps/",
				// 	cMapPacked: true,
				// });
				// loadingTask.promise.then((pdf) => {
				// 	console.log("PDF loaded");
				// 	// Fetch the first page
				// 	// TODO: maybe concatenate all pages into one image?
				// 	var pageNumber = 1;
				// 	pdf.getPage(pageNumber).then((page) => {
				// 		console.log("Page loaded");
				// 		var scale = 1.5;
				// 		var viewport = page.getViewport({ scale });
				// 		// Prepare canvas using PDF page dimensions
				// 		var canvas = make_canvas(viewport.width, viewport.height);
				// 		// Render PDF page into canvas context
				// 		var renderContext = {
				// 			canvasContext: canvas.ctx,
				// 			viewport,
				// 		};
				// 		var renderTask = page.render(renderContext);
				// 		renderTask.promise.then(() => {
				// 			console.log("Page rendered");
				// 			const image_data = canvas.ctx.getImageData(0, 0, canvas.width, canvas.height);
				// 			callback(null, { file_format, monochrome, palette, image_data, source_blob: blob });
				// 		});
				// 	});
				// }, (reason) => {
				// 	callback(new Error(`Failed to load PDF. ${reason}`));
				// });
			} else {
				monochrome = false;
				file_format =
					{
						// bmp: "image/bmp",
						png: "image/png",
						webp: "image/webp",
						jpeg: "image/jpeg",
						gif: "image/gif",
						tiff_be: "image/tiff",
						tiff_le: "image/tiff", // can also be image/x-canon-cr2 etc.
						ico: "image/x-icon",
						cur: "image/x-win-bitmap",
						icns: "image/icns",
					}[detected_type_id] || blob.type;

				const blob_uri = URL.createObjectURL(blob);
				const img = new Image();
				// img.crossOrigin = "Anonymous";
				const handle_decode_fail = () => {
					URL.revokeObjectURL(blob_uri);
					blob.text().then(
						(file_text) => {
							const error = new Error("failed to decode blob as an image");
							// @ts-ignore
							error.code = file_text.match(/^\s*<!doctype\s+html/i)
								? "html-not-image"
								: "decoding-failure";
							callback(error);
						},
						(_err) => {
							const error = new Error("failed to decode blob as image or text");
							// @ts-ignore
							error.code = "decoding-failure";
							callback(error);
						},
					);
				};
				img.onload = () => {
					URL.revokeObjectURL(blob_uri);
					if (
						!img.complete ||
						typeof img.naturalWidth == "undefined" ||
						img.naturalWidth === 0
					) {
						handle_decode_fail();
						return;
					}
					callback(null, {
						file_format,
						monochrome,
						palette,
						image: img,
						source_blob: blob,
					});
				};
				img.onerror = handle_decode_fail;
				img.src = blob_uri;
			}
		},
		(error) => {
			callback(error);
		},
	);
}

async function readImageFile(blob) {
	console.log("이미지 읽어오기!");

	let file_format;
	let palette;
	let monochrome = false;

	try {
		const arrayBuffer = await blob.arrayBuffer();
		const magics = {
			png: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
			bmp: [0x42, 0x4d], // "BM" in ASCII
			jpeg: [0xff, 0xd8, 0xff],
			gif: [0x47, 0x49, 0x46, 0x38], // "GIF8" in ASCII, fully either "GIF87a" or "GIF89a"
			webp: [0x57, 0x45, 0x42, 0x50], // "WEBP" in ASCII
			tiff_be: [0x4d, 0x4d, 0x0, 0x2a],
			tiff_le: [0x49, 0x49, 0x2a, 0x0],
			ico: [0x00, 0x00, 0x01, 0x00],
			cur: [0x00, 0x00, 0x02, 0x00],
			icns: [0x69, 0x63, 0x6e, 0x73], // "icns" in ASCII
		};
		const file_bytes = new Uint8Array(arrayBuffer);
		let detected_type_id;

		for (const [type_id, magic_bytes] of Object.entries(magics)) {
			const magic_found = magic_bytes.every(
				(byte, index) => byte === file_bytes[index],
			);
			if (magic_found) {
				detected_type_id = type_id;
				break;
			}
		}

		if (!detected_type_id) {
			const firstChunk = String.fromCharCode(...file_bytes.slice(0, 1024));
			if (firstChunk.includes("%PDF")) {
				detected_type_id = "pdf";
			}
		}

		if (detected_type_id === "bmp") {
			const { colorTable, bitsPerPixel, imageData } = decodeBMP(arrayBuffer);
			file_format =
				bitsPerPixel === 24 ? "image/bmp" : `image/bmp;bpp=${bitsPerPixel}`;
			if (colorTable.length >= 2) {
				palette = colorTable.map(
					(color) => `rgb(${color.r}, ${color.g}, ${color.b})`,
				);
				monochrome = false;
			}
			return {
				file_format,
				monochrome,
				palette,
				image_data: imageData,
				source_blob: blob,
			};
		} else if (detected_type_id === "png") {
			const decoded = UPNG.decode(arrayBuffer);
			const rgba = UPNG.toRGBA8(decoded)[0];
			const { width, height, tabs, ctype } = decoded;

			if (
				tabs.PLTE &&
				tabs.PLTE.length >= 3 * 2 &&
				ctype === 3 /* palettized */
			) {
				palette = new Array(tabs.PLTE.length / 3);
				for (let i = 0; i < palette.length; i++) {
					if (tabs.tRNS && tabs.tRNS.length >= i + 1) {
						palette[i] =
							`rgba(${tabs.PLTE[i * 3 + 0]}, ${tabs.PLTE[i * 3 + 1]}, ${tabs.PLTE[i * 3 + 2]}, ${tabs.tRNS[i] / 255})`;
					} else {
						palette[i] =
							`rgb(${tabs.PLTE[i * 3 + 0]}, ${tabs.PLTE[i * 3 + 1]}, ${tabs.PLTE[i * 3 + 2]})`;
					}
				}
				monochrome = false;
			}
			file_format = "image/png";
			const image_data = new ImageData(
				new Uint8ClampedArray(rgba),
				width,
				height,
			);
			return {
				file_format,
				monochrome,
				palette,
				image_data,
				source_blob: blob,
			};
		} else if (
			detected_type_id === "tiff_be" ||
			detected_type_id === "tiff_le"
		) {
			var ifds = UTIF.decode(arrayBuffer);
			var vsns = ifds,
				ma = 0,
				page = vsns[0];
			if (ifds[0].subIFD) {
				vsns = vsns.concat(ifds[0].subIFD);
			}
			for (var i = 0; i < vsns.length; i++) {
				var img = vsns[i];
				if (img["t258"] == null || img["t258"].length < 3) continue;
				var ar = img["t256"] * img["t257"];
				if (ar > ma) {
					ma = ar;
					page = img;
				}
			}
			UTIF.decodeImage(arrayBuffer, page, ifds);
			var rgba = UTIF.toRGBA8(page);

			var image_data = new ImageData(
				new Uint8ClampedArray(rgba.buffer),
				page.width,
				page.height,
			);

			file_format = "image/tiff";
			return {
				file_format,
				monochrome,
				palette,
				image_data,
				source_blob: blob,
			};
		} else if (detected_type_id === "pdf") {
			// PDF 처리 로직은 현재 주석 처리되어 있습니다.
			throw new Error("PDF 처리 기능은 현재 구현되지 않았습니다.");
		} else {
			monochrome = false;
			file_format =
				{
					png: "image/png",
					webp: "image/webp",
					jpeg: "image/jpeg",
					gif: "image/gif",
					tiff_be: "image/tiff",
					tiff_le: "image/tiff", // can also be image/x-canon-cr2 etc.
					ico: "image/x-icon",
					cur: "image/x-win-bitmap",
					icns: "image/icns",
				}[detected_type_id] || blob.type;

			const blob_uri = URL.createObjectURL(blob);
			const img = new Image();

			// 이미지 로딩을 Promise로 래핑
			const loadImage = () => {
				return new Promise((resolve, reject) => {
					img.onload = () => {
						if (
							!img.complete ||
							typeof img.naturalWidth === "undefined" ||
							img.naturalWidth === 0
						) {
							reject(new Error("이미지 로드 실패"));
						} else {
							resolve(img);
						}
					};
					img.onerror = () => {
						reject(new Error("이미지 로드 중 에러 발생"));
					};
				});
			};

			img.src = blob_uri;

			try {
				const loadedImg = await loadImage();
				URL.revokeObjectURL(blob_uri);
				return {
					file_format,
					monochrome,
					palette,
					image: loadedImg,
					source_blob: blob,
				};
			} catch (error) {
				URL.revokeObjectURL(blob_uri);
				// 추가적인 에러 처리를 위해 Blob을 텍스트로 변환 시도
				try {
					const file_text = await blob.text();
					const err = new Error("이미지 디코딩 실패");
					err.code = file_text.match(/^\s*<!doctype\s+html/i)
						? "html-not-image"
						: "decoding-failure";
					throw err;
				} catch (_err) {
					const err = new Error("이미지 또는 텍스트로 디코딩 실패");
					err.code = "decoding-failure";
					throw err;
				}
			}
		}
	} catch (error) {
		// 에러 발생 시 다시 던지기
		throw error;
	}
}

/**
 * Updates the canvas to reflect reductions in color when saving to certain file formats.
 * @param {Blob} blob - The saved file blob.
 */
function update_from_saved_file(blob) {
	read_image_file(blob, (error, info) => {
		if (error) {
			show_error_message(
				"The file has been saved, however... " +
					localize("Paint cannot read this file."),
				error,
			);
			return;
		}
		//	apply_file_format_and_palette_info(info);
		const format = image_formats.find(
			({ mimeType }) => mimeType === info.file_format,
		);
		undoable(
			{
				name: `${localize("Save As")} ${format ? format.name : info.file_format}`,
				icon: get_help_folder_icon("p_save.png"),
			},
			() => {
				drawcopy(PaintJSState.main_ctx, info.image || info.image_data);
			},
		);
	});
}

function save_selection_to_file() {
	if (PaintJSState.selection && PaintJSState.selection.canvas) {
		systemHooks.showSaveFileDialog({
			dialogTitle: localize("Save As"),
			defaultFileName: "selection.png",
			defaultFileFormatID: "image/png",
			formats: image_formats,
			getBlob: (new_file_type) => {
				return new Promise((resolve) => {
					write_image_file(
						PaintJSState.selection.canvas,
						new_file_type,
						(blob) => {
							resolve(blob);
						},
					);
				});
			},
		});
	}
}

/**
 * @param {Blob} blob
 * @param {() => void} okay_callback
 * @param {number[]} [magic_number_bytes]
 * @param {boolean} [magic_wanted]
 */
function sanity_check_blob(
	blob,
	okay_callback,
	magic_number_bytes,
	magic_wanted = true,
) {
	if (blob.size > 0) {
		if (magic_number_bytes) {
			blob.arrayBuffer().then(
				(arrayBuffer) => {
					const file_bytes = new Uint8Array(arrayBuffer);
					const magic_found = magic_number_bytes.every(
						(byte, index) => byte === file_bytes[index],
					);
					// console.log(file_bytes, magic_number_bytes, magic_found, magic_wanted);
					if (magic_found === magic_wanted) {
						okay_callback();
					} else {
						showMessageBox({
							// hackily combining messages that are already localized, in ways they were not meant to be used.
							// you may have to do some deduction to understand this message.
							// messageHTML: `
							// 	<p>${localize("Unexpected file format.")}</p>
							// 	<p>${localize("An unsupported operation was attempted.")}</p>
							// `,
							message: window.is_electron_app
								? "Writing images in this file format is not supported."
								: "Your browser does not support writing images in this file format.",
							iconID: "error",
						});
					}
				},
				(error) => {
					show_error_message(localize("An unknown error has occurred."), error);
				},
			);
		} else {
			okay_callback();
		}
	} else {
		show_error_message(localize("Failed to save document."));
	}
}

export {
	are_you_sure,
	choose_file_to_paste,
	cleanup_bitmap_view,
	clear,
	confirm_overwrite_capability,
	delete_selection,
	deselect,
	edit_copy,
	edit_cut,
	edit_paste,
	exit_fullscreen_if_ios,
	file_new,
	file_open,
	file_print,
	file_save,
	file_save_as,
	getSelectionText,
	get_tool_by_id,
	get_uris,
	handle_keyshortcuts,
	image_attributes,
	//image_flip_and_rotate,
	image_invert_colors,
	//image_stretch_and_skew,
	load_image_from_uri,
	meld_selection_into_canvas,
	open_from_file,
	open_from_image_info,
	paste,
	paste_image_from_file,
	please_enter_a_number,
	read_image_file,
	render_canvas_view,
	reset_file,
	reset_selected_colors,
	resize_canvas_and_save_dimensions,
	resize_canvas_without_saving_dimensions,
	sanity_check_blob,
	//save_as_prompt,
	save_selection_to_file,
	select_all,
	select_tool,
	set_magnification,
	//show_convert_to_black_and_white,
	show_error_message,
	show_file_format_errors,
	show_resource_load_error_message,
	try_exec_command,
	update_canvas_rect,
	update_css_classes_for_conditional_messages,
	update_disable_aa,
	update_from_saved_file,
	update_helper_layer,
	update_helper_layer_immediately,
	update_magnified_canvas_size,
	update_title,
	view_bitmap,
	write_image_file,
};
