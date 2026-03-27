import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { useI18n } from '../context/I18nContext';
import { sanitizePlainText, validateEventForm } from '../utils/security';
import { getProjectMembers, getWorkspaceMembers } from '../utils/team';

const initialEventForm = {
  projectId: '',
  title: '',
  date: '',
  time: '',
  type: 'Meeting',
  owner: ''
};

function buildMonthMatrix(referenceDate) {
  const startOfMonth = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 1);
  const start = new Date(startOfMonth);
  const dayOfWeek = (startOfMonth.getDay() + 6) % 7;
  start.setDate(start.getDate() - dayOfWeek);

  return Array.from({ length: 42 }, (_, index) => {
    const cellDate = new Date(start);
    cellDate.setDate(start.getDate() + index);
    return cellDate;
  });
}

function isoDate(value) {
  return value.toISOString().slice(0, 10);
}

function monthLabel(value) {
  return new Intl.DateTimeFormat('es-GT', { month: 'long', year: 'numeric' }).format(value);
}

function shortWeekdayLabel(value) {
  return new Intl.DateTimeFormat('es-GT', { weekday: 'short' }).format(value);
}

export default function CalendarPage() {
  const { createEvent, currentUser, events, projects, userDirectory, workgroups } = useAppContext();
  const { translate } = useI18n();
  const [searchParams, setSearchParams] = useSearchParams();
  const [submitted, setSubmitted] = useState(false);
  const [viewMode, setViewMode] = useState('agenda');
  const [monthAnchor, setMonthAnchor] = useState(() => new Date());
  const [form, setForm] = useState(() => ({
    ...initialEventForm,
    projectId: searchParams.get('project') || ''
  }));

  const activeProjectId = searchParams.get('project') || 'all';
  const errors = useMemo(() => validateEventForm(form), [form]);
  const ownerOptions = useMemo(() => {
    const scoped = getProjectMembers(workgroups, form.projectId || activeProjectId);
    return scoped.length ? scoped : getWorkspaceMembers(workgroups, currentUser, userDirectory);
  }, [activeProjectId, currentUser, form.projectId, userDirectory, workgroups]);

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

  const monthCells = useMemo(() => buildMonthMatrix(monthAnchor), [monthAnchor]);
  const eventsByDate = useMemo(
    () =>
      Object.entries(groupedEvents).reduce((lookup, [date, dayEvents]) => {
        lookup[date] = dayEvents;
        return lookup;
      }, {}),
    [groupedEvents]
  );

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
      <section className="page-panel calendar-hero">
        <div>
          <p className="eyebrow">Calendario</p>
          <h2>Fechas, reuniones y entregas con dos formas de lectura</h2>
          <p className="body-copy">Usa la agenda para revisar el flujo de la semana o cambia al mes para planificar como un calendario clasico.</p>
        </div>
        <div className="calendar-mode-switch">
          <button type="button" className={viewMode === 'agenda' ? 'ghost-button active-view' : 'ghost-button'} onClick={() => setViewMode('agenda')}>
            Agenda
          </button>
          <button type="button" className={viewMode === 'month' ? 'ghost-button active-view' : 'ghost-button'} onClick={() => setViewMode('month')}>
            Mes
          </button>
        </div>
      </section>

      <section className="two-column-grid align-start-grid">
        <article className="page-panel">
          <div className="panel-headline">
            <div>
              <p className="eyebrow">Vista del calendario</p>
              <h2>{viewMode === 'agenda' ? 'Agenda operativa del equipo' : 'Mes completo de trabajo'}</h2>
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

          {viewMode === 'agenda' ? (
            <div className="agenda-list">
              {Object.entries(groupedEvents).length ? (
                Object.entries(groupedEvents).map(([date, dayEvents]) => (
                  <section key={date} className="agenda-day">
                    <div className="agenda-day-head">
                      <p className="eyebrow">{date}</p>
                      <h3>{dayEvents.length} eventos</h3>
                    </div>
                    <div className="card-list compact-card-list">
                      {dayEvents.map((entry) => (
                        <article key={entry.id} className="detail-card">
                          <div className="detail-card-top">
                            <span className="tag">{entry.time}</span>
                            <span>{entry.type}</span>
                          </div>
                          <h3>{entry.title}</h3>
                          <p className="body-copy">{entry.owner}</p>
                        </article>
                      ))}
                    </div>
                  </section>
                ))
              ) : (
                <div className="empty-state subtle-empty-state calendar-empty-state">
                  <p className="body-copy">Todavia no hay eventos para este alcance. Crea uno desde el panel lateral y aparecera aqui.</p>
                </div>
              )}
            </div>
          ) : (
            <div className="calendar-month-shell">
              <div className="calendar-month-toolbar">
                <button type="button" className="ghost-button" onClick={() => setMonthAnchor((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))}>
                  Mes anterior
                </button>
                <strong>{monthLabel(monthAnchor)}</strong>
                <button type="button" className="ghost-button" onClick={() => setMonthAnchor((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))}>
                  Mes siguiente
                </button>
              </div>
              <div className="calendar-month-weekdays">
                {monthCells.slice(0, 7).map((cellDate) => (
                  <span key={shortWeekdayLabel(cellDate)}>{shortWeekdayLabel(cellDate)}</span>
                ))}
              </div>
              <div className="calendar-month-grid">
                {monthCells.map((cellDate) => {
                  const dateKey = isoDate(cellDate);
                  const dayEvents = eventsByDate[dateKey] || [];
                  const isCurrentMonth = cellDate.getMonth() === monthAnchor.getMonth();

                  return (
                    <article key={dateKey} className={isCurrentMonth ? 'calendar-day-card' : 'calendar-day-card outside-month'}>
                      <div className="calendar-day-top">
                        <strong>{cellDate.getDate()}</strong>
                        {dayEvents.length ? <span className="tag subtle-tag">{dayEvents.length}</span> : null}
                      </div>
                      <div className="calendar-day-events">
                        {dayEvents.slice(0, 3).map((entry) => (
                          <div key={entry.id} className="calendar-day-pill">
                            <span>{entry.time}</span>
                            <strong>{entry.title}</strong>
                          </div>
                        ))}
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          )}
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
                <select value={form.owner} onChange={(event) => updateField('owner', event.target.value)}>
                  <option value="">Selecciona a una persona</option>
                  {ownerOptions.map((member) => (
                    <option key={member.id || member.email || member.name} value={member.name}>
                      {member.name}
                    </option>
                  ))}
                </select>
                {submitted && errors.owner ? <span className="field-error">{translate(errors.owner)}</span> : null}
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
