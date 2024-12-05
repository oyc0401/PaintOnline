export const GET = async () => {
  const urls = ['', '/en', '/ko', '/ja'];
  const today = new Date().toISOString();
  const sitemap = `
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      ${urls
        .map(
          (url) => `
        <url>
          <loc>${`https://paintonline365.com${url}`}</loc>
          <lastmod>${today}</lastmod>
          <changefreq>weekly</changefreq>
        </url>
      `
        )
        .join('')}
    </urlset>
  `.trim();

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
    },
  });
};
