<script>
  import Header from './Header.svelte';
  import Canvas from './Canvas.svelte';
  import Footer from './Footer.svelte';
  
  import { onMount } from 'svelte';
  
  onMount( async() => { 
    // 클라이언트 환경에서만 동적으로 import
    const {preSetting, setSession} = await import('../preSetting');
    const {setupState} = await import('../setupState.js');
    const {setupApp} = await import('../appSetup.js');
   

    // preSetting 함수나 객체를 여기서 사용
    preSetting();
 
    setupState();
      
    setupApp();
  
    setSession();
  });

</script>

<svelte:head>
  <title>Home</title>
  <meta name="description" content="Svelte demo app" />
</svelte:head>

<div class='h-full flex flex-col'>
   <Header></Header>
  
 <Canvas></Canvas>
  <Footer>
  </Footer>
</div>

