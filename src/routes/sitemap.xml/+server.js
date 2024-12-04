// src/routes/sitemap.xml/+server.js
export async function GET() {
  const baseUrl = 'https://paintonline365.com';
  const languages = ['en', 'ko', 'ja'];
  const lastmod = new Date().toISOString();

  // sitemap 콘텐츠 생성
  const sitemap = `
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
            xmlns:xhtml="http://www.w3.org/1999/xhtml">
      <url>
        <loc>${baseUrl}/</loc>
        ${languages
          .map(
            (lang) =>
              `<xhtml:link rel="alternate" hreflang="${lang}" href="${baseUrl}/${lang}/" />`
          )
          .join('\n')}
        <lastmod>${lastmod}</lastmod>
      </url>
    </urlset>
  `.trim();

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
    },
  });
}
