# Ripple Analyzer

> **Supply Chain Intelligence & Dependency Risk Simulator**  
> Ripple maps open-source dependency graphs, ranks structural risk, and simulates compromise blast radius across applications.

---

## Overview

Traditional vulnerability scanners rely almost entirely on CVSS scores. A low-level utility with a low CVSS can cause catastrophic damage if hundreds of critical systems depend on it, while a high-severity vulnerability in an isolated, dead-end library might have near-zero actual blast radius.

**Ripple Analyzer** shifts the focus from simple advisory counts to **structural graph importance**:
- **Reverse-Graph PageRank**: Measures transitive gravity and downstream dependence.
- **Betweenness Centrality**: Finds chokepoint packages that lie on the shortest dependency paths.
- **Monte Carlo Compromise Simulator**: Simulates attack vectors (malicious releases, account takeovers, protestware, build backdoors, and typosquats) to model actual probability of infection across downstream applications.
- **Actionable Mitigations**: Quantifies risk reduction per unit of engineering effort.

---

## Features

- **Interactive Dependency Graph**: High-performance canvas rendering with pan, zoom, layer stratification (utilities, libraries, frameworks, applications), and real-time ripple wave visualization.
- **Compromise Simulation**: Monte Carlo draw engine modeling stochastic attack propagation through runtime, dev, and optional edges.
- **Critical Packages Board**: Search and sort dependencies by Ripple score, blast radius, weekly downloads, maintainer count, and active CVEs.
- **Application Impact View**: Discover which mission-critical applications (finance, healthcare, government) inherit risk from transitive dependencies.
- **Mitigation Planner**: Prioritize refactoring, pinning, or replacing libraries based on expected leverage.
- **Incident Replays**: Walk through real-world supply chain compromises (e.g., `event-stream`, `xz-utils`) to see how Ripple detects structural danger before CVE disclosure.

---

## Tech Stack

- **Framework**: [TanStack Start](https://tanstack.com/start) / [TanStack Router](https://tanstack.com/router)
- **UI & Styling**: [React 19](https://react.dev/), [Tailwind CSS v4](https://tailwindcss.com/), [Radix UI](https://www.radix-ui.com/), [Lucide React](https://lucide.dev/)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **Build & Server**: [Vite](https://vitejs.dev/), [Nitro](https://nitro.unjs.io/)
- **Deployment**: Zero-configuration support for **Netlify** and **Vercel**

---

## Getting Started

### Prerequisites

- Node.js 20+ (Node 22 recommended)
- npm / pnpm / yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/hackingkali1/ripple-analyzer.git
cd ripple-analyzer

# Install dependencies
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:8080](http://localhost:8080) in your browser.

### Building for Production

```bash
# Production build
npm run build

# Preview production build
npm run preview
```

### Verification & Testing

```bash
# Type check
npm run typecheck

# Lint check
npm run lint

# Run automated tests
npm run test
```

---

## Deployment

### Netlify

The repository includes a `netlify.toml` preconfigured for Netlify deployment:

1. Push to your GitHub repository: `hackingkali1/ripple-analyzer`
2. Import the repository in [Netlify](https://app.netlify.com/).
3. Netlify will automatically detect the configuration:
   - **Build Command**: `npm run build`
   - **Publish Directory**: `dist`
4. Click **Deploy**.

Netlify Deployed link:-- https://ripple-analyzer.netlify.app/

Ripple is fully compatible with Vercel out of the box with zero additional configuration needed.

---

## License

MIT License.
