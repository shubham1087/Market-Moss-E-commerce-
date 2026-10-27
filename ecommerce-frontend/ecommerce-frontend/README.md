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

On the admin product form, either choose a JPG, JPEG, PNG, or WebP image up to 5 MB from your computer, or enter an image URL. A local file is validated and uploaded to Cloudinary; the resulting HTTPS URL is saved in the existing product `imageUrl`/`image_url` field. An entered URL is saved through the existing JSON product endpoint. Newly uploaded images are not stored on Render's temporary filesystem or in the frontend build.

### Product image upload configuration

Create a Cloudinary account and set these environment variables on the backend. Do not put their values in source files or commit them:

| Variable | Purpose |
| --- | --- |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |
| `FRONTEND_URL` | Exact origin allowed by backend CORS, e.g. `http://localhost:5173` locally or the deployed Render frontend origin |

The backend defaults to a 5 MB image limit and allows a 6 MB multipart request envelope. Locally, set the three Cloudinary variables in the backend process environment, then start Spring Boot from the backend project directory:

```powershell
$env:CLOUDINARY_CLOUD_NAME = "your-cloud-name"
$env:CLOUDINARY_API_KEY = "your-api-key"
$env:CLOUDINARY_API_SECRET = "your-api-secret"
$env:FRONTEND_URL = "http://localhost:5173"
.\mvnw.cmd spring-boot:run
```

Keep `VITE_API_URL` unset for local development to use the Vite `/api` proxy to `http://localhost:8080`. If calling a backend directly, set `VITE_API_URL` to its origin without a trailing slash.

For deployment, add the Cloudinary credentials and `FRONTEND_URL` as environment variables to the Render backend service. Set `VITE_API_URL` on the Render frontend service to the backend's public origin and redeploy/rebuild the frontend. The backend must also have its normal database and authentication configuration.

To test locally, start the backend and frontend, sign in with an admin account, and open `/admin/products`. Add a product with each required field. Test once with a small valid local image, confirm its preview, and submit; verify its `imageUrl` response/database `image_url` is a Cloudinary HTTPS URL. Test again by pasting a reachable image URL instead of selecting a file; verify that URL is saved. Try a file over 5 MB and an unsupported file type; each should be rejected without creating a product. Repeat on the deployed frontend and verify the image URL loads after deployment or a backend restart. Cloudinary upload failures are returned as a specific backend message rather than the generic server error.

The multipart endpoints are `POST /api/products/with-image` and `PUT /api/products/{id}/with-image`; they accept a JSON `product` part and an `image` file part. Existing JSON product endpoints remain available for other clients and for edits that keep the current image.

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
