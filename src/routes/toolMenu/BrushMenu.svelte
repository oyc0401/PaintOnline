<script>
  export let value;
  import { TOOL_AIRBRUSH, TOOL_BRUSH } from "../../paint/tools";

  import { menuState, changeTool } from "../../store/menuState.svelte.js";

  function setTool(toolId){
    changeTool(toolId, 3);
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