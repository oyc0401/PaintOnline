<script>
  import {
    TOOL_FILL,
    TOOL_MAGNIFIER,
    TOOL_PENCIL,
    TOOL_PICK_COLOR,
  } from "$paint/src/tools";
  import ToolsIcon from "$lib/images/tools.png";

  import { menuState } from "$store/menuState.svelte.js";
  import { changeTool, clickMenu } from "$store/paintFunction.js";
  import "./menu.css";
  import "../toolsMenu.css";
  const MENU_NUMBER = 2;
</script>

<div>
  <button
    class="menu-button"
    class:selected-menu={menuState.toolMenuId === MENU_NUMBER}
    onclick={() => clickMenu(MENU_NUMBER)}
  >
    <img src={ToolsIcon} alt="tools" />
  </button>

  {#if menuState.showDropdown && menuState.dropdownId == MENU_NUMBER}
    <div class="dropdown-area menu-top">
     
        <button
          class:selected-tool={menuState.selectedTool === TOOL_PENCIL}
          onclick={() => changeTool(TOOL_PENCIL, MENU_NUMBER)}
        >
          <p>연필</p>
        </button>
        <button
          class:selected-tool={menuState.selectedTool === TOOL_FILL}
          onclick={() => changeTool(TOOL_FILL, MENU_NUMBER)}
        >
          <p>칠하기</p>
        </button>
        <button
          class:selected-tool={menuState.selectedTool === TOOL_MAGNIFIER}
          onclick={() => changeTool(TOOL_MAGNIFIER, MENU_NUMBER)}
        >
          <p>돋보기</p>
        </button>
        <button
          class:selected-tool={menuState.selectedTool === TOOL_PICK_COLOR}
          onclick={() => changeTool(TOOL_PICK_COLOR, MENU_NUMBER)}
        >
          <p>pick color</p>
        </button>
  
    </div>
  {/if}
</div>
