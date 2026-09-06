// src/components/ErrorBoundary.jsx — erro de componente nao derruba o painel.
import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { erro: null };
  }

  static getDerivedStateFromError(e) {
    return { erro: e };
  }

  componentDidCatch(erro, info) {
    console.error('Erro de renderização:', erro, info?.componentStack);
  }

  render() {
    if (this.state.erro) {
      return (
        <div className="page">
          <div className="card card-pad">
            <div className="vazio">
              <span className="vazio-emoji">💥</span>
              Esta tela quebrou ao carregar
              <span className="vazio-dica">{this.state.erro?.message}</span>
            </div>
            <div className="linha" style={{ justifyContent: 'center' }}>
              <button type="button" className="btn btn-primario" onClick={() => this.setState({ erro: null })}>
                Tentar de novo
              </button>
              <button type="button" className="btn" onClick={() => window.location.reload()}>
                Recarregar o painel
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
