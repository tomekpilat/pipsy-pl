import assert from "node:assert/strict";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("https://pipsy.test/", { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the pipsy calculator", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>pipsy\.pl — policz, zanim zadzwonisz<\/title>/i);
  assert.match(html, /Kurs rynkowy/);
  assert.match(html, /Porównanie ofert/);
  assert.match(html, /Negocjacja/);
  assert.match(html, /375[\s\u00a0]170,00 zł/);
  assert.match(html, /https:\/\/pipsy\.pl\/og\.png/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape|react-loading-skeleton/i);
});

test("includes both transaction directions and accessible input labels", async () => {
  const response = await render();
  const html = await response.text();
  assert.match(html, />kupuję</);
  assert.match(html, />sprzedaję</);
  assert.match(html, /Średni kurs rynkowy/);
  assert.match(html, /Kwota transakcji/);
  assert.match(html, /Kierunek transakcji/);
});
