<script>
   import RedoIcon from "$lib/images/redo.png";
   import DisabledRedoIcon from "$lib/images/redo_disabled.png";

   import { menuState } from "$store/menuState.svelte.js";
   import "./menu.css";
   import "../toolsMenu.css";
   import { redo } from "$paint/src/functions.js";
</script>

<button class="menu-button" onclick={redo}>
   {#if menuState.redoLength == 0}
      <img src={DisabledRedoIcon} alt="redo icon" />
   {:else}
      <img src={RedoIcon} alt="redo icon" />
   {/if}
</button>
