from django.contrib.auth import get_user_model
from django.contrib.auth.backends import ModelBackend
from django.db.models import Q

User = get_user_model()


class EmailOrUsernameModelBackend(ModelBackend):
    """
    Authenticates against either the username OR the email address, for any
    user account (not just one hard-coded address). Whatever is typed into
    the login field — a username or an email — is checked against both
    columns, case-insensitively.
    """

    def authenticate(self, request, username=None, password=None, **kwargs):
        identifier = username or kwargs.get(User.USERNAME_FIELD)
        if identifier is None or password is None:
            return None
        try:
            user = User.objects.get(Q(username__iexact=identifier) | Q(email__iexact=identifier))
        except User.DoesNotExist:
            User().set_password(password)  # run the hasher anyway to keep timing constant
            return None
        except User.MultipleObjectsReturned:
            user = User.objects.filter(
                Q(username__iexact=identifier) | Q(email__iexact=identifier)
            ).order_by("id").first()
        if user and user.check_password(password) and self.user_can_authenticate(user):
            return user
        return None
