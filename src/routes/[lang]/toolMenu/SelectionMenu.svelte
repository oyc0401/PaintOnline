<script>
  import { TOOL_FREE_FORM_SELECT, TOOL_SELECT } from "$paint/src/tools";
  import SelectRectangleIcon from "$lib/images/select_rectangle.png";
  import { menuState } from "$store/menuState.svelte.js";
  import { changeTool, openMenu } from "$store/paintFunction.js";
  import "./menu.css";
  import "../toolsMenu.css";
  const MENU_NUMBER = 1;
</script>


<div>
  <button class="menu-button" 
    class:selected-menu={menuState.selectedMenuId === MENU_NUMBER}
    onclick={()=>openMenu(MENU_NUMBER)}>
    <img src={SelectRectangleIcon} alt="selection" />
  </button>

  {#if menuState.showMenu && menuState.selectedMenuId == MENU_NUMBER}
    <div class="menu-area menu-top">
      <div class="menuDropdown">
        <button
          class:selected-tool={menuState.selectedTool === TOOL_SELECT}
          onclick={() => changeTool(TOOL_SELECT,MENU_NUMBER)}
        >
          <p>사각형으로 선택</p>
        </button>
        <button
          class:selected-tool={menuState.selectedTool === TOOL_FREE_FORM_SELECT}
          onclick={() => changeTool(TOOL_FREE_FORM_SELECT,MENU_NUMBER)}
        >
          <p>자유형으로 선택</p>
        </button>
      </div>
    </div>
  {/if}
</div>