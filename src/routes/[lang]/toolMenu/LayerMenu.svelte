<script>
  import { menuState } from "$store/menuState.svelte.js";

  import LayerIcon from "$lib/images/layer.svelte";
  import CheckBoxBlankIcon from "$lib/images/check_box_blank.svelte";
  import CheckBoxIcon from "$lib/images/check_box.svelte";
  import AddIcon from "$lib/images/add.svelte";

 // import { quickClickMenu } from "$store/paintFunction.js";
  import "./menu.css";
  import "../toolsMenu.css";

  import { drawjs } from "$store/paintStore";

  function toggleLayerMenu(){
    menuState.showLayerMenu=!menuState.showLayerMenu;
  }
  function clickLayer(id) {
    drawjs.setLayer(id);
    menuState.activeLayerId = id;
  }

  function addLayer() {
    drawjs.addLayer();
  }

</script>

<div>
  <button
    class="menu-button"
    class:selected-menu={menuState.showLayerMenu}
    onclick={() => toggleLayerMenu()}
  >
    <LayerIcon />
  </button>

  <div
    class="dropdown-area medium-dropdown menu-bottom-right"
    class:hide={ !menuState.showLayerMenu }
  >
    <div class="layer-menu">
      <div class="layer-header">
        <p class="px-3 text-medium">레이어</p>
        <button
          class="icon-button"
          onclick={() => {
            addLayer();
          }}
        >
          <AddIcon />
        </button>
      </div>
      {#each menuState.layers as layer}
        <button
          class="layer-box"
          class:selected={layer.layerId == menuState.activeLayerId}
          onclick={() => {
            clickLayer(layer.layerId);
          }}
        >
          <img id={layer.layerId} class="layer-image" src={layer.url} />
          <p class="layer-text">{layer.name}</p>
          <div class="icon-button">
            <CheckBoxBlankIcon />
          </div>
        </button>
      {/each}
    </div>
  </div>
</div>

<style>
  .hide {
    display: none;
  }
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

    height: 88px;
    width: 100%;
    padding-top: 8px;
    padding-bottom: 8px;
    padding-left: 8px;
  }
  .selected {
    background: #cde1ff;
  }

  .layer-image {
    width: 90px;
    height: 72px;
    object-fit: cover;
    background-color: #aaaaaa;
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
