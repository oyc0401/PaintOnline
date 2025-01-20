<script>
  import MenuIcon from "$lib/images/menu.svelte";
  import OpenIcon from "$lib/images/open.svelte";

  import NewFileIcon from "$lib/images/new_file.svelte";
  import SaveIcon from "$lib/images/save.svelte";

  import { menuState } from "$store/menuState.svelte.js";
  import { quickClickMenu, closeDropdown } from "$store/paintFunction.js";
  import { i18n, localize } from "$src/localize/localize";
  import { drawjs } from "$store/paintStore";

  import "./menu.css";
  import "../toolsMenu.css";
  const MENU_NUMBER = 0;

  function saveFile() {
    drawjs.downloadFile();
    closeDropdown();
  }

  function newFile() {
    drawjs.newFile();
    closeDropdown();
  }

  function openFile() {
    drawjs.openFile();
    closeDropdown();
  }
</script>

<div>
  <button
    title={localize("File")}
    class="menu-button"
    class:selected-menu={menuState.toolMenuId === MENU_NUMBER}
    onclick={() => quickClickMenu(MENU_NUMBER)}
  >
    <MenuIcon />
  </button>

  {#if menuState.showDropdown && menuState.dropdownId == MENU_NUMBER}
    <div class="dropdown-area small-dropdown menu-top">
      <button title={localize("New")} class="dropdown-button" onclick={newFile}>
        <NewFileIcon />
        <p>{localize("New")}</p>
      </button>
      <button
        title={localize("Open")}
        class="dropdown-button"
        onclick={openFile}
      >
        <OpenIcon />
        <p>{localize("Open")}</p>
      </button>
      <button
        title={localize("Save")}
        class="dropdown-button"
        onclick={saveFile}
      >
        <SaveIcon />
        <p>{localize("Save")}</p>
      </button>
    </div>
  {/if}
</div>
