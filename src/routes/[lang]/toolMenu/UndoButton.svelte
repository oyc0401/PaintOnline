<script>
   import UndoIcon from "$lib/images/undo.svelte";

   import { menuState } from "$store/menuState.svelte.js";
   import { drawjs } from "$store/paintStore";
   import "./menu.css";
   import "../toolsMenu.css";

   function undo() {
      drawjs.undo();
   }
   
</script>

<button
   class="menu-button"
   class:history-disabled={menuState.undoLength == 0}
   onclick={undo}
>
   <UndoIcon />
</button>
