# Thamizharasan R · Portfolio

A static, single-page portfolio built with plain HTML, CSS, and JavaScript. It has no build step and no dependencies.

## Run locally

Open `index.html` in a browser, or serve the folder. Serving it is recommended, because the "Copy email" button can then use the clipboard API.

```bash
cd ~/Downloads/Portfolio
python3 -m http.server 8080
# then open http://localhost:8080
```

`npx serve .` works too.

## Deploy

Upload the folder as-is to any static host.

- **GitHub Pages:** push the folder's contents to a repository, then enable Pages under Settings → Pages → Deploy from a branch.
- **Netlify:** drag the folder onto app.netlify.com/drop, or connect the repository with no build command.
- **Vercel:** run `npx vercel` in this folder and pick the "Other" framework preset with no build command.
- **Cloudflare Pages:** create a project with no build command and this folder as the output directory.

`404.html` links back to `/`. If you deploy under a sub-path, such as a GitHub project page at `username.github.io/portfolio/`, change that link to the sub-path.

## Structure

```
Portfolio/
├── index.html          All page content, one comment banner per section
├── 404.html            Self-contained not-found page
└── assets/
    ├── css/styles.css  Design tokens (light and dark) and all styles
    ├── js/main.js      Theme toggle, mobile menu, scroll effects, copy email
    ├── img/            Favicon, Apple touch icon, FoodTrack icon, project app icons
    └── resume/         Résumé PDF served by the hero's "Download Resume" button
```

## Editing

- All content lives in `index.html`.
- Colors, spacing, and fonts are CSS variables at the top of `styles.css`. The dark values appear twice, once for the system setting and once for the manual toggle, so edit both.
- A visitor's theme choice is stored in `localStorage` under `portfolio-theme`.

## Content notes

- Profile, skills, experience, projects, education, and contact details come from the résumé, including the LinkedIn and App Store links. The résumé PDF itself lives at `assets/resume/thamizharasan-r-resume.pdf` and is served by the hero's "Download Resume" button via the HTML `download` attribute, so it saves to the visitor's device on click without needing JavaScript or a server. To update it, replace that PDF, keeping the same filename (or update the button's `href`/`download` attributes in `index.html` to match).
- The FoodTrack feature list reflects the FoodTrack codebase as of 25 September 2026. The admin flow is listed under "In progress" because its screens still use sample data. Move it to "Working today" once it is connected to the backend.
