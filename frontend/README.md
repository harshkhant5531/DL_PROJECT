# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

# Frontend Setup

## Run Locally

1. Start backend first on port 8000.
2. Run frontend:

```bash
npm install
npm run dev
```

The app calls `/api/process_frame` and Vite proxies that to `http://127.0.0.1:8000` in development.

## Custom Backend URL

If backend is running on another host/port, create a `.env` file in `frontend`:

```env
VITE_BACKEND_URL=http://127.0.0.1:8000
```

When `VITE_BACKEND_URL` is set, frontend calls that URL directly.
