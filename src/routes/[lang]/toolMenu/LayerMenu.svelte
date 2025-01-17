<script>
  import { menuState } from "$store/menuState.svelte.js";

  import LayerIcon from "$lib/images/layer.svelte";
  import CheckBoxBlankIcon from "$lib/images/check_box_blank.svelte";
  import CheckBoxIcon from "$lib/images/check_box.svelte";
  import AddIcon from "$lib/images/add.svelte";

  import { changeTool, quickClickMenu } from "$store/paintFunction.js";
  import "./menu.css";
  import "../toolsMenu.css";
  import { onMount } from "svelte";
  import { reaction } from "mobx";

  import { PaintJSState, PaintMobXState } from "$paint/state";

  import { getLayerIds } from "$paint/layer.js";

  let layersPreview = {};


  onMount(() => {
    reaction(
      () => PaintMobXState.layerIds, // 감시할 상태
       (newValue) => {
        console.log("변화!");
   
        layersPreview = [];

        for (let i = 0; i < PaintJSState.layers.length; i++) {
          const layer = PaintJSState.layers[i];

          if (!layersPreview[layer.layerId]) {
            const canvas = document.createElement("canvas");
            layersPreview[layer.layerId] = {
              id: layer.layerId,
              name: layer.name,
              canvas,
            };
          }
        }

        menuState.layerIds = newValue;
        window.layersPreview = layersPreview;
        console.log("newValue:", newValue);
        console.log("layersPreview", layersPreview);

      },
    );
  });

  function getLayerById(id) {
    for (let i = 0; i < PaintJSState.layers.length; i++) {
      const layer = PaintJSState.layers[i];
      if (layer.layerId == id) {
        return layer;
      }
    }
  }

  function drawPreviewCanvas(node, { id }) {
    //console.log("레이어 미리보기 그리기");
    console.log("그리기", node);
  
    const layer = getLayerById(id); 

    const preview_canvas = node;
    const preview_ctx = preview_canvas.getContext("2d");
 
    preview_canvas.width = layer.canvas.width;
    preview_canvas.height = layer.canvas.height;
    preview_ctx.drawImage(layer.canvas, 0, 0);

  }

  const MENU_NUMBER = 7;

</script>

<div>
  <button
    class="menu-button"
    class:selected-menu={menuState.toolMenuId === MENU_NUMBER}
    onclick={() => quickClickMenu(MENU_NUMBER)}
  >
    <LayerIcon />
  </button>

  {#if true || (menuState.showDropdown && menuState.dropdownId == MENU_NUMBER)}
    <div class="dropdown-area medium-dropdown menu-bottom-right">
      <div class="layer-menu">
        <div class="layer-header">
          <p class="px-3 text-medium">레이어</p>
          <button class="icon-button" onclick={drawPreviewCanvas}>
            <AddIcon />
          </button>
        </div>
        {#each menuState.layerIds as id}
          <div class="layer-box">
            <canvas
              {id}
              class="layer-image"
              use:drawPreviewCanvas={{ id }}
            ></canvas>
            <p class="layer-text">{id}</p>
            <button class="icon-button">
              <CheckBoxBlankIcon />
            </button>
          </div>
        {/each}
      </div>
    </div>
  {/if}
</div>

<style>
  .layer-menu {
    padding-left: 4px;
    padding-right: 4px;
    border-radius: 4px;
  }
  .layer-header {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    padding-top: 2px;
    padding-bottom: 2px;
  }

  .layer-box {
    display: flex;
    flex-direction: row;
    align-items: center;
    border-radius: 4px;
    background: #cde1ff;
    height: 88px;
    padding-top: 8px;
    padding-bottom: 8px;
    padding-left: 8px;
  }

  .layer-image {
    width: 90px;
    height: 72px;
    object-fit: fill;
  }

  .layer-text {
    font-size: 12px;
    color: #191919;
    padding-left: 12px;
    padding-right: 8px;
    flex: 1;
  }
  .icon-button {
    padding: 10px;
  }
</style>
