# CreateWebSeoOptimized - V6 Local Domination Cluster Engine

`CreateWebSeoOptimized` is a state-of-the-art agentic system designed for automated, high-scale SEO content generation and local domination. It leverages a fleet of specialized AI agents to analyze markets, architect content, write high-quality copy, and deploy SEO-optimized pages to WordPress or static environments.

## 🚀 Key Features

- **Multi-Agent Orchestration**: A sophisticated conductor model that manages dozens of specialized agents.
- **Local Domination**: Advanced geographical intelligence for targeting specific cities and clusters.
- **EEAT Compliance**: Built-in quality assurance and linguistic auditing to ensure content meets search engine standards.
- **Hybrid Deployment**: Supports direct WordPress publishing and static HTML deployment.
- **Dynamic Content Architecture**: Automated layout selection and niche coherence enforcement.
- **SERP Analysis**: Real-time competitor auditing and keyword extraction.
- **Dashboard**: Real-time monitoring and mission control via a web interface.

## 🏗️ Architecture

The system follows a modular, agent-based architecture:

### Core Components
- **Orchestrator**: The central brain that receives commands and manages the mission lifecycle.
- **Registry**: Manages agent discovery and communication.
- **Mission Queue**: Powered by BullMQ and Redis for scalable task processing (with a local Failsafe Mode).
- **Database**: SQLite-based persistence for mission logs, site settings, and city data.

### Specialized Agents (Partial List)
- **SEO Analyst**: Market research, SERP scraping, and keyword strategy.
- **Content Architect**: Page structure and semantic design.
- **Content Writer**: Generates high-density, niche-specific copy.
- **Linguist**: Grammatical correction and semantic variety.
- **Technical Lead**: JSON-LD Schema generation and technical SEO optimization.
- **NAP Guardian**: Manages consistent business identity (Name, Address, Phone).
- **Geo Intel**: Geographical expansion and local cluster logic.
- **Static Deploy / WP Bridge**: Deployment handlers for different targets.

## 🛠️ Tech Stack

- **Runtime**: Node.js with TypeScript
- **Automation**: Playwright (for scraping and audits)
- **Data Persistence**: SQLite & Redis
- **Task Management**: BullMQ
- **Web Framework**: Express (for the dashboard)
- **AI Integration**: Custom agent implementations with Zod-based validation.

## ⚙️ Getting Started

### Prerequisites
- Node.js (v18+)
- Redis (Optional, system enters Failsafe Mode if unavailable)
- Npm or Yarn

### Installation
1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure environment variables in `.env`.

### Running the System
- **Start the Orchestrator**:
  ```bash
  npm start
  ```
- **Launch the Dashboard**:
  ```bash
  npm run dashboard
  ```
- **CLI Command Examples**:
  ```bash
  npx tsx src/orchestrator/orchestrator.ts "@freeze cerrajeros barcelona"
  ```

## 📊 Dashboard
The dashboard provides a visual interface to:
- Monitor active missions.
- View detailed logs from each agent.
- Manage site settings and deployment credentials.
- Track quality scores and audit results.

---
*Created with ❤️ for SEO automation.*

## BLE V2.4 Hardening

Este proyecto separa ahora uso de laboratorio y uso de produccion. Antes de publicar o exponer el dashboard ejecuta:

```bash
npm run typecheck
npm run audit:security
npm run audit:hardening
npm run prepare:production
```

Variables minimas de produccion:

- `NODE_ENV=production`
- `DASHBOARD_AUTH_TOKEN` obligatorio si el dashboard esta expuesto
- `PIPELINE_SOFT_MODE=false`
- `DEBUG_MODE=false`
- `QUALITY_AUDIT_FAIL_OPEN=false`

Los artefactos generados, bases de datos, scratch y backups no deben formar parte del paquete principal de produccion. Usa `npm run prepare:production` para auditarlo en modo dry-run.
