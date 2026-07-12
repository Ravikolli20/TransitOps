# TransitOps

**TransitOps** is a highly polished, full-stack Smart Transport Operations Platform designed to digitize vehicle management, driver dispatch, maintenance, fuel tracking, expense logging, and real-time fleet analytics. 

Built with **React 19**, **Vite**, **Express**, and styled using **Tailwind CSS v4** with the **Professional Polish** design system, TransitOps provides transit and fleet managers with an intuitive, executive-grade operational command center.

---

## 🚀 Key Features

*   **Executive Dashboard**: Key Performance Indicators (KPIs) tracking active vehicles, driver supply, pending trips, and fuel burn rates with high-performance visualization charts.
*   **Vehicle Fleet Management**: Direct oversight of fleet vehicles including status tracking (Operational, Maintenance, Out of Service), specifications, inspection schedules, and active duty assignments.
*   **Driver Management**: Full driver profiles with licensing status, safety ratings, contact cards, and current shift assignments.
*   **Trip Dispatcher**: Live trip coordination showing dispatch schedules, origin/destination points, allocated drivers, assigned vehicles, and real-time transit state tracking.
*   **Maintenance Log**: Tracks technical inspections, scheduled garage operations, costs, and mechanic reports.
*   **Fuel & Expenses Logger**: Monitors diesel liters, total refueling costs, fuel efficiency analytics, and overall ledger bookkeeping of operational costs.
 **Real-time Analytics**: High-quality **Recharts** integrations for fleet utilization, revenue vs. expense trends, and operational cost breakdowns.
*   **Server-Side AI Assistance**: Power-assisted intelligence utilizing the **Gemini 2.5 Flash** model for smart suggestions, automation, and analytics insights.



## 🛠️ Technology Stack

*   **Frontend**: 
    *   [React 19](https://react.dev/) — Interactive user interface
    *   [Tailwind CSS v4](https://tailwindcss.com/) — Modern, utility-first styling with high-performance CSS engine
    *   [Lucide React](https://lucide.dev/) — Professional, clean, and modern vector icon library
    *   [Recharts](https://recharts.org/) — Responsive, modular SVG chart library for React
    *   [Motion](https://motion.dev/) — Smooth, micro-interactive spring animations and route transitions
*   **Backend**:
    *   [Express](https://expressjs.com/) — High-performance Node.js API server
    *   [Vite Middleware](https://vite.dev/) — Integrated development server bundling and hot reloading
    *   [esbuild](https://esbuild.github.io/) — Ultra-fast JavaScript & TypeScript bundling for production
    *   [Google Gen AI SDK](https://github.com/google/generative-ai-js) — Unified interface for Gemini API operations
*   **Persistence**:
    *   Local filesystem-backed JSON database engine for rapid prototyping and mock storage.

---

## 📦 Project Structure

```text
├── .env.example            # Environment variables template
├── index.html              # Vite entry point html
├── metadata.json           # Application metadata and permissions
├── package.json            # Node dependencies and npm scripts
├── server.ts               # Custom Express server with Vite middleware integration
├── tsconfig.json           # TypeScript configuration
├── vite.config.ts          # Vite configuration with Tailwind CSS plugin
├── src/
│   ├── main.tsx            # Main client entrypoint
│   ├── App.tsx             # Root React component managing view states
│   ├── index.css           # Global Tailwind CSS configuration and theme fonts
│   ├── types.ts            # Core TypeScript models and interfaces
│   ├── components/         # Modular user interface views
│   │   ├── AnalyticsView.tsx
│   │   ├── AuthView.tsx
│   │   ├── DashboardView.tsx
│   │   ├── DriversView.tsx
│   │   ├── ExpensesView.tsx
│   │   ├── FuelView.tsx
│   │   ├── Header.tsx
│   │   ├── MaintenanceView.tsx
│   │   ├── ReportsView.tsx
│   │   ├── Sidebar.tsx
│   │   ├── TripsView.tsx
│   │   └── VehiclesView.tsx
│   └── server/             # Server utilities
```

---

## ⚙️ Setup and Installation

### Prerequisites

*   [Node.js](https://nodejs.org/) (v18+ recommended)
*   [npm](https://www.npmjs.com/) (v9+)

### Installation

1. Clone the repository or navigate to the project directory:
   ```bash
   cd transitops
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure Environment Variables:
   Create a `.env` file in the root directory or copy `.env.example`:
   ```bash
   cp .env.example .env
   ```
   Provide your Gemini API key in `.env`:
   ```env
   GEMINI_API_KEY="your-google-gemini-api-key"
   ```

---
