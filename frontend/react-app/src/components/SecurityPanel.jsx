const controls = [
  'No se usan tokens en localStorage ni sessionStorage.',
  'Las llamadas API usan credentials=include para sesiones basadas en cookies.',
  'No existe renderizado HTML arbitrario ni dangerouslySetInnerHTML.',
  'La UI segmenta vistas por rol y deja autorizacion final al backend.',
  'Los formularios incorporan validaciones de longitud y formato.',
  'La CSP base se declara en el documento y debe reforzarse en el servidor.'
];

export function SecurityPanel() {
  return (
    <section className="panel security-panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Frontend hardening</p>
          <h3>Controles incluidos en esta entrega</h3>
        </div>
      </div>

      <div className="security-grid">
        {controls.map((control) => (
          <article key={control} className="security-card">
            <strong>Control activo</strong>
            <p>{control}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
