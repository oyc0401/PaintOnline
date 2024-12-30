<script>
  import { TOOL_AIRBRUSH, TOOL_BRUSH } from "$paint/src/tools";
  import BrushIcon from "$lib/images/brush.png";
  import { menuState } from "$store/menuState.svelte.js";
  import { changeTool, openMenu } from "$store/paintFunction.js";
  import "./menu.css";
  import "../toolsMenu.css";

  const MENU_NUMBER = 3;
</script>

<div>
  <button
    class="menu-button"
    class:selected-menu={menuState.selectedMenuId === MENU_NUMBER}
    onclick={() => openMenu(MENU_NUMBER)}
  >
    <img src={BrushIcon} alt="brush" />
  </button>

  {#if menuState.showMenu && menuState.selectedMenuId == MENU_NUMBER}
    <div class="menu-area menu-bottom">
      <div class="menuDropdown">
        <button
          class:selected-tool={menuState.selectedTool === TOOL_BRUSH}
          onclick={() => changeTool(TOOL_BRUSH, MENU_NUMBER)}
        >
          <p>브러쉬</p>
        </button>
        <button
          class:selected-tool={menuState.selectedTool === TOOL_AIRBRUSH}
          onclick={() => changeTool(TOOL_AIRBRUSH, MENU_NUMBER)}
        >
          <p>에어 브러쉬</p>
        </button>
      </div>
    </div>
  {/if}
</div>