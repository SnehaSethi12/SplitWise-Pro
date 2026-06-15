import Link from "next/link";

export function Shell({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-logo">SP</span>
          <div>
            <strong>SplitWise Pro</strong>
            <small>simple shared expenses</small>
          </div>
        </div>

        <div className="nav-label">Main</div>

        <Link className="nav-item" href="/">
          Overview
        </Link>

        <Link className="nav-item" href="/analytics">
          Insights
        </Link>

        <Link className="nav-item" href="/import">
          Import
        </Link>

        <Link className="nav-item" href="/groups">
          Groups
        </Link>

        <div className="nav-label">Details</div>

        <Link className="nav-item" href="/expenses">
          Expenses
        </Link>

        <Link className="nav-item" href="/members">
          People
        </Link>

        <Link className="nav-item" href="/decisions">
          Decisions
        </Link>
        <Link className="nav-item" href="/submission">
          Submission
        </Link>
        <Link className="nav-item logout" href="/logout">
          Logout
        </Link>
      </aside>

      <main className="page">
        <header className="topbar">
          <div>
            <span className="eyebrow">SplitWise Pro</span>
            <h1>{title}</h1>
          </div>

          <nav className="section-nav" aria-label="Page sections">
            <a href="#summary">Summary</a>
            <a href="#visuals">Visuals</a>
            <a href="#details">Details</a>
            <a href="#actions">Actions</a>
          </nav>
        </header>

        <section className="hero" id="summary">
          <div className="hero-copy">
            <h2>{title}</h2>
            <p>
              Review balances, inspect messy imports, and settle shared
              expenses clearly.
            </p>
          </div>

          <div className="hero-actions">
            <Link className="btn light" href="/">
              Overview
            </Link>
            <Link className="btn secondary" href="/import">
              Import
            </Link>
            <Link className="btn secondary" href="/expenses">
              Expenses
            </Link>
          </div>
        </section>

        {children}
      </main>
    </div>
  );
}
