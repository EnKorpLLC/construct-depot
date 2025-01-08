# Construct Depot Bulk Buying Platform

A modern web application for managing bulk building material purchases and sales, connecting contractors, and streamlining construction material procurement.

## Features

- Bulk order aggregation system
- Supplier management
- Real-time order tracking
- Shipping and logistics management
- Take-off service from blueprints
- Contractor bidding platform
- Multi-role user system

## Tech Stack

### Frontend
- React.js with Next.js
- TypeScript
- Tailwind CSS
- Material-UI/Chakra UI

### Backend
- Node.js with Express
- PostgreSQL
- Redis
- GraphQL
- WebSocket

## Getting Started

### Prerequisites
- Node.js (v18 or later)
- Git
- PostgreSQL
- Redis

### Installation

1. Clone the repository
```bash
git clone [repository-url]
```

2. Install frontend dependencies
```bash
cd frontend
npm install
```

3. Install backend dependencies
```bash
cd backend
npm install
```

4. Set up environment variables
```bash
cp .env.example .env
```

5. Start development servers
```bash
# Frontend
cd frontend
npm run dev

# Backend
cd backend
npm run dev
```

## Project Structure

```
├── frontend/           # Frontend application
│   ├── src/           # Source files
│   └── public/        # Static files
├── backend/           # Backend application
│   ├── src/          # Source files
│   └── config/       # Configuration files
└── docs/             # Documentation
```

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details 