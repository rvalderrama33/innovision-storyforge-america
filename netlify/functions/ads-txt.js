exports.handler = async function () {
  const body = [
    "google.com, pub-3665365079867533, DIRECT, f08c47fec0942fa0",
    "googlesyndication.com, pub-3665365079867533, DIRECT, f08c47fec0942fa0",
  ].join("\n") + "\n";

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
    body,
  };
};
