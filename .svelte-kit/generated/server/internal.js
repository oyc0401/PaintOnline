
import root from '../root.js';
import { set_building } from '__sveltekit/environment';
import { set_assets } from '__sveltekit/paths';
import { set_private_env, set_public_env } from '../../../node_modules/@sveltejs/kit/src/runtime/shared-server.js';

export const options = {
	app_template_contains_nonce: false,
	csp: {"mode":"auto","directives":{"upgrade-insecure-requests":false,"block-all-mixed-content":false},"reportOnly":{"upgrade-insecure-requests":false,"block-all-mixed-content":false}},
	csrf_check_origin: true,
	track_server_fetches: false,
	embedded: false,
	env_public_prefix: 'PUBLIC_',
	env_private_prefix: '',
	hooks: null, // added lazily, via `get_hooks`
	preload_strategy: "modulepreload",
	root,
	service_worker: false,
	templates: {
		app: ({ head, body, assets, nonce, env }) => "<!DOCTYPE html>\n<html lang=\"en\">\n  <head>\n    <meta charset=\"utf-8\" />\n    <link rel=\"icon\" href=\"" + assets + "/favicon.png\" />\n    <meta name=\"viewport\" content=\"width=device-width\" />\n    <head>\n      <meta charset=\"utf-8\" />\n      <title>JS Paint</title>\n\n\n      <link rel=\"apple-touch-icon\" href=\"images/icons/apple-icon-180x180.png\" />\n      <!-- Chrome will pick the largest image for some reason, instead of the most appropriate one. -->\n      <!-- <link rel=\"icon\" type=\"image/png\" sizes=\"192x192\" href=\"images/icons/192x192.png\">\n      <link rel=\"icon\" type=\"image/png\" sizes=\"32x32\" href=\"images/icons/32x32.png\">\n      <link rel=\"icon\" type=\"image/png\" sizes=\"96x96\" href=\"images/icons/96x96.png\"> -->\n      <!-- <link rel=\"icon\" type=\"image/png\" sizes=\"16x16\" href=\"images/icons/16x16.png\"> -->\n      <link rel=\"shortcut icon\" href=\"favicon.ico\" />\n      <link\n        rel=\"mask-icon\"\n        href=\"images/icons/safari-pinned-tab.svg\"\n        color=\"red\"\n      />\n      <!-- <link rel=\"manifest\" href=\"manifest.webmanifest\" /> -->\n      <meta name=\"msapplication-TileColor\" content=\"#008080\" />\n      <meta\n        name=\"msapplication-TileImage\"\n        content=\"images/icons/ms-icon-144x144.png\"\n      />\n      <meta name=\"theme-color\" content=\"#000080\" />\n\n      <meta name=\"viewport\" content=\"width=device-width, user-scalable=no\" />\n\n      <meta\n        name=\"description\"\n        content=\"Classic MS Paint in the browser, with extra features\"\n      />\n      <meta property=\"og:image:width\" content=\"279\" />\n      <meta property=\"og:image:height\" content=\"279\" />\n      <meta\n        property=\"og:description\"\n        content=\"Classic MS Paint in the browser, with extra features.\"\n      />\n      <meta property=\"og:title\" content=\"JS Paint\" />\n      <meta property=\"og:url\" content=\"https://jspaint.app\" />\n      <meta\n        property=\"og:image\"\n        content=\"https://jspaint.app/images/icons/og-image-279x279.jpg\"\n      />\n      <meta name=\"twitter:title\" content=\"JS Paint\" />\n      <meta\n        name=\"twitter:description\"\n        content=\"Classic MS Paint in the browser, with extra features\"\n      />\n      <meta\n        name=\"twitter:image\"\n        content=\"https://jspaint.app/images/meta/twitter-card-plz-no-crop.png\"\n      />\n      <meta name=\"twitter:card\" content=\"summary_large_image\" />\n      <meta name=\"twitter:site\" content=\"@isaiahodhner\" />\n      <meta name=\"twitter:creator\" content=\"@isaiahodhner\" />\n\n    </head>\n    \n    " + head + "\n  </head>\n\n  \n  <body data-sveltekit-preload-data=\"hover\" oncontextmenu=\"return false\">\n    <script type=\"module\" src=\"lib/jquery-3.4.1.min.js\"></script>\n    <script type=\"module\" src=\"src/app-localization.js\"></script>\n    \n    <div style=\"height:100%\">" + body + "</div>\n  </body>\n</html>\n",
		error: ({ status, message }) => "<!doctype html>\n<html lang=\"en\">\n\t<head>\n\t\t<meta charset=\"utf-8\" />\n\t\t<title>" + message + "</title>\n\n\t\t<style>\n\t\t\tbody {\n\t\t\t\t--bg: white;\n\t\t\t\t--fg: #222;\n\t\t\t\t--divider: #ccc;\n\t\t\t\tbackground: var(--bg);\n\t\t\t\tcolor: var(--fg);\n\t\t\t\tfont-family:\n\t\t\t\t\tsystem-ui,\n\t\t\t\t\t-apple-system,\n\t\t\t\t\tBlinkMacSystemFont,\n\t\t\t\t\t'Segoe UI',\n\t\t\t\t\tRoboto,\n\t\t\t\t\tOxygen,\n\t\t\t\t\tUbuntu,\n\t\t\t\t\tCantarell,\n\t\t\t\t\t'Open Sans',\n\t\t\t\t\t'Helvetica Neue',\n\t\t\t\t\tsans-serif;\n\t\t\t\tdisplay: flex;\n\t\t\t\talign-items: center;\n\t\t\t\tjustify-content: center;\n\t\t\t\theight: 100vh;\n\t\t\t\tmargin: 0;\n\t\t\t}\n\n\t\t\t.error {\n\t\t\t\tdisplay: flex;\n\t\t\t\talign-items: center;\n\t\t\t\tmax-width: 32rem;\n\t\t\t\tmargin: 0 1rem;\n\t\t\t}\n\n\t\t\t.status {\n\t\t\t\tfont-weight: 200;\n\t\t\t\tfont-size: 3rem;\n\t\t\t\tline-height: 1;\n\t\t\t\tposition: relative;\n\t\t\t\ttop: -0.05rem;\n\t\t\t}\n\n\t\t\t.message {\n\t\t\t\tborder-left: 1px solid var(--divider);\n\t\t\t\tpadding: 0 0 0 1rem;\n\t\t\t\tmargin: 0 0 0 1rem;\n\t\t\t\tmin-height: 2.5rem;\n\t\t\t\tdisplay: flex;\n\t\t\t\talign-items: center;\n\t\t\t}\n\n\t\t\t.message h1 {\n\t\t\t\tfont-weight: 400;\n\t\t\t\tfont-size: 1em;\n\t\t\t\tmargin: 0;\n\t\t\t}\n\n\t\t\t@media (prefers-color-scheme: dark) {\n\t\t\t\tbody {\n\t\t\t\t\t--bg: #222;\n\t\t\t\t\t--fg: #ddd;\n\t\t\t\t\t--divider: #666;\n\t\t\t\t}\n\t\t\t}\n\t\t</style>\n\t</head>\n\t<body>\n\t\t<div class=\"error\">\n\t\t\t<span class=\"status\">" + status + "</span>\n\t\t\t<div class=\"message\">\n\t\t\t\t<h1>" + message + "</h1>\n\t\t\t</div>\n\t\t</div>\n\t</body>\n</html>\n"
	},
	version_hash: "109kqid"
};

export function get_hooks() {
	return {};
}

export { set_assets, set_building, set_private_env, set_public_env };
