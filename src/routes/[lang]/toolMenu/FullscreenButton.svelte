<script>
  import FullScreenIcon from "$lib/images/full_screen.svelte";

  import "./menu.css";
  import "../toolsMenu.css";

  function setFullscreen() {
    // 전체 화면으로 만들 요소 (여기서는 <html> 전체)
    const element = document.documentElement;
    if (element.requestFullscreen) {
      element.requestFullscreen(); // 표준 방식
    } else if (element.webkitRequestFullscreen) {
      element.webkitRequestFullscreen(); // Safari
    } else if (element.msRequestFullscreen) {
      element.msRequestFullscreen(); // IE
    }
  }

  function exitFullscreen() {
    if (document.exitFullscreen) {
      document.exitFullscreen(); // 표준 방식
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen(); // Safari
    } else if (document.msExitFullscreen) {
      document.msExitFullscreen(); // IE
    }
  }

  function toggleFullscreen() {
    if (document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement) {
      exitFullscreen();
    } else {
      setFullscreen();
    }
  }
</script>

<button class="menu-button" onclick={toggleFullscreen}>
  <FullScreenIcon />
</button>
