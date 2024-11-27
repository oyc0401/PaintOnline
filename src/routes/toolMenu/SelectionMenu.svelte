<script>
  export let value;
  import { TOOL_FREE_FORM_SELECT, TOOL_SELECT } from "../../paint/tools";

  import { menuState } from "../../store/menuState.svelte.js";

  function setTool(toolId){
    console.log(toolId);

    menuState.toolMenuId = 1;
    menuState.selectedTool = toolId;
    menuState.selectedTools[1] = toolId;

    const toolObj = window.svelteApp.get_tool_by_id(toolId);
    window.svelteApp.select_tool(toolObj);
    window.globApp.$canvas.css({ cursor: window.svelteApp.make_css_cursor(...toolObj.cursor)});
  }

</script>

<div class='menuDropdown'>
  <div class:selected-tool={menuState.selectedTool === TOOL_SELECT} on:click={() => { setTool(TOOL_SELECT); }}>
    <p>사각형으로 선택</p>
  </div>
  <div class:selected-tool={menuState.selectedTool === TOOL_FREE_FORM_SELECT} on:click={() => { setTool(TOOL_FREE_FORM_SELECT); }}>
    <p>자유형으로 선택</p>
  </div>
</div>

<style>
  .menu {
     position: absolute;
     background-color: #fff;
     border: 1px solid #ccc;
     padding: 8px;
     z-index: 10;
   }


  .selected-menu{
     background: gray;
  }

  .selected-tool{
    background: gray;
    font-weight: 700;
  }

</style>