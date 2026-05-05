import LiveConsole from './components/LiveConsole';
import MissionControl from './components/MissionControl';
import MissionPhaseMonitor from './components/MissionPhaseMonitor';
import MissionPhaseTimer from './components/MissionPhaseTimer';
import SiteSettings from './components/SiteSettings';
import AuditView from './components/AuditView';
import KeywordExplorer from './components/KeywordExplorer';
import AssetsGallery from './components/AssetsGallery';
import AgentPlayground from './components/AgentPlayground';
import KnowledgeHub from './components/KnowledgeHub';
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
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', marginBottom: '4rem', borderBottom: '1px solid var(--border)', paddingBottom: '2rem', flexWrap: 'wrap', gap: '2rem' }}>
        <div style={{ minWidth: '300px' }}>
          <h1 style={{ fontSize: '3.5rem', lineHeight: 1 }}>Maestro</h1>
          <p style={{ color: 'var(--muted)', fontSize: '1.1rem', marginTop: '0.5rem', fontWeight: 500 }}>
            Command Center <span style={{ color: 'var(--primary)' }}>{'//'}</span> Agent Intelligence Swarm
          </p>
        </div>
        <div style={{ textAlign: 'right', flex: 1, minWidth: '300px' }}>
          <div className={`status-badge ${agents.length > 0 ? 'status-active' : 'status-error'}`} style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', display: 'inline-block' }}>
            {agents.length > 0 ? 'CORE SYSTEM ONLINE' : 'WAITING FOR API'}
          </div>
          <p style={{ fontSize: '0.7rem', marginTop: '0.75rem', color: 'var(--muted)', letterSpacing: '0.2em' }}>VERSION 2.1-PRO // LEZO STABLE</p>
        </div>
      </header>

      <section className="stats-grid" style={{ marginBottom: '3rem' }}>
        <div className="premium-card">
          <h3 style={{ color: 'var(--muted)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Total Agentes Activos</h3>
          <p style={{ fontSize: '2rem', fontWeight: 700 }}>{agents.length}</p>
        </div>
        <div className="premium-card">
          <h3 style={{ color: 'var(--muted)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Misiones en Proceso</h3>
          <p style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--primary)' }}>
            {stats.reduce((acc: number, s: Stat) => 
              ['RESEARCHING', 'ANALYZED', 'PLANNING', 'WRITING', 'EDITING', 'CORRECTING', 'QA_READY', 'PROCESSING', 'IMAGES', 'IMAGES_GENERATING', 'QA', 'COMPLETENESS', 'TECHNICAL_VALIDATION'].includes(s.status) ? acc + s.count : acc, 0)}
          </p>
        </div>
        <div className="premium-card">
          <h3 style={{ color: 'var(--muted)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Misiones Publicadas</h3>
          <p style={{ fontSize: '2rem', fontWeight: 700 }}>
            {stats.find((s: Stat) => s.status === 'PUBLISHED' || s.status === 'STATIC_READY' || s.status === 'COMPLETED')?.count || 0}
          </p>
        </div>
        <div className="premium-card">
          <h3 style={{ color: 'var(--muted)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Tasa de Éxito QA</h3>
          <p style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--accent)' }}>98.4%</p>
        </div>
      </section>

      <section className="responsive-grid" style={{ marginBottom: '3rem' }}>
        {/* COLUMNA IZQUIERDA (Principal - 2fr) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <MissionControl />
          <MissionPhaseMonitor />
          <LiveConsole />
          <PublishedUrls />
        </div>

        {/* COLUMNA DERECHA (Sidebar - 1fr) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <MissionPhaseTimer />
          
          <div className="premium-card">
            <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>Estado del Enjambre</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '400px', overflowY: 'auto', paddingRight: '0.5rem' }}>
              {agents.map((agent: Agent) => (
                <div key={agent.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--primary)' }}>{agent.id}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{agent.role}</div>
                  </div>
                  <div className="status-badge status-active" style={{ fontSize: '0.625rem' }}>Online</div>
                </div>
              ))}
              {agents.length === 0 && <p style={{ fontSize: '0.875rem', color: 'var(--muted)' }}>No hay agentes registrados.</p>}
            </div>
          </div>

          <SiteSettings />
          <AgentPlayground />
        </div>
      </section>


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
