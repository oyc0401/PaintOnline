<script>
  import { TOOL_FREE_FORM_SELECT, TOOL_SELECT } from "$paint/src/tools";
  import SelectRectangleIcon from "$lib/images/select_rectangle.svelte";
  import SelectFreeIcon from "$lib/images/select_free.svelte";
  import { menuState } from "$store/menuState.svelte.js";
  import { changeTool, clickMenu } from "$store/paintFunction.js";
  import "./menu.css";
  import "../toolsMenu.css";
  const MENU_NUMBER = 1;
</script>

<div>
  <button
    class="menu-button"
    class:selected-menu={menuState.toolMenuId === MENU_NUMBER}
    onclick={() => clickMenu(MENU_NUMBER)}
  >
    {#if menuState.toolHistory[MENU_NUMBER] == TOOL_SELECT}
      <SelectRectangleIcon />
    {:else if menuState.toolHistory[MENU_NUMBER] == TOOL_FREE_FORM_SELECT}
      <SelectFreeIcon />
    {/if}
  </button>

  {#if menuState.showDropdown && menuState.dropdownId == MENU_NUMBER}
    <div class="dropdown-area menu-top">
      <button
        class="dropdown-button"
        class:selected-tool={menuState.selectedTool === TOOL_SELECT}
        onclick={() => changeTool(TOOL_SELECT, MENU_NUMBER)}
      >
        <SelectRectangleIcon />
        <p>사각형으로 선택</p>
      </button>
      <button
        class="dropdown-button"
        class:selected-tool={menuState.selectedTool === TOOL_FREE_FORM_SELECT}
        onclick={() => changeTool(TOOL_FREE_FORM_SELECT, MENU_NUMBER)}
      >
        <SelectFreeIcon />
        <p>자유형으로 선택</p>
      </button>
    </div>
  {/if}
</div>
