# Realty Hub — Django Backend + Frontend (Full Stack)

The frontend design is **completely unchanged** — same HTML, same CSS, same
layout, same admin panel screens. What changed is the data layer: every page
that used to read/write `localStorage` now talks to a real **Django REST
Framework** API, and the whole site (public pages + admin panel + API) is
served from **one Django project** so there's nothing else to configure.

## What was added

- `realtyhub_backend/` — Django project (settings, root URLs)
- `api/` — Django app with all models, serializers, views, permissions,
  Django admin registration, and a `seed_data` management command
- `frontend/` — your original frontend, byte-for-byte identical except for
  `assets/js/main.js`, which now calls the API instead of `localStorage`
- Single unified URL space:
  - `/` , `/properties.html`, `/admin/dashboard.html`, ... → the static frontend
  - `/api/...` → the REST API
  - `/django-admin/` → Django's built-in data admin (separate from the
    site's own `/admin/*.html` panel, which still works exactly as before —
    just now backed by real data)
  - `/media/...` → uploaded property/vehicle/blog photos

## Models (`api/models.py`)

`Property`, `PropertyImage`, `Vehicle`, `VehicleImage`, `Inquiry`,
`Testimonial`, `BlogPost`, `Category`, `AdminProfile` — field names mirror
the original JS objects (`listingType`, `builtYear`, `agentRole`, `seoTitle`,
`metaDescription`, etc.) so no renaming logic was needed on the frontend.

## REST API (`api/urls.py`, all under `/api/`)

| Endpoint | Notes |
|---|---|
| `GET/POST /api/properties/` , `GET/PATCH/DELETE /api/properties/<id>/` | filters: `status`, `featured=1`, `location`, `property_type`, `listing_type`, `q` |
| `GET/POST /api/vehicles/` , `.../<id>/` | filters: `status`, `featured=1`, `type`, `fuel`, `transmission`, `year` |
| `GET/POST /api/inquiries/` , `.../<id>/` | `POST` is public (contact/enquiry forms); list/update needs admin login |
| `GET/POST /api/testimonials/`, `.../<id>/` |
| `GET/POST /api/blog/`, `.../<id>/` |
| `GET/POST /api/categories/`, `.../<id>/` |
| `GET/POST /api/featured/` | ordered list of featured property ids; `POST {"order":[...]}` saves the drag-reorder from the admin Featured page |
| `GET/PUT/PATCH /api/profile/` | the logged-in admin's profile (auth required) |
| `GET /api/dashboard/` | aggregated counts + recent activity for the admin dashboard |
| `POST /api/auth/login/` | `{"email","password"}` → `{"token","name","email","role"}` |
| `POST /api/auth/logout/` | invalidates the current token |

**Auth:** DRF Token authentication. Reading (`GET`) is public everywhere so
the public site works without logging in. Every write (`POST`/`PATCH`/`DELETE`)
requires `Authorization: Token <token>`, except creating an `Inquiry`
(the public contact/enquiry forms), which is open to anyone. The admin panel
pages (`admin/*.html`) already redirected to `login.html` when there was no
session flag — that logic is untouched; the flag now holds a real auth token
instead of the placeholder `"demo"` string.

Image uploads (property/vehicle photos, blog cover image) are handled as
real `multipart/form-data` uploads and stored under `media/`, served at
`/media/...`. If a listing has no uploaded photo yet, the frontend still
falls back to the same curated local images it always did
(`assets/images/...`), so nothing ever looks broken.

## Run it

```bash
cd realtyhub_backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

python manage.py migrate
python manage.py seed_data      # creates demo data + an admin login
python manage.py runserver
```

### Removing the demo/seed data

Once you're ready to go live and don't want the demo properties, vehicles,
inquiries, testimonials, blog posts, and categories anymore, run:

```bash
python manage.py clear_seed_data
```

This deletes all of that content but **leaves your admin login untouched**
so you can keep logging in. It never touches anything in `frontend/`. If you
also want to remove the seeded admin account itself, add `--with-admin-user`
and then create a fresh one with `python manage.py createsuperuser`.

Then open **http://127.0.0.1:8000/** — that's the whole site: public
pages, admin panel, and API, all from one server.

**Demo admin login** (created by `seed_data`):
- Email: `admin@realtyhub.com`
- Password: `Thunderbird1`

### How login actually works on the site's admin panel (important)

`/api/auth/login/` (used by `login.html` / the admin panel) does **not**
check the password against one fixed value stored in the database. Per the
client's requirement, it instead accepts **any password that matches the
required format** — this is a deliberate business rule, not a bug:

1. The email must belong to an existing **admin user in the database** —
   any Django `User` row with `is_staff=True`. There is no fixed email
   list anymore: `admin@realtyhub.com`, `you@yourcompany.com`,
   `anyone@gmail.com`, etc. all work interchangeably, as long as that exact
   address is on a staff account (created by `seed_data`,
   `createsuperuser`, or promoted via `/django-admin/`). A plain, non-staff
   user's email will not be accepted.
