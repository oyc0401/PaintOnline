<script>
  export let value;
  import { TOOL_ERASER, TOOL_FILL, TOOL_MAGNIFIER, TOOL_PENCIL, TOOL_PICK_COLOR} from "../../paint/tools";

  import { menuState } from "../../store/menuState.svelte.js";
  
  function setTool(toolId){
    console.log(toolId);

    menuState.toolMenuId = 2;
    menuState.selectedTool = toolId;
    menuState.selectedTools[2] = toolId;

    const toolObj = window.svelteApp.get_tool_by_id(toolId);
    window.svelteApp.select_tool(toolObj);
    window.globApp.$canvas.css({ cursor: window.svelteApp.make_css_cursor(...toolObj.cursor)});
  }
  
</script>
<div class='menuDropdown'>
  <div class:selected-tool={menuState.selectedTool === TOOL_PENCIL} on:click={() => { setTool(TOOL_PENCIL); }}>
    <p>연필</p>
  </div>
  <div class:selected-tool={menuState.selectedTool === TOOL_ERASER} on:click={() => { setTool(TOOL_ERASER); }}>
    <p>지우개</p>
  </div>
  <div class:selected-tool={menuState.selectedTool === TOOL_FILL} on:click={() => { setTool(TOOL_FILL); }}>
    <p>칠하기</p>
  </div>
  <div class:selected-tool={menuState.selectedTool === TOOL_MAGNIFIER} on:click={() => { setTool(TOOL_MAGNIFIER); }}>
    <p>돋보기</p>
  </div>
  <div class:selected-tool={menuState.selectedTool === TOOL_PICK_COLOR} on:click={() => { setTool(TOOL_PICK_COLOR); }}>
    <p>pick color</p>
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