import { useAppContext } from '../context/AppContext';
import { useI18n } from '../context/I18nContext';

export default function SecurityPage() {
  const { accessFeed, currentUser, pentestChecklist, securityControls, threatMatrix } = useAppContext();
  const { translate } = useI18n();

  return (
    <div className="page-stack">
      <section className="hero-surface compact-hero">
        <div>
          <p className="eyebrow">{translate('Frontend posture')}</p>
          <h1>{translate('This interface is built to align with enterprise backend controls, not bypass them.')}</h1>
          <p className="body-copy hero-copy">
            {translate('Client routing, forms and collaboration flows stay explicit so pentest hardening can be layered from API to edge.')}
          </p>
        </div>
        <div className="hero-actions security-identity-block">
          <span className="tag">{translate('Role')}: {translate(currentUser?.role || 'Protected user')}</span>
          <span className="tag">{translate('Identity')}: {currentUser?.email || translate('No email')}</span>
        </div>
      </section>

      <section className="two-column-grid">
        <article className="page-panel">
          <div className="panel-headline">
            <div>
              <p className="eyebrow">{translate('Active controls')}</p>
              <h2>{translate('Client side guardrails')}</h2>
            </div>
          </div>
          <div className="card-list">
            {securityControls.map((control) => (
              <article key={control.title} className="detail-card">
                <h3>{translate(control.title)}</h3>
                <p className="body-copy">{translate(control.body)}</p>
              </article>
            ))}
          </div>
        </article>

        <article className="page-panel">
          <div className="panel-headline">
            <div>
              <p className="eyebrow">{translate('Access telemetry')}</p>
              <h2>{translate('Signals visible to operators')}</h2>
            </div>
          </div>
          <div className="metric-grid nested-grid">
            {accessFeed.map((entry) => (
              <article key={entry.id} className="metric-card soft-card">
                <span>{translate(entry.title)}</span>
                <strong>{entry.value}</strong>
                <p className="body-copy">{translate(entry.note)}</p>
              </article>
            ))}
          </div>
        </article>
      </section>

      <section className="two-column-grid">
        <article className="page-panel">
          <div className="panel-headline">
            <div>
              <p className="eyebrow">{translate('Pentest readiness')}</p>
              <h2>{translate('Checklist for backend and infrastructure alignment')}</h2>
            </div>
          </div>
          <div className="bullet-list">
            {pentestChecklist.map((item) => (
              <div key={item} className="bullet-row">
                <span className="bullet-dot" />
                <p className="body-copy">{translate(item)}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="page-panel">
          <div className="panel-headline">
            <div>
              <p className="eyebrow">{translate('Threat map')}</p>
              <h2>{translate('What the frontend assumes the platform will defend')}</h2>
            </div>
          </div>
          <div className="card-list compact-card-list">
            {threatMatrix.map((item) => (
              <article key={item.threat} className="detail-card">
                <div className="detail-card-top">
                  <span className="tag">{translate(item.threat)}</span>
                </div>
                <p className="body-copy">{translate(item.defense)}</p>
              </article>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}
