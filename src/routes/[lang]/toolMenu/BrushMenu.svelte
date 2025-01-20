<script>
  import { TOOL_PENCIL, TOOL_AIRBRUSH, TOOL_BRUSH } from "$paint";
  import BrushIcon from "$lib/images/brush.svelte";
  import PenIcon from "$lib/images/pen.svelte";
  import SprayIcon from "$lib/images/spray.svelte";
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
    {#if menuState.toolHistory[MENU_NUMBER] == TOOL_PENCIL}
      <PenIcon />
    {:else if menuState.toolHistory[MENU_NUMBER] == TOOL_BRUSH}
      <BrushIcon />
    {:else if menuState.toolHistory[MENU_NUMBER] == TOOL_AIRBRUSH}
      <SprayIcon />
    {/if}
  </button>

  {#if menuState.showDropdown && menuState.dropdownId == MENU_NUMBER}
    <div class="dropdown-area small-dropdown menu-bottom">
      <button
        class="dropdown-button"
        class:selected-tool={menuState.selectedTool === TOOL_PENCIL}
        onclick={() => changeTool(TOOL_PENCIL, MENU_NUMBER)}
      >
        <PenIcon />
        <p>펜</p>
      </button>
      <button
        class="dropdown-button"
        class:selected-tool={menuState.selectedTool === TOOL_BRUSH}
        onclick={() => changeTool(TOOL_BRUSH, MENU_NUMBER)}
      >
        <BrushIcon />
        <p>브러쉬</p>
      </button>
      <button
        class="dropdown-button"
        class:selected-tool={menuState.selectedTool === TOOL_AIRBRUSH}
        onclick={() => changeTool(TOOL_AIRBRUSH, MENU_NUMBER)}
      >
        <SprayIcon />
        <p>에어 브러쉬</p>
      </button>
    </div>
  {/if}
</div>
