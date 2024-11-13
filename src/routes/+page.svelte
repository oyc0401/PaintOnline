<script>
  import Header from './Header.svelte';
  import Canvas from './Canvas.svelte';
  import Footer from './Footer.svelte';
  
  import { onMount } from 'svelte';
  import {setupApp} from "../appSetup.js"
  import {setupState} from "../setupState";
  let preSetting;
  
  onMount( async() => { 
    // 클라이언트 환경에서만 동적으로 import
    const module = await import('../preSetting');
    const {preSetting,setAppParams,setSession} = module;

    // preSetting 함수나 객체를 여기서 사용
   preSetting();
 
    setupState();
    
    setAppParams();
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

