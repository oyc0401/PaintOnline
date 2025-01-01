<script>
  import { TOOL_FILL, TOOL_MAGNIFIER, TOOL_PICK_COLOR } from "$paint/src/tools";
  import ToolsIcon from "$lib/images/tools.svelte";
  import PickColorIcon from "$lib/images/pick_color.svelte";
  import FillColorIcon from "$lib/images/fill_color.svelte";
  import ZoomIcon from "$lib/images/zoom.svelte";

  import { menuState } from "$store/menuState.svelte.js";
  import { changeToolAndCloseDropdown, quickClickMenu } from "$store/paintFunction.js";
  import "./menu.css";
  import "../toolsMenu.css";
  const MENU_NUMBER = 2;
</script>

<div>
  <button
    class="menu-button"
    class:selected-menu={menuState.toolMenuId === MENU_NUMBER}
    onclick={() => quickClickMenu(MENU_NUMBER)}
  >
    {#if menuState.toolHistory[MENU_NUMBER] == TOOL_FILL}
      <FillColorIcon />
    {:else if menuState.toolHistory[MENU_NUMBER] == TOOL_MAGNIFIER}
      <ZoomIcon />
    {:else if menuState.toolHistory[MENU_NUMBER] == TOOL_PICK_COLOR}
      <PickColorIcon />
    {:else}
      <ToolsIcon />
    {/if}
  </button>

  {#if menuState.showDropdown && menuState.dropdownId == MENU_NUMBER}
    <div class="dropdown-area small-dropdown menu-top">
      <button
        class="dropdown-button"
        class:selected-tool={menuState.selectedTool === TOOL_FILL}
        onclick={() => changeToolAndCloseDropdown(TOOL_FILL, MENU_NUMBER)}
      >
        <FillColorIcon />
        <p>칠하기</p>
      </button>
      <button
        class="dropdown-button"
        class:selected-tool={menuState.selectedTool === TOOL_MAGNIFIER}
        onclick={() => changeToolAndCloseDropdown(TOOL_MAGNIFIER, MENU_NUMBER)}
      >
        <ZoomIcon />
        <p>돋보기</p>
      </button>
      <button
        class="dropdown-button"
        class:selected-tool={menuState.selectedTool === TOOL_PICK_COLOR}
        onclick={() => changeToolAndCloseDropdown(TOOL_PICK_COLOR, MENU_NUMBER)}
      >
        <PickColorIcon />
        <p>색상 선택</p>
      </button>
    </div>
  {/if}
</div>
