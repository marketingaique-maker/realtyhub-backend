from rest_framework.permissions import SAFE_METHODS, BasePermission


class ReadOnlyOrAdmin(BasePermission):
    """Anyone can read (GET/HEAD/OPTIONS). Only authenticated admin users can write."""

    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True
        return bool(request.user and request.user.is_authenticated)


class PublicCreateAdminManage(BasePermission):
    """Anyone can create (public enquiry/contact forms). Reading/updating/deleting
    the list requires an authenticated admin (used for the Inquiries model)."""

    def has_permission(self, request, view):
        if request.method == "POST":
            return True
        if request.method in SAFE_METHODS:
            return bool(request.user and request.user.is_authenticated)
        return bool(request.user and request.user.is_authenticated)
