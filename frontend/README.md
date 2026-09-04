# Realty Hub — Frontend + Admin (Enhanced Build)

Kerala-focused real estate + luxury vehicle marketplace: public site, fully wired to a working admin panel via `localStorage` (frontend demo persistence layer — swap for a real API later).

## What changed in this pass
- **Removed all "PREVIEW / API IMAGE / GALLERY" placeholder blocks.** Every property, vehicle and blog card now renders a real photograph. Images are self-hosted from `assets/images/` and are chosen deterministically per item and category (see `themedImage()` in `assets/js/main.js`), so the same listing always shows the same on-topic photo, any new item added from the admin panel automatically gets one too, and nothing depends on a third-party image API that can return an unrelated photo or fail to load — no more gray placeholder boxes, mismatched photos, or blank sections.
- **Homepage is now animated and data-driven.** Featured properties, featured vehicles, published testimonials and published blog posts are pulled live from the same store the admin panel edits — add/feature something in the admin panel and it appears on the homepage. Sections fade/rise into view on scroll (`IntersectionObserver`, respects `prefers-reduced-motion`), and the hero has a subtle slow-zoom background.
- **Properties & Vehicles pages are fully functional**, not static HTML: real filtering (location, type, listing, budget, bedrooms, live text search) against the same data store, with a proper **"No Listings Match Your Search"** state (broaden-location / adjust-price / fewer-filters tips, popular search chips, featured alternatives) matching the supplied UI.
- **Property & Vehicle detail pages are dynamic** (`?id=`): gallery with clickable thumbnails, amenities, agent info, and a "Schedule a Viewing" / "Interested in This Vehicle?" form.
- **Enquiry forms now show a real success screen** ("Enquiry Submitted Successfully!" with a reference ID, submission time and next steps) instead of a one-line note, and every submission is saved into the admin Inquiries inbox.
- **About page rebuilt to match the supplied UI**: About hero, "Our Story & Mission" with photo, "Why Curators & Investors Choose Us" grid, and a "Get in Touch" section with office details + message form.
- **New public Blog** (`blog.html`, `blog-post.html`) so posts published from the admin Blog module are actually visible on the live site.
- **SEO**: canonical tags, Open Graph + Twitter Card metadata, `RealEstateAgent` JSON-LD on the homepage, a corrected `sitemap.xml`/`robots.txt`, per-page `<title>`/description, and semantic `alt` text on every image.

## Stack
- HTML5, one shared CSS design system, vanilla JavaScript
- `localStorage` as the frontend demo database (see "Production note" below)
- No build step, no framework — open `index.html` directly or serve statically

## Public pages
`index.html`, `properties.html`, `property-details.html`, `vehicles.html`, `vehicle-details.html`, `projects.html`, `project-details.html`, `blog.html`, `blog-post.html`, `about.html`, `contact.html`, `login.html`

## Admin panel (`/admin`)
Login-gated (`login.html` → session flag). Modules:
- **Dashboard** — live counts (properties, vehicles, inquiries, featured) + recent activity
- **Properties** — add / edit / delete, feature toggle, search + status filter
- **Vehicles** — add / edit / delete, feature toggle, search + status filter
- **Inquiries** — every public enquiry/contact form submission lands here, with status workflow (New → Pending → Contacted → Closed)
- **Testimonials** — add / edit / delete, publish/draft
- **Blog** — add / edit / delete, category + status filters, SEO fields, shows live on `/blog.html`
- **Featured** — drag-to-reorder featured properties carousel, syncs with the homepage
- **Categories** — manage property categories used in the property form
- **Profile** — admin account details (demo only)

## Production note
This is still a **frontend demo**: the login gate is session-only (not real auth), and all CRUD data lives in the browser's `localStorage`. For production, connect these same forms/admin actions to a real backend (e.g. Django REST Framework) with:
- Secure session/JWT authentication + server-side authorization
- A real database instead of `localStorage`
- Real media upload/storage (S3, Cloudinary, etc.) — uploaded file previews currently use temporary in-browser object URLs that don't persist across reloads
- Server-rendered or prerendered SEO for pages with dynamic (`?id=`) content, if search-engine crawling of individual listings matters

## Run
Open `index.html` directly, or serve statically:

```
python -m http.server 8000
```

Then visit `http://localhost:8000/`.
