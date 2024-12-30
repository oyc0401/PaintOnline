<script>
  import "./toolsMenu.css";
  import UndoIcon from "$lib/images/undo.png";
  import RedoIcon from "$lib/images/redo.png";
  import DisabledUndoIcon from "$lib/images/undo_disabled.png";
  import DisabledRedoIcon from "$lib/images/redo_disabled.png";
  import MenuIcon from "$lib/images/menu.png";
  import SelectionIcon from "$lib/images/selection.png";
  import FullScreenIcon from "$lib/images/full-screen.png";
  import PenIcon from "$lib/images/pen.png";

  import ToolMenu from "./toolMenu/ToolMenu.svelte";
  import ActionMenu from "./toolMenu/ActionMenu.svelte";
  import SelectionMenu from "./toolMenu/SelectionMenu.svelte";
 
  import { onMount } from 'svelte';
  
  import { menuState } from "$store/menuState.svelte.js";
  import {changeTool as setTool} from '$store/paintFunction.js'

  import { reaction , toJS} from 'mobx';

  import {redo, undo} from "$paint/src/functions.js";
  import {PaintJSState} from '$paint/state';
  let buttons = Array(7);

  import { localize } from "$src/localize/localize";

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
  }

  function closeMenu() {
    menuState.showMenu=false;
    menuState.selectedMenuId = menuState.toolMenuId;
  }
  
  function clickRedo(){
    redo();
  }

  function  clickUndo(){
    undo();
  }

 // 외부 클릭 시 메뉴를 닫도록 설정
  onMount(() => {
     
    const handleClickOutside = (event) => {
      if (menuState.showMenu && !event.target.closest('.menu-area') && !event.target.closest('button')) {
          closeMenu();
      }
    };

    reaction(
        () => PaintJSState.undos.length, // 감시할 상태
        (newValue) => {
           menuState.undoLength = newValue;
          console.log('undo:',newValue)
        }
    );
    reaction(
        () => PaintJSState.redos.length, // 감시할 상태
        (newValue) => {
           menuState.redoLength = newValue;
          console.log('redo:',newValue)
        }
    );

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
      <div class="flex-1"></div>
     <button class="menu-button" onclick={clickUndo}>
       {#if menuState.undoLength==0}
          <img src={DisabledUndoIcon} alt="undo icon" />
       {:else}
          <img src={UndoIcon} alt="undo icon" />
       {/if}

     </button>
     <button class="menu-button" onclick={clickRedo}>
       {#if menuState.redoLength==0}
         <img src={DisabledRedoIcon} alt="redo icon" />
       {:else}
         <img src={RedoIcon} alt="redo icon" />
       {/if}

     </button>
      <div class="menu-button">
         <img src={FullScreenIcon} alt="full-screen" />
      </div>
    
      {#if menuState.showMenu}
        <div class="menu-area"
           style="top: 48px;">
          {#if menuState.selectedMenuId == 0}
            <ActionMenu/>
          {/if}
          {#if menuState.selectedMenuId == 1}
            <SelectionMenu/>
          {/if}
          {#if menuState.selectedMenuId == 2}
            <ToolMenu/>
          {/if}
         </div>
      {/if}
     
   </div>
</header>