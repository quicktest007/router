# Covenant Eyes Router

Static site (HTML, CSS, JS only). No frameworks, no build tools. Runs by opening `index.html` and deploys on GitHub Pages. Product page with gallery, pack selector, savings, and checkout.

## File tree

```
/
├── index.html
├── checkout.html
├── privacy.html
├── terms.html
├── README.md
└── assets/
    ├── styles.css
    ├── app.js
    ├── index.js
    ├── checkout.js
    ├── config.js
    ├── CErouter1pack.png    (1 Pack product image)
    ├── CErouter2pack.png    (2 Pack product image)
    ├── router-angle.png     (optional gallery thumbnail)
    └── router-lifestyle.png (optional gallery thumbnail)
```

## Required asset filenames

- **CErouter1pack.png** – Shown for 1 Pack selection; used as main image and in gallery.
- **CErouter2pack.png** – Shown for 2 Pack selection; used in gallery.
- **router-angle.png**, **router-lifestyle.png** – Optional. If present, add them to the gallery in `index.html` and `assets/index.js` (e.g. in the `GALLERY_SRCS` array). If omitted, the gallery uses the two pack images (4 thumbnails total).

## How to replace images

1. Keep the same filenames so links don’t break, or update every reference in the repo:
   - `index.html`: `src` on `.gallery__thumb` and `.gallery__main`.
   - `assets/index.js`: `GALLERY_SRCS`, `GALLERY_ALTS`, and the `updateProductImage()` logic (CErouter1pack / CErouter2pack).
2. Recommended: replace the files in place so `CErouter1pack.png` and `CErouter2pack.png` stay the same names.

## Local run

Open or serve the site from the **project root** (the folder that contains both `index.html` and the `assets` folder).

- Double-click `index.html`, or run a local server from the project root, e.g.:
  `python3 -m http.server 8000` then open `http://localhost:8000`.

## GitHub Pages deployment

1. Push the repo to GitHub (e.g. branch `main`).
2. Go to **Settings → Pages**.
3. Under **Build and deployment**, set **Source** to **Deploy from a branch**.
4. Choose **Branch**: `main` (or your default), **Folder**: `/ (root)`.
5. Click **Save**. The site will be at `https://<username>.github.io/<repo-name>/`

## Optional webhook

Edit `assets/config.js` and set `WEBHOOK_URL` to your endpoint. On checkout submit (“Place order”), the order/lead data (including email, package, qty, total, savings, UTM) is POSTed as JSON. If unset or the request fails, the data is still stored in `localStorage`.

## Tracking events

Stored in `localStorage` under the key `events` (and logged to the console):

- **view_product** – Index page load
- **select_pack** – User selects 1 PACK or 2 PACK
- **click_thumbnail** – User changes gallery image
- **add_to_cart** – User clicks Add to cart (package, price, qty, savings)
- **submit_email** – User submits email on checkout

UTM params are captured on load and stored in `localStorage`; they are included in the lead payload on checkout.

## Brand colors

Use only these in CSS:

- Hero Blue: `#005EE0`
- Executive Blue: `#002870`
- Ally Blue: `#49BADD`
- White: `#FFFFFF`

No gradients.
