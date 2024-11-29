<script>
  import Header from "./Header.svelte";
  import Canvas from "./Canvas.svelte";
  import Footer from "./Footer.svelte";

  import { onMount } from "svelte";
  import { menuState } from "../store/menuState.svelte.js";
  import { initState } from "../initState.js";
  import { initApp } from "../initApp.js";
  import { initSesstion } from "../initSesstion";
  import { PaintJS } from "../paint/main";
  import {PaintJSState} from '../paint/state';
  onMount(async () => {

    PaintJS.create();
    
    initState();

    initApp();

    initSesstion();
    
    // 아래껀 실험용
    menuState.undo = PaintJSState.undos;
    window.menuState = menuState;
  });
</script>

<svelte:head>
  <title>Home</title>
  <meta name="description" content="Svelte demo app" />
</svelte:head>

<div class="h-full flex flex-col">
  <Header></Header>

  <Canvas></Canvas>
  <Footer></Footer>
</div>
