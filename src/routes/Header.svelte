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
  let menuId = $state(2);
  let menuPosition = $state({ top: 0, left: 0 });
  
  let selectedMenuId = $state(2);
  let selectedToolIds = $state(Array(7).fill(0));
  let buttons = Array(7);
  let toolList;
  
  const openMenu = (id) => {
    if(!showMenu){
      showMenu = true;
    } else if (id == menuId){
      showMenu = !showMenu;
    } 
    menuId = id;

    if(toolList[id].keep){
      selectedMenuId = id;
    }
  
    if(showMenu){
      const rect = buttons[id].getBoundingClientRect();
       menuPosition = {
         top: rect.bottom + window.scrollY,
         left: rect.left + window.scrollX
       };
    }
    
    if(id == selectedMenuId){
      toolList[selectedMenuId].subMenus[selectedToolIds[selectedMenuId]].onclick();
    }
    
  }

  function menuItemClick(id, idx){
    if(toolList[id].keep){
      menuId = id;
    }
    selectedToolIds[id] = idx;

    toolList[id].subMenus[idx].onclick();
    
    
  }
  
  

 // 외부 클릭 시 메뉴를 닫도록 설정
  onMount(() => {
    toolList = [
      { menuName:'menu', keep: false, subMenus: [
        { id: TOOL_SELECT, onclick: ()=>{console.log('새창')} },
        { id: TOOL_FREE_FORM_SELECT, onclick: ()=>{ console.log('열기')} },
        { id: TOOL_FREE_FORM_SELECT, onclick: ()=>{ console.log('저장')} },
      ]},
      { menuName:'', keep: true, subMenus: [
        { id: TOOL_SELECT, icon: LineIcon, onclick: ()=>{setTool(TOOL_SELECT)} },
        { id: TOOL_FREE_FORM_SELECT, icon: LineIcon, onclick: ()=>{ setTool(TOOL_FREE_FORM_SELECT)} },
      ]},
      { menuName:'', keep: true, subMenus: [
        { id: TOOL_PENCIL, icon: LineIcon, onclick: ()=>{ setTool(TOOL_PENCIL)} },
        { id: TOOL_ERASER, icon: LineIcon, onclick: ()=>{ setTool(TOOL_ERASER)} },
        { id: TOOL_FILL, icon: LineIcon, onclick: ()=>{ setTool(TOOL_FILL)} },
        { id: TOOL_PICK_COLOR, icon: LineIcon, onclick: ()=>{ setTool(TOOL_PICK_COLOR)} },
        { id: TOOL_MAGNIFIER, icon: LineIcon, onclick: ()=>{ setTool(TOOL_MAGNIFIER)} },
      ]},
      { menuName:'', keep: true, subMenus: [
        { id: TOOL_BRUSH, icon: LineIcon, onclick: ()=>{ setTool(TOOL_BRUSH)} },
        { id: TOOL_AIRBRUSH, icon: LineIcon, onclick: ()=>{ setTool(TOOL_AIRBRUSH)} },
      ]},
      { menuName:'', keep: true, subMenus: [
        { id: TOOL_RECTANGLE, icon: LineIcon, onclick: ()=>{ setTool(TOOL_RECTANGLE)} },
        { id: TOOL_ROUNDED_RECTANGLE, icon: LineIcon, onclick: ()=>{ setTool(TOOL_ROUNDED_RECTANGLE)} },
        { id: TOOL_ELLIPSE, icon: LineIcon, onclick: ()=>{ setTool(TOOL_ELLIPSE)} },
        { id: TOOL_POLYGON, icon: LineIcon, onclick: ()=>{ setTool(TOOL_POLYGON)} },
        { id: TOOL_LINE, icon: LineIcon, onclick: ()=>{ setTool(TOOL_LINE)} },
        { id: TOOL_CURVE, icon: LineIcon, onclick: ()=>{ setTool(TOOL_CURVE)} },
      ]},
      { menuName:'', keep: false, subMenus: [
        { id: TOOL_FILL, icon: LineIcon, onclick: ()=>{ console.log('1px')} },
        { id: TOOL_PICK_COLOR, icon: LineIcon, onclick: ()=>{ console.log('2px')} },
        { id: TOOL_MAGNIFIER, icon: LineIcon, onclick: ()=>{ console.log('3px')} },
      ]},
      { menuName:'', keep: false, subMenus: [
        { id: TOOL_FILL, icon: LineIcon, onclick: ()=>{ console.log('흰색')} },
        { id: TOOL_PICK_COLOR, icon: LineIcon, onclick: ()=>{ console.log('검정')} },
        { id: TOOL_MAGNIFIER, icon: LineIcon, onclick: ()=>{ console.log('빨강')} },
        { id: TOOL_FILL, icon: LineIcon, onclick: ()=>{ console.log('노랑')} },
        { id: TOOL_PICK_COLOR, icon: LineIcon, onclick: ()=>{ console.log('연한파랑')} },
        { id: TOOL_MAGNIFIER, icon: LineIcon, onclick: ()=>{ console.log('투명')} },
      ]}
    ]
     
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
      <button class="menu-button" class:selected-menu={selectedMenuId === 0} bind:this={buttons[0]} on:click={()=>{openMenu(0)}}>
         <img src={MenuIcon} alt="menu" />
      </button>
      <button class="menu-button" class:selected-menu={selectedMenuId === 1} bind:this={buttons[1]} on:click={()=>{openMenu(1)}}>
        <img src={SelectionIcon} alt="selection" />
      </button>
     <button class="menu-button" class:selected-menu={selectedMenuId === 2} bind:this={buttons[2]} on:click={()=>{openMenu(2)}}>
       <img src={PenIcon} alt="tools" />
     </button>
     <button class="menu-button" class:selected-menu={selectedMenuId === 3} bind:this={buttons[3]} on:click={()=>{openMenu(3)}}>
        <img src={BrushIcon} alt="brush" />
      </button>
     <button class="menu-button" class:selected-menu={selectedMenuId === 4} bind:this={buttons[4]} on:click={()=>{openMenu(4)}}>
        <img src={RectangleIcon} alt="shapes" />
      </button>
     <button class="menu-button" class:selected-menu={selectedMenuId === 5} bind:this={buttons[5]} on:click={()=>{openMenu(5)}}>
        <img src={LineIcon} alt="line" />
      </button>
     <button class="menu-button" class:selected-menu={selectedMenuId === 6} bind:this={buttons[6]} on:click={()=>{openMenu(6)}}>
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
            <div class:selected-tool={selectedToolIds[0] === 0} on:click={()=>{menuItemClick(0, 0)}}>
              <p>새창</p>
            </div>
            <div class:selected-tool={selectedToolIds[0] === 1} on:click={()=>{menuItemClick(0, 1)}}>
              <p>열기</p>
            </div>
            <div class:selected-tool={selectedToolIds[0] === 2} on:click={()=>{menuItemClick(0, 2)}}>
              <p>저장</p>
            </div>
          {/if}
          {#if menuId == 1}
            <div class:selected-tool={selectedToolIds[1] === 0} on:click={()=>{menuItemClick(1, 0)}}>
              <p>사각형으로 선택</p>
            </div>
            <div class:selected-tool={selectedToolIds[1] === 1} on:click={()=>{menuItemClick(1, 1)}}>
              <p>자유형으로 선택</p>
            </div>
          {/if}
          {#if menuId == 2}
            <div class:selected-tool={selectedToolIds[2] === 0} on:click={()=>{menuItemClick(2, 0)}}>
              <p>연필</p>
            </div>
            <div class:selected-tool={selectedToolIds[2] === 1} on:click={()=>{menuItemClick(2, 1)}}>
              <p>지우개</p>
            </div>
            <div class:selected-tool={selectedToolIds[2] === 2} on:click={()=>{menuItemClick(2, 2)}}>
              <p>칠하기</p>
            </div>
            <div class:selected-tool={selectedToolIds[2] === 3} on:click={()=>{menuItemClick(2, 3)}}>
              <p>돋보기</p>
            </div>
            <div class:selected-tool={selectedToolIds[2] === 4} on:click={()=>{menuItemClick(2, 4)}}>
              <p>pick color</p>
            </div>
          {/if}
          {#if menuId == 3}
            <div class:selected-tool={selectedToolIds[3] === 0} on:click={()=>{menuItemClick(3, 0)}}>
              <p>브러쉬</p>
            </div>
            <div class:selected-tool={selectedToolIds[3] === 1} on:click={()=>{menuItemClick(3, 1)}}>
              <p>스프레이</p>
            </div>
          {/if}
          {#if menuId == 4}
            <div class:selected-tool={selectedToolIds[4] === 0} on:click={()=>{menuItemClick(4, 0)}}>
              <p>사각형</p>
            </div>
            <div class:selected-tool={selectedToolIds[4] === 1} on:click={()=>{menuItemClick(4, 1)}}>
              <p>둥근 사각형</p>
            </div>
            <div class:selected-tool={selectedToolIds[4] === 2} on:click={()=>{menuItemClick(4, 2)}}>
              <p>원형</p>
            </div>
            
          {/if}
          {#if menuId == 5}
            <div class:selected-tool={selectedToolIds[5] === 0} on:click={()=>{menuItemClick(5, 0)}}>
              <p>1px</p>
            </div>
            <div class:selected-tool={selectedToolIds[5] === 1} on:click={()=>{menuItemClick(5, 1)}}>
              <p>2px</p>
            </div>
            <div class:selected-tool={selectedToolIds[5] === 2} on:click={()=>{menuItemClick(5, 2)}}>
              <p>3px</p>
            </div>
          {/if}
          {#if menuId == 6}
            <div class:selected-tool={selectedToolIds[6] === 0} on:click={()=>{menuItemClick(6, 0)}}>
              <p>흰색</p>
            </div>
            <div class:selected-tool={selectedToolIds[6] === 1} on:click={()=>{menuItemClick(6, 1)}}>
              <p>검정색</p>
            </div>
            <div class:selected-tool={selectedToolIds[6] === 2} on:click={()=>{menuItemClick(6, 2)}}>
              <p>빨강</p>
            </div>
            <div class:selected-tool={selectedToolIds[6] === 3} on:click={()=>{menuItemClick(6, 3)}}>
              <p>노랑</p>
            </div>
            <div class:selected-tool={selectedToolIds[6] === 4} on:click={()=>{menuItemClick(6, 4)}}>
              <p>연한파랑</p>
            </div>
            <div class:selected-tool={selectedToolIds[6] === 5} on:click={()=>{menuItemClick(6, 5)}}>
              <p>투명</p>
            </div>
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
  .selected-menu{
     background: gray;
  }

  .selected-tool{
    background: gray;
    font-weight: 700;
  }
  
</style>