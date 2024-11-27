<script>
  export let value;
  import { TOOL_CURVE, TOOL_ELLIPSE, TOOL_LINE, TOOL_POLYGON, TOOL_RECTANGLE, TOOL_ROUNDED_RECTANGLE} from "../../paint/tools";

  import { menuState } from "../../store/menuState.svelte.js";

  function setTool(toolId){
    console.log(toolId);

    menuState.toolMenuId = 4;
    menuState.selectedTool = toolId;
    menuState.selectedTools[4] = toolId;

    const toolObj = window.svelteApp.get_tool_by_id(toolId);
    window.svelteApp.select_tool(toolObj);
    window.globApp.$canvas.css({ cursor: window.svelteApp.make_css_cursor(...toolObj.cursor)});
  }

</script>
<div class='menuDropdown'>
  <div class:selected-tool={menuState.selectedTool === TOOL_RECTANGLE} on:click={() => { setTool(TOOL_RECTANGLE); }}>
    <p>사각형</p>
  </div>
  <div class:selected-tool={menuState.selectedTool === TOOL_ROUNDED_RECTANGLE} on:click={() => { setTool(TOOL_ROUNDED_RECTANGLE); }}>
    <p>둥근 사각형</p>
  </div>
  <div class:selected-tool={menuState.selectedTool === TOOL_ELLIPSE} on:click={() => { setTool(TOOL_ELLIPSE); }}>
    <p>원형</p>
  </div>
  <div class:selected-tool={menuState.selectedTool === TOOL_POLYGON} on:click={() => { setTool(TOOL_POLYGON); }}>
    <p>다각형</p>
  </div>
  <div class:selected-tool={menuState.selectedTool === TOOL_LINE} on:click={() => { setTool(TOOL_LINE); }}>
    <p>직선</p>
  </div>
  <div class:selected-tool={menuState.selectedTool === TOOL_CURVE} on:click={() => { setTool(TOOL_CURVE); }}>
    <p>곡선</p>
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