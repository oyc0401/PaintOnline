<script>
   import UndoIcon from "$lib/images/undo.png";
   import DisabledUndoIcon from "$lib/images/undo_disabled.png";

   import { menuState } from "$store/menuState.svelte.js";
   import "./menu.css";
   import "../toolsMenu.css";

   import { undo } from "$paint/src/functions.js";
</script>

<button class="menu-button" onclick={undo}>
   {#if menuState.undoLength == 0}
      <img src={DisabledUndoIcon} alt="undo icon" />
   {:else}
      <img src={UndoIcon} alt="undo icon" />
   {/if}
</button>
