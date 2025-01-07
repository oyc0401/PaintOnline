console.log('JS 실행:','color-data.js')
// @ts-check

const default_palette = [
	"rgb(0,0,0)", // Black
	"rgb(128,128,128)", // Dark Gray
	"rgb(128,0,0)", // Dark Red
	"rgb(128,128,0)", // Pea Green
	"rgb(0,128,0)", // Dark Green
	"rgb(0,128,128)", // Slate
	"rgb(0,0,128)", // Dark Blue
	"rgb(128,0,128)", // Lavender
	"rgb(128,128,64)", //
	"rgb(0,64,64)", //
	"rgb(0,128,255)", //
	"rgb(0,64,128)", //
	"rgb(64,0,255)", //
	"rgb(128,64,0)", //
	"rgb(128,64,0,0.1)", // tranparent
	"rgb(128,64,0,0.2)", // tranparent
	
	"rgb(255,255,255)", // White
	"rgb(192,192,192)", // Light Gray
	"rgb(255,0,0)", // Bright Red
	"rgb(255,255,0)", // Yellow
	"rgb(0,255,0)", // Bright Green
	"rgb(0,255,255)", // Cyan
	"rgb(0,0,255)", // Bright Blue
	"rgb(255,0,255)", // Magenta
	"rgb(255,255,128)", //
	"rgb(0,255,128)", //
	"rgb(128,255,255)", //
	"rgb(128,128,255)", //
	"rgb(255,0,128)", //
	"rgb(255,128,64)", //
	"rgb(128,64,0,0.3)", // tranparent
	"rgb(128,64,0,0)", // tranparent
];

// https://github.com/kouzhudong/win2k/blob/ce6323f76d5cd7d136b74427dad8f94ee4c389d2/trunk/private/shell/win16/comdlg/color.c#L38-L43
// These are a fallback in case colors are not received from some driver.
// const default_basic_colors = [
// 	"#8080FF", "#80FFFF", "#80FF80", "#80FF00", "#FFFF80", "#FF8000", "#C080FF", "#FF80FF",
// 	"#0000FF", "#00FFFF", "#00FF80", "#40FF00", "#FFFF00", "#C08000", "#C08080", "#FF00FF",
// 	"#404080", "#4080FF", "#00FF00", "#808000", "#804000", "#FF8080", "#400080", "#8000FF",
// 	"#000080", "#0080FF", "#008000", "#408000", "#FF0000", "#A00000", "#800080", "#FF0080",
// 	"#000040", "#004080", "#004000", "#404000", "#800000", "#400000", "#400040", "#800040",
// 	"#000000", "#008080", "#408080", "#808080", "#808040", "#C0C0C0", "#400040", "#FFFFFF",
// ];
// Grabbed with Color Cop from the screen with Windows 98 SE running in VMWare
const basic_colors = [
	"#FF8080", "#FFFF80", "#80FF80", "#00FF80", "#80FFFF", "#0080FF", "#FF80C0", "#FF80FF",
	"#FF0000", "#FFFF00", "#80FF00", "#00FF40", "#00FFFF", "#0080C0", "#8080C0", "#FF00FF",
	"#804040", "#FF8040", "#00FF00", "#008080", "#004080", "#8080FF", "#800040", "#FF0080",
	"#800000", "#FF8000", "#008000", "#008040", "#0000FF", "#0000A0", "#800080", "#8000FF",
	"#400000", "#804000", "#004000", "#004040", "#000080", "#000040", "#400040", "#400080",
	"#000000", "#808000", "#808040", "#808080", "#408080", "#C0C0C0", "#400040", "#FFFFFF",
];
// Note: this array gets modified even though the reference to it is constant.
const custom_colors = [
	"#FFFFFF", "#FFFFFF", "#FFFFFF", "#FFFFFF", "#FFFFFF", "#FFFFFF", "#FFFFFF", "#FFFFFF",
	"#FFFFFF", "#FFFFFF", "#FFFFFF", "#FFFFFF", "#FFFFFF", "#FFFFFF", "#FFFFFF", "#FFFFFF",
];

const lerp = (a, b, b_ness) => a + (b - a) * b_ness;

const color_ramp = (num_colors, start_hsla, end_hsla) =>
	Array(num_colors).fill().map((_undefined, ramp_index, array) => {
		// TODO: should this use (array.length - 1)?
		const h = lerp(start_hsla[0], end_hsla[0], ramp_index / array.length);
		const s = lerp(start_hsla[1], end_hsla[1], ramp_index / array.length);
		const l = lerp(start_hsla[2], end_hsla[2], ramp_index / array.length);
		const a = lerp(start_hsla[3], end_hsla[3], ramp_index / array.length);
		return `hsla(${h}deg, ${s}%, ${l}%, ${a})`;
	});

/**
 * @returns {(string | CanvasPattern)[]}  A palette of colors and patterns for the Winter theme.
 */


export {
	basic_colors, custom_colors, default_palette
};
