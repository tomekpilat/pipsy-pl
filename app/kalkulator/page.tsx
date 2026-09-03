"use client";

import { useEffect, useMemo, useState } from "react";

type Direction = "buy" | "sell";
type Currency = "USD" | "EUR" | "GBP" | "CHF";
type Offer = { id: string; name: string; rate: string; commissionPct: string; fixedFee: string; transferFee: string };
type Preset = Omit<Offer, "rate">;

const GRADE_STOPS = [
  { max: 50, label: "bardzo dobra", tone: "green" },
  { max: 100, label: "dobra", tone: "green" },
  { max: 130, label: "akceptowalna", tone: "yellow" },
  { max: 200, label: "słaba — negocjuj", tone: "orange" },
  { max: 300, label: "tabela bankowa", tone: "red" },
  { max: Number.POSITIVE_INFINITY, label: "kurs lotniskowy", tone: "red" },
] as const;

const CURRENCY_WORDS: Record<Currency, string> = { USD: "dolarów", EUR: "euro", GBP: "funtów", CHF: "franków" };

const INITIAL_OFFERS: Offer[] = [
  { id: "o1", name: "kantor internetowy", rate: "3.7517", commissionPct: "0", fixedFee: "0", transferFee: "0" },
  { id: "o2", name: "bank — tabela", rate: "3.7596", commissionPct: "0", fixedFee: "0", transferFee: "250" },
];

const INITIAL_PRESETS: Preset[] = [
  { id: "p1", name: "kantor internetowy", commissionPct: "0", fixedFee: "0", transferFee: "0" },
  { id: "p2", name: "platforma P2P", commissionPct: "0.2", fixedFee: "0", transferFee: "0" },
  { id: "p3", name: "bank — przelew SWIFT", commissionPct: "0", fixedFee: "0", transferFee: "250" },
];

const numberFrom = (value: string) => {
  const normalized = value.replace(/\s/g, "").replace(",", ".");
  if (!normalized) return Number.NaN;
  return Number.parseFloat(normalized);
};

const money = (value: number, digits = 2) => Number.isFinite(value)
  ? `${value.toLocaleString("pl-PL", { minimumFractionDigits: digits, maximumFractionDigits: digits })} zł`
  : "—";
const rate4 = (value: number) => Number.isFinite(value) ? value.toFixed(4) : "—";
const spokenRate = (value: number) => rate4(value).replace(".", ",");

