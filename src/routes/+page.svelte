<script>
  import Header from './Header.svelte';
  import Canvas from './Canvas.svelte';
  import Footer from './Footer.svelte';
  
  import welcome from '$lib/images/svelte-welcome.webp';
  import welcome_fallback from '$lib/images/svelte-welcome.png';


  export let data;
  console.log(data)
</script>

<svelte:head>
  <title>Home</title>
  <meta name="description" content="Svelte demo app" />
</svelte:head>

<section>
   <Header></Header>
  
 <Canvas></Canvas>
  <Footer>
  </Footer>
</section>

