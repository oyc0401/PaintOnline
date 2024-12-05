<script>
  import Header from "./Header.svelte";
  import Canvas from "./Canvas.svelte";
  import Footer from "./Footer.svelte";
  import { onMount } from "svelte";
  import { PaintJS } from "$paint/main";
  import { i18n, localize } from "$src/localize/localize";

  let { data } = $props();
  const {lang} = data;
  i18n.lang = lang;

  const translations = {
    title: localize('Paint Online'),
    description: localize('easy paint tool'),
    ogTitle: localize('easy paint tool'),
    ogDescription: localize('this is modern easy paint tool!'),
  };

  const baseUrl = 'https://paintonline365.com';
  
  onMount(async () => {
    PaintJS.create();
  });
</script>

<svelte:head>
  <title>{translations.title}</title>
  <meta name="description" content={translations.description} />
  <meta property="og:title" content={translations.ogTitle} />
  <meta property="og:description" content={translations.ogDescription} />
  <meta property="og:url" content="https://paintonline365.com" />
  <meta property="og:image:width" content="279" />
  <meta property="og:image:height" content="279" />
  <meta property="og:image" content="https://paintonline365.com/images/icons/og-image-279x279.jpg" />
  <link rel="canonical" href={`${baseUrl}/${lang}`} />
  <link rel="alternate" href={`${baseUrl}/en`} hreflang="en" />
  <link rel="alternate" href={`${baseUrl}/ko`} hreflang="ko" />
  <link rel="alternate" href={`${baseUrl}/ja`} hreflang="ja" />
</svelte:head>

<div class="h-full flex flex-col">
  <Header></Header>

  <Canvas></Canvas>
  <Footer></Footer>
</div>