export default function Home() {
  const [midInput, setMidInput] = useState("3.7375");
  const [midTimestamp, setMidTimestamp] = useState(() => Date.now());
  const [now, setNow] = useState(() => Date.now());
  const [halfSpreadInput, setHalfSpreadInput] = useState("0.0015");
  const [direction, setDirection] = useState<Direction>("buy");
  const [amountInput, setAmountInput] = useState("100000");
  const [currency, setCurrency] = useState<Currency>("USD");
  const [offers, setOffers] = useState<Offer[]>(INITIAL_OFFERS);
  const [presets, setPresets] = useState<Preset[]>(INITIAL_PRESETS);
  const [tableBuy, setTableBuy] = useState("");
  const [tableSell, setTableSell] = useState("");
  const [copiedScriptId, setCopiedScriptId] = useState("");
  const [savedId, setSavedId] = useState("");
  const [comparisonPipsInput, setComparisonPipsInput] = useState("25");

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 20_000);
    try {
      const saved = window.localStorage.getItem("pipsy.presets");
      if (saved) {
        const parsed = JSON.parse(saved) as Preset[];
        if (Array.isArray(parsed) && parsed.length) setPresets(parsed);
      }
    } catch {}
    return () => window.clearInterval(timer);
  }, []);

  const model = useMemo(() => {
    const mid = numberFrom(midInput);
    const amount = numberFrom(amountInput);
    const enteredHalfSpread = numberFrom(halfSpreadInput);
    const halfSpread = Number.isFinite(enteredHalfSpread) ? enteredHalfSpread : 0.0015;
    const hasMid = Number.isFinite(mid) && mid > 0;
    const hasAmount = Number.isFinite(amount) && amount > 0;
    const buy = direction === "buy";
    const ask = hasMid ? mid + halfSpread : Number.NaN;
    const bid = hasMid ? mid - halfSpread : Number.NaN;
    const pipValue = hasAmount ? amount * 0.0001 : Number.NaN;
    const notional = hasMid && hasAmount ? amount * mid : Number.NaN;

    const calculated = offers.map((offer) => {
      const rate = numberFrom(offer.rate);
      const percentagePoints = numberFrom(offer.commissionPct);
      const pct = (Number.isFinite(percentagePoints) ? percentagePoints : 0) / 100;
      const fixedFee = numberFrom(offer.fixedFee);
      const transferFee = numberFrom(offer.transferFee);
      const fixed = Number.isFinite(fixedFee) ? fixedFee : 0;
      const transfer = Number.isFinite(transferFee) ? transferFee : 0;
      const valid = hasMid && hasAmount && Number.isFinite(rate) && rate > 0;
      const gross = amount * rate;
      const commission = gross * pct + fixed;
      const total = buy ? gross + commission + transfer : gross - commission - transfer;
      const effectiveRate = total / amount;
      const effectivePips = (buy ? effectiveRate - mid : mid - effectiveRate) * 10_000;
      const fixedFeePips = ((fixed + transfer) / amount) * 10_000;
      return { offer, rate, percentagePoints: Number.isFinite(percentagePoints) ? percentagePoints : 0, valid, commission, total, effectiveRate, effectivePips, fixedFeePips };
    });

    const ranked = calculated.filter((result) => result.valid).sort((a, b) => buy ? a.total - b.total : b.total - a.total);
    const negotiable = hasMid && hasAmount && notional >= 100_000;
    const floor = buy ? ask : bid;
    const opening = buy ? ask + 0.004 : bid - 0.004;
    const target = buy ? ask + 0.008 : bid - 0.008;
    const targetHigh = buy ? ask + 0.011 : bid - 0.011;
    const ageMinutes = Math.max(0, Math.floor((now - midTimestamp) / 60_000));
    const ageLevel = ageMinutes >= 30 ? "critical" : ageMinutes >= 15 ? "warning" : "fresh";

    return { mid, amount, halfSpread, hasMid, hasAmount, buy, ask, bid, pipValue, notional, calculated, ranked, negotiable, floor, opening, target, targetHigh, ageMinutes, ageLevel };
  }, [midInput, amountInput, halfSpreadInput, direction, offers, now, midTimestamp]);

  const displayedResults = model.calculated;
  const bestResult = model.ranked[0];
  const pipsFromMid = (rate: number) => Number.isFinite(rate) && model.hasMid
    ? (model.buy ? rate - model.mid : model.mid - rate) * 10_000
    : Number.NaN;
  const pips = (value: number) => Number.isFinite(value) ? `${Math.round(value)} pips` : "— pips";
  const offerQuoteAtRate = (offer: Offer, rate: number) => {
    if (!model.hasMid || !model.hasAmount || !Number.isFinite(rate) || rate <= 0) return { total: Number.NaN, effectivePips: Number.NaN };
    const percentagePoints = numberFrom(offer.commissionPct);
    const percentage = (Number.isFinite(percentagePoints) ? percentagePoints : 0) / 100;
    const fixedFee = numberFrom(offer.fixedFee);
    const transferFee = numberFrom(offer.transferFee);
    const gross = model.amount * rate;
    const fees = gross * percentage + (Number.isFinite(fixedFee) ? fixedFee : 0) + (Number.isFinite(transferFee) ? transferFee : 0);
    const total = model.buy ? gross + fees : gross - fees;
    const effectiveRate = total / model.amount;
    const effectivePips = (model.buy ? effectiveRate - model.mid : model.mid - effectiveRate) * 10_000;
    return { total, effectivePips };
  };

  const comparisonPipsValue = numberFrom(comparisonPipsInput);
  const comparisonPips = Number.isFinite(comparisonPipsValue) ? Math.max(0, comparisonPipsValue) : Number.NaN;

  const nudgeComparisonPips = (change: number) => {
    const currentPips = numberFrom(comparisonPipsInput);
    const nextPips = Math.max(0, Math.round(((Number.isFinite(currentPips) ? currentPips : 0) + change) * 10) / 10);
    setComparisonPipsInput(`${nextPips}`);
    setCopiedScriptId("");
  };

  const tableSkew = useMemo(() => {
    const buyRate = numberFrom(tableBuy);
    const sellRate = numberFrom(tableSell);
    if (!model.hasMid || !Number.isFinite(buyRate) || !Number.isFinite(sellRate)) return "";
    const skew = ((buyRate + sellRate) / 2 - model.mid) * 10_000;
    if (model.buy && skew > 10) return `Środek tabeli jest ${Math.round(skew)} pipsów nad rynkiem — tabela jest przesunięta przeciw kupującym. Powiedz to na głos.`;
    if (!model.buy && skew < -10) return `Środek tabeli jest ${Math.round(-skew)} pipsów pod rynkiem — przesunięcie działa przeciw sprzedającym. Warto o tym wspomnieć.`;
    return `Tabela jest symetryczna wobec rynku (${Math.round(skew)} pipsów) — tu argumentu nie ma.`;
  }, [tableBuy, tableSell, model.hasMid, model.mid, model.buy]);

  const updateOffer = (id: string, field: keyof Omit<Offer, "id">, value: string) => {
    setOffers((current) => current.map((offer) => offer.id === id ? { ...offer, [field]: value } : offer));
    setSavedId("");
    setCopiedScriptId("");
  };

  const addOffer = (preset?: Preset) => {
    setOffers((current) => [...current, {
      id: `o${Date.now()}`, name: preset?.name ?? "", rate: "", commissionPct: preset?.commissionPct ?? "",
      fixedFee: preset?.fixedFee ?? "", transferFee: preset?.transferFee ?? "",
    }]);
  };

  const savePreset = (offer: Offer) => {
    const next = [...presets, { id: `p${Date.now()}`, name: offer.name || "bez nazwy", commissionPct: offer.commissionPct, fixedFee: offer.fixedFee, transferFee: offer.transferFee }];
    setPresets(next);
    setSavedId(offer.id);
    try { window.localStorage.setItem("pipsy.presets", JSON.stringify(next)); } catch {}
  };

  const clearPresets = () => {
    setPresets([]);
    try { window.localStorage.removeItem("pipsy.presets"); } catch {}
  };

  const copyOfferScript = async (id: string, script: string) => {
    try { await navigator.clipboard.writeText(script); setCopiedScriptId(id); } catch { setCopiedScriptId(""); }
  };

  const validCount = model.ranked.length;
  const nearTie = model.ranked.length >= 2 && Math.abs(model.ranked[0].total - model.ranked[1].total) < 20;

  return (
    <div className="app-shell">
      <header className="control-panel">
        <a className="brand" aria-label="pipsy.pl — strona główna" href="/">
          <span className="brand-mark" aria-hidden="true"><i /><i /><i /></span>
          <span>pipsy<span>.pl</span></span>
        </a>

        <section className="control-section market-rate-section">
          <p className="eyebrow">Kurs rynkowy</p>
          <label className="sr-only" htmlFor="mid-rate">Średni kurs rynkowy</label>
          <input id="mid-rate" className={`mid-input age-${model.ageLevel}`} inputMode="decimal" value={midInput}
            onChange={(event) => { setMidInput(event.target.value); setMidTimestamp(Date.now()); setCopiedScriptId(""); }} placeholder="3.7375" />
          <div className="rate-status-row">
            <span className={`rate-age age-${model.ageLevel}`}><i />{!model.hasMid ? "brak kursu" : model.ageMinutes < 1 ? "sprawdzony teraz" : `sprzed ${model.ageMinutes} min`}</span>
            <button className="subtle-button" type="button" onClick={() => setMidTimestamp(Date.now())}>odświeżyłem</button>
          </div>
          <p className="pair-label">{currency}/PLN</p>
          <p className="rate-source"><strong>Źródło: wpis ręczny.</strong> Kalkulator nie pobiera kursu online; wartość startowa 3,7375 jest tylko przykładem, nie kursem live.</p>
          <label className="spread-control">
            <span>połowa spreadu</span>
            <input inputMode="decimal" value={halfSpreadInput} onChange={(event) => { setHalfSpreadInput(event.target.value); setCopiedScriptId(""); }} />
            <span>= {Math.round(model.halfSpread * 10_000)} pips</span>
          </label>
        </section>

        <section className="market-grid" aria-label="Parametry rynku">
          <div><span>ask</span><strong>{rate4(model.ask)}</strong><small>{pips(pipsFromMid(model.ask))} od mid</small></div>
          <div><span>bid</span><strong>{rate4(model.bid)}</strong><small>{pips(pipsFromMid(model.bid))} od mid</small></div>
          <div className="pip-tile"><span>1 pips</span><strong>{money(model.pipValue)}</strong><small>przy tej kwocie</small></div>
        </section>

        <section className="control-section transaction-section">
          <p className="eyebrow">Transakcja</p>
          <div className="direction-switch" role="group" aria-label="Kierunek transakcji">
            <button type="button" className={model.buy ? "active" : ""} aria-pressed={model.buy} onClick={() => { setDirection("buy"); setCopiedScriptId(""); }}>kupuję</button>
            <button type="button" className={!model.buy ? "active" : ""} aria-pressed={!model.buy} onClick={() => { setDirection("sell"); setCopiedScriptId(""); }}>sprzedaję</button>
          </div>
          <div className="amount-row">
            <label className="sr-only" htmlFor="amount">Kwota transakcji</label>
            <input id="amount" inputMode="decimal" value={amountInput} onChange={(event) => { setAmountInput(event.target.value); setCopiedScriptId(""); }} />
            <label className="sr-only" htmlFor="currency">Waluta</label>
            <select id="currency" value={currency} onChange={(event) => { setCurrency(event.target.value as Currency); setCopiedScriptId(""); }}>
              <option>USD</option><option>EUR</option><option>GBP</option><option>CHF</option>
            </select>
          </div>
          <p className="transaction-detail">wartość <strong>{money(model.notional, 0)}</strong> · ruch 25 pips <strong>{money(25 * model.pipValue, 0)}</strong></p>
        </section>

        {model.ageLevel !== "fresh" && model.hasMid && <div className={`age-message ${model.ageLevel}`}>
          {model.ageLevel === "critical" ? "Kurs ma ponad pół godziny. Odśwież go — na starych danych ten kalkulator daje fałszywą pewność." : `Kurs sprzed ${model.ageMinutes} min. Zerknij jeszcze raz przed telefonem.`}
        </div>}
      </header>

      <main className="workspace">
        <header className="offers-header">
          <h1>Oferty <span>— porównanie kwot końcowych</span></h1>
          <div className="header-actions">
            <label className="sr-only" htmlFor="preset">Dodaj z zapisanych profili</label>
            <select id="preset" defaultValue="" onChange={(event) => { const preset = presets.find((item) => item.id === event.target.value); if (preset) addOffer(preset); event.target.value = ""; }}>
              <option value="">z zapisanych…</option>
              {presets.map((preset) => <option key={preset.id} value={preset.id}>{preset.name}</option>)}
            </select>
            <button className="primary-button" type="button" onClick={() => addOffer()}>+ oferta</button>
          </div>
        </header>

        <section className="global-pips-panel offers-pips-panel" aria-labelledby="global-pips-title">
          <p className="eyebrow" id="global-pips-title">Wspólny wariant negocjacji</p>
          <div className="scenario-pips-input global-pips-input">
            <button type="button" aria-label="Odejmij 1 pips we wszystkich ofertach" disabled={!Number.isFinite(comparisonPips) || comparisonPips <= 0} onClick={() => nudgeComparisonPips(-1)}>−</button>
            <input aria-label="Wspólna liczba pipsów dla wszystkich ofert" inputMode="decimal" value={comparisonPipsInput} onChange={(event) => { setComparisonPipsInput(event.target.value); setCopiedScriptId(""); }} />
            <em>pips</em>
            <button type="button" aria-label="Dodaj 1 pips we wszystkich ofertach" onClick={() => nudgeComparisonPips(1)}>+</button>
          </div>
          <div className="global-pips-presets" aria-label="Szybki wybór pipsów">
            {[10, 25, 50].map((value) => <button className={comparisonPips === value ? "active" : ""} type="button" key={value} onClick={() => { setComparisonPipsInput(`${value}`); setCopiedScriptId(""); }}>{value}</button>)}
          </div>
          <p>{model.buy ? "Odejmujemy od kursu każdej oferty." : "Dodajemy do kursu każdej oferty."} Wyniki i skrypty aktualizują się razem.</p>
        </section>

        {!model.hasMid && <p className="empty-note">Wpisz kurs rynkowy w panelu u góry — bez niego nie ma do czego porównywać.</p>}

        <section className={`offer-list ${!model.hasMid ? "muted" : ""}`} aria-label="Porównanie ofert">
          {displayedResults.map((result) => {
            const isBest = result.valid && result.offer.id === bestResult?.offer.id;
            const grade = result.valid ? GRADE_STOPS.find((item) => result.effectivePips < item.max)! : null;
            const deltaFromBest = result.valid && bestResult?.valid ? Math.abs(result.total - bestResult.total) : Number.NaN;
            const negotiatedRate = result.valid && Number.isFinite(comparisonPips)
              ? result.rate + (model.buy ? -1 : 1) * comparisonPips / 10_000
              : Number.NaN;
            const negotiatedQuote = offerQuoteAtRate(result.offer, negotiatedRate);
            const negotiatedDifference = result.valid && Number.isFinite(negotiatedQuote.total)
              ? (model.buy ? result.total - negotiatedQuote.total : negotiatedQuote.total - result.total)
              : Number.NaN;
            const variantQuotes = [10, 25, 50].map((variantPips) => {
              const variantRate = result.valid ? result.rate + (model.buy ? -1 : 1) * variantPips / 10_000 : Number.NaN;
              const quote = offerQuoteAtRate(result.offer, variantRate);
              const difference = result.valid && Number.isFinite(quote.total)
                ? Math.abs(quote.total - result.total)
                : Number.NaN;
              return { pips: variantPips, rate: variantRate, quote, difference };
            });
            const customVariantVisible = Number.isFinite(comparisonPips) && comparisonPips > 0 && !variantQuotes.some((variant) => variant.pips === comparisonPips);
            const offerScript = result.valid && Number.isFinite(negotiatedRate)
              ? `${model.buy ? "Mam do kupienia" : "Mam do sprzedania"} ${model.amount.toLocaleString("pl-PL")} ${CURRENCY_WORDS[currency]}, transakcja dziś. Rynek jest na ${spokenRate(model.mid)}, a Państwa kurs to ${spokenRate(result.rate)} — ${Math.round(result.effectivePips)} pipsów efektywnie. Proszę o ${spokenRate(negotiatedRate)}, czyli poprawę o ${Math.round(comparisonPips)} pipsów. Po prowizjach daje to ${Math.round(negotiatedQuote.effectivePips)} pipsów i ${money(negotiatedQuote.total, 0)} łącznie.`
              : "Uzupełnij kurs oferty, aby otrzymać gotowy skrypt rozmowy.";
            let warning = "";
            if (result.valid && model.buy && result.rate < model.ask) warning = "Kurs poniżej rynkowego — sprawdź, czy to na pewno kurs sprzedaży waluty przez tę instytucję.";
            else if (result.valid && !model.buy && result.rate > model.bid) warning = "Kurs powyżej rynkowego — sprawdź, czy to kurs, po którym instytucja kupuje walutę od ciebie.";
            else if (result.percentagePoints > 2) warning = "Prowizja powyżej 2% jest nietypowo wysoka — sprawdź, od jakiej kwoty jest liczona.";
            else if (result.valid && result.fixedFeePips > 100) warning = `Opłaty stałe to ${Math.round(result.fixedFeePips)} pipsów — przy tej kwocie ważą więcej niż sam kurs.`;

            return <article className="offer-card" key={result.offer.id}>
              <div className="offer-body">
                <div className="offer-title-row">
                  <label className="sr-only" htmlFor={`name-${result.offer.id}`}>Nazwa oferty</label>
                  <input id={`name-${result.offer.id}`} className="offer-name" value={result.offer.name} onChange={(event) => updateOffer(result.offer.id, "name", event.target.value)} placeholder="nazwa oferty" />
                  <div className="offer-actions">
                    <button type="button" onClick={() => savePreset(result.offer)}>{savedId === result.offer.id ? "zapisane" : "zapisz"}</button>
                    <button type="button" disabled={offers.length <= 1} onClick={() => setOffers((current) => current.filter((offer) => offer.id !== result.offer.id))}>usuń</button>
                  </div>
                </div>
                <div className="offer-fields">
                  <label><span>kurs</span><input inputMode="decimal" value={result.offer.rate} onChange={(event) => updateOffer(result.offer.id, "rate", event.target.value)} /></label>
                  <label><span>prow. %</span><input inputMode="decimal" value={result.offer.commissionPct} onChange={(event) => updateOffer(result.offer.id, "commissionPct", event.target.value)} placeholder="0" /></label>
                  <label><span>prow. zł</span><input inputMode="decimal" value={result.offer.fixedFee} onChange={(event) => updateOffer(result.offer.id, "fixedFee", event.target.value)} placeholder="0" /></label>
                  <label><span>przelew zł</span><input inputMode="decimal" value={result.offer.transferFee} onChange={(event) => updateOffer(result.offer.id, "transferFee", event.target.value)} placeholder="0" /></label>
                </div>
                <div className="offer-scenario">
                  <div className="scenario-heading">
                    <div><span>Warianty tej oferty</span><small>Wybrany wariant {pips(comparisonPips)} jest podświetlony we wszystkich ofertach.</small></div>
                  </div>
                  <div className="quote-table" aria-label={`Kursy i kwoty dla ${result.offer.name || "oferty"}`}>
                    <div className="quote-table-head" aria-hidden="true"><span>kurs</span><span>zmiana</span><span>pipsy efektywnie</span><span>ostateczna kwota</span></div>
                    <div className={`quote-row quote-row-current ${isBest ? "quote-row-best" : ""} ${comparisonPips === 0 ? "active" : ""}`}>
                      <div data-label="kurs"><small>obecna oferta</small><strong>{result.valid ? rate4(result.rate) : "—"}</strong></div>
                      <div data-label="zmiana"><strong>0 pips</strong></div>
                      <div data-label="pipsy efektywnie"><span className={`quote-grade grade-${grade?.tone ?? "neutral"}`}>{result.valid ? `${Math.round(result.effectivePips)} pips · ${grade?.label}` : "— · brak oceny"}</span></div>
                      <div className="quote-amount" data-label="ostateczna kwota"><strong>{result.valid ? money(result.total) : "—"}</strong><small>{!result.valid ? "wpisz kurs" : isBest ? (model.buy ? "najniższy koszt" : "najwyższy przychód") : Number.isFinite(deltaFromBest) ? `${model.buy ? "+" : "−"}${money(deltaFromBest, 0)} względem najlepszej oferty` : "brak porównania"}</small></div>
                    </div>
                    {variantQuotes.map((variant) => <div className={`quote-row quote-row-calculated ${comparisonPips === variant.pips ? "active" : ""}`} key={variant.pips}>
                      <div data-label="kurs"><small>wariant {variant.pips} pips</small><strong>{rate4(variant.rate)}</strong></div>
                      <div data-label="zmiana"><button className="quote-variant-button" type="button" aria-label={`Wybierz ${variant.pips} pips dla wszystkich ofert`} disabled={!result.valid} onClick={() => { setComparisonPipsInput(`${variant.pips}`); setCopiedScriptId(""); }}>{model.buy ? "−" : "+"}{pips(variant.pips)}</button></div>
                      <div data-label="pipsy efektywnie"><strong>{pips(variant.quote.effectivePips)}</strong></div>
                      <div className="quote-amount" data-label="ostateczna kwota"><strong>{money(variant.quote.total)}</strong><small>{money(variant.difference, 0)} lepiej od oferty</small></div>
                    </div>)}
                    {customVariantVisible && <div className="quote-row quote-row-calculated active">
                      <div data-label="kurs"><small>wspólny wariant</small><strong>{rate4(negotiatedRate)}</strong></div>
                      <div data-label="zmiana"><strong>{model.buy ? "−" : "+"}{pips(comparisonPips)}</strong></div>
                      <div data-label="pipsy efektywnie"><strong>{pips(negotiatedQuote.effectivePips)}</strong></div>
                      <div className="quote-amount" data-label="ostateczna kwota"><strong>{money(negotiatedQuote.total)}</strong><small>{money(Math.abs(negotiatedDifference), 0)} {negotiatedDifference >= 0 ? "lepiej" : "gorzej"} od oferty</small></div>
                    </div>}
                  </div>
                  <button className="apply-quote-button" type="button" disabled={!result.valid || !Number.isFinite(negotiatedRate) || negotiatedRate <= 0 || Math.abs(negotiatedRate - result.rate) < 0.0000001} onClick={() => {
                      updateOffer(result.offer.id, "rate", rate4(negotiatedRate));
                    }}>zapisz wyróżniony kurs jako ofertę</button>
                </div>
                <section className="offer-script" aria-labelledby={`script-${result.offer.id}`}>
                  <div className="offer-script-heading">
                    <div><span>Skrypt rozmowy</span><strong id={`script-${result.offer.id}`}>{result.offer.name || "oferta bez nazwy"}</strong></div>
                    <button type="button" disabled={!result.valid} onClick={() => copyOfferScript(result.offer.id, offerScript)}>{copiedScriptId === result.offer.id ? "skopiowane" : "kopiuj"}</button>
                  </div>
                  <blockquote>„{offerScript}”</blockquote>
                </section>
                <div className="offer-meta">
                  {result.valid && <span>kurs efektywny {rate4(result.effectiveRate)} · prowizje i opłaty {money(result.commission + (numberFrom(result.offer.transferFee) || 0), 0)} = {Math.round(result.fixedFeePips)} pips stałych</span>}
                </div>
                {warning && <p className="offer-warning">{warning}</p>}
              </div>
            </article>;
          })}
        </section>

        {validCount === 1 && <p className="hint-line">Jedna oferta to jeszcze nie ranking — dodaj drugą, żeby zobaczyć różnicę w złotówkach.</p>}
        {nearTie && <p className="hint-line">Praktycznie remis — różnica poniżej 20 zł. Wybierz wygodniejszą opcję.</p>}

        <section className="negotiation negotiation-argument">
          <div>
            <p className="eyebrow light">Dodatkowy argument do rozmowy</p>
            <p className="negotiation-context">Każda oferta ma teraz własny skrypt bezpośrednio pod wyliczeniem. Tu możesz dodatkowo sprawdzić asymetrię tabeli bankowej.</p>
          </div>
          <div className="table-skew">
            <label><span>kurs kupna banku</span><input inputMode="decimal" value={tableBuy} onChange={(event) => setTableBuy(event.target.value)} placeholder="—" /></label>
            <label><span>kurs sprzedaży banku</span><input inputMode="decimal" value={tableSell} onChange={(event) => setTableSell(event.target.value)} placeholder="—" /></label>
            <p>{tableSkew || "Wpisz oba kursy z tabeli — pokażemy, czy środek jest przesunięty przeciw Tobie."}</p>
          </div>
        </section>

        <footer className="app-footer">
          <div>{presets.length ? `Zapisane profile: ${presets.length}` : "Brak zapisanych profili"} {presets.length > 0 && <button type="button" onClick={clearPresets}>wyczyść</button>}</div>
          <p>To kalkulator porównawczy, nie rekomendacja inwestycyjna. Kurs rynkowy wpisujesz ręcznie.</p>
        </footer>
      </main>
    </div>
  );
}
