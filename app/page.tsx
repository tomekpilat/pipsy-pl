"use client";

import Calculator from "./kalkulator/page";

const Logo = () => (
  <span className="site-brand-mark" aria-hidden="true"><i /><i /><i /></span>
);

const ranking = [
  { name: "Platforma P2P", range: "10–40", tone: "green", bar: "p2p" },
  { name: "Kantor internetowy", range: "30–80", tone: "green", bar: "kantor" },
  { name: "Fintech multiwalutowy", range: "40–120", tone: "yellow", bar: "fintech" },
  { name: "Bank z dealing deskiem", note: "negocjowalne", range: "50–130", tone: "yellow", bar: "dealer" },
  { name: "Bank — tabela", range: "200–300", tone: "red", bar: "bank" },
  { name: "Lotnisko, kantor przy trasie", range: "300+", tone: "red", bar: "airport" },
] as const;

const concepts = [
  ["Pips", "Czwarte miejsce po przecinku. Przy 100 000 USD — 10 zł."],
  ["Ask", "Kurs, po którym instytucja sprzedaje ci walutę. Twoja podłoga negocjacyjna przy zakupie."],
  ["Marża efektywna", "Kurs po doliczeniu prowizji i opłat, w pipsach. Jedyna miara porównywalna między ofertami."],
  ["Waga opłat", "SWIFT 250 zł to 25 pipsów przy 100 000 USD i 500 pipsów przy 5 000 USD."],
] as const;

const articles = [
  { title: "Jak negocjować kurs w banku — scenariusz rozmowy", time: "9 min", text: "Zacznij od bieżącego kursu rynkowego, podaj wolumen i nazwij oczekiwany kurs. Nie pytaj o „lepszą ofertę” — podaj konkretną liczbę otwarcia i poproś o potwierdzenie pełnych opłat." },
  { title: "Kantor czy bank przy 100 tys. zł — pełne wyliczenie", time: "7 min", text: "Porównuj kwotę końcową, nie sam kurs. Do kursu dolicz prowizję procentową, opłatę stałą i koszt przelewu, a potem przelicz wszystko na efektywny kurs oraz pipsy." },
  { title: "Przelew SWIFT do USA: OUR, SHA, BEN", time: "8 min", text: "OUR oznacza, że nadawca pokrywa koszty; SHA dzieli je między strony; BEN przenosi je na odbiorcę. W kalkulatorze wpisz koszt, który realnie obciąża twoją transakcję." },
  { title: "Kurs NBP a kurs rynkowy — do czego służy każdy", time: "5 min", text: "Kurs NBP jest dziennym kursem referencyjnym i księgowym. Do negocjacji potrzebujesz aktualnego kursu rynkowego z chwili rozmowy — dlatego kalkulator pozwala wpisać go ręcznie." },
] as const;

const faqs = [
  ["Od jakiej kwoty można negocjować kurs?", "Najczęściej od równowartości około 100 000 PLN. Dokładny próg zależy od banku, relacji z klientem i bieżącej płynności."],
  ["Ile pipsów da się wynegocjować?", "Typowo 35–80 pipsów wobec tabeli. Przy 100 000 USD 35 pipsów to 350 zł."],
  ["Czy kantor jest zawsze tańszy niż bank?", "Nie. Decyduje koszt całkowity — opłata SWIFT potrafi odwrócić ranking przy mniejszych kwotach."],
  ["Czy pobieracie kursy automatycznie?", "Nie. Kurs rynkowy i oferty wpisujesz ręcznie, dzięki czemu dokładnie wiesz, z jakiej chwili i z jakiego źródła pochodzą dane."],
] as const;

