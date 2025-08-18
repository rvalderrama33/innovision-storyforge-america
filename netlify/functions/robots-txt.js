exports.handler = async function () {
  const body = `User-agent: *\nAllow: /\nAllow: /about\nAllow: /stories\nAllow: /article/*\nAllow: /sitemap.xml\n\nDisallow: /admin\nDisallow: /auth\nDisallow: /submit\n\nSitemap: https://enckzbxifdrihnfcqagb.supabase.co/functions/v1/sitemap\n`;

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
    body,
  };
};
