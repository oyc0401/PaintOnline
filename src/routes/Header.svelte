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

  import ActionMenu from "./toolMenu/ActionMenu.svelte";
  import SelectionMenu from "./toolMenu/SelectionMenu.svelte";
  import ToolMenu from "./toolMenu/ToolMenu.svelte";
  import BrushMenu from "./toolMenu/BrushMenu.svelte";
  import ShapeMenu from "./toolMenu/ShapeMenu.svelte";
  import ColorMenu from "./toolMenu/ColorMenu.svelte";
  
  import { onMount } from 'svelte';
  
  import { menuState, changeTool as setTool} from "../store/menuState.svelte.js";

  let buttons = Array(7);

  const openMenu = (id) => {
    if(!menuState.showMenu){
      menuState.showMenu = true;
    } else if (id == menuState.selectedMenuId){
        closeMenu();
    } 
    menuState.selectedMenuId = id;
    if(menuState.selectedTools[id]){
      setTool(menuState.selectedTools[id],id);
    }
  
    // if(showMenu){
    //   const rect = buttons[id].getBoundingClientRect();
    //    menuPosition = {
    //      top: rect.bottom + window.scrollY,
    //      left: rect.left + window.scrollX
    //    };
    // }
  
  }

  function closeMenu() {
    menuState.showMenu=false;
    menuState.selectedMenuId = menuState.toolMenuId;
  }
  
  

 // 외부 클릭 시 메뉴를 닫도록 설정
  onMount(() => {
     
    const handleClickOutside = (event) => {
      if (menuState.showMenu && !event.target.closest('.menu-area') && !event.target.closest('button')) {
          closeMenu();
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
      <button class="menu-button" class:selected-menu={menuState.selectedMenuId === 0} bind:this={buttons[0]} onclick={()=>openMenu(0)}>
         <img src={MenuIcon} alt="menu" />
      </button>
      <button class="menu-button" class:selected-menu={menuState.selectedMenuId === 1} bind:this={buttons[1]} onclick={()=>openMenu(1)}>
        <img src={SelectionIcon} alt="selection" />
      </button>
     <button class="menu-button" class:selected-menu={menuState.selectedMenuId === 2} bind:this={buttons[2]} onclick={()=>openMenu(2)}>
       <img src={PenIcon} alt="tools" />
     </button>
     <button class="menu-button" class:selected-menu={menuState.selectedMenuId === 3} bind:this={buttons[3]} onclick={()=>openMenu(3)}>
        <img src={BrushIcon} alt="brush" />
      </button>
     <button class="menu-button" class:selected-menu={menuState.selectedMenuId === 4} bind:this={buttons[4]} onclick={()=>openMenu(4)}>
        <img src={RectangleIcon} alt="shapes" />
      </button>
     <button class="menu-button" class:selected-menu={menuState.selectedMenuId === 5} bind:this={buttons[5]} onclick={()=>openMenu(5)}>
        <img src={LineIcon} alt="line" />
      </button>
     <button class="menu-button" class:selected-menu={menuState.selectedMenuId === 6} bind:this={buttons[6]} onclick={()=>openMenu(6)}>
        <img src={ColorIcon} alt="color" />
      </button>
      <div class="flex-1"></div>
      <div class="menu-button">
         <img src={FullScreenIcon} alt="full-screen" />
      </div>
    
      {#if menuState.showMenu}
        <div class="menu-area"
           style="top: 88px;">
          {#if menuState.selectedMenuId == 0}
            <ActionMenu/>
          {/if}
          {#if menuState.selectedMenuId == 1}
            <SelectionMenu/>
          {/if}
          {#if menuState.selectedMenuId == 2}
            <ToolMenu/>
          {/if}
          {#if menuState.selectedMenuId == 3}
            <BrushMenu/>
          {/if}
          {#if menuState.selectedMenuId == 4}
            <ShapeMenu/>
          {/if}
       
          {#if menuState.selectedMenuId == 6}
            <ColorMenu/>
          {/if}
         </div>
      {/if}
     
   </div>
  
</header>

<style>
  .menu-area {
     position: absolute;
     z-index: 10;
     width:100%;
   }

  .selected-menu{
     background: #FCFCFD;
  }

 
  
</style>