<script>
  import "./toolsMenu.css";
  import ToolMenu from "./toolMenu/ToolMenu.svelte";
  import ActionMenu from "./toolMenu/ActionMenu.svelte";
  import SelectionMenu from "./toolMenu/SelectionMenu.svelte";
  import UndoButton from "./toolMenu/UndoButton.svelte";
  import RedoButton from "./toolMenu/RedoButton.svelte";
  import FullscreenButton from "./toolMenu/FullscreenButton.svelte";
</script>

<header>
  <div class="menus">
    <ActionMenu>0</ActionMenu>
    <SelectionMenu>1</SelectionMenu>
    <ToolMenu>2</ToolMenu>
    <div class="flex-1"></div>
    <UndoButton />
    <RedoButton />
    <FullscreenButton />
  </div>
</header>
