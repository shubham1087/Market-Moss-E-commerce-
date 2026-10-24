# Market & Moss — E-commerce Frontend

Market & Moss is a React storefront for browsing a product collection, managing a shopping bag, and placing and tracking orders. It also includes account registration and sign-in, an admin product-management page, and a shopping assistant.

## Tech stack

- React 19
- Vite 8
- React Router
- Axios
- ESLint

## Requirements

- Node.js and npm
- The Market & Moss API backend, running locally on port `8080`

The frontend repository does not include the backend. During development, Vite forwards requests made to `/api` to `http://localhost:8080`.

## Getting started

From the project directory:

```bash
npm install
npm run dev
```

Open the local URL printed by Vite (usually `http://localhost:5173`). Start the API backend before using features that load or update server data.

## Available scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Vite development server with hot module replacement. |
| `npm run build` | Create a production build in `dist/`. |
| `npm run preview` | Serve the production build locally. Run `npm run build` first. |
| `npm run lint` | Run ESLint across the project. |

## Storefront features

- Browse products and open individual product detail pages.
- Add products to the shopping bag, adjust quantities, and review the subtotal.
- Register and sign in to access protected checkout and order-history pages.
- Submit orders through the API.
- Manage products from the admin page when signed in with an administrator account.
- Ask the shopping assistant for help.

## Routes

| Path | Page | Access |
| --- | --- | --- |
| `/` | Home | Public |
| `/products` | Product collection | Public |
| `/products/:id` | Product details | Public |
| `/register` | Create an account | Public |
| `/login` | Sign in | Public |
| `/cart` | Shopping bag | Public |
| `/checkout` | Checkout | Signed-in users |
| `/orders` | Order history | Signed-in users |
| `/admin/products` | Product administration | Administrators |

## API integration

The Axios client uses `/api` as its base URL, and the Vite development server proxies that path to `http://localhost:8080`. The frontend calls endpoints for product and category data, user registration and sign-in, orders, and the shopping assistant. The API backend must provide the routes and response formats expected by the frontend.

To use a different backend during development, update the proxy target in `vite.config.js`.
