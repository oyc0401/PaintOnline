<script>
  export let value;
  import { TOOL_AIRBRUSH, TOOL_BRUSH } from "../../paint/tools";

  import { menuState } from "../../store/menuState.svelte.js";

  function setTool(toolId){
    console.log(toolId);

    menuState.toolMenuId = 3;
    menuState.selectedTool = toolId;
    menuState.selectedTools[3] = toolId;

    const toolObj = window.svelteApp.get_tool_by_id(toolId);
    window.svelteApp.select_tool(toolObj);
    window.globApp.$canvas.css({ cursor: window.svelteApp.make_css_cursor(...toolObj.cursor)});
  }

</script>
<div class='menuDropdown'>
  <div class:selected-tool={menuState.selectedTool === TOOL_BRUSH} on:click={() => { setTool(TOOL_BRUSH); }}>
    <p>브러쉬</p>
  </div>
  <div class:selected-tool={menuState.selectedTool === TOOL_AIRBRUSH} on:click={() => { setTool(TOOL_AIRBRUSH); }}>
    <p>에어 브러쉬</p>
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