import assert from "node:assert/strict";
import test from "node:test";

async function render(path = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(`https://pipsy.test${path}`, { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the landing page with working destinations", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /Nie porównuj kursów/);
  assert.match(html, /Gdzie ile tracisz/);
  assert.match(html, /Cztery pojęcia i koniec/);
  assert.match(html, /href="\/kalkulator"/);
  assert.match(html, /id="ranking"/);
  assert.match(html, /id="faq"/);
  assert.match(html, /\/og-v2\.jpg/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape|react-loading-skeleton/i);
});

test("server-renders the pipsy calculator at its own route", async () => {
  const response = await render("/kalkulator");
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /Kurs rynkowy/);
  assert.match(html, /Porównanie ofert/);
  assert.match(html, /Negocjacja/);
  assert.match(html, /375[\s\u00a0]170,00 zł/);
  assert.match(html, /przelicz ranking/);
  assert.match(html, /Ranking aktualny/);
  assert.match(html, /40 pips(?:<!-- -->)? efektywnie/);
  assert.match(html, /374[\s\u00a0]150 zł(?:<!-- -->)? łącznie/);
  assert.match(html, /łącznie/);
  assert.match(html, /Szybkie liczenie w trakcie negocjacji/);
  assert.match(html, /zapisz jako kurs oferty/);
  assert.match(html, /Odejmij 1 pips/);
  assert.match(html, /Dodaj 1 pips/);
  assert.match(html, /374[\s\u00a0]920 zł/);
  assert.match(html, /117 pips(?:<!-- -->)? efektywnie/);
  assert.match(html, /https:\/\/pipsy\.pl\/og-v2\.jpg/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape|react-loading-skeleton/i);
});

test("includes both transaction directions and accessible input labels", async () => {
  const response = await render("/kalkulator");
  const html = await response.text();
  assert.match(html, />kupuję</);
  assert.match(html, />sprzedaję</);
  assert.match(html, /Średni kurs rynkowy/);
  assert.match(html, /Kwota transakcji/);
  assert.match(html, /Kierunek transakcji/);
});
