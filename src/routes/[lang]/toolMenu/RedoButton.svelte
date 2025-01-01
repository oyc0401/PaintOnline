<script>
   import RedoIcon from "$lib/images/redo.svelte";
   import { menuState } from "$store/menuState.svelte.js";
   import "./menu.css";
   import "../toolsMenu.css";
   import { redo } from "$paint/src/functions.js";
</script>


<button
   class="menu-button"
   class:history-disabled={menuState.redoLength == 0}
   onclick={redo}
>
   <RedoIcon />
</button>

