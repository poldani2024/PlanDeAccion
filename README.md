# Plan de Acción PNL

Aplicación web para el seguimiento de objetivos basados en Programación Neurolingüística.

## Stack

- **Frontend**: React + TypeScript + Vite + TailwindCSS + Framer Motion
- **Backend**: Node.js + Express + Prisma + PostgreSQL
- **Auth**: JWT
- **Charts**: Recharts

## Inicio rápido con Docker

```bash
docker-compose up -d
```

La app estará disponible en `http://localhost:5173`

**Cuenta demo**: `demo@plandeaccion.app` / `demo1234`

## Desarrollo local

### Backend

```bash
cd backend
cp .env.example .env
# Editá .env con tu DATABASE_URL
npm install
npx prisma migrate dev
npx prisma db seed
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Características

- ✅ Flujo guiado de 9 pasos para definir objetivos (método PNL)
- ✅ Plan de Acción con micro-acciones
- ✅ Registro diario (emociones, motivación, energía, acciones)
- ✅ 7 técnicas de PNL interactivas paso a paso
- ✅ Dashboard con estadísticas y racha
- ✅ Revisiones semanales
- ✅ Sistema de logros y gamificación
- ✅ Mapa de calor de actividad
- ✅ Diseño responsive (Desktop + Mobile)
- ✅ Modo claro

## Estructura

```
PlanDeAccion/
├── backend/
│   ├── prisma/          # Schema y seed
│   └── src/
│       ├── routes/      # API endpoints
│       ├── middleware/  # Auth JWT
│       └── utils/       # Prisma client
├── frontend/
│   └── src/
│       ├── components/  # UI reutilizables
│       ├── pages/       # Vistas principales
│       ├── lib/         # API client, utils
│       ├── store/       # Estado global (Zustand)
│       └── types/       # TypeScript types
└── docker-compose.yml
```