function KnowledgeBelowCalculator() {
  return (
    <div className="landing-page knowledge-home">
      <header className="site-header">
        <div className="site-header-inner">
          <a className="site-brand" href="/" aria-label="pipsy.pl — strona główna">
            <Logo /><span>pipsy<span>.pl</span></span>
          </a>
          <nav className="site-nav" aria-label="Nawigacja główna">
            <a href="#ranking">Ranking</a>
            <a href="#baza">Baza wiedzy</a>
            <a href="#artykuly">Artykuły</a>
            <a href="#faq">FAQ</a>
            <a className="site-nav-cta" href="#kalkulator">Kalkulator ↑</a>
          </nav>
          <details className="mobile-menu">
            <summary aria-label="Otwórz menu"><span>Menu</span><i aria-hidden="true" /></summary>
            <nav aria-label="Nawigacja mobilna">
              <a href="#ranking" onClick={(event) => event.currentTarget.closest("details")?.removeAttribute("open")}>Ranking</a>
              <a href="#baza" onClick={(event) => event.currentTarget.closest("details")?.removeAttribute("open")}>Baza wiedzy</a>
              <a href="#artykuly" onClick={(event) => event.currentTarget.closest("details")?.removeAttribute("open")}>Artykuły</a>
              <a href="#faq" onClick={(event) => event.currentTarget.closest("details")?.removeAttribute("open")}>FAQ</a>
              <a className="mobile-menu-cta" href="#kalkulator" onClick={(event) => event.currentTarget.closest("details")?.removeAttribute("open")}>Wróć do kalkulatora</a>
            </nav>
          </details>
        </div>
      </header>

      <div className="landing-main">
        <section className="landing-hero knowledge-intro">
          <p className="landing-kicker">Baza wiedzy pod kalkulatorem</p>
          <h2>Nie porównuj kursów.<br />Porównuj koszt.</h2>
          <p>Kurs, prowizja i opłata SWIFT sprowadzone do jednej liczby w złotych — plus liczba, którą masz powiedzieć dealerowi.</p>
          <a className="landing-primary" href="#kalkulator">Wróć do kalkulatora <span aria-hidden="true">↑</span></a>
        </section>

        <section className="landing-stats" aria-label="Najważniejsze liczby">
          <article><strong>10 zł</strong><span>1 pips przy 100 000 USD</span></article>
          <article><strong>100 tys.</strong><span>próg PLN, od którego bank rozmawia o kursie</span></article>
          <article className="accent"><strong>2 000 zł</strong><span>typowa różnica między najlepszą i najgorszą ofertą na 100 000 USD</span></article>
        </section>

        <section id="ranking" className="landing-section ranking-section">
          <div className="section-heading">
            <p>Orientacyjne widełki</p>
            <h2>Gdzie ile tracisz</h2>
            <span>Marża w pipsach nad kursem międzybankowym. Widełki dla USD/PLN i EUR/PLN w godzinach 9–17.</span>
          </div>
          <div className="ranking-list" role="list" aria-label="Ranking orientacyjnych marż">
            {ranking.map((item) => (
              <div className="ranking-row" role="listitem" key={item.name}>
                <div className="ranking-name">{item.name}{item.note && <small>{item.note}</small>}</div>
                <div className="ranking-track"><i className={`ranking-bar bar-${item.bar}`} /></div>
                <strong className={`ranking-value ${item.tone}`}>{item.range}</strong>
              </div>
            ))}
            <div className="ranking-scale" aria-hidden="true"><span>0 pips</span><span>150</span><span>300+</span></div>
          </div>
          <p className="data-note">Widełki są orientacyjne i zależą od pary walutowej, kwoty, pory dnia oraz aktualnej płynności.</p>
        </section>

        <section id="baza" className="landing-section knowledge-section">
          <div className="section-heading">
            <p>Minimum teorii</p>
            <h2>Cztery pojęcia i koniec</h2>
          </div>
          <div className="knowledge-grid">
            {concepts.map(([title, text], index) => <article key={title}><span>0{index + 1}</span><h3>{title}</h3><p>{text}</p></article>)}
          </div>
        </section>

        <section id="rozmowa" className="conversation-section">
          <div className="conversation-heading">
            <p>Przygotowanie do telefonu</p>
            <h2>Rozmowa w trzech liczbach</h2>
          </div>
          <div className="conversation-number"><strong>ask</strong><span>podłoga — poniżej dealer zwykle nie zejdzie</span></div>
          <div className="conversation-number highlight"><strong>+40</strong><span>pipsów otwarcia — tę liczbę mówisz na głos</span></div>
          <div className="conversation-number"><strong>+80</strong><span>realny wynik rozmowy przy większym wolumenie</span></div>
          <a href="#kalkulator">Wylicz moje liczby <span aria-hidden="true">↑</span></a>
        </section>

        <section id="artykuly" className="landing-section articles-section">
          <div className="section-heading">
            <p>Praktyczna wiedza</p>
            <h2>Artykuły</h2>
          </div>
          <div className="article-list">
            {articles.map((article, index) => (
              <details className="article-item" key={article.title}>
                <summary><span className="article-number">0{index + 1}</span><strong>{article.title}</strong><span className="article-time">{article.time}</span><i aria-hidden="true" /></summary>
                <div><p>{article.text}</p><a href="#kalkulator">Sprawdź na własnych liczbach ↑</a></div>
              </details>
            ))}
          </div>
        </section>

        <section id="faq" className="landing-section faq-section">
          <div className="section-heading">
            <p>Krótko i konkretnie</p>
            <h2>FAQ</h2>
          </div>
          <div className="faq-list">
            {faqs.map(([question, answer]) => (
              <details key={question}><summary>{question}<i aria-hidden="true" /></summary><p>{answer}</p></details>
            ))}
          </div>
        </section>

        <section className="landing-final-cta">
          <div><p>Masz oferty przed sobą?</p><h2>Policz, zanim zadzwonisz.</h2></div>
          <a href="#kalkulator">Wróć do kalkulatora <span aria-hidden="true">↑</span></a>
        </section>
      </div>

      <footer className="site-footer">
        <div>
          <a className="site-brand" href="/" aria-label="pipsy.pl — strona główna"><Logo /><span>pipsy<span>.pl</span></span></a>
          <nav aria-label="Nawigacja w stopce"><a href="#kalkulator">Kalkulator</a><a href="#ranking">Ranking</a><a href="#baza">Baza wiedzy</a><a href="#artykuly">Artykuły</a><a href="#faq">FAQ</a></nav>
          <p>Serwis nie świadczy doradztwa inwestycyjnego ani nie prowadzi wymiany walut. Widełki marż są orientacyjne.</p>
        </div>
      </footer>
    </div>
  );
}

export default function Home() {
  return (
    <>
      <a className="skip-link" href="#kalkulator">Przejdź do kalkulatora</a>
      <div id="kalkulator" className="home-calculator-anchor">
        <Calculator />
      </div>
      <KnowledgeBelowCalculator />
    </>
  );
}
