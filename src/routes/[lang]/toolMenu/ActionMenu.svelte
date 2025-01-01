<script>
  import MenuIcon from "$lib/images/menu.svelte";
  import OpenIcon from "$lib/images/open.svelte";

  import NewFileIcon from "$lib/images/new_file.svelte";
  import SaveIcon from "$lib/images/save.svelte";

  import { menuState } from "$store/menuState.svelte.js";
  import { quickClickMenu, closeDropdown } from "$store/paintFunction.js";
  import { file_save, file_new,file_open } from "$paint/src/functions.js";
  import "./menu.css";
  import "../toolsMenu.css";
  const MENU_NUMBER = 0;

  function saveFile() {
    file_save();
    closeDropdown();
  }

  function newFile() {
    file_new();
    closeDropdown();
  }

  function openFile(){
    file_open();
     closeDropdown();
  }
</script>

<div>
  <button
    class="menu-button"
    class:selected-menu={menuState.toolMenuId === MENU_NUMBER}
    onclick={() => quickClickMenu(MENU_NUMBER)}
  >
    <MenuIcon />
  </button>

  {#if menuState.showDropdown && menuState.dropdownId == MENU_NUMBER}
    <div class="dropdown-area small-dropdown menu-top">
      <button class="dropdown-button" onclick={newFile}>
        <NewFileIcon/>
        <p>새로 만들기</p>
      </button>
      <button class="dropdown-button" onclick={openFile}>
        <OpenIcon/>
        <p>열기</p>
      </button>
      <button class="dropdown-button" onclick={saveFile}>
        <SaveIcon/>
        <p>저장</p>
      </button>
    </div>
  {/if}
</div>
