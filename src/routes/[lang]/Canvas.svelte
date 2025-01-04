<script>
  //let canvasList=[];

  import { onMount } from "svelte";
  import { PaintJSState } from "$paint/state";
  import { menuState } from "$store/menuState.svelte.js";
  import { reaction } from "mobx";
  // onMount(() => {
  //  reaction(
  //     () => PaintJSState.layerId.length,
  //     (newValue) => {
  //       menuState.position_mouse.x = newValue;
  //     },
  //   );
  // }

    
</script>

<div class="canvas-area">
  <!-- <canvas class="background-canvas"></canvas> -->
  <div class="layer-area">
    
  </div>
</div>

<style>
  .background-canvas {
    position: absolute;
    z-index: 1;
    background: url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACAQMAAABIeJ9nAAAABlBMVEW9vb3///8EwsWUAAAADElEQVQI12NoYHAAAAHEAMFJRSpJAAAAAElFTkSuQmCC")
      repeat;
    /* 16px is a common grid size, but that gives 8px grid cells, and our max zoom is 8x */
    /*background-size: 16px;*/
    background-size: 8px;
  }

  .layer-area{
    position: absolute;
    z-index: 0;
    width:800px;
    height: 600px;
  }
</style>
