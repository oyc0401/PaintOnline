<script>
   import "./header.css";
   import LogoIcon from "$lib/images/logo.png";
   import UndoIcon from "$lib/images/undo.png";
   import RedoIcon from "$lib/images/redo.png";
   import MenuIcon from "$lib/images/menu.png";
   import SelectionIcon from "$lib/images/selection.png";
   import PenIcon from "$lib/images/pen.png";
   import BrushIcon from "$lib/images/brush.png";
   import RectangleIcon from "$lib/images/shape.png";
   import LineIcon from "$lib/images/line.png";
   import ColorIcon from "$lib/images/color.png";
   import FullScreenIcon from "$lib/images/full-screen.png";

   import { counter, counter2 } from "../store/appState.js";
   import {
      TOOL_AIRBRUSH,
      TOOL_BRUSH,
      TOOL_CURVE,
      TOOL_ELLIPSE,
      TOOL_ERASER,
      TOOL_FILL,
      TOOL_FREE_FORM_SELECT,
      TOOL_LINE,
      TOOL_MAGNIFIER,
      TOOL_PENCIL,
      TOOL_PICK_COLOR,
      TOOL_POLYGON,
      TOOL_RECTANGLE,
      TOOL_ROUNDED_RECTANGLE,
      TOOL_SELECT,
      TOOL_TEXT,
   } from "../paint/tools";

   function setTool(toolId){
      console.log(toolId);
          window.globAppstate.selected_tool = window.get_tool_by_id(toolId);
         window.globAppstate.selected_tools = [window.globAppstate.selected_tool]
   }
</script>

<header>
   <div class="appbar">
      <div class="main-logo">
         <img src={LogoIcon} alt="logo icon" />
      </div>
      <p class="pl-2.5 text-md">제목없음 그림판</p>
      <div class="flex-1"></div>
      <div class="history-button">
         <img src={UndoIcon} alt="undo icon" />
      </div>
      <div class="history-button">
         <img src={RedoIcon} alt="redo icon" />
      </div>
   </div>
   <div class="menus">
      <div class="menu-button"><img src={MenuIcon} alt="menu" /></div>
      <div class="menu-button" on:click={()=>{setTool(TOOL_SELECT)}}><img src={SelectionIcon} alt="selection" /></div>
      <div class="menu-button" on:click={()=>{setTool(TOOL_PENCIL)}}><img src={PenIcon} alt="tools" /></div>
      <div class="menu-button" on:click={()=>{setTool(TOOL_BRUSH)}}><img src={BrushIcon} alt="brush" /></div>
      <div class="menu-button" on:click={()=>{setTool(TOOL_RECTANGLE)}}><img src={RectangleIcon} alt="shapes" /></div>
      <div class="menu-button"><img src={LineIcon} alt="line" /></div>
      <div class="menu-button"><img src={ColorIcon} alt="color" /></div>
      <div class="flex-1"></div>
      <div class="menu-button">
         <img src={FullScreenIcon} alt="full-screen" />
      </div>
   </div>
</header>

<style lang="postcss">
</style>
