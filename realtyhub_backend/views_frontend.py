from pathlib import Path

from django.conf import settings
from django.http import Http404
from django.views.static import serve as static_serve


def serve_frontend(request, path=""):
    """Serve the static frontend (index.html, properties.html, admin/*.html, ...)
    straight from the FRONTEND_DIR so the whole site runs from one Django server.
    """
    frontend_dir: Path = settings.FRONTEND_DIR
    clean_path = path.strip("/")

    if not clean_path:
        clean_path = "index.html"

    candidate = frontend_dir / clean_path
    if candidate.is_dir():
        candidate = candidate / "index.html"
    if not candidate.exists() and not clean_path.endswith(".html"):
        html_candidate = frontend_dir / f"{clean_path}.html"
        if html_candidate.exists():
            candidate = html_candidate

    try:
        relative_path = candidate.relative_to(frontend_dir)
    except ValueError:
        raise Http404("Not found")

    if not candidate.exists():
        raise Http404("Not found")

    return static_serve(request, str(relative_path), document_root=str(frontend_dir))
