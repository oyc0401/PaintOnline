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
  import { addLayer} from "$paint/layer";
  
  // let layersPreview = {};

  let layers = [];

  onMount(() => {
    reaction(
      () => PaintMobXState.lastChanged, // 감시할 상태
      (newValue) => {
        menuState.lastChanged = newValue;
        layers = PaintJSState.layerStore;
        console.log("newValue:", newValue);
      },
    );
  });


  function clickLayer(id){
    PaintJSState.activeLayerId=id;
    console.log('select:',PaintJSState.layerObject[id])
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
          <button class="icon-button" onclick={()=>{addLayer()}}>
            <AddIcon />
          </button>
        </div>
        {#each layers as layer}
          <button class="layer-box" onclick={()=>{clickLayer(layer.layerId)}}>
            <img id={layer.layerId} class="layer-image" src={layer.url} />
            <p class="layer-text">{layer.name}</p>
            <div class="icon-button">
              <CheckBoxBlankIcon />
            </div>
          </button>
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
    width:100%;
    padding-top: 8px;
    padding-bottom: 8px;
    padding-left: 8px;
  }

  .layer-image {
    width: 90px;
    height: 72px;
    object-fit: cover;
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
