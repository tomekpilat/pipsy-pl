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
  { id: "o2", name: "platforma P2P", rate: "3.7450", commissionPct: "0.2", fixedFee: "0", transferFee: "0" },
  { id: "o3", name: "bank — tabela", rate: "3.7596", commissionPct: "0", fixedFee: "0", transferFee: "250" },
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
  const [scriptTarget, setScriptTarget] = useState("");
  const [tableBuy, setTableBuy] = useState("");
  const [tableSell, setTableSell] = useState("");
  const [copyState, setCopyState] = useState<"idle" | "copied">("idle");
  const [savedId, setSavedId] = useState("");

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
    const leader = ranked[0];
    const ordered = [...ranked, ...calculated.filter((result) => !result.valid)];
    const negotiable = hasMid && hasAmount && notional >= 100_000;
    const floor = buy ? ask : bid;
    const opening = buy ? ask + 0.004 : bid - 0.004;
    const target = buy ? ask + 0.008 : bid - 0.008;
    const targetHigh = buy ? ask + 0.011 : bid - 0.011;
    const potentialSaving = leader ? Math.max(0, (buy ? leader.effectiveRate - target : target - leader.effectiveRate) * amount) : Number.NaN;
    const ageMinutes = Math.max(0, Math.floor((now - midTimestamp) / 60_000));
    const ageLevel = ageMinutes >= 30 ? "critical" : ageMinutes >= 15 ? "warning" : "fresh";

    return { mid, amount, halfSpread, hasMid, hasAmount, buy, ask, bid, pipValue, notional, calculated, ranked, leader, ordered, negotiable, floor, opening, target, targetHigh, potentialSaving, ageMinutes, ageLevel };
  }, [midInput, amountInput, halfSpreadInput, direction, offers, now, midTimestamp]);

  const selectedForScript = model.calculated.find((result) => result.valid && result.offer.id === scriptTarget)
    ?? [...model.calculated].filter((result) => result.valid).sort((a, b) => b.effectivePips - a.effectivePips)[0];

  const negotiationScript = model.negotiable && selectedForScript
    ? `${model.buy ? "Mam do kupienia" : "Mam do sprzedania"} ${model.amount.toLocaleString("pl-PL")} ${CURRENCY_WORDS[currency]}, transakcja dziś. Rynek jest na ${spokenRate(model.mid)}, wasz kurs to ${spokenRate(selectedForScript.rate)} — czyli ${Math.round(selectedForScript.effectivePips)} pipsów. Przy tym wolumenie oczekuję ${spokenRate(model.opening)}.`
    : "Wpisz kurs, kwotę i przynajmniej jedną ofertę — wtedy przygotuję zdanie do rozmowy.";

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
    setCopyState("idle");
  };

  const addOffer = (preset?: Preset) => setOffers((current) => [...current, {
    id: `o${Date.now()}`, name: preset?.name ?? "", rate: "", commissionPct: preset?.commissionPct ?? "",
    fixedFee: preset?.fixedFee ?? "", transferFee: preset?.transferFee ?? "",
  }]);

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

  const copyScript = async () => {
    try { await navigator.clipboard.writeText(negotiationScript); setCopyState("copied"); } catch { setCopyState("idle"); }
  };

  const validCount = model.ranked.length;
  const nearTie = validCount >= 2 && Math.abs(model.ranked[0].total - model.ranked[1].total) < 20;

  return (
    <div className="app-shell">
      <aside className="control-panel">
        <a className="brand" aria-label="pipsy.pl — strona główna" href="/">
          <span className="brand-mark" aria-hidden="true"><i /><i /><i /></span>
          <span>pipsy<span>.pl</span></span>
        </a>

        <section className="control-section">
          <p className="eyebrow">Kurs rynkowy</p>
          <label className="sr-only" htmlFor="mid-rate">Średni kurs rynkowy</label>
          <input id="mid-rate" className={`mid-input age-${model.ageLevel}`} inputMode="decimal" value={midInput}
            onChange={(event) => { setMidInput(event.target.value); setMidTimestamp(Date.now()); setCopyState("idle"); }} placeholder="3.7375" />
          <div className="rate-status-row">
            <span className={`rate-age age-${model.ageLevel}`}><i />{!model.hasMid ? "brak kursu" : model.ageMinutes < 1 ? "sprawdzony teraz" : `sprzed ${model.ageMinutes} min`}</span>
            <button className="subtle-button" type="button" onClick={() => setMidTimestamp(Date.now())}>odświeżyłem</button>
          </div>
          <p className="pair-label">{currency}/PLN</p>
          <p className="rate-source"><strong>Źródło: wpis ręczny.</strong> Kalkulator nie pobiera kursu online; wartość startowa 3,7375 jest tylko przykładem, nie kursem live.</p>
        </section>

        <section className="market-grid" aria-label="Parametry rynku">
          <div><span>ask</span><strong>{rate4(model.ask)}</strong></div>
          <div><span>bid</span><strong>{rate4(model.bid)}</strong></div>
          <div className="pip-tile"><span>1 pips</span><strong>{money(model.pipValue)}</strong></div>
        </section>

        <section className="control-section">
          <p className="eyebrow">Transakcja</p>
          <div className="direction-switch" role="group" aria-label="Kierunek transakcji">
            <button type="button" className={model.buy ? "active" : ""} aria-pressed={model.buy} onClick={() => { setDirection("buy"); setCopyState("idle"); }}>kupuję</button>
            <button type="button" className={!model.buy ? "active" : ""} aria-pressed={!model.buy} onClick={() => { setDirection("sell"); setCopyState("idle"); }}>sprzedaję</button>
          </div>
          <div className="amount-row">
            <label className="sr-only" htmlFor="amount">Kwota transakcji</label>
            <input id="amount" inputMode="decimal" value={amountInput} onChange={(event) => { setAmountInput(event.target.value); setCopyState("idle"); }} />
            <label className="sr-only" htmlFor="currency">Waluta</label>
            <select id="currency" value={currency} onChange={(event) => setCurrency(event.target.value as Currency)}>
              <option>USD</option><option>EUR</option><option>GBP</option><option>CHF</option>
            </select>
          </div>
          <p className="transaction-detail">wartość <strong>{money(model.notional, 0)}</strong> · ruch 25 pips <strong>{money(25 * model.pipValue, 0)}</strong></p>
        </section>

        <label className="spread-control">
          <span>połowa spreadu</span>
          <input inputMode="decimal" value={halfSpreadInput} onChange={(event) => setHalfSpreadInput(event.target.value)} />
          <span>= {Math.round(model.halfSpread * 10_000)} pips</span>
        </label>

        {model.ageLevel !== "fresh" && model.hasMid && <div className={`age-message ${model.ageLevel}`}>
          {model.ageLevel === "critical" ? "Kurs ma ponad pół godziny. Odśwież go — na starych danych ten kalkulator daje fałszywą pewność." : `Kurs sprzed ${model.ageMinutes} min. Zerknij jeszcze raz przed telefonem.`}
        </div>}
      </aside>

      <main className="workspace">
        <header className="offers-header">
          <h1>Oferty <span>— {model.buy ? "od najtańszej" : "od najbardziej opłacalnej"}</span></h1>
          <div className="header-actions">
            <label className="sr-only" htmlFor="preset">Dodaj z zapisanych profili</label>
            <select id="preset" defaultValue="" onChange={(event) => { const preset = presets.find((item) => item.id === event.target.value); if (preset) addOffer(preset); event.target.value = ""; }}>
              <option value="">z zapisanych…</option>
              {presets.map((preset) => <option key={preset.id} value={preset.id}>{preset.name}</option>)}
            </select>
            <button className="primary-button" type="button" onClick={() => addOffer()}>+ oferta</button>
          </div>
        </header>

        {!model.hasMid && <p className="empty-note">Wpisz kurs rynkowy w lewej kolumnie — bez niego nie ma do czego porównywać.</p>}

        <section className={`offer-list ${!model.hasMid ? "muted" : ""}`} aria-label="Porównanie ofert">
          {model.ordered.map((result) => {
            const rank = model.ranked.indexOf(result);
            const isLeader = rank === 0;
            const grade = result.valid ? GRADE_STOPS.find((item) => result.effectivePips < item.max)! : null;
            const delta = result.valid && model.leader ? Math.abs(result.total - model.leader.total) : Number.NaN;
            let warning = "";
            if (result.valid && model.buy && result.rate < model.ask) warning = "Kurs poniżej rynkowego — sprawdź, czy to na pewno kurs sprzedaży waluty przez tę instytucję.";
            else if (result.valid && !model.buy && result.rate > model.bid) warning = "Kurs powyżej rynkowego — sprawdź, czy to kurs, po którym instytucja kupuje walutę od ciebie.";
            else if (result.percentagePoints > 2) warning = "Prowizja powyżej 2% jest nietypowo wysoka — sprawdź, od jakiej kwoty jest liczona.";
            else if (result.valid && result.fixedFeePips > 100) warning = `Opłaty stałe to ${Math.round(result.fixedFeePips)} pipsów — przy tej kwocie ważą więcej niż sam kurs.`;

            return <article className={`offer-card ${isLeader ? "leader" : ""}`} key={result.offer.id}>
              <div className="offer-body">
                <div className="offer-title-row">
                  <span className={`rank-badge ${isLeader ? "leader" : ""}`}>{!result.valid ? "uzupełnij" : isLeader ? (model.buy ? "najtaniej" : "najwięcej") : `${rank + 1}. miejsce`}</span>
                  <label className="sr-only" htmlFor={`name-${result.offer.id}`}>Nazwa oferty</label>
                  <input id={`name-${result.offer.id}`} className="offer-name" value={result.offer.name} onChange={(event) => updateOffer(result.offer.id, "name", event.target.value)} placeholder="nazwa oferty" />
                </div>
                <div className="offer-fields">
                  <label><span>kurs</span><input inputMode="decimal" value={result.offer.rate} onChange={(event) => updateOffer(result.offer.id, "rate", event.target.value)} /></label>
                  <label><span>prow. %</span><input inputMode="decimal" value={result.offer.commissionPct} onChange={(event) => updateOffer(result.offer.id, "commissionPct", event.target.value)} placeholder="0" /></label>
                  <label><span>prow. zł</span><input inputMode="decimal" value={result.offer.fixedFee} onChange={(event) => updateOffer(result.offer.id, "fixedFee", event.target.value)} placeholder="0" /></label>
                  <label><span>przelew zł</span><input inputMode="decimal" value={result.offer.transferFee} onChange={(event) => updateOffer(result.offer.id, "transferFee", event.target.value)} placeholder="0" /></label>
                </div>
                <div className="offer-meta">
                  <span className={`grade grade-${grade?.tone ?? "neutral"}`}><i />{result.valid ? `${Math.round(result.effectivePips)} pips · ${grade?.label}` : "— · brak oceny"}</span>
                  {result.valid && <span>kurs efektywny {rate4(result.effectiveRate)} · prowizje i opłaty {money(result.commission + (numberFrom(result.offer.transferFee) || 0), 0)} = {Math.round(result.fixedFeePips)} pips stałych</span>}
                </div>
                {warning && <p className="offer-warning">{warning}</p>}
              </div>
              <div className="offer-result">
                <div><strong>{result.valid ? money(result.total) : "—"}</strong><span>{!result.valid ? "wpisz kurs" : isLeader ? (model.buy ? "najniższy koszt" : "najwyższy przychód") : `${model.buy ? "+" : "−"}${money(delta, 0)}`}</span></div>
                <div className="offer-actions">
                  <button type="button" onClick={() => savePreset(result.offer)}>{savedId === result.offer.id ? "zapisane" : "zapisz"}</button>
                  <button type="button" disabled={offers.length <= 1} onClick={() => setOffers((current) => current.filter((offer) => offer.id !== result.offer.id))}>usuń</button>
                </div>
              </div>
            </article>;
          })}
        </section>

        {validCount === 1 && <p className="hint-line">Jedna oferta to jeszcze nie ranking — dodaj drugą, żeby zobaczyć różnicę w złotówkach.</p>}
        {nearTie && <p className="hint-line">Praktycznie remis — różnica poniżej 20 zł. Wybierz wygodniejszą opcję.</p>}

        <section className="negotiation">
          <p className="eyebrow light">Negocjacja</p>
          {model.negotiable ? <>
            <div className="negotiation-grid">
              <div><span>podłoga</span><strong>{rate4(model.floor)}</strong><small>niżej dealer nie zejdzie</small></div>
              <div className="opening"><span>otwórz od</span><strong>{rate4(model.opening)}</strong><small>mów na głos</small></div>
              <div><span>realny cel</span><strong>{rate4(model.target)}</strong><small>zakres {rate4(model.target)}–{rate4(model.targetHigh)}</small></div>
              <div><span>do zyskania</span><strong>{money(model.potentialSaving, 0)}</strong><small>wobec lidera</small></div>
            </div>

            <div className="script-card">
              <div className="script-header">
                <span className="eyebrow">Co powiedzieć</span>
                <label className="sr-only" htmlFor="script-target">Oferta do negocjacji</label>
                <select id="script-target" value={selectedForScript?.offer.id ?? ""} onChange={(event) => { setScriptTarget(event.target.value); setCopyState("idle"); }}>
                  {model.calculated.filter((item) => item.valid).map((item) => <option key={item.offer.id} value={item.offer.id}>{item.offer.name || "bez nazwy"} · {rate4(item.rate)}</option>)}
                </select>
              </div>
              <blockquote>„{negotiationScript}”</blockquote>
              <div className="script-actions">
                <button type="button" onClick={copyScript}>{copyState === "copied" ? "skopiowane" : "kopiuj zdanie"}</button>
                {tableSkew && <p>{tableSkew}</p>}
              </div>
            </div>

            <div className="table-skew">
              <p>Masz tabelę banku? Wpisz oba kursy — sprawdzimy asymetrię.</p>
              <label><span>kupno</span><input inputMode="decimal" value={tableBuy} onChange={(event) => setTableBuy(event.target.value)} placeholder="—" /></label>
              <label><span>sprzedaż</span><input inputMode="decimal" value={tableSell} onChange={(event) => setTableSell(event.target.value)} placeholder="—" /></label>
            </div>
          </> : <p className="not-negotiable">
            {model.hasMid && model.hasAmount ? `Przy ${model.amount.toLocaleString("pl-PL")} ${currency} (${money(model.notional, 0)}) banki zwykle nie dają dostępu do dealing desku. Wybierz najtańszą ofertę z listy — 35 pipsów byłoby tu warte tylko ${money(35 * model.pipValue)}.` : "Uzupełnij kurs i kwotę, a policzymy, czy jest o co negocjować."}
          </p>}
        </section>

        <footer className="app-footer">
          <div>{presets.length ? `Zapisane profile: ${presets.length}` : "Brak zapisanych profili"} {presets.length > 0 && <button type="button" onClick={clearPresets}>wyczyść</button>}</div>
          <p>To kalkulator porównawczy, nie rekomendacja inwestycyjna. Kurs rynkowy wpisujesz ręcznie.</p>
        </footer>
      </main>
    </div>
  );
}
