<script>
  import {
    TOOL_CURVE,
    TOOL_ELLIPSE,
    TOOL_LINE,
    TOOL_POLYGON,
    TOOL_RECTANGLE,
    TOOL_ROUNDED_RECTANGLE,
  } from "$paint/src/tools";

  import RectangleIcon from "$lib/images/shape.png";
  import { menuState } from "$store/menuState.svelte.js";
  import { changeTool, clickMenu } from "$store/paintFunction.js";
  import "./menu.css";
  import "../toolsMenu.css";

  const MENU_NUMBER = 4;
</script>

<div>
  <button
    class="menu-button"
    class:selected-menu={menuState.toolMenuId === MENU_NUMBER}
    onclick={() => clickMenu(MENU_NUMBER)}
  >
    <img src={RectangleIcon} alt="shapes" />
  </button>

  {#if menuState.showDropdown && menuState.dropdownId == MENU_NUMBER}
    <div class="dropdown-area menu-bottom">
     
        <button
          class:selected-tool={menuState.selectedTool === TOOL_RECTANGLE}
          onclick={() => changeTool(TOOL_RECTANGLE, MENU_NUMBER)}
        >
          <p>사각형</p>
        </button>
        <button
          class:selected-tool={menuState.selectedTool ===
            TOOL_ROUNDED_RECTANGLE}
          onclick={() => changeTool(TOOL_ROUNDED_RECTANGLE, MENU_NUMBER)}
        >
          <p>둥근 사각형</p>
        </button>
        <button
          class:selected-tool={menuState.selectedTool === TOOL_ELLIPSE}
          onclick={() => changeTool(TOOL_ELLIPSE, MENU_NUMBER)}
        >
          <p>원형</p>
        </button>
        <button
          class:selected-tool={menuState.selectedTool === TOOL_POLYGON}
          onclick={() => changeTool(TOOL_POLYGON, MENU_NUMBER)}
        >
          <p>다각형</p>
        </button>
        <button
          class:selected-tool={menuState.selectedTool === TOOL_LINE}
          onclick={() => changeTool(TOOL_LINE, MENU_NUMBER)}
        >
          <p>직선</p>
        </button>
        <button
          class:selected-tool={menuState.selectedTool === TOOL_CURVE}
          onclick={() => changeTool(TOOL_CURVE, MENU_NUMBER)}
        >
          <p>곡선</p>
        </button>
    
    </div>
  {/if}
</div>
