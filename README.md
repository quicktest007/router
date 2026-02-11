# Covenant Eyes Router – Purchase-Intent Landing Page

Static site (HTML, CSS, JS only). No frameworks, no build tools. Runs by opening `index.html` and deploys on GitHub Pages.

## File tree

```
/
├── index.html
├── checkout.html
├── README.md
└── assets/
    ├── styles.css
    ├── app.js
    ├── checkout.js
    ├── index.js
    ├── config.js
    └── router.png   (placeholder; replace with your product image)
```

## Local run

**Important:** Open or serve the site from the **project root** (the folder that contains both `index.html` and the `assets` folder). If you open an `index.html` that lives in a different folder, the CSS and images won’t load and the page will look unstyled.

- Double-click `index.html` in the project root, or drag it into the browser.  
- Or serve the folder from the project root:

```bash
python3 -m http.server 8000
# Open http://localhost:8000
```

## GitHub Pages deployment

1. Push the repo to GitHub (e.g. branch `main`).
2. In the repo go to **Settings → Pages**.
3. Under **Build and deployment**, set **Source** to **Deploy from a branch**.
4. Choose **Branch**: `main` (or your default), **Folder**: `/ (root)`.
5. Click **Save**. After a minute or two the site is live at:
   `https://<username>.github.io/<repo-name>/`

## Optional webhook

Edit `assets/config.js` and set `WEBHOOK_URL` to your endpoint URL. On checkout submit, the lead payload is POSTed as JSON. If unset or if the request fails, the lead is still stored in `localStorage` only.

## Conversion metrics

- **Events** are stored in `localStorage` under the key `events` and logged to the console:
  - `view_product` – index page load
  - `select_package` – user toggles 1 Pack / 2 Pack
  - `click_checkout` – user clicks Checkout
  - `submit_email` – user submits a valid email on checkout

- **Leads** are stored in `localStorage` under the key `leads`. Each lead includes: `email`, `selected_package`, `price`, `timestamp`, `referrer`, `user_agent`, and UTM fields if present.

- **Funnel**: view_product → select_package → click_checkout → submit_email. Compare counts at each step to see drop-off. Use UTM parameters on campaign links to compare traffic sources.
