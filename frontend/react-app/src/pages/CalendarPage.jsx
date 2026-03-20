import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { useI18n } from '../context/I18nContext';
import { sanitizePlainText, validateEventForm } from '../utils/security';

const initialEventForm = {
  projectId: '',
  title: '',
  date: '',
  time: '',
  type: 'Meeting',
  owner: ''
};

export default function CalendarPage() {
  const { createEvent, events, projects } = useAppContext();
  const { translate } = useI18n();
  const [searchParams, setSearchParams] = useSearchParams();
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState(() => ({
    ...initialEventForm,
    projectId: searchParams.get('project') || projects[0]?.id || ''
  }));

  const activeProjectId = searchParams.get('project') || 'all';
  const errors = useMemo(() => validateEventForm(form), [form]);

  const groupedEvents = useMemo(() => {
    const scopedEvents = (activeProjectId === 'all' ? events : events.filter((event) => event.projectId === activeProjectId))
      .slice()
      .sort((left, right) => `${left.date}${left.time}`.localeCompare(`${right.date}${right.time}`));

    return scopedEvents.reduce((groups, event) => {
      if (!groups[event.date]) {
        groups[event.date] = [];
      }

      groups[event.date].push(event);
      return groups;
    }, {});
  }, [activeProjectId, events]);

  function updateField(name, value) {
    setForm((current) => ({
      ...current,
      [name]: ['title', 'owner'].includes(name) ? sanitizePlainText(value) : value
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitted(true);

    if (Object.keys(errors).length > 0) {
      return;
    }

    await createEvent(form);
    setForm((current) => ({
      ...current,
      title: '',
      date: '',
      time: '',
      type: 'Meeting',
      owner: ''
    }));
    setSubmitted(false);
  }

  return (
    <div className="page-stack">
      <section className="two-column-grid align-start-grid">
        <article className="page-panel">
          <div className="panel-headline">
            <div>
              <p className="eyebrow">Calendario</p>
              <h2>Fechas, reuniones y entregas del equipo</h2>
            </div>
            <label className="field compact-field wide-field">
              {translate('Filter project')}
              <select
                value={activeProjectId}
                onChange={(event) => {
                  const nextValue = event.target.value;
                  setSearchParams(nextValue === 'all' ? {} : { project: nextValue });
                  setForm((current) => ({
                    ...current,
                    projectId: nextValue === 'all' ? current.projectId : nextValue
                  }));
                }}
              >
                <option value="all">{translate('All projects')}</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {translate(project.name)}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="agenda-list">
            {Object.entries(groupedEvents).map(([date, dayEvents]) => (
              <section key={date} className="agenda-day">
                <div className="agenda-day-head">
                  <p className="eyebrow">{date}</p>
                  <h3>{dayEvents.length} eventos</h3>
                </div>
                <div className="card-list compact-card-list">
                  {dayEvents.map((event) => (
                    <article key={event.id} className="detail-card">
                      <div className="detail-card-top">
                        <span className="tag">{event.time}</span>
                        <span>{event.type}</span>
                      </div>
                      <h3>{event.title}</h3>
                      <p className="body-copy">{event.owner}</p>
                    </article>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </article>

        <article className="page-panel sticky-panel">
            <div className="panel-headline">
              <div>
              <p className="eyebrow">Nuevo evento</p>
              <h2>Agrega una fecha importante</h2>
              </div>
            </div>

          <form className="form-stack" onSubmit={handleSubmit}>
            <label className="field">
              {translate('Project')}
              <select value={form.projectId} onChange={(event) => updateField('projectId', event.target.value)}>
                <option value="">{translate('Select project')}</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {translate(project.name)}
                  </option>
                ))}
              </select>
              {submitted && errors.projectId ? <span className="field-error">{translate(errors.projectId)}</span> : null}
            </label>

            <label className="field">
              {translate('Title')}
              <input value={form.title} onChange={(event) => updateField('title', event.target.value)} />
              {submitted && errors.title ? <span className="field-error">{translate(errors.title)}</span> : null}
            </label>

            <div className="form-row">
              <label className="field">
                {translate('Date')}
                <input type="date" value={form.date} onChange={(event) => updateField('date', event.target.value)} />
                {submitted && errors.date ? <span className="field-error">{translate(errors.date)}</span> : null}
              </label>

              <label className="field">
                {translate('Time')}
                <input type="time" value={form.time} onChange={(event) => updateField('time', event.target.value)} />
                {submitted && errors.time ? <span className="field-error">{translate(errors.time)}</span> : null}
              </label>
            </div>

            <div className="form-row">
              <label className="field">
                {translate('Type')}
                <select value={form.type} onChange={(event) => updateField('type', event.target.value)}>
                  <option value="Meeting">{translate('Meeting')}</option>
                  <option value="Deadline">{translate('Deadline')}</option>
                  <option value="Review">{translate('Review')}</option>
                  <option value="Release">{translate('Release')}</option>
                </select>
              </label>

              <label className="field">
                {translate('Owner')}
                <input value={form.owner} onChange={(event) => updateField('owner', event.target.value)} />
              </label>
            </div>

            <button type="submit" className="primary-button block-button">
              {translate('Create event')}
            </button>
          </form>
        </article>
      </section>
    </div>
  );
}
