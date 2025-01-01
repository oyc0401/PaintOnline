<script>
  import { TOOL_ERASER } from "$paint/src/tools";
  import EraserIcon from "$lib/images/eraser.svelte";
  import EraserPickIcon from "$lib/images/eraser_pick.svelte";

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
    {#if menuState.toolHistory[MENU_NUMBER] == TOOL_ERASER}
      <EraserIcon />
    {:else if menuState.toolHistory[MENU_NUMBER] == TOOL_ERASER}
      <EraserPickIcon />
    {/if}
  </button>

  {#if menuState.showDropdown && menuState.dropdownId == MENU_NUMBER}
    <div class="dropdown-area small-dropdown menu-bottom">
      <button
        class="dropdown-button"
        class:selected-tool={menuState.selectedTool === TOOL_ERASER}
        onclick={() => changeTool(TOOL_ERASER, MENU_NUMBER)}
      >
        <EraserIcon />
        <p>지우개</p>
      </button>
      <button
        class="dropdown-button"
        class:selected-tool={menuState.selectedTool === TOOL_ERASER}
        onclick={() => changeTool(TOOL_ERASER, MENU_NUMBER)}
      >
        <EraserPickIcon />
        <p>일부 지우개</p>
      </button>
    </div>
  {/if}
</div>
