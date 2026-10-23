import React from 'react';

export default class ErrorBoundary extends React.Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('UI error:', error, info);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FDFBF7] p-6" data-testid="error-boundary">
        <div className="max-w-md rounded-3xl bg-white p-8 text-center shadow-lg">
          <h1 className="mb-2 text-2xl font-bold text-[#2C221E]">Ops! Algo deu errado</h1>
          <p className="mb-6 text-[#5C524B]">A página encontrou um problema. Tente novamente.</p>
          <button onClick={() => { this.setState({ error: null }); window.location.reload(); }} className="rounded-full bg-[#2A9D8F] px-6 py-3 font-semibold text-white" data-testid="error-reload-btn">
            Recarregar
          </button>
        </div>
      </div>
    );
  }
}
