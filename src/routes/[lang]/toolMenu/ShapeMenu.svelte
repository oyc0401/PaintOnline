<script>
  import {
    TOOL_CURVE,
    TOOL_ELLIPSE,
    TOOL_LINE,
    TOOL_POLYGON,
    TOOL_RECTANGLE,
    TOOL_ROUNDED_RECTANGLE,
  } from "$paint/src/tools";
  import ShapeIcon from "$lib/images/shape.svelte";
  import RectangleIcon from "$lib/images/rectangle.svelte";
  import CircleIcon from "$lib/images/circle.svelte";
  import PolygonIcon from "$lib/images/polygon.svelte";
  import LineIcon from "$lib/images/line.svelte";
  import CurveIcon from "$lib/images/curve.svelte";

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
    {#if menuState.toolHistory[MENU_NUMBER] == TOOL_RECTANGLE}
      <RectangleIcon />
    {:else if menuState.toolHistory[MENU_NUMBER] == TOOL_ROUNDED_RECTANGLE}
      <RectangleIcon />
    {:else if menuState.toolHistory[MENU_NUMBER] == TOOL_ELLIPSE}
      <CircleIcon />
    {:else if menuState.toolHistory[MENU_NUMBER] == TOOL_POLYGON}
      <PolygonIcon />
    {:else if menuState.toolHistory[MENU_NUMBER] == TOOL_LINE}
      <LineIcon />
    {:else if menuState.toolHistory[MENU_NUMBER] == TOOL_CURVE}
      <CurveIcon />
    {:else}
      <ShapeIcon />
    {/if}
  </button>

  {#if menuState.showDropdown && menuState.dropdownId == MENU_NUMBER}
    <div class="dropdown-area small-dropdown menu-bottom">
      <button
        class="dropdown-button"
        class:selected-tool={menuState.selectedTool === TOOL_RECTANGLE}
        onclick={() => changeTool(TOOL_RECTANGLE, MENU_NUMBER)}
      >
        <RectangleIcon />
        <p>사각형</p>
      </button>
      <button
        class="dropdown-button"
        class:selected-tool={menuState.selectedTool === TOOL_ROUNDED_RECTANGLE}
        onclick={() => changeTool(TOOL_ROUNDED_RECTANGLE, MENU_NUMBER)}
      >
        <RectangleIcon />
        <p>둥근 사각형</p>
      </button>
      <button
        class="dropdown-button"
        class:selected-tool={menuState.selectedTool === TOOL_ELLIPSE}
        onclick={() => changeTool(TOOL_ELLIPSE, MENU_NUMBER)}
      >
        <CircleIcon />
        <p>원형</p>
      </button>
      <button
        class="dropdown-button"
        class:selected-tool={menuState.selectedTool === TOOL_POLYGON}
        onclick={() => changeTool(TOOL_POLYGON, MENU_NUMBER)}
      >
        <PolygonIcon />
        <p>다각형</p>
      </button>
      <button
        class="dropdown-button"
        class:selected-tool={menuState.selectedTool === TOOL_LINE}
        onclick={() => changeTool(TOOL_LINE, MENU_NUMBER)}
      >
        <LineIcon />
        <p>직선</p>
      </button>
      <button
        class="dropdown-button"
        class:selected-tool={menuState.selectedTool === TOOL_CURVE}
        onclick={() => changeTool(TOOL_CURVE, MENU_NUMBER)}
      >
        <CurveIcon />
        <p>곡선</p>
      </button>
    </div>
  {/if}
</div>
