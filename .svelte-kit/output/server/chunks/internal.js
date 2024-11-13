import { c as create_ssr_component, a as setContext, v as validate_component, m as missing_component } from "./ssr.js";
let base = "";
let assets = base;
const initial = { base, assets };
function reset() {
  base = initial.base;
  assets = initial.assets;
}
function set_assets(path) {
  assets = initial.assets = path;
}
let public_env = {};
function set_private_env(environment) {
}
function set_public_env(environment) {
  public_env = environment;
}
function afterUpdate() {
}
function set_building() {
}
const Root = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let { stores } = $$props;
  let { page } = $$props;
  let { constructors } = $$props;
  let { components = [] } = $$props;
  let { form } = $$props;
  let { data_0 = null } = $$props;
  let { data_1 = null } = $$props;
  {
    setContext("__svelte__", stores);
  }
  afterUpdate(stores.page.notify);
  if ($$props.stores === void 0 && $$bindings.stores && stores !== void 0)
    $$bindings.stores(stores);
  if ($$props.page === void 0 && $$bindings.page && page !== void 0)
    $$bindings.page(page);
  if ($$props.constructors === void 0 && $$bindings.constructors && constructors !== void 0)
    $$bindings.constructors(constructors);
  if ($$props.components === void 0 && $$bindings.components && components !== void 0)
    $$bindings.components(components);
  if ($$props.form === void 0 && $$bindings.form && form !== void 0)
    $$bindings.form(form);
  if ($$props.data_0 === void 0 && $$bindings.data_0 && data_0 !== void 0)
    $$bindings.data_0(data_0);
  if ($$props.data_1 === void 0 && $$bindings.data_1 && data_1 !== void 0)
    $$bindings.data_1(data_1);
  let $$settled;
  let $$rendered;
  let previous_head = $$result.head;
  do {
    $$settled = true;
    $$result.head = previous_head;
    {
      stores.page.set(page);
    }
    $$rendered = `  ${constructors[1] ? `${validate_component(constructors[0] || missing_component, "svelte:component").$$render(
      $$result,
      { data: data_0, this: components[0] },
      {
        this: ($$value) => {
          components[0] = $$value;
          $$settled = false;
        }
      },
      {
        default: () => {
          return `${validate_component(constructors[1] || missing_component, "svelte:component").$$render(
            $$result,
            { data: data_1, form, this: components[1] },
            {
              this: ($$value) => {
                components[1] = $$value;
                $$settled = false;
              }
            },
            {}
          )}`;
        }
      }
    )}` : `${validate_component(constructors[0] || missing_component, "svelte:component").$$render(
      $$result,
      { data: data_0, form, this: components[0] },
      {
        this: ($$value) => {
          components[0] = $$value;
          $$settled = false;
        }
      },
      {}
    )}`} ${``}`;
  } while (!$$settled);
  return $$rendered;
});
const options = {
  app_template_contains_nonce: false,
  csp: { "mode": "auto", "directives": { "upgrade-insecure-requests": false, "block-all-mixed-content": false }, "reportOnly": { "upgrade-insecure-requests": false, "block-all-mixed-content": false } },
  csrf_check_origin: true,
  track_server_fetches: false,
  embedded: false,
  env_public_prefix: "PUBLIC_",
  env_private_prefix: "",
  hooks: null,
  // added lazily, via `get_hooks`
  preload_strategy: "modulepreload",
  root: Root,
  service_worker: false,
  templates: {
    app: ({ head, body, assets: assets2, nonce, env }) => '<!DOCTYPE html>\n<html lang="en">\n  <head>\n    <meta charset="utf-8" />\n    <link rel="icon" href="' + assets2 + `/favicon.png" />
    <meta name="viewport" content="width=device-width" />
    <head>
      <meta charset="utf-8" />
      <title>JS Paint</title>

   

      <!-- <link href="styles/normalize.css" rel="stylesheet" type="text/css" />
      <link
        href="styles/layout.css"
        class="flippable-layout-stylesheet"
        rel="stylesheet"
        type="text/css"
      />
      <link
        href="styles/print.css"
        rel="stylesheet"
        type="text/css"
        media="print"
      />
      <link
        href="lib/os-gui/build/layout.css"
        class="flippable-layout-stylesheet"
        rel="stylesheet"
        type="text/css"
      /> -->
      <!-- <link href="lib/os-gui/build/windows-98.css" rel="stylesheet" type="text/css"> -->
      <!-- <link href="lib/os-gui/build/windows-default.css" rel="stylesheet" type="text/css" title="Windows Default"> -->
      <!-- <link href="lib/os-gui/build/peggys-pastels.css" rel="alternate stylesheet" type="text/css" title="Peggy's Pastels"> -->
      <!-- <link
        href="lib/tracky-mouse/core/tracky-mouse.css"
        rel="stylesheet"
        type="text/css"
      /> -->
      <!--
      @TODO: bring these styles into OS-GUI.
      This is a custom build of 98.css https://github.com/jdan/98.css
      for checkboxes, radio buttons, sliders, and fieldsets,
      excluding e.g. scrollbars, buttons, and windows (already in OS-GUI),
      and integrating with the theme CSS vars used by OS-GUI,
      and with some RTLCSS tweaks.
      Text inputs and dropdowns are styled in classic.css, but should also be included in OS-GUI at some point.
      This is not an @import in classic.css because it needs RTLCSS and I'm not applying RTLCSS to themes yet.
      So I added .not-for-modern logic to theme.js to exclude these styles depending on the theme.
    -->
      <!-- <link
        href="lib/98.css/98.custom-build.css"
        class="flippable-layout-stylesheet not-for-modern"
        rel="stylesheet"
        type="text/css"
      />
 -->


      <!-- 모던 css -->
      <!-- <link
        href="styles/themes/modern.css"
        rel="stylesheet"
        type="text/css"
      /> -->

      <link rel="apple-touch-icon" href="images/icons/apple-icon-180x180.png" />
      <!-- Chrome will pick the largest image for some reason, instead of the most appropriate one. -->
      <!-- <link rel="icon" type="image/png" sizes="192x192" href="images/icons/192x192.png">
      <link rel="icon" type="image/png" sizes="32x32" href="images/icons/32x32.png">
      <link rel="icon" type="image/png" sizes="96x96" href="images/icons/96x96.png"> -->
      <!-- <link rel="icon" type="image/png" sizes="16x16" href="images/icons/16x16.png"> -->
      <link rel="shortcut icon" href="favicon.ico" />
      <link
        rel="mask-icon"
        href="images/icons/safari-pinned-tab.svg"
        color="red"
      />
      <!-- <link rel="manifest" href="manifest.webmanifest" /> -->
      <meta name="msapplication-TileColor" content="#008080" />
      <meta
        name="msapplication-TileImage"
        content="images/icons/ms-icon-144x144.png"
      />
      <meta name="theme-color" content="#000080" />

      <meta name="viewport" content="width=device-width, user-scalable=no" />

      <meta
        name="description"
        content="Classic MS Paint in the browser, with extra features"
      />
      <meta property="og:image:width" content="279" />
      <meta property="og:image:height" content="279" />
      <meta
        property="og:description"
        content="Classic MS Paint in the browser, with extra features."
      />
      <meta property="og:title" content="JS Paint" />
      <meta property="og:url" content="https://jspaint.app" />
      <meta
        property="og:image"
        content="https://jspaint.app/images/icons/og-image-279x279.jpg"
      />
      <meta name="twitter:title" content="JS Paint" />
      <meta
        name="twitter:description"
        content="Classic MS Paint in the browser, with extra features"
      />
      <meta
        name="twitter:image"
        content="https://jspaint.app/images/meta/twitter-card-plz-no-crop.png"
      />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@isaiahodhner" />
      <meta name="twitter:creator" content="@isaiahodhner" />

      <script  type="module" src="src/error-handling-basic.js"><\/script>
    </head>
    
    ` + head + '\n  </head>\n\n  \n  <body data-sveltekit-preload-data="hover">\n    <script type="module" src="lib/jquery-3.4.1.min.js"><\/script>\n    \n\n    <script type="module" src="src/app-localization.js"><\/script>\n\n      <script type="module" src="src/before_status.js"><\/script>\n    \n      <script type="module" src="src/error-handling-enhanced.js"><\/script>\n    \n      <script type="module" src="src/app.js"><\/script>\n      <script type="module" src="src/sessions.js"><\/script>\n    \n    <div style="height:100%">' + body + "</div>\n  </body>\n</html>\n",
    error: ({ status, message }) => '<!doctype html>\n<html lang="en">\n	<head>\n		<meta charset="utf-8" />\n		<title>' + message + `</title>

		<style>
			body {
				--bg: white;
				--fg: #222;
				--divider: #ccc;
				background: var(--bg);
				color: var(--fg);
				font-family:
					system-ui,
					-apple-system,
					BlinkMacSystemFont,
					'Segoe UI',
					Roboto,
					Oxygen,
					Ubuntu,
					Cantarell,
					'Open Sans',
					'Helvetica Neue',
					sans-serif;
				display: flex;
				align-items: center;
				justify-content: center;
				height: 100vh;
				margin: 0;
			}

			.error {
				display: flex;
				align-items: center;
				max-width: 32rem;
				margin: 0 1rem;
			}

			.status {
				font-weight: 200;
				font-size: 3rem;
				line-height: 1;
				position: relative;
				top: -0.05rem;
			}

			.message {
				border-left: 1px solid var(--divider);
				padding: 0 0 0 1rem;
				margin: 0 0 0 1rem;
				min-height: 2.5rem;
				display: flex;
				align-items: center;
			}

			.message h1 {
				font-weight: 400;
				font-size: 1em;
				margin: 0;
			}

			@media (prefers-color-scheme: dark) {
				body {
					--bg: #222;
					--fg: #ddd;
					--divider: #666;
				}
			}
		</style>
	</head>
	<body>
		<div class="error">
			<span class="status">` + status + '</span>\n			<div class="message">\n				<h1>' + message + "</h1>\n			</div>\n		</div>\n	</body>\n</html>\n"
  },
  version_hash: "zgmi6z"
};
function get_hooks() {
  return {};
}
export {
  assets as a,
  base as b,
  set_public_env as c,
  set_assets as d,
  set_building as e,
  get_hooks as g,
  options as o,
  public_env as p,
  reset as r,
  set_private_env as s
};
