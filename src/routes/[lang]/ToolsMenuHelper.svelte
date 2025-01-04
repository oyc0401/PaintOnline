<script>
  import "./toolsMenu.css";
  import { onMount } from "svelte";

  import { menuState } from "$store/menuState.svelte.js";
  import { reaction } from "mobx";

  import { PaintJSState,PaintMobXState } from "$paint/state";

  import { closeDropdown } from "$store/paintFunction.js";

  // 외부 클릭 시 메뉴를 닫도록 설정
  onMount(() => {
    const handleClickOutside = (event) => {
      if (
        menuState.showDropdown &&
        !event.target.closest(".dropdown-area") &&
        !event.target.closest("button")
      ) {
        closeDropdown();
      }
    };

    reaction(
      () => PaintMobXState.undo_length, // 감시할 상태
      (newValue) => {
        menuState.undoLength = newValue;
        console.log("undo:", newValue);
      },
    );
    reaction(
      () => PaintMobXState.redo_length, // 감시할 상태
      (newValue) => {
        menuState.redoLength = newValue;
        console.log("redo:", newValue);
      },
    );

    // document.addEventListener('click', handleClickOutside);
    document.addEventListener("pointerdown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("pointerdown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  });
</script>

<div></div>
