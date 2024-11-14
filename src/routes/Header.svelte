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
  import { onMount } from 'svelte';
  
   
  function setTool(toolId){
    console.log(toolId);
    window.select_tool(window.get_tool_by_id(toolId));
  }

  
  let showMenu = $state(false);
  let menuId = $state(0);
  let menuPosition = $state({ top: 0, left: 0 });
  let selectedToolIds = $state(Array(7).fill(0));
  let buttons = Array(7);

  const openMenu = (id) => {
    if(!showMenu){
      showMenu=true;
      menuId=id;
    } else if (id == menuId){
      showMenu = !showMenu;
    } else {
      menuId = id;
    }
  
    if(showMenu){
      const rect = buttons[id].getBoundingClientRect();
       menuPosition = {
         top: rect.bottom + window.scrollY,
         left: rect.left + window.scrollX
       };
    }
    
  }

 // 외부 클릭 시 메뉴를 닫도록 설정
  onMount(() => {
    const toolList={
      0: ['menu'],
      1: [TOOL_SELECT,TOOL_FREE_FORM_SELECT],
      2: [TOOL_PENCIL,TOOL_ERASER,TOOL_FILL,TOOL_PICK_COLOR,TOOL_MAGNIFIER],
      3: [TOOL_BRUSH,TOOL_AIRBRUSH],
      4: [TOOL_RECTANGLE,TOOL_ROUNDED_RECTANGLE,TOOL_RECTANGLE,TOOL_POLYGON,TOOL_ELLIPSE,TOOL_LINE,TOOL_CURVE],
      5: ['stroke'],
      6: ['color'],
    }
     
    const handleClickOutside = (event) => {
      if (showMenu && !event.target.closest('.menu') && !event.target.closest('button')) {
        showMenu = false;
      }
    };

    // document.addEventListener('click', handleClickOutside);
    document.addEventListener('pointerdown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('pointerdown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
    };
  });
   
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
      <button class="menu-button" bind:this={buttons[0]} on:click={()=>{openMenu(0)}}>
         <img src={MenuIcon} alt="menu" />
      </button>
      <button class="menu-button" bind:this={buttons[1]} on:click={()=>{openMenu(1)}}>
        <img src={SelectionIcon} alt="selection" />
      </button>
     <button class="menu-button" bind:this={buttons[2]} on:click={()=>{openMenu(2)}}>
       <img src={PenIcon} alt="tools" />
     </button>
     <button class="menu-button" bind:this={buttons[3]} on:click={()=>{openMenu(3)}}>
        <img src={BrushIcon} alt="brush" />
      </button>
     <button class="menu-button" bind:this={buttons[4]} on:click={()=>{openMenu(4)}}>
        <img src={RectangleIcon} alt="shapes" />
      </button>
     <button class="menu-button" bind:this={buttons[5]} on:click={()=>{openMenu(5)}}>
        <img src={LineIcon} alt="line" />
      </button>
     <button class="menu-button" bind:this={buttons[6]} on:click={()=>{openMenu(6)}}>
        <img src={ColorIcon} alt="color" />
      </button>
      <!-- <div class="menu-button" on:click={()=>{setTool(TOOL_BRUSH)}}><img src={BrushIcon} alt="brush" /></div>
      <div class="menu-button" on:click={()=>{setTool(TOOL_RECTANGLE)}}><img src={RectangleIcon} alt="shapes" /></div>
      <div class="menu-button"><img src={LineIcon} alt="line" /></div>
      <div class="menu-button"><img src={ColorIcon} alt="color" /></div> -->
      <div class="flex-1"></div>
      <div class="menu-button">
         <img src={FullScreenIcon} alt="full-screen" />
      </div>
      {#if showMenu}
        <div
          class="menu show"
          style="top: {menuPosition.top}px; left: {menuPosition.left}px;"
        >
          {#if menuId == 0}
            <p>1번도구</p>
          {/if}
          {#if menuId == 1}
            <p>2번도구</p>
          {/if}
          {#if menuId == 2}
            <p>3번도구</p>
          {/if}
          {#if menuId == 3}
            <p>4번도구</p>
          {/if}
          {#if menuId == 4}
            <p>5번도구</p>
          {/if}
          {#if menuId == 5}
            <p>6번도구</p>
          {/if}
          {#if menuId == 6}
            <p>7번도구</p>
          {/if}
        </div>
      {/if}
   </div>
  
</header>

<style>
    .menu {
       position: absolute;
       background-color: #fff;
       border: 1px solid #ccc;
       padding: 8px;
       display: none;
       z-index: 10;
     }

     .menu.show {
       display: block;
     }
</style>