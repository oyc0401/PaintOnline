<script>
  import {
    TOOL_ERASER,
  } from "$paint/src/tools";
  import EraserIcon from "$lib/images/eraser.png";

  import { menuState } from "$store/menuState.svelte.js";
  import { changeTool, openMenu } from "$store/paintFunction.js";
  import "./menu.css";
  import "../toolsMenu.css";
  const MENU_NUMBER = 5;
</script>

<div>
  <button
    class="menu-button"
    class:selected-menu={menuState.selectedMenuId === MENU_NUMBER}
    onclick={() => openMenu(MENU_NUMBER)}
  >
    <img src={EraserIcon} alt="eraser" />
  </button>

  {#if menuState.showMenu && menuState.selectedMenuId == MENU_NUMBER}
    <div class="menu-area menu-bottom">
      <div class="menuDropdown">
        <button
          class:selected-tool={menuState.selectedTool === TOOL_ERASER}
          onclick={() => changeTool(TOOL_ERASER, MENU_NUMBER)}
        >
          <p>지우개</p>
        </button>
      </div>
    </div>
  {/if}
</div>
