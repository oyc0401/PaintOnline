<script>
  import Header from "./Header.svelte";
  import Canvas from "./Canvas.svelte";
  import Footer from "./Footer.svelte";

  import { onMount } from "svelte";
  import { menuState } from "../store/menuState.svelte.js";
  import { PaintJS } from "$paint/main";
  import {PaintJSState} from '$paint/state';
  import { reaction , toJS} from 'mobx';
  
  onMount(async () => {

    PaintJS.create();

    console.log('undo:',toJS(PaintJSState.undos));
    

    // reaction(
    //     () => [PaintJSState.pointer.x, PaintJSState.pointer.y], // 감시할 상태
    //     ([x, y]) => {
    //        console.log(`pointer UI: (${x}, ${y})`)
    //     }
    // );

    // reaction(
    //     () => [PaintJSState.pointer.x, PaintJSState.pointer.y], // 감시할 상태
    //     ([x, y]) => {
    //        console.log(`pointer UI: (${x}, ${y})`)
    //     }
    // );

    //PaintJSState.pointer.x}, ${
    
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
