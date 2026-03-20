export function Overview({ stats, securitySignals }) {
  return (
    <section className="overview-grid">
      <div className="panel metric-panel">
        <div className="panel-heading compact">
          <div>
            <p className="eyebrow">Panorama</p>
            <h3>Operacion del dia</h3>
          </div>
        </div>
        <div className="metrics-grid">
          {stats.map((item) => (
            <article key={item.label} className="metric-card">
              <span>{item.label}</span>
              <strong>{item.value}</strong>
              <p>{item.detail}</p>
            </article>
          ))}
        </div>
      </div>

      <div className="panel signal-panel">
        <div className="panel-heading compact">
          <div>
            <p className="eyebrow">Trust Controls</p>
            <h3>Controles visibles</h3>
          </div>
        </div>
        <div className="signal-list">
          {securitySignals.map((signal) => (
            <article key={signal.title} className="signal-card">
              <strong>{signal.title}</strong>
              <p>{signal.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
