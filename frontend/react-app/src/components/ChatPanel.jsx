export function ChatPanel({ messages }) {
  return (
    <section className="panel split-panel">
      <div>
        <div className="panel-heading compact">
          <div>
            <p className="eyebrow">Chat interno</p>
            <h3>Mensajeria en tiempo real</h3>
          </div>
        </div>
        <div className="chat-list">
          {messages.map((message) => (
            <article key={message.id} className="chat-card">
              <div className="chat-head">
                <strong>{message.author}</strong>
                <span>{message.time}</span>
              </div>
              <p className="chat-role">{message.role}</p>
              <p>{message.text}</p>
            </article>
          ))}
        </div>
      </div>

      <form className="message-form">
        <label>
          Nuevo mensaje
          <textarea
            rows="7"
            placeholder="Escribe un mensaje operativo. Sin HTML, sin scripts y sin archivos incrustados."
            maxLength="400"
          />
        </label>
        <button type="button" className="primary-button">
          Enviar por WebSocket
        </button>
      </form>
    </section>
  );
}
