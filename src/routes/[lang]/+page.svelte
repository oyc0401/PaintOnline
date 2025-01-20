<script>
  import Canvas from "./Canvas.svelte";
  import { onMount } from "svelte";
  import { Drawjs } from "$paint";
  import { i18n, localize } from "$src/localize/localize";
  import ToolsAbove from "./ToolsAbove.svelte";
  import ToolsBelow from "./ToolsBelow.svelte";
  import ToolsMenuHelper from "./ToolsMenuHelper.svelte";
  import Position from "./Position.svelte";
  import { setDrawjs } from "$store/paintStore";
  import { menuState } from "$store/menuState.svelte.js";

  let { data } = $props();
  const { lang } = data;
  i18n.lang = lang;

  const translations = {
    title: localize("Paint Online"),
    description: localize("easy paint tool"),
    ogTitle: localize("easy paint tool"),
    ogDescription: localize("this is modern easy paint tool!"),
  };

  const baseUrl = "https://paintonline365.com";

  onMount(async () => {
    const drawjs = new Drawjs();
    setDrawjs(drawjs);

    drawjs.onchangeHistory((undoLength, redoLength) => {
      menuState.undoLength = undoLength;
      menuState.redoLength = redoLength;
    });

    drawjs.onchangeLayer((newLayer) => {
      menuState.layers = newLayer.reverse();
      console.log("newLayer:", newLayer);
    });

    drawjs.onchangeMousePosition((active, position) => {
      menuState.position_mouse_active = active;
      menuState.position_mouse = position;
    });

    drawjs.onchangeCanvasPosition((active, position) => {
      menuState.position_canvas_active = active;
      menuState.position_canvas = position;
    });
    drawjs.onchangeObjectPosition((active, position) => {
      menuState.position_object_active = active;
      menuState.position_object = position;
    });

    await drawjs.create(".canvas-area");

    menuState.activeLayerId = drawjs.state.activeLayerId;
  console.log('menuState.activeLayerId',menuState.activeLayerId)
  });
</script>

<svelte:head>
  <title>{translations.title}</title>
  <meta name="description" content={translations.description} />
  <meta property="og:title" content={translations.ogTitle} />
  <meta property="og:description" content={translations.ogDescription} />
  <meta property="og:url" content="https://paintonline365.com" />
  <meta property="og:image:width" content="279" />
  <meta property="og:image:height" content="279" />
  <meta
    property="og:image"
    content="https://paintonline365.com/images/icons/og-image-279x279.jpg"
  />
  <link rel="canonical" href={`${baseUrl}/${lang}`} />
  <link rel="alternate" href={`${baseUrl}/en`} hreflang="en" />
  <link rel="alternate" href={`${baseUrl}/ko`} hreflang="ko" />
  <link rel="alternate" href={`${baseUrl}/ja`} hreflang="ja" />
  <link rel="alternate" href={baseUrl} hreflang="x-default" />
</svelte:head>

<div class="h-full flex flex-col">
  <ToolsMenuHelper></ToolsMenuHelper>
  <ToolsAbove></ToolsAbove>
  <Position />
  <Canvas></Canvas>
  <ToolsBelow></ToolsBelow>
</div>
