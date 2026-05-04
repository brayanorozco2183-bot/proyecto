import LiveConsole from './components/LiveConsole';
import MissionControl from './components/MissionControl';
import MissionPhaseMonitor from './components/MissionPhaseMonitor';
import SiteSettings from './components/SiteSettings';
import AuditView from './components/AuditView';
import KeywordExplorer from './components/KeywordExplorer';
import AssetsGallery from './components/AssetsGallery';
import AgentPlayground from './components/AgentPlayground';
import KnowledgeHub from './components/KnowledgeHub';
import PublishedUrls from './components/PublishedUrls';
import CollapsibleSection from './components/CollapsibleSection';

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
    <main style={{ maxWidth: '1600px', margin: '0 auto', padding: '2rem' }}>
      <header className="dashboard-header" style={{ marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '0.25rem', background: 'linear-gradient(to right, #6366f1, #10b981)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontWeight: 900 }}>
            SEO Maestro Orchestrator V7.2
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: '1rem' }}>Sincronización Total: Enjambre de Agentes Autónomos con Aprendizaje V8.0</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className={`status-badge ${agents.length > 0 ? 'status-active' : 'status-error'}`} style={{ padding: '0.5rem 1.5rem', fontSize: '0.85rem' }}>
            {agents.length > 0 ? 'SISTEMA OPERATIVO' : 'ESPERANDO NÚCLEO'}
          </div>
          <p style={{ fontSize: '0.75rem', marginTop: '0.5rem', opacity: 0.5 }}>KERNEL: 7.2.4-GOLD-V80</p>
        </div>
      </header>

      {/* Quick Intelligence Bar */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="premium-card" style={{ background: 'rgba(99, 102, 241, 0.05)' }}>
          <h3 style={{ color: 'var(--muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Agentes en Red</h3>
          <p style={{ fontSize: '2rem', fontWeight: 800 }}>{agents.length}</p>
        </div>
        <div className="premium-card" style={{ background: 'rgba(16, 185, 129, 0.05)' }}>
          <h3 style={{ color: 'var(--muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Páginas Generadas</h3>
          <p style={{ fontSize: '2rem', fontWeight: 800 }}>
            {stats.find((s: Stat) => s.status === 'PUBLISHED' || s.status === 'READY' || s.status === 'DRAFT')?.count || 0}
          </p>
        </div>
        <div className="premium-card" style={{ background: 'rgba(234, 179, 8, 0.05)' }}>
          <h3 style={{ color: 'var(--muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Puntos de Aprendizaje</h3>
          <p style={{ fontSize: '2rem', fontWeight: 800 }}>600+</p>
        </div>
        <div className="premium-card" style={{ background: 'rgba(239, 68, 68, 0.05)' }}>
          <h3 style={{ color: 'var(--muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Consumo de Tokens (Est.)</h3>
          <p style={{ fontSize: '2rem', fontWeight: 800 }}>Mínimo</p>
        </div>
      </section>

      {/* Main Orchestration Layer */}
      <CollapsibleSection title="Orquestación de Misiones" badge="LIVE CONTROL">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
          <MissionControl />
          <LiveConsole />
        </div>
        <MissionPhaseMonitor />
      </CollapsibleSection>

      {/* High Fidelity Audit View */}
      <CollapsibleSection title="Auditoría Pre-Publicación" badge="V7.2 LIVE DETECTION">
        <AuditView />
      </CollapsibleSection>

      {/* Knowledge Hub & Secondary Tools */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
        <CollapsibleSection title="Nucleus Knowledge Hub" badge="LEARNING V8.0">
          <KnowledgeHub />
        </CollapsibleSection>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <CollapsibleSection title="URLs Publicadas" badge="DEPLOY" defaultOpen={false}>
                <PublishedUrls />
            </CollapsibleSection>
            <CollapsibleSection title="Configuración de Sitio" badge="SITE DNA" defaultOpen={false}>
                <SiteSettings />
            </CollapsibleSection>
        </div>
      </div>

      <CollapsibleSection title="Herramientas Avanzadas de Agentes" badge="LAB" defaultOpen={false}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '2rem' }}>
            <AgentPlayground />
            <KeywordExplorer />
            <AssetsGallery />
          </div>
      </CollapsibleSection>

      <footer style={{ marginTop: '4rem', padding: '3rem 0', borderTop: '1px solid rgba(255,255,255,0.05)', textAlign: 'center', color: 'var(--muted)', fontSize: '0.875rem' }}>
        <p style={{ marginBottom: '0.5rem' }}>&copy; 2026 Gravity V7.2 SEO Orchestrator. Dominación Autónoma de las SERP.</p>
        <p style={{ opacity: 0.3, fontSize: '0.7rem' }}>Protegido por Semantic Guard V8.0 & Autonomous Learning Pack</p>
      </footer>
    </main>
  );
}
