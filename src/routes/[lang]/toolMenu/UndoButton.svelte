<script>
   import UndoIcon from "$lib/images/undo.svelte";

   import { menuState } from "$store/menuState.svelte.js";
   import "./menu.css";
   import "../toolsMenu.css";

   import { undo } from "$paint/src/history.js";
</script>

<button
   class="menu-button"
   class:history-disabled={menuState.undoLength == 0}
   onclick={undo}
>
   <UndoIcon />
</button>