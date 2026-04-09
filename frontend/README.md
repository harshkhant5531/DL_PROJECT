# MPIIGaze Frontend Showcase

Modern React + Vite UI for presenting the MPIIGaze model with:

- **Overview page** for value proposition and pipeline storytelling
- **Live demo page** for webcam-based real-time inference
- **Benchmarks page** for model performance framing
- **Model story page** for architecture and deployment narrative

## Run locally

1. Start backend on port `8000`.
2. Start frontend:

```bash
npm install
npm run dev
```

The frontend calls `/api/process_frame`; Vite proxies this to `http://127.0.0.1:8000` in development.

## Custom backend URL

To call a deployed backend directly, create `frontend/.env`:

```env
VITE_BACKEND_URL=http://127.0.0.1:8000
```

When `VITE_BACKEND_URL` is set, the app uses that base URL instead of the dev proxy.
