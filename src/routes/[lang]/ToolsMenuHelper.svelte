<script>
  import "./toolsMenu.css";
  import { onMount } from "svelte";
  import { menuState } from "$store/menuState.svelte.js";
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
