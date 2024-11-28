<script>
  import { TOOL_AIRBRUSH, TOOL_BRUSH } from "../../paint/tools";

  import { menuState } from "../../store/menuState.svelte.js";
  import {  changeTool } from "../../store/paintFunction.js";
  function setTool(toolId) {
    changeTool(toolId, 3);
  }
</script>

<div class="menuDropdown">
  <button
    class:selected-tool={menuState.selectedTool === TOOL_BRUSH}
    onclick={() => setTool(TOOL_BRUSH)}
  >
    <p>브러쉬</p>
  </button>
  <button
    class:selected-tool={menuState.selectedTool === TOOL_AIRBRUSH}
    onclick={() => setTool(TOOL_AIRBRUSH)}
  >
    <p>에어 브러쉬</p>
  </button>
</div>

<style>
  .selected-tool {
    background: gray;
    font-weight: 700;
  }
</style>
