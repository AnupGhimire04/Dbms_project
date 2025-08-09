# FoodEase Frontend

Modern web UI for the FoodEase restaurant management system.  
Built with **Next.js (App Router)**, **TypeScript**, and **Tailwind CSS**.

> This repository uses Next.js + TypeScript with an `/app` directory and Tailwind configuration; the codebase is predominantly TypeScript. :contentReference[oaicite:0]{index=0}

---

## ✨ Features

- **Admin UI** for:
  - **Menu Management**: create/edit items, images, customization groups/options
  - **Categories**: CRUD + thumbnail management
  - **Tables**: status tracking (available / occupied / reserved / maintenance)
  - **Orders**: view details, update statuses, payment info
  - **Statistics & Dashboards**: daily/weekly/monthly trends, top sellers, category revenue
- **Auth flow** (paired with backend JWT cookie sessions)
- **Responsive** layouts with Tailwind
- **Type-safe** codebase (TypeScript)

---

## 🧱 Tech Stack

- **Framework**: Next.js (App Router)
- **Language**: TypeScript (≈98%) :contentReference[oaicite:1]{index=1}
- **Styling**: Tailwind CSS
- **UI Components**: local `components/` (compatible with shadcn-style composition)
- **Data**: REST calls to the FoodEase backend API

---

## 📁 Project Structure (high level)

```
Dbms_project/
├─ app/           # App Router routes and layouts
├─ components/    # UI building blocks
├─ hooks/         # Reusable React hooks
├─ lib/           # API clients, utils
├─ public/        # Static assets
├─ styles/        # Global styles
├─ tailwind.config.js
├─ next.config.mjs
├─ tsconfig.json
└─ package.json
```

---

## 🔧 Prerequisites

- **Node.js** 18+
- A running **FoodEase Backend** (see backend repo README for setup)
- Backend must be reachable from the browser (CORS allowed)

---

## 🏃 Scripts

Using **npm**:

```bash
# install
npm install

# start dev server
npm run dev

# type-check
npm run type-check

# build for production
npm run build

# start production server (after build)
npm run start

# lint
npm run lint
```

> If you prefer pnpm, run `pnpm install && pnpm dev`. A lockfile for pnpm may be present.

---

## 🚀 Running Locally

1) **Start the backend** (ensure DB and env are configured).  
2) **Configure** `.env.local` with your backend URL.  
3) **Install** and **run**:

```bash
npm install
npm run dev
# open http://localhost:3000
```

You should be able to:
- Log in as admin (`/login` or the app’s entry route, depending on your setup)
- Manage **Menu** and **Categories**
- Manage **Tables**
- View and update **Orders**
- Explore **Statistics** dashboards

---

## 🔌 API Contract (expected endpoints)

The frontend calls the following backend routes (HTTP-only JWT cookies recommended):

**Auth**
- `POST /auth/login`
- `POST /auth/logout`
- `GET  /auth/me`
- `PATCH /auth/updateUser`
- `PATCH /auth/updatePassword`

**Menu**
- `GET  /menu`
- `POST /menu`
- `GET  /menu/:id`
- `PATCH /menu/:id`
- `DELETE /menu/:id`
- `PATCH /menu/image/:id`
- `GET  /menu/category/:categoryId`

**Categories**
- `GET  /categories`
- `POST /categories`
- `GET  /categories/:id`
- `PATCH /categories/:id`
- `DELETE /categories/:id`
- `PATCH /categories/image/:id`

**Tables**
- `GET  /tables`
- `POST /tables`
- `GET  /tables/:id`
- `PATCH /tables/:id`
- `DELETE /tables/:id`
- `PATCH /tables/:id/status`

**Orders**
- `GET  /orders`
- `POST /orders`
- `GET  /orders/:id`
- `PATCH /orders/:id`
- `DELETE /orders/:id`
- `PATCH /orders/:id/status`
- `GET  /orders/table/:tableId`
- `GET  /orders/status/:status`

**Statistics**
- `GET  /stats/daily`
- `GET  /stats/weekly`
- `GET  /stats/monthly`
- `GET  /stats/custom`

> Make sure the backend sets the authentication cookie on the **same domain** (or correct CORS + `credentials: 'include'` if cross-origin).

---

## 🧰 Development Notes

- **Data fetching**: centralize API calls in `lib/` with a tiny wrapper that injects `baseURL`, credentials, and errors.
- **State**: co-locate component state; lift to context/store only for cross-page needs (e.g., session user).
- **UI**: components in `components/` are designed for composition; keep them dumb/presentational where possible.
- **Styling**: Tailwind utility-first styling with project-wide config in `tailwind.config.js`.

---


