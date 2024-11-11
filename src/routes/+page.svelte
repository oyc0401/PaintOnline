<script>
  import Header from './Header.svelte';
  import Canvas from './Canvas.svelte';
  import Footer from './Footer.svelte';
  
  import welcome from '$lib/images/svelte-welcome.webp';
  import welcome_fallback from '$lib/images/svelte-welcome.png';
  import { onMount } from 'svelte';
  import {setupApp} from "../appSetup.js"
  import {setupState} from "../setupState";
  
  
  onMount(() => { 
      //setupState();

    setupApp();
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

