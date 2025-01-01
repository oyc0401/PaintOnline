<script>
  import {
    TOOL_ERASER,
  } from "$paint/src/tools";
  import EraserIcon from "$lib/images/eraser.png";

  import { menuState } from "$store/menuState.svelte.js";
  import { changeTool, clickMenu } from "$store/paintFunction.js";
  import "./menu.css";
  import "../toolsMenu.css";
  const MENU_NUMBER = 5;
</script>

<div>
  <button
    class="menu-button"
    class:selected-menu={menuState.toolMenuId === MENU_NUMBER}
    onclick={() => clickMenu(MENU_NUMBER)}
  >
    <img src={EraserIcon} alt="eraser" />
  </button>

  {#if menuState.showDropdown && menuState.dropdownId == MENU_NUMBER}
    <div class="dropdown-area menu-bottom">
        <button
          class:selected-tool={menuState.selectedTool === TOOL_ERASER}
          onclick={() => changeTool(TOOL_ERASER, MENU_NUMBER)}
        >
          <p>지우개</p>
        </button>
    </div>
  {/if}
</div>
