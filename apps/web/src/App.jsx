export default function App() {
  return (
    <main className="page">
      <header className="hero">
        <p className="kicker">Turbo + FastAPI</p>
        <h1>Vite React Frontend</h1>
        <p className="lede">
          The frontend workspace is ready. Wire it up to your FastAPI routes and
          ship.
        </p>
        <div className="actions">
          <a className="button" href="https://vitejs.dev" target="_blank" rel="noreferrer">
            Vite Docs
          </a>
          <a
            className="button secondary"
            href="https://react.dev"
            target="_blank"
            rel="noreferrer"
          >
            React Docs
          </a>
        </div>
      </header>
      <section className="panel">
        <h2>Next steps</h2>
        <ul>
          <li>Call your FastAPI endpoints from `app`.</li>
          <li>Replace this layout with your product UI.</li>
          <li>Run `bun run dev` from the repo root.</li>
        </ul>
      </section>
    </main>
  );
}
