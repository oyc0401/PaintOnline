<script>
  import {
    TOOL_ERASER,
    TOOL_FILL,
    TOOL_MAGNIFIER,
    TOOL_PENCIL,
    TOOL_PICK_COLOR,
  } from "$paint/src/tools";

  import { menuState } from "$store/menuState.svelte.js";
   import {  changeTool } from "$store/paintFunction.js";
  function setTool(toolId) {
    changeTool(toolId, 2);
    console.log(toolId);
  }
</script>

<div class="menuDropdown">
  <button
    class:selected-tool={menuState.selectedTool === TOOL_PENCIL}
    onclick={() => setTool(TOOL_PENCIL)}
  >
    <p>연필</p>
  </button>
  <button
    class:selected-tool={menuState.selectedTool === TOOL_ERASER}
    onclick={() => setTool(TOOL_ERASER)}
  >
    <p>지우개</p>
  </button>
  <button
    class:selected-tool={menuState.selectedTool === TOOL_FILL}
    onclick={() => setTool(TOOL_FILL)}
  >
    <p>칠하기</p>
  </button>
  <button
    class:selected-tool={menuState.selectedTool === TOOL_MAGNIFIER}
    onclick={() => setTool(TOOL_MAGNIFIER)}
  >
    <p>돋보기</p>
  </button>
  <button
    class:selected-tool={menuState.selectedTool === TOOL_PICK_COLOR}
    onclick={() => setTool(TOOL_PICK_COLOR)}
  >
    <p>pick color</p>
  </button>
</div>

<style>

  .selected-tool {
    background: gray;
    font-weight: 700;
  }
</style>
