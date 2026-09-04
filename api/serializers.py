from django.contrib.auth.models import User
from rest_framework import serializers

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


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ["id", "name", "description"]


class PropertyImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = PropertyImage
        fields = ["id", "image"]


class PropertySerializer(serializers.ModelSerializer):
    gallery = PropertyImageSerializer(many=True, read_only=True)
    images = serializers.SerializerMethodField()

    class Meta:
        model = Property
        fields = [
            "id", "title", "category", "listingType", "price", "location",
            "bedrooms", "bathrooms", "area", "status", "featured", "featured_order",
            "amenities", "description", "builtYear", "agent", "agentRole",
            "image", "gallery", "images", "created_at", "updated_at",
        ]

    def get_images(self, obj):
        request = self.context.get("request")
        urls = []
        if obj.image:
            urls.append(request.build_absolute_uri(obj.image.url) if request else obj.image.url)
        for g in obj.gallery.all():
            url = request.build_absolute_uri(g.image.url) if request else g.image.url
            urls.append(url)
        return urls


class VehicleImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = VehicleImage
        fields = ["id", "image"]


class VehicleSerializer(serializers.ModelSerializer):
    gallery = VehicleImageSerializer(many=True, read_only=True)
    images = serializers.SerializerMethodField()

    class Meta:
        model = Vehicle
        fields = [
            "id", "title", "type", "brand", "year", "price", "fuel", "transmission",
            "power", "range", "drivetrain", "specifications", "status", "featured",
            "image", "gallery", "images", "created_at", "updated_at",
        ]

    def get_images(self, obj):
        request = self.context.get("request")
        urls = []
        if obj.image:
            urls.append(request.build_absolute_uri(obj.image.url) if request else obj.image.url)
        for g in obj.gallery.all():
            url = request.build_absolute_uri(g.image.url) if request else g.image.url
            urls.append(url)
        return urls


class InquirySerializer(serializers.ModelSerializer):
    date = serializers.SerializerMethodField()

    class Meta:
        model = Inquiry
        fields = [
            "id", "name", "phone", "email", "interest", "type", "message",
            "attachments", "status", "date", "created_at",
        ]

    def get_date(self, obj):
        return obj.created_at.strftime("%d %b %Y, %I:%M %p")


class TestimonialSerializer(serializers.ModelSerializer):
    class Meta:
        model = Testimonial
        fields = ["id", "name", "role", "rating", "status", "review", "created_at"]


class BlogPostSerializer(serializers.ModelSerializer):
    class Meta:
        model = BlogPost
        fields = [
            "id", "title", "category", "author", "status", "date", "views", "tags",
            "excerpt", "content", "seoTitle", "metaDescription", "image",
            "created_at", "updated_at",
        ]


class AdminProfileSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(source="user.email", read_only=True)

    class Meta:
        model = AdminProfile
        fields = ["id", "name", "phone", "role", "avatar", "email"]
