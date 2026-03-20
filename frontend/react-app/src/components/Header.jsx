export function Header({ sessionNotice }) {
  return (
    <header className="topbar">
      <div>
        <p className="eyebrow">Security by Design</p>
        <h2>Workspace operacional</h2>
      </div>
      <div className="session-banner" role="status" aria-live="polite">
        {sessionNotice}
      </div>
    </header>
  );
}
