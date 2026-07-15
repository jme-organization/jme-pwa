// src/components/ModalEditarCliente.jsx
import React, { useState } from 'react';
import { BadgeCliente } from './BadgeCliente';
import { PainelDatas } from './PainelDatas';
import { api } from '../api/client';

export const ModalEditarCliente = ({ cliente, baseId, onClose, onSalvo }) => {
  const [form, setForm] = useState({
    nome: cliente.nome || "",
    cpf: cliente.cpf || "",
    telefone: cliente.telefone || "",
    endereco: cliente.endereco || "",
    numero: cliente.numero || "",
    senha: cliente.senha || "",
    plano: cliente.plano || "",
    forma_pagamento: cliente.forma_pagamento || "",
    dia_vencimento: String(cliente.dia_vencimento || ""),
    comodato: cliente.comodato === true,
    observacao: cliente.observacao || "",
    status: cliente.status || "pendente",
  });

  const [aba, setAba] = useState("dados");
  const [diaOutro, setDiaOutro] = useState(!["10","20","30"].includes(String(cliente.dia_vencimento)) ? String(cliente.dia_vencimento || "") : "");
  const [mostrarConfigAvancada, setMostrarConfigAvancada] = useState(!!cliente.config_cobranca);
  const [offsets, setOffsets] = useState(cliente.config_cobranca?.offsets?.length ? cliente.config_cobranca.offsets : [-1, 1, 3, 5, 7, 9]);
  const [novoOffset, setNovoOffset] = useState("");
  const [salvandoConfig, setSalvandoConfig] = useState(false);
  const [configMsg, setConfigMsg] = useState(null);
  const [cobrandoAgora, setCobrandoAgora] = useState(false);
  const [cobrarMsg, setCobrarMsg] = useState(null);
  const [solicitandoCarne, setSolicitandoCarne] = useState(false);
  const [carneMsg, setCarneMsg] = useState(null);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState(null);

  // Promessa
  const [dataPromessa, setDataPromessa] = useState("");
  const [salvandoProm, setSalvandoProm] = useState(false);
  const [promMsg, setPromMsg] = useState(null);

  // Cancelamento
  const MOTIVOS_CANCELAMENTO = [
    "Problemas financeiros",
    "Qualidade do serviço",
    "Mudança de endereço",
    "Contratei outro provedor",
    "Outro motivo"
  ];
  const [motivoCancelamento, setMotivoCancelamento] = useState("");
  const [motivoDetalhe, setMotivoDetalhe] = useState("");
  const [cancelMsg, setCancelMsg] = useState(null);
  const [salvandoCancel, setSalvandoCancel] = useState(false);
  const [cancelado, setCancelado] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const salvar = async () => {
    if (!form.nome.trim()) {
      setErro("Nome é obrigatório");
      return;
    }
    setSalvando(true);
    setErro(null);
    try {
      const json = await api.put(`/api/bases/${baseId}/clientes/${cliente.id}`, { ...form, dia_vencimento: parseInt(form.dia_vencimento), comodato: Boolean(form.comodato) });
      if (json.id) {
        onSalvo(json);
        onClose();
      } else {
        setErro(json.erro || "Erro ao salvar");
      }
    } catch (e) {
      console.error('Erro ao salvar cliente:', e);
      setErro("Falha de conexão: " + e.message);
    }
    setSalvando(false);
  };

  const solicitarCarne = async () => {
    setSolicitandoCarne(true);
    setCarneMsg(null);
    try {
      const j = await api.post("/api/carne", {
        cliente_id: cliente.id,
        nome: form.nome,
        numero: form.telefone || null,
        endereco: form.endereco || null,
      });
      if (j.ok) {
        setCarneMsg({ ok: true, txt: "✅ Solicitação registrada! Aparece na aba Carnês." });
      } else {
        setCarneMsg({ ok: false, txt: j.erro || "Erro ao solicitar" });
      }
    } catch (e) {
      setCarneMsg({ ok: false, txt: e.message || "Falha de conexão" });
    }
    setSolicitandoCarne(false);
  };

  const salvarPromessa = async () => {
    if (!dataPromessa) {
      setPromMsg({ ok: false, txt: "Informe a data da promessa" });
      return;
    }
    setSalvandoProm(true);
    setPromMsg(null);
    try {
      const json = await api.post("/api/promessas", {
        nome: form.nome,
        numero: form.telefone || null,
        data_promessa: dataPromessa,
      });
      if (json.ok) {
        await api.post(`/api/bases/${baseId}/clientes/${cliente.id}/status`, { status: "promessa" });
        setPromMsg({ ok: true, txt: `✅ Promessa registrada para ${dataPromessa}` });
        onSalvo({ ...cliente, status: "promessa" });
      } else {
        setPromMsg({ ok: false, txt: json.erro || "Erro ao salvar" });
      }
    } catch (e) {
      setPromMsg({ ok: false, txt: e.message || "Falha de conexão" });
    }
    setSalvandoProm(false);
  };

  const salvarConfigAvancada = async () => {
    if (!offsets.length) {
      setConfigMsg({ ok: false, txt: "Adicione pelo menos um dia de aviso" });
      return;
    }
    setSalvandoConfig(true);
    setConfigMsg(null);
    try {
      const json = await api.put(`/api/bases/${baseId}/clientes/${cliente.id}/config-cobranca`, { offsets });
      if (json.ok) {
        setConfigMsg({ ok: true, txt: "✅ Configuração salva!" });
      } else {
        setConfigMsg({ ok: false, txt: json.erro || "Erro ao salvar" });
      }
    } catch (e) {
      setConfigMsg({ ok: false, txt: e.message || "Falha de conexão" });
    }
    setSalvandoConfig(false);
  };

  const removerConfigAvancada = async () => {
    if (!confirm("Remover config customizada? Volta a usar o calendário padrão (10/20/30).")) return;
    setSalvandoConfig(true);
    try {
      await api.put(`/api/bases/${baseId}/clientes/${cliente.id}/config-cobranca`, {});
      setConfigMsg({ ok: true, txt: "Config removida, cliente voltou ao padrão." });
      setOffsets([-1, 1, 3, 5, 7, 9]);
    } catch (e) {
      setConfigMsg({ ok: false, txt: e.message || "Falha de conexão" });
    }
    setSalvandoConfig(false);
  };

  const cobrarAgora = async () => {
    if (!confirm(`Enviar mensagem de cobrança agora pra ${form.nome}?`)) return;
    setCobrandoAgora(true);
    setCobrarMsg(null);
    try {
      const json = await api.post(`/api/clientes/${cliente.id}/cobrar-individual`, { offset: offsets[offsets.length - 1] ?? 0 });
      setCobrarMsg(json.ok
        ? { ok: true, txt: "✅ Mensagem enviada!" }
        : { ok: false, txt: json.erro || "Erro ao enviar" });
    } catch (e) {
      setCobrarMsg({ ok: false, txt: e.message || "Falha de conexão" });
    }
    setCobrandoAgora(false);
  };

  const toggleStatus = async () => {
    const novoStatus = form.status === "pago" ? "pendente" : "pago";
    await api.post(`/api/bases/${baseId}/clientes/${cliente.id}/status`, { status: novoStatus });
    set("status", novoStatus);
    onSalvo({ ...cliente, status: novoStatus });
  };

  const inp = (k, label, placeholder = "", type = "text") => (
    <div style={{ marginBottom: 12 }}>
      <label style={{ display: "block", fontSize: 11, color: "#64748b", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>
        {label}
      </label>
      <input
        type={type}
        value={form[k]}
        onChange={e => set(k, e.target.value)}
        placeholder={placeholder}
        style={{
          width: "100%",
          padding: "9px 12px",
          borderRadius: 8,
          border: "1px solid #1e3a5f",
          background: "#0d1a2e",
          color: "#e2e8f0",
          fontSize: 13,
          boxSizing: "border-box"
        }}
      />
    </div>
  );

  const abaBtnStyle = (a) => ({
    padding: "7px 14px",
    borderRadius: 7,
    border: "none",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 600,
    background: aba === a ? "rgba(56,189,248,0.15)" : "transparent",
    color: aba === a ? "#38bdf8" : "#64748b",
  });

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box modal-grande" onClick={e => e.stopPropagation()} style={{ maxWidth: 540 }}>
        <div className="modal-title" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <span style={{ fontSize: '1.25rem', fontWeight: 700, color: '#38bdf8' }}>✏️ {cliente.nome}</span>
        <BadgeCliente status={form.status} />
        </div>

        {/* Abas */}
        <div style={{ display: "flex", gap: 4, marginBottom: 16, borderBottom: "1px solid #1e3a5f", paddingBottom: 8, flexWrap: 'wrap' }}>
          <button style={abaBtnStyle("dados")} onClick={() => setAba("dados")}>📋 Dados</button>
          <button style={abaBtnStyle("contato")} onClick={() => setAba("contato")}>📞 Contato</button>
          <button style={abaBtnStyle("financeiro")} onClick={() => setAba("financeiro")}>💰 Financeiro</button>
          <button style={abaBtnStyle("promessa")} onClick={() => setAba("promessa")}>🤝 Promessa</button>
          <button
            style={{
              ...abaBtnStyle("cancelar"),
              color: aba === "cancelar" ? "#f87171" : "#64748b",
              background: aba === "cancelar" ? "rgba(248,113,113,0.12)" : "transparent"
            }}
            onClick={() => setAba("cancelar")}
          >
            ❌ Cancelar
          </button>
        </div>

        {aba === "dados" && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 12px" }}>
              {inp("nome", "Nome completo", "Ex: Marine Silva")}
              {inp("cpf", "CPF", "000.000.000-00")}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "3fr 1fr", gap: "0 12px" }}>
              {inp("endereco", "Endereço", "Rua, bairro")}
              {inp("numero", "Nº da casa", "Ex: 123")}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 12px" }}>
              {inp("senha", "PPPoE (senha da conexão)", "Ex: cliente123")}
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: "block", fontSize: 11, color: "#64748b", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Plano
                </label>
                <select
                  value={form.plano}
                  onChange={e => set("plano", e.target.value)}
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: 8,
                    border: "1px solid #1e3a5f",
                    background: "#0d1a2e",
                    color: form.plano ? "#e2e8f0" : "#64748b",
                    fontSize: 13,
                    boxSizing: "border-box"
                  }}
                >
                  <option value="">-- selecione --</option>
                  <option value="Cabo 50MB — R$50">Cabo 50MB — R$ 50</option>
                  <option value="Fibra 200MB — R$60">Fibra 200MB — R$ 60</option>
                  <option value="Fibra 200MB + IPTV — R$70">Fibra 200MB + IPTV — R$ 70</option>
                </select>
              </div>
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ display: "block", fontSize: 11, color: "#64748b", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Roteador em comodato
              </label>
              <div style={{ display: "flex", gap: 6 }}>
                {["comodato", "proprio"].map(opcao => (
                  <button
                    key={opcao}
                    onClick={() => set("comodato", opcao === "comodato")}
                    style={{
                      flex: 1,
                      padding: "9px 0",
                      borderRadius: 8,
                      border: "1px solid",
                      borderColor: form.comodato === (opcao === "comodato") ? "#38bdf8" : "#1e3a5f",
                      background: form.comodato === (opcao === "comodato") ? "rgba(56,189,248,0.12)" : "transparent",
                      color: form.comodato === (opcao === "comodato") ? "#38bdf8" : "#64748b",
                      fontWeight: 700,
                      cursor: "pointer"
                    }}
                  >
                    {opcao === "comodato" ? "📦 Comodato" : "🏠 Próprio"}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ display: "block", fontSize: 11, color: "#64748b", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Dia de Vencimento
              </label>
              <div style={{ display: "flex", gap: 6 }}>
                {["10", "20", "30"].map(d => (
                  <button
                    key={d}
                    onClick={() => { set("dia_vencimento", d); setDiaOutro(""); }}
                    style={{
                      flex: 1,
                      padding: "9px 0",
                      borderRadius: 8,
                      border: "1px solid",
                      borderColor: form.dia_vencimento === d && !diaOutro ? "#38bdf8" : "#1e3a5f",
                      background: form.dia_vencimento === d && !diaOutro ? "rgba(56,189,248,0.12)" : "transparent",
                      color: form.dia_vencimento === d && !diaOutro ? "#38bdf8" : "#64748b",
                      fontWeight: 700,
                      cursor: "pointer"
                    }}
                  >
                    Dia {d}
                  </button>
                ))}
                <input
                  type="number"
                  min="1"
                  max="31"
                  placeholder="Outro"
                  value={diaOutro}
                  onChange={e => { setDiaOutro(e.target.value); if (e.target.value) set("dia_vencimento", e.target.value); }}
                  style={{
                    flex: 1,
                    padding: "9px 0",
                    borderRadius: 8,
                    textAlign: "center",
                    border: "1px solid",
                    borderColor: diaOutro ? "#38bdf8" : "#1e3a5f",
                    background: diaOutro ? "rgba(56,189,248,0.12)" : "#0d1a2e",
                    color: diaOutro ? "#38bdf8" : "#e2e8f0",
                    fontWeight: 700,
                    fontSize: 13,
                    boxSizing: "border-box"
                  }}
                />
              </div>
            </div>

            {inp("observacao", "Observação", "Notas internas...")}

            {/* Cobrança avançada — configuração customizada por cliente (opcional) */}
            <div style={{ borderTop: "1px solid #1e3a5f", marginTop: 12, paddingTop: 12 }}>
              <button
                onClick={() => setMostrarConfigAvancada(v => !v)}
                style={{
                  width: "100%", textAlign: "left", background: "none", border: "none",
                  color: "#64748b", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em",
                  cursor: "pointer", padding: 0, marginBottom: mostrarConfigAvancada ? 10 : 0
                }}
              >
                {mostrarConfigAvancada ? "▾" : "▸"} Cobrança avançada (opcional)
              </button>

              {mostrarConfigAvancada && (
                <div>
                  <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 10 }}>
                    Dias de aviso relativos ao vencimento (negativo = antes, positivo = depois).
                    O último número é tratado como risco de suspensão.
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
                    {offsets.map((o, i) => (
                      <span key={i} style={{
                        display: "flex", alignItems: "center", gap: 6,
                        padding: "5px 10px", borderRadius: 6,
                        background: "rgba(56,189,248,0.1)", border: "1px solid rgba(56,189,248,0.25)",
                        color: "#38bdf8", fontSize: 12, fontWeight: 700
                      }}>
                        {o > 0 ? `+${o}` : o}
                        <button
                          onClick={() => setOffsets(offsets.filter((_, idx) => idx !== i))}
                          style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: 12, padding: 0 }}
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>
                  <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
                    <input
                      type="number"
                      placeholder="Ex: 4"
                      value={novoOffset}
                      onChange={e => setNovoOffset(e.target.value)}
                      style={{
                        flex: 1, padding: "8px 12px", borderRadius: 8, border: "1px solid #1e3a5f",
                        background: "#0d1a2e", color: "#e2e8f0", fontSize: 13, boxSizing: "border-box"
                      }}
                    />
                    <button
                      onClick={() => {
                        const n = parseInt(novoOffset);
                        if (!isNaN(n) && !offsets.includes(n)) setOffsets([...offsets, n].sort((a, b) => a - b));
                        setNovoOffset("");
                      }}
                      style={{
                        padding: "8px 14px", borderRadius: 8, border: "none",
                        background: "rgba(56,189,248,0.15)", color: "#38bdf8", fontWeight: 700, cursor: "pointer", fontSize: 13
                      }}
                    >
                      + Add
                    </button>
                  </div>

                  {configMsg && (
                    <div style={{
                      padding: "8px 12px", borderRadius: 7, marginBottom: 8, fontSize: 12,
                      background: configMsg.ok ? "rgba(34,197,94,.08)" : "rgba(239,68,68,.08)",
                      border: `1px solid ${configMsg.ok ? "rgba(34,197,94,.25)" : "rgba(239,68,68,.25)"}`,
                      color: configMsg.ok ? "#4ade80" : "#f87171"
                    }}>
                      {configMsg.txt}
                    </div>
                  )}

                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      onClick={salvarConfigAvancada}
                      disabled={salvandoConfig}
                      style={{
                        flex: 1, padding: "9px 0", borderRadius: 8, border: "none",
                        background: salvandoConfig ? "#1e3a5f" : "#2563eb", color: "#fff",
                        fontWeight: 600, fontSize: 13, cursor: salvandoConfig ? "not-allowed" : "pointer"
                      }}
                    >
                      {salvandoConfig ? "Salvando..." : "💾 Salvar config"}
                    </button>
                    {!!cliente.config_cobranca && (
                      <button
                        onClick={removerConfigAvancada}
                        disabled={salvandoConfig}
                        style={{
                          padding: "9px 14px", borderRadius: 8, border: "1px solid rgba(248,113,113,0.3)",
                          background: "transparent", color: "#f87171", fontWeight: 600, fontSize: 13, cursor: "pointer"
                        }}
                      >
                        Remover
                      </button>
                    )}
                  </div>

                  {cobrarMsg && (
                    <div style={{
                      padding: "8px 12px", borderRadius: 7, marginTop: 8, marginBottom: 8, fontSize: 12,
                      background: cobrarMsg.ok ? "rgba(34,197,94,.08)" : "rgba(239,68,68,.08)",
                      border: `1px solid ${cobrarMsg.ok ? "rgba(34,197,94,.25)" : "rgba(239,68,68,.25)"}`,
                      color: cobrarMsg.ok ? "#4ade80" : "#f87171"
                    }}>
                      {cobrarMsg.txt}
                    </div>
                  )}
                  <button
                    onClick={cobrarAgora}
                    disabled={cobrandoAgora}
                    style={{
                      width: "100%", marginTop: 8, padding: "9px 0", borderRadius: 8,
                      border: "1px solid rgba(74,222,128,0.3)", background: "rgba(74,222,128,0.08)",
                      color: "#4ade80", fontWeight: 700, fontSize: 13, cursor: cobrandoAgora ? "not-allowed" : "pointer"
                    }}
                  >
                    {cobrandoAgora ? "Enviando..." : "📤 Cobrar agora"}
                  </button>
                </div>
              )}
            </div>

            {/* Solicitar carnê direto da ficha */}
            <div style={{ borderTop: "1px solid #1e3a5f", marginTop: 12, paddingTop: 12 }}>
              {carneMsg && (
                <div style={{
                  padding: "8px 12px",
                  borderRadius: 7,
                  marginBottom: 8,
                  fontSize: 12,
                  background: carneMsg.ok ? "rgba(34,197,94,.08)" : "rgba(239,68,68,.08)",
                  border: `1px solid ${carneMsg.ok ? "rgba(34,197,94,.25)" : "rgba(239,68,68,.25)"}`,
                  color: carneMsg.ok ? "#4ade80" : "#f87171"
                }}>
                  {carneMsg.txt}
                </div>
              )}
              <button
                onClick={solicitarCarne}
                disabled={solicitandoCarne}
                style={{
                  width: "100%",
                  padding: "9px 0",
                  borderRadius: 8,
                  border: "1px solid rgba(167,139,250,.3)",
                  background: "rgba(167,139,250,.08)",
                  color: "#a78bfa",
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: "pointer"
                }}
              >
                {solicitandoCarne ? "Solicitando..." : "📋 Solicitar Carnê Físico"}
              </button>
            </div>
          </div>
        )}

        {aba === "contato" && (
          <div>
            {inp("telefone", "Telefone / WhatsApp", "81999999999")}
          </div>
        )}

        {aba === "financeiro" && (
          <div>
            <PainelDatas
              clienteId={cliente.id}
              diaVencimento={parseInt(form.dia_vencimento) || cliente.dia_vencimento || 10}
              plano={form.plano || cliente.plano || ""}
              onStatusChange={(novoStatus) => {
                set("status", novoStatus);
                onSalvo({ ...cliente, status: novoStatus });
              }}
            />
          </div>
        )}

        {aba === "promessa" && (
          <div>
            <div style={{
              background: "rgba(167,139,250,0.08)",
              border: "1px solid rgba(167,139,250,0.2)",
              borderRadius: 10,
              padding: "14px",
              marginBottom: 16,
              fontSize: 13,
              color: "#94a3b8"
            }}>
              Registre uma promessa de pagamento para <b style={{ color: "#e2e8f0" }}>{form.nome}</b>.
              O status dela ficará como 🤝 Promessa e o sistema vai acompanhar o vencimento.
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ display: "block", fontSize: 11, color: "#64748b", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Data da promessa
              </label>
              <input
                type="date"
                value={dataPromessa}
                onChange={e => setDataPromessa(e.target.value)}
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  borderRadius: 8,
                  border: "1px solid #1e3a5f",
                  background: "#0d1a2e",
                  color: "#e2e8f0",
                  fontSize: 13,
                  boxSizing: "border-box"
                }}
              />
              <div style={{ fontSize: 11, color: "#475569", marginTop: 4 }}>
                Ou escreva em texto: ex. "25/03", "dia 25", "próxima semana"
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 11, color: "#64748b", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                ou data em texto livre
              </label>
              <input
                type="text"
                placeholder='Ex: "dia 25", "25/03/2026"'
                onChange={e => setDataPromessa(e.target.value)}
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  borderRadius: 8,
                  border: "1px solid #1e3a5f",
                  background: "#0d1a2e",
                  color: "#e2e8f0",
                  fontSize: 13,
                  boxSizing: "border-box"
                }}
              />
            </div>

            {promMsg && (
              <div style={{
                padding: "10px 14px",
                borderRadius: 8,
                marginBottom: 12,
                background: promMsg.ok ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
                border: `1px solid ${promMsg.ok ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)"}`,
                color: promMsg.ok ? "#4ade80" : "#f87171",
                fontSize: 13
              }}>
                {promMsg.txt}
              </div>
            )}

            <button
              onClick={salvarPromessa}
              disabled={salvandoProm}
              style={{
                width: "100%",
                padding: "11px 0",
                borderRadius: 8,
                border: "none",
                background: salvandoProm ? "#1e3a5f" : "linear-gradient(135deg, #7c3aed, #6d28d9)",
                color: "#fff",
                fontWeight: 700,
                fontSize: 14,
                cursor: salvandoProm ? "not-allowed" : "pointer"
              }}
            >
              {salvandoProm ? "Salvando..." : "🤝 Registrar Promessa"}
            </button>
          </div>
        )}

        {aba === "cancelar" && (
          <div>
            {cancelado ? (
              <div style={{ textAlign: "center", padding: "2rem 0" }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
                <div style={{ fontWeight: 700, color: "#f87171", fontSize: 16, marginBottom: 8 }}>
                  Cancelamento registrado!
                </div>
                <div style={{ fontSize: 13, color: "#64748b" }}>
                  O cliente foi movido para a página de cancelamentos.
                </div>
              </div>
            ) : (
              <>
                <div style={{
                  background: "rgba(248,113,113,0.08)",
                  border: "1px solid rgba(248,113,113,0.2)",
                  borderRadius: 10,
                  padding: "14px",
                  marginBottom: 16,
                  fontSize: 13,
                  color: "#94a3b8"
                }}>
                  Registre o cancelamento de <b style={{ color: "#e2e8f0" }}>{form.nome}</b>.
                  O cliente será movido para a lista de cancelamentos e marcado como cancelado na base.
                </div>

                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: "block", fontSize: 11, color: "#64748b", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Motivo do cancelamento
                  </label>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {MOTIVOS_CANCELAMENTO.map(m => (
                      <button
                        key={m}
                        onClick={() => setMotivoCancelamento(m)}
                        style={{
                          padding: "9px 14px",
                          borderRadius: 8,
                          border: "1px solid",
                          borderColor: motivoCancelamento === m ? "#f87171" : "#1e3a5f",
                          background: motivoCancelamento === m ? "rgba(248,113,113,0.12)" : "transparent",
                          color: motivoCancelamento === m ? "#f87171" : "#64748b",
                          fontWeight: 600,
                          cursor: "pointer",
                          fontSize: 13,
                          textAlign: "left",
                          transition: "all .15s"
                        }}
                      >
                        {motivoCancelamento === m ? "● " : "○ "}{m}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: "block", fontSize: 11, color: "#64748b", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Observação (opcional)
                  </label>
                  <textarea
                    value={motivoDetalhe}
                    onChange={e => setMotivoDetalhe(e.target.value)}
                    placeholder="Detalhes adicionais sobre o cancelamento..."
                    rows={3}
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      borderRadius: 8,
                      border: "1px solid #1e3a5f",
                      background: "#0d1a2e",
                      color: "#e2e8f0",
                      fontSize: 13,
                      boxSizing: "border-box",
                      resize: "vertical",
                      fontFamily: "inherit"
                    }}
                  />
                </div>

                {cancelMsg && (
                  <div style={{
                    padding: "10px 14px",
                    borderRadius: 8,
                    marginBottom: 12,
                    background: cancelMsg.ok ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
                    border: `1px solid ${cancelMsg.ok ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)"}`,
                    color: cancelMsg.ok ? "#4ade80" : "#f87171",
                    fontSize: 13
                  }}>
                    {cancelMsg.txt}
                  </div>
                )}

                <button
                  onClick={async () => {
                    if (!motivoCancelamento) {
                      setCancelMsg({ ok: false, txt: "Selecione um motivo" });
                      return;
                    }
                    if (!confirm(`Confirma o cancelamento de ${form.nome}?`)) return;
                    setSalvandoCancel(true);
                    setCancelMsg(null);
                    try {
                      // Cancelamento atômico — /api/cancelamentos já deleta o cliente da base
                      const json = await api.post("/api/cancelamentos", {
                        cliente_id: cliente.id,
                        base_id: baseId,
                        nome: form.nome,
                        telefone: form.telefone || null,
                        endereco: form.endereco || null,
                        plano: form.plano || null,
                        dia_vencimento: cliente.dia_vencimento || null,
                        motivo: motivoCancelamento,
                        motivo_detalhado: motivoDetalhe || null,
                        solicitado_via: "painel",
                      });
                      if (json.ok) {
                        setCancelado(true);
                        // Remove da lista — backend já deletou do Firestore
                        onSalvo({ ...cliente, status: "cancelado" });
                        setTimeout(() => onClose(), 1500);
                      } else {
                        setCancelMsg({ ok: false, txt: json.erro || "Erro ao registrar" });
                      }
                    } catch (e) {
                      setCancelMsg({ ok: false, txt: e.message || "Falha de conexão" });
                    }
                    setSalvandoCancel(false);
                  }}
                  disabled={salvandoCancel || !motivoCancelamento}
                  style={{
                    width: "100%",
                    padding: "12px 0",
                    borderRadius: 8,
                    border: "none",
                    background: salvandoCancel || !motivoCancelamento ? "#1e3a5f" : "linear-gradient(135deg, #dc2626, #b91c1c)",
                    color: salvandoCancel || !motivoCancelamento ? "#475569" : "#fff",
                    fontWeight: 700,
                    fontSize: 14,
                    cursor: salvandoCancel || !motivoCancelamento ? "not-allowed" : "pointer"
                  }}
                >
                  {salvandoCancel ? "Registrando..." : "❌ Confirmar Cancelamento"}
                </button>
              </>
            )}
          </div>
        )}

        {erro && <div style={{ color: "#f87171", fontSize: 13, marginTop: 8 }}>{erro}</div>}

        <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
          {aba !== "promessa" && aba !== "cancelar" && (
            <button
              className="btn-save"
              onClick={salvar}
              disabled={salvando}
              style={{
                padding: '8px 16px',
                borderRadius: 8,
                border: 'none',
                background: salvando ? '#1e3a5f' : '#2563eb',
                color: '#fff',
                fontWeight: 600,
                fontSize: 13,
                cursor: salvando ? 'not-allowed' : 'pointer'
              }}
            >
              {salvando ? "Salvando..." : "💾 Salvar alterações"}
            </button>
          )}
          <button
            className="btn-cancel"
            onClick={onClose}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              border: '1px solid #374151',
              background: 'transparent',
              color: '#94a3b8',
              fontWeight: 600,
              fontSize: 13,
              cursor: 'pointer'
            }}
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};