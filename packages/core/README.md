
# ComplianceOS Core (Open Source)

The open-source core of ComplianceOS, a comprehensive GRC (Governance, Risk, and Compliance) platform.

## Features

- **Dashboard**: Centralized view of compliance status.
- **Client Management**: Manage multiple clients or organizations.
- **Control Library**: Manage compliance controls.
- **Policy Management**: Create and distribute policies.
- **Risk Management**: Risk register, assessments, and heatmaps.
- **Vendor Management**: Track vendor risks and assessments.
- **Business Continuity**: BCP planning and analysis.
- **Evidence Collection**: Upload and link evidence to controls.

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL (Supabase recommended)

### Installation

1.  Clone the repository.
2.  Install dependencies:
    ```bash
    npm install
    ```

### Environment Setup

Copy `.env.example` to `.env` and fill in your Supabase credentials.

```bash
cp .env.example .env
```

Required variables:
- `DATABASE_URL`: Connection string to your PostgreSQL database.
- `VITE_SUPABASE_URL`: Your Supabase Project URL.
- `VITE_SUPABASE_ANON_KEY`: Your Supabase Anon Key.
- `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase Service Role Key (for backend).

### Running the App

Start the development server:

```bash
npm run dev
```

Start the backend server (for API/TRPC):

```bash
npm run server
```

## Architecture

This project is a Monorepo.
- `packages/core`: The main application logic and UI.
- `packages/ui`: Shared UI components (shadcn/ui).

**Note on Premium Features**:
Some features referenced in the code (like AI Advisor/Copilot) are part of the Premium edition. In this open-source build, these features are disabled or mocked automatically.

## License

[License Name Here]
