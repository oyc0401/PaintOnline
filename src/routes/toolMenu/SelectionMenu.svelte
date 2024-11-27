<script>
  export let value;
  import { TOOL_FREE_FORM_SELECT, TOOL_SELECT } from "../../paint/tools";

  import { menuState, changeTool } from "../../store/menuState.svelte.js";

  function setTool(toolId){
    changeTool(toolId, 1);
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