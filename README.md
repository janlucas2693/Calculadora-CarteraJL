# Calculadora de Portafolio

App React + Vite con la calculadora de Markowitz / pignoración / backtest.
La data se carga desde `yfinance_results.json` (generado por `download_data.py`) usando el botón "📂 Cargar JSON" del banner, y queda persistida en localStorage del browser.

## Correr local

```bash
npm install
npm run dev
```

Abre http://localhost:5173

## Build de producción

```bash
npm run build      # genera /dist
npm run preview    # sirve /dist localmente para verificar
```

## Deploy gratis a Vercel (recomendado)

1. Crea cuenta en https://vercel.com (gratis, login con GitHub).
2. Sube esta carpeta a un repo de GitHub:
   ```bash
   git init && git add . && git commit -m "init"
   git remote add origin https://github.com/<tu-usuario>/<repo>.git
   git push -u origin main
   ```
3. En Vercel: "Add New Project" → seleccionas el repo → Deploy.
   - Framework detecta Vite automáticamente, no toques nada.
4. Te da una URL pública tipo `https://<repo>.vercel.app`.
5. Cada `git push` a `main` redespliega automáticamente.

## Deploy alternativo: Netlify

Mismo flow que Vercel. https://netlify.com — login con GitHub, importas el repo, deploy.
Framework: Vite. Build command: `npm run build`. Publish dir: `dist`.

## Estructura

```
.
├── index.html              # entry HTML + fonts + CSS variables
├── package.json            # deps (react, react-dom, recharts) + vite
├── vite.config.js          # plugin de react
└── src/
    ├── main.jsx            # bootstrap, monta <Calculadora /> en #root
    └── calculadora.jsx     # el componente entero
```
