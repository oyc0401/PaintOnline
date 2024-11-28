<script>
  import {
    TOOL_CURVE,
    TOOL_ELLIPSE,
    TOOL_LINE,
    TOOL_POLYGON,
    TOOL_RECTANGLE,
    TOOL_ROUNDED_RECTANGLE,
  } from "../../paint/tools";

  import { menuState } from "../../store/menuState.svelte.js";
  import {  changeTool } from "../../store/paintFunction.js";
  function setTool(toolId) {
    changeTool(toolId, 4);
  }
</script>

<div class="menuDropdown">
  <button
    class:selected-tool={menuState.selectedTool === TOOL_RECTANGLE}
    onclick={() => setTool(TOOL_RECTANGLE)}
  >
    <p>사각형</p>
  </button>
  <button
    class:selected-tool={menuState.selectedTool === TOOL_ROUNDED_RECTANGLE}
    onclick={() => setTool(TOOL_ROUNDED_RECTANGLE)}
  >
    <p>둥근 사각형</p>
  </button>
  <button
    class:selected-tool={menuState.selectedTool === TOOL_ELLIPSE}
    onclick={() => setTool(TOOL_ELLIPSE)}
  >
    <p>원형</p>
  </button>
  <button
    class:selected-tool={menuState.selectedTool === TOOL_POLYGON}
    onclick={() => setTool(TOOL_POLYGON)}
  >
    <p>다각형</p>
  </button>
  <button
    class:selected-tool={menuState.selectedTool === TOOL_LINE}
    onclick={() => setTool(TOOL_LINE)}
  >
    <p>직선</p>
  </button>
  <button
    class:selected-tool={menuState.selectedTool === TOOL_CURVE}
    onclick={() => setTool(TOOL_CURVE)}
  >
    <p>곡선</p>
  </button>
</div>

<style>

  .selected-tool {
    background: gray;
    font-weight: 700;
  }
</style>
