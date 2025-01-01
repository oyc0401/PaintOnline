<script>
  import { TOOL_PENCIL,TOOL_AIRBRUSH, TOOL_BRUSH } from "$paint/src/tools";
  import BrushIcon from "$lib/images/brush.png";
  import { menuState } from "$store/menuState.svelte.js";
  import { changeTool, clickMenu } from "$store/paintFunction.js";
  import "./menu.css";
  import "../toolsMenu.css";

  const MENU_NUMBER = 3;
</script>

<div>
  <button
    class="menu-button"
    class:selected-menu={menuState.toolMenuId === MENU_NUMBER}
    onclick={() => clickMenu(MENU_NUMBER)}
  >
    <img src={BrushIcon} alt="brush" />
  </button>

  {#if menuState.showDropdown && menuState.dropdownId == MENU_NUMBER}
    <div class="dropdown-area menu-bottom">
      <button
        class:selected-tool={menuState.selectedTool === TOOL_PENCIL}
        onclick={() => changeTool(TOOL_PENCIL, MENU_NUMBER)}
      >
        <p>연필</p>
      </button>
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
  {/if}
</div>
