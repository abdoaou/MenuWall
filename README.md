# MenuWall Admin

Frontend admin panel to test every endpoint in **MenuApi(V2)** on your Desktop.

## Run

1. Start the API (from `MenuApi(V2)`):

   ```bash
   npm install
   npm run dev
   ```

2. Start this admin UI:

   ```bash
   npm install
   npm run dev
   ```

3. Open http://localhost:5173

The app defaults to the hosted API:

**https://menuapi-v2-test.up.railway.app/api/v1**

Use the **Railway** button in the top bar to reset the base URL. For local API testing, set base URL to `http://localhost:3000/api/v1` (Vite proxy `/api/v1` also works when both apps run locally).

## Usage

1. **Auth** — Log in with admin email/username + password (min 8 chars). JWT is stored in localStorage.
2. **Websites** — Create a website, then set its ID in the top bar as **Website ID** (`x-website-id` header).
3. **API Keys** — Create a key (tenant required); copy the plain key into **API key** for **Public API** routes.
4. Use sidebar sections for Products, Categories, Menus, Settings, etc.

## Covered endpoints

| Section | Routes |
|---------|--------|
| Auth | `POST /auth/login`, `/refresh`, `/logout` |
| Health | `GET /health` |
| Public | `GET /public/products`, `/categories`, `/menus/:slug`, `/settings` |
| Websites | Full CRUD |
| Admins | Full CRUD |
| Parent categories | Full CRUD + image upload |
| Categories | Full CRUD + image upload |
| Products | Full CRUD + filters + image upload |
| Product variants | Full CRUD |
| Menus | CRUD + add/remove items |
| Settings | List, get by key, upsert, delete |
| API keys | List, create, revoke |

If the API runs on another host, set **API base** to e.g. `http://localhost:3000/api/v1`.
