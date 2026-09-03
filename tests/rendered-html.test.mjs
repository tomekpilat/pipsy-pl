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

test("server-renders the calculator first and knowledge below on the home page", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /Kurs rynkowy/);
  assert.match(html, /Porównanie ofert/);
  assert.match(html, /Nie porównuj kursów/);
  assert.match(html, /Gdzie ile tracisz/);
  assert.match(html, /Cztery pojęcia i koniec/);
  assert.ok(html.indexOf("Kurs rynkowy") < html.indexOf("Nie porównuj kursów"));
  assert.ok(html.indexOf("Porównanie ofert") < html.indexOf("Artykuły"));
  assert.equal((html.match(/aria-label="Miejsce reklamowe"/g) ?? []).length, 3);
  assert.ok(html.indexOf('data-ad-placement="after-calculator"') > html.indexOf("Porównanie ofert"));
  assert.ok(html.indexOf('data-ad-placement="before-articles"') < html.indexOf("<h2>Artykuły</h2>"));
  assert.ok(html.indexOf('data-ad-placement="after-articles"') > html.indexOf("<h2>Artykuły</h2>"));
  assert.match(html, /href="#kalkulator"/);
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
  assert.match(html, /Wspólny wariant negocjacji/);
  assert.ok(html.indexOf("Oferty") < html.indexOf("Wspólny wariant negocjacji"));
  assert.ok(html.indexOf("Wspólny wariant negocjacji") < html.indexOf("Porównanie ofert"));
  assert.ok(html.indexOf("Porównanie ofert") < html.indexOf("Dodatkowy argument do rozmowy"));
  assert.equal((html.match(/Dodatkowy argument do rozmowy/g) ?? []).length, 2);
  assert.match(html, /id="table-buy-o1"/);
  assert.match(html, /id="table-sell-o1"/);
  assert.match(html, /id="table-buy-o2"/);
  assert.match(html, /id="table-sell-o2"/);
  assert.doesNotMatch(html, /kurs kupna banku|kurs sprzedaży banku/i);
  assert.match(html, /375[\s\u00a0]170,00 zł/);
  assert.doesNotMatch(html, /przelicz ranking|Ranking aktualny|2\. miejsce|najtaniej/);
  assert.equal((html.match(/quote-row-best/g) ?? []).length, 1);
  assert.match(html, /najniższy koszt/);
  assert.match(html, /łącznie/);
  assert.equal((html.match(/Warianty tej oferty/g) ?? []).length, 2);
  assert.match(html, /obecna oferta/);
  assert.match(html, /ostateczna kwota/);
  assert.match(html, /142 pips(?:<!-- -->)? · (?:<!-- -->)?słaba — negocjuj/);
  assert.match(html, /zapisz wyróżniony kurs jako ofertę/);
  assert.match(html, /Odejmij 1 pips/);
  assert.match(html, /Dodaj 1 pips/);
  assert.match(html, /374[\s\u00a0]920,00 zł/);
  assert.match(html, /117 pips/);
  assert.equal((html.match(/Wspólna liczba pipsów dla wszystkich ofert/g) ?? []).length, 1);
  assert.equal((html.match(/Skrypt rozmowy/g) ?? []).length, 2);
  assert.equal((html.match(/quote-change/g) ?? []).length, 6);
  assert.equal((html.match(/wspólny wariant/g) ?? []).length, 2);
  assert.equal((html.match(/wariant 25 pips/g) ?? []).length, 0);
  assert.ok(html.indexOf("wspólny wariant") < html.indexOf("wariant <!-- -->10<!-- --> pips"));
  assert.equal((html.match(/quote-row-comparison-best/g) ?? []).length, 1);
  assert.equal((html.match(/comparison-winner-badge/g) ?? []).length, 1);
  assert.match(html, /najlepsza przy/);
  assert.match(html, /względem najlepszej przy/);
  assert.doesNotMatch(html, /Wybierz (?:10|25|50) pips dla wszystkich ofert/);
  assert.match(html, /id="script-o1"/);
  assert.match(html, /id="script-o2"/);
  assert.doesNotMatch(html, /id="script-o3"/);
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
