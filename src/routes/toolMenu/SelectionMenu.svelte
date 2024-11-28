<script>
  import { TOOL_FREE_FORM_SELECT, TOOL_SELECT } from "../../paint/tools";

  import { menuState } from "../../store/menuState.svelte.js";
  import {  changeTool } from "../../store/paintFunction.js";
  function setTool(toolId) {
    changeTool(toolId, 1);
  }
</script>

<div class="menuDropdown">
  <button
    class:selected-tool={menuState.selectedTool === TOOL_SELECT}
    onclick={() => setTool(TOOL_SELECT)}
  >
    <p>사각형으로 선택</p>
  </button>
  <button
    class:selected-tool={menuState.selectedTool === TOOL_FREE_FORM_SELECT}
    onclick={() => setTool(TOOL_FREE_FORM_SELECT)}
  >
    <p>자유형으로 선택</p>
  </button>
</div>

<style>

  .selected-tool {
    background: gray;
    font-weight: 700;
  }
</style>
