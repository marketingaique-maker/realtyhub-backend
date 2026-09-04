from django.contrib import admin
from django.contrib.admin.forms import AdminAuthenticationForm

from .models import (
    AdminProfile,
    BlogPost,
    Category,
    Inquiry,
    Property,
    PropertyImage,
    Testimonial,
    Vehicle,
    VehicleImage,
)


class EmailOrUsernameAdminAuthenticationForm(AdminAuthenticationForm):
    """Relabels the django-admin login field to make it clear an email
    address works just as well as a username (see api/backends.py)."""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['username'].label = 'Email or Username'


admin.site.login_form = EmailOrUsernameAdminAuthenticationForm


class PropertyImageInline(admin.TabularInline):
    model = PropertyImage
    extra = 1


@admin.register(Property)
class PropertyAdmin(admin.ModelAdmin):
    list_display = ("title", "category", "location", "price", "status", "featured", "created_at")
    list_filter = ("status", "category", "listingType", "featured")
    search_fields = ("title", "location", "category")
    inlines = [PropertyImageInline]


class VehicleImageInline(admin.TabularInline):
    model = VehicleImage
    extra = 1


@admin.register(Vehicle)
class VehicleAdmin(admin.ModelAdmin):
    list_display = ("title", "type", "brand", "year", "price", "status", "featured")
    list_filter = ("status", "type", "fuel", "featured")
    search_fields = ("title", "brand")
    inlines = [VehicleImageInline]


@admin.register(Inquiry)
class InquiryAdmin(admin.ModelAdmin):
    list_display = ("name", "interest", "type", "status", "created_at")
    list_filter = ("status", "type")
    search_fields = ("name", "email", "phone", "interest")


@admin.register(Testimonial)
class TestimonialAdmin(admin.ModelAdmin):
    list_display = ("name", "role", "rating", "status")
    list_filter = ("status", "rating")


@admin.register(BlogPost)
class BlogPostAdmin(admin.ModelAdmin):
    list_display = ("title", "category", "author", "status", "date", "views")
    list_filter = ("status", "category")
    search_fields = ("title", "tags")


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "description")


@admin.register(AdminProfile)
class AdminProfileAdmin(admin.ModelAdmin):
    list_display = ("name", "user", "role", "phone")