2. The password must contain an uppercase letter, a lowercase letter, a
   number, and the word **"thunderbird"** (any casing) — checked by
   `ThunderbirdPasswordValidator` in `api/validators.py`.

If both are true, login succeeds — `Thunderbird1`, `Xy1thunderbird`,
`Zz9ThunderBird`, `Qq5thunderbirdAAA`, etc. are all valid logins for any
admin email. Anything that fails either check gets the same generic
`"Incorrect email or password."` response either way.

**Security note:** because of rule #2, this means anyone who knows the
format rule (which is now documented here, in the code, and in the login
UI) *and* knows or guesses an admin email address can log in with a
password of their own choosing — the format is the credential, not a
specific secret. This was requested explicitly as the project's
authentication model; if that ever changes, replace the
`validate_password(...)` call in `login_view()` (`api/views.py`) with a real
`authenticate()` check against a stored password again.

### Using your own email/password instead of the demo ones

`seed_data` accepts `--email`, `--password`, and `--username` so you're not
stuck with the demo login:

```bash
python manage.py seed_data --email="you@yourcompany.com" --password="YourOwnThunderbird9" --username="you"
```

This creates the user with `is_staff=True`, so `you@yourcompany.com`
immediately works on `/api/auth/login/` — no extra settings.py edit needed.
The password you set here only matters for `/django-admin/` and for
`manage.py changepassword`; the site's own `/api/auth/login/` accepts any
password matching the format (see above), regardless of what's stored.
To add more admin logins later, either run `seed_data` again with a new
`--email`, use `python manage.py createsuperuser`, or tick "Staff status" on
a user in `/django-admin/`.

The password must contain an uppercase letter, a lowercase letter, a
number, and the word **"thunderbird"** somewhere in it (any casing). This
rule is enforced by `ThunderbirdPasswordValidator` in `api/validators.py`,
which is registered in `AUTH_PASSWORD_VALIDATORS` (`settings.py`) — so it
applies everywhere Django validates a password: `seed_data`,
`changepassword`, `createsuperuser`, the Django admin's "change password"
form, the `/api/profile/` endpoint if a `password` field is sent to it, and
`/api/auth/login/` itself (used as the login rule, not just a set-password
rule). Anything that doesn't match is rejected with a message telling you
exactly what's missing.

To change the password used for `/django-admin/` and `changepassword` on an
**existing** account:
```bash
python manage.py changepassword admin
```
This prompts for a new password directly in the terminal and enforces the
rule above (remove the `api.validators.ThunderbirdPasswordValidator` entry
from `AUTH_PASSWORD_VALIDATORS` in `settings.py` if you don't want it
enforced).

**Django admin** (raw data management, separate from the site's own admin
panel): `http://127.0.0.1:8000/django-admin/` — log in with **either**:
- Username: `admin`
- Email: `admin@realtyhub.com`

both with password `Thunderbird1` (see `api/backends.py` — a custom auth
backend that matches the login field against username *or* email for any
account, so this also works for any other user you create with
`createsuperuser`). Or run `python manage.py createsuperuser` for another
account.

## Notes / next steps for production

- `DEBUG=True` and `SECRET_KEY` are dev defaults — set `DJANGO_DEBUG=False`,
  a real `DJANGO_SECRET_KEY`, and a real `ALLOWED_HOSTS` via environment
  variables before deploying.
- SQLite is used for simplicity; point `DATABASES` at Postgres/MySQL for
  production.
- Media files are served by Django's dev server for convenience; use
  S3/Cloudinary + whitenoise/nginx in production.
- `CORS_ALLOW_ALL_ORIGINS = True` is fine for local development; restrict it
  if the frontend and API ever end up on different origins.
- `GET` endpoints currently return every record regardless of status so the
  admin tables can filter client-side exactly like the old localStorage
  version did. If you don't want draft/unpublished listings reachable over
  the public API, add `published_only=1`-style filtering to the public
  fetches in `assets/js/main.js` (the query param is already supported
  server-side).

## Property gallery upload (updated)

The admin Property form now supports selecting **6 or more property photos** in one upload (there is no 5-photo limit). The first selected photo is saved as the property's main image and every remaining selected photo is saved as a `PropertyImage` gallery record.

When editing a property:
- The **Current Images** section shows the main image and every stored gallery image.
- Each extra gallery image can be removed individually with the `×` button.
- Newly selected photos are previewed before saving, with no artificial 5/8-image preview limit.

On the public `property-details.html?id=<property-id>` page:
- Only the property's actual uploaded images are displayed; the system no longer adds fake fallback gallery photos when a real main image exists.
- All uploaded images are available in the thumbnail strip, not just the first three.
- Clicking any thumbnail changes the large main image.
- The gallery shows the total uploaded image count.

The same Django `PropertyImage` table and `/api/properties/<id>/` response are used, so the uploaded gallery remains attached to the correct property and is preserved in the database.
