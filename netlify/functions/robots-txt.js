exports.handler = async function () {
  const body = `User-agent: *\nAllow: /\nAllow: /about\nAllow: /stories\nAllow: /article/*\nAllow: /sitemap.xml\n\nDisallow: /admin\nDisallow: /auth\nDisallow: /submit\n\nSitemap: https://americainnovates.us/sitemap.xml\n\n# Block AI training crawlers\nUser-agent: GPTBot\nDisallow: /\n\nUser-agent: ChatGPT-User\nDisallow: /\n\nUser-agent: CCBot\nDisallow: /\n\nUser-agent: anthropic-ai\nDisallow: /\n\nUser-agent: Claude-Web\nDisallow: /\n`;

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
    body,
  };
};
