import { Component } from "react";

export default class AppErrorBoundary extends Component {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error) {
    console.error("Immigra recovered from an unexpected interface error.", error);
  }

  render() {
    if (!this.state.failed) return this.props.children;

    return (
      <main className="app-recovery-screen" role="alert">
        <section className="app-recovery-card">
          <span className="app-recovery-icon" aria-hidden="true">!</span>
          <p>IMMIGRA</p>
          <h1>Let&apos;s restart this screen.</h1>
          <p>Something unexpected interrupted the interface. Your locally saved study progress has not been deleted.</p>
          <button type="button" onClick={() => window.location.reload()}>Restart Immigra</button>
          <small>Si necesitas ayuda, reinicia la aplicación. Tu progreso local no fue eliminado.</small>
        </section>
      </main>
    );
  }
}
