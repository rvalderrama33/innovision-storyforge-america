exports.handler = async function () {
  try {
    const upstream = "https://enckzbxifdrihnfcqagb.supabase.co/functions/v1/sitemap";
    const res = await fetch(upstream, { headers: { Accept: "application/xml" } });
    const xml = await res.text();

    if (!res.ok || !xml) {
      throw new Error(`Upstream sitemap error: ${res.status}`);
    }

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
      },
      body: xml,
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
      body: `Sitemap generation failed: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
};
