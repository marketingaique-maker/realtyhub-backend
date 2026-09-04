from django.contrib.auth.models import User
from django.db import models


class Category(models.Model):
    name = models.CharField(max_length=150, unique=True)
    description = models.TextField(blank=True, default="")

    class Meta:
        ordering = ["name"]
        verbose_name_plural = "Categories"

    def __str__(self):
        return self.name


class Property(models.Model):
    STATUS_CHOICES = [
        ("Published", "Published"),
        ("Draft", "Draft"),
        ("Sold", "Sold"),
        ("Rented", "Rented"),
    ]
    LISTING_CHOICES = [("Sale", "Sale"), ("Rent", "Rent")]

    title = models.CharField(max_length=200)
    category = models.CharField(max_length=150)
    listingType = models.CharField(max_length=20, choices=LISTING_CHOICES, default="Sale")
    price = models.CharField(max_length=60)
    location = models.CharField(max_length=200)
    bedrooms = models.PositiveIntegerField(null=True, blank=True)
    bathrooms = models.DecimalField(max_digits=4, decimal_places=1, null=True, blank=True)
    area = models.CharField(max_length=60, blank=True, default="")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="Published")
    featured = models.BooleanField(default=False)
    featured_order = models.PositiveIntegerField(default=0)
    amenities = models.TextField(blank=True, default="")
    description = models.TextField(blank=True, default="")
    builtYear = models.PositiveIntegerField(null=True, blank=True)
    agent = models.CharField(max_length=150, blank=True, default="Dev Nevell Osborne")
    agentRole = models.CharField(max_length=150, blank=True, default="Senior Property Consultant")
    image = models.ImageField(upload_to="properties/", blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name_plural = "Properties"

    def __str__(self):
        return self.title


class PropertyImage(models.Model):
    property = models.ForeignKey(Property, related_name="gallery", on_delete=models.CASCADE)
    image = models.ImageField(upload_to="properties/gallery/")

    def __str__(self):
        return f"Image for {self.property.title}"


class Vehicle(models.Model):
    STATUS_CHOICES = [("Published", "Published"), ("Draft", "Draft"), ("Sold", "Sold")]

    title = models.CharField(max_length=200)
    type = models.CharField(max_length=100)
    brand = models.CharField(max_length=100, blank=True, default="")
    year = models.PositiveIntegerField(null=True, blank=True)
    price = models.CharField(max_length=60)
    fuel = models.CharField(max_length=50, blank=True, default="")
    transmission = models.CharField(max_length=50, blank=True, default="")
    power = models.CharField(max_length=50, blank=True, default="")
    range = models.CharField(max_length=50, blank=True, default="")
    drivetrain = models.CharField(max_length=100, blank=True, default="")
    specifications = models.TextField(blank=True, default="")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="Published")
    featured = models.BooleanField(default=False)
    image = models.ImageField(upload_to="vehicles/", blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.title


class VehicleImage(models.Model):
    vehicle = models.ForeignKey(Vehicle, related_name="gallery", on_delete=models.CASCADE)
    image = models.ImageField(upload_to="vehicles/gallery/")

    def __str__(self):
        return f"Image for {self.vehicle.title}"


class Inquiry(models.Model):
    STATUS_CHOICES = [
        ("New", "New"),
        ("Pending", "Pending"),
        ("Contacted", "Contacted"),
        ("Answered", "Answered"),
        ("Closed", "Closed"),
    ]
    name = models.CharField(max_length=150)
    phone = models.CharField(max_length=40, blank=True, default="")
    email = models.EmailField(blank=True, default="")
    interest = models.CharField(max_length=200, blank=True, default="")
    type = models.CharField(max_length=50, blank=True, default="General")
    message = models.TextField(blank=True, default="")
    attachments = models.CharField(max_length=255, blank=True, default="")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="New")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name_plural = "Inquiries"

    def __str__(self):
        return f"{self.name} - {self.interest}"


class Testimonial(models.Model):
    STATUS_CHOICES = [("Published", "Published"), ("Draft", "Draft")]

    name = models.CharField(max_length=150)
    role = models.CharField(max_length=150, blank=True, default="Verified Client")
    rating = models.PositiveSmallIntegerField(default=5)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="Published")
    review = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.name} ({self.rating} star)"


class BlogPost(models.Model):
    STATUS_CHOICES = [("Published", "Published"), ("Draft", "Draft")]

    title = models.CharField(max_length=250)
    category = models.CharField(max_length=120, blank=True, default="")
    author = models.CharField(max_length=150, blank=True, default="Admin User")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="Draft")
    date = models.CharField(max_length=60, blank=True, default="")
    views = models.PositiveIntegerField(default=0)
    tags = models.CharField(max_length=255, blank=True, default="")
    excerpt = models.TextField(blank=True, default="")
    content = models.TextField(blank=True, default="")
    seoTitle = models.CharField(max_length=250, blank=True, default="")
    metaDescription = models.CharField(max_length=300, blank=True, default="")
    image = models.ImageField(upload_to="blog/", blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.title


class AdminProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
    name = models.CharField(max_length=150, blank=True, default="Admin User")
    phone = models.CharField(max_length=40, blank=True, default="")
    role = models.CharField(max_length=100, blank=True, default="Super Admin")
    avatar = models.ImageField(upload_to="profile/", blank=True, null=True)

    def __str__(self):
        return self.name or self.user.username
