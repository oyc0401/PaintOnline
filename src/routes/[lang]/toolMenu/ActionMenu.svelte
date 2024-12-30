<script>
  import MenuIcon from "$lib/images/menu.png";
  import { menuState } from "$store/menuState.svelte.js";
  import { openMenu } from "$store/paintFunction.js";
  import "./menu.css";
  import "../toolsMenu.css";
  const MENU_NUMBER = 0;
  
</script>
<div>
  <button class="menu-button"
    class:selected-menu={menuState.selectedMenuId === MENU_NUMBER}
    onclick={()=>openMenu(MENU_NUMBER)}>
     <img src={MenuIcon} alt="menu" />
  </button>

  {#if menuState.showMenu && menuState.selectedMenuId == MENU_NUMBER}
    <div class="menu-area menu-top">
      <div class="menuDropdown">
        <button onclick={() => console.log("새창")}>
          <p>새창</p>
        </button>
        <button onclick={() => console.log("열기")}>
          <p>열기</p>
        </button>
        <button onclick={() => console.log("저장")}>
          <p>저장</p>
        </button>
      </div>
    </div>
  {/if}
</div>






