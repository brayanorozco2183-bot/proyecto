import LiveConsole from './components/LiveConsole';
import MissionControl from './components/MissionControl';
import SiteSettings from './components/SiteSettings';
import AuditView from './components/AuditView';
import KeywordExplorer from './components/KeywordExplorer';
import AssetsGallery from './components/AssetsGallery';
import AgentPlayground from './components/AgentPlayground';
import KnowledgeHub from './components/KnowledgeHub';
import SeoMasterControl from './components/SeoMasterControl';
import PublishedUrls from './components/PublishedUrls';

interface Agent {
  id: string;
  role: string;
}

interface Stat {
  status: string;
  count: number;
}

async function getStats() {
  try {
    const res = await fetch('http://localhost:8081/api/stats', { cache: 'no-store', next: { revalidate: 0 } });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

async function getAgents() {
  try {
    const res = await fetch('http://localhost:8081/api/agents', { cache: 'no-store', next: { revalidate: 0 } });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export default async function Home() {
  const stats = await getStats();
  const agents = await getAgents();

  return (
    <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Maestro Command Center</h1>
          <p style={{ color: 'var(--muted)' }}>Monitoreo en tiempo real del enjambre de agentes SEO.</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className={`status-badge ${agents.length > 0 ? 'status-active' : 'status-error'}`}>
            {agents.length > 0 ? 'Sistema Online' : 'Esperando API'}
          </div>
          <p style={{ fontSize: '0.75rem', marginTop: '0.5rem', opacity: 0.5 }}>v1.0.0-PRO</p>
        </div>
      </header>

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
        <div className="premium-card">
          <h3 style={{ color: 'var(--muted)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Total Agentes Activos</h3>
          <p style={{ fontSize: '2rem', fontWeight: 700 }}>{agents.length}</p>
        </div>
        <div className="premium-card">
          <h3 style={{ color: 'var(--muted)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Misiones Publicadas</h3>
          <p style={{ fontSize: '2rem', fontWeight: 700 }}>
            {stats.find((s: Stat) => s.status === 'PUBLISHED')?.count || 0}
          </p>
        </div>
        <div className="premium-card">
          <h3 style={{ color: 'var(--muted)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Tasa de Éxito QA</h3>
          <p style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--accent)' }}>98.4%</p>
        </div>
      </section>

      <section style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr', gap: '1.5rem', alignItems: 'start', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <SiteSettings />
          <MissionControl />
        </div>

        <LiveConsole />

        <div className="premium-card" style={{ height: 'fit-content' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>Estado del Enjambre</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {agents.map((agent: Agent) => (
              <div key={agent.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: '#18181b', borderRadius: '8px' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{agent.id}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Especialidad: {agent.role}</div>
                </div>
                <div className="status-badge status-active" style={{ fontSize: '0.625rem' }}>Active</div>
              </div>
            ))}
            {agents.length === 0 && <p style={{ fontSize: '0.875rem', color: 'var(--muted)' }}>No hay agentes registrados.</p>}
          </div>
        </div>
      </section>

      <div style={{ marginBottom: '3rem' }}>
        <SeoMasterControl />
      </div>

      <div style={{ marginBottom: '3rem' }}>
        <PublishedUrls />
      </div>

      <div style={{ marginBottom: '3rem' }}>
        <AgentPlayground />
      </div>

      <div style={{ marginBottom: '3rem' }}>
        <KnowledgeHub />
      </div>

      <section style={{ marginTop: '2rem' }}>
        <AuditView />
        <KeywordExplorer />
        <AssetsGallery />
      </section>

      <footer style={{ marginTop: '4rem', padding: '2rem 0', borderTop: '1px solid var(--border)', textAlign: 'center', color: 'var(--muted)', fontSize: '0.875rem' }}>
        &copy; 2026 SEO Maestro AI. Creado para la dominación total de las SERP locales.
      </footer>
    </main>
  );
}
