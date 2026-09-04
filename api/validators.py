"""
Custom auth validators for Realty Hub.

ThunderbirdPasswordValidator enforces the site's required password format
wherever Django validates a password (django-admin password change,
`manage.py changepassword`, `manage.py createsuperuser`, and any future
password-change API that calls django.contrib.auth.password_validation).

validate_admin_email() enforces normal email formatting for the admin
account's email address wherever it's set from user input (currently the
profile update endpoint).
"""

from django.core.exceptions import ValidationError
from django.core.validators import validate_email as django_validate_email


class ThunderbirdPasswordValidator:
    """
    Require the password to contain:
      - at least one uppercase letter
      - at least one lowercase letter
      - at least one digit
      - the word "thunderbird" (case-insensitive) somewhere in the password
    """

    def validate(self, password, user=None):
        errors = []
        if not any(c.isupper() for c in password):
            errors.append("an uppercase letter")
        if not any(c.islower() for c in password):
            errors.append("a lowercase letter")
        if not any(c.isdigit() for c in password):
            errors.append("a number")
        if "thunderbird" not in password.lower():
            errors.append('the word "thunderbird" (any casing)')
        if errors:
            raise ValidationError(
                "Password must contain " + ", ".join(errors) + ".",
                code="password_missing_thunderbird_format",
            )

    def get_help_text(self):
        return (
            "Your password must contain an uppercase letter, a lowercase "
            'letter, a number, and the word "thunderbird".'
        )


def validate_admin_email(email):
    """Raise django.core.exceptions.ValidationError if `email` isn't a
    well-formed email address. Use for any admin-editable email field."""
    django_validate_email(email)
