from django.urls import include, path
from rest_framework.routers import DefaultRouter

from . import views

router = DefaultRouter()
router.register("properties", views.PropertyViewSet, basename="property")
router.register("vehicles", views.VehicleViewSet, basename="vehicle")
router.register("inquiries", views.InquiryViewSet, basename="inquiry")
router.register("testimonials", views.TestimonialViewSet, basename="testimonial")
router.register("blog", views.BlogPostViewSet, basename="blogpost")
router.register("categories", views.CategoryViewSet, basename="category")

urlpatterns = [
    path("auth/login/", views.login_view, name="api-login"),
    path("auth/logout/", views.logout_view, name="api-logout"),
    path("dashboard/", views.dashboard_view, name="api-dashboard"),
    path("featured/", views.featured_view, name="api-featured"),
    path("profile/", views.profile_view, name="api-profile"),
    path(
        "properties/gallery/<int:pk>/upload/",
        views.upload_property_gallery_view,
        name="api-property-gallery-upload",
    ),
    path(
        "properties/gallery/<int:pk>/",
        views.delete_property_gallery_image_view,
        name="api-property-gallery-delete",
    ),
    path(
        "vehicles/gallery/<int:pk>/upload/",
        views.upload_vehicle_gallery_view,
        name="api-vehicle-gallery-upload",
    ),
    path(
        "vehicles/gallery/<int:pk>/",
        views.delete_vehicle_gallery_image_view,
        name="api-vehicle-gallery-delete",
    ),
    path("", include(router.urls)),
]
