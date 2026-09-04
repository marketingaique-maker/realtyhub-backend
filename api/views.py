from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from django.conf import settings
from django.db.models import Q
from django.shortcuts import get_object_or_404
from rest_framework import viewsets
from rest_framework.authtoken.models import Token
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

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
from .permissions import PublicCreateAdminManage, ReadOnlyOrAdmin
from .validators import ThunderbirdPasswordValidator, validate_admin_email
from .serializers import (
    AdminProfileSerializer,
    BlogPostSerializer,
    CategorySerializer,
    InquirySerializer,
    PropertySerializer,
    TestimonialSerializer,
    VehicleSerializer,
)


class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [ReadOnlyOrAdmin]


class PropertyViewSet(viewsets.ModelViewSet):
    queryset = Property.objects.all().prefetch_related("gallery")
    serializer_class = PropertySerializer
    permission_classes = [ReadOnlyOrAdmin]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        qs = super().get_queryset()
        params = self.request.query_params
        status_param = params.get("status")
        featured = params.get("featured")
        published_only = params.get("published_only")
        location = params.get("location")
        category = params.get("property_type") or params.get("category")
        listing_type = params.get("listing_type")
        q = params.get("q")
        if status_param:
            qs = qs.filter(status=status_param)
        if published_only == "1":
            qs = qs.filter(status="Published")
        if featured == "1":
            qs = qs.filter(featured=True)
        if location:
            qs = qs.filter(location__icontains=location)
        if category:
            category_map = {
                "plot": "Land / Plot",
                "land": "Land / Plot",
                "villa": "Villa / Apartment",
                "apartment": "Villa / Apartment",
                "rental": "Rental House / Apartment",
            }
            normalized = category_map.get(str(category).strip().lower())
            qs = qs.filter(category__iexact=normalized) if normalized else qs.filter(category__icontains=category)
        if listing_type:
            qs = qs.filter(listingType__iexact=listing_type)
        if q:
            qs = qs.filter(
                Q(title__icontains=q) | Q(category__icontains=q) |
                Q(location__icontains=q) | Q(listingType__icontains=q)
            )
        return qs

    def perform_create(self, serializer):
        instance = serializer.save()
        self._save_gallery(instance)

    def perform_update(self, serializer):
        instance = serializer.save()
        self._save_gallery(instance)

    def _save_gallery(self, instance):
        # The admin UI sends the first selected photo as the main `image` and
        # all remaining photos as `gallery_images`. Accept `images` too so a
        # normal multipart form can upload multiple property photos directly.
        files = list(self.request.FILES.getlist("gallery_images"))
        direct_images = list(self.request.FILES.getlist("images"))
        if direct_images:
            files.extend(direct_images)

        if not instance.image and files:
            instance.image = files.pop(0)
            instance.save(update_fields=["image", "updated_at"])

        for f in files:
            PropertyImage.objects.create(property=instance, image=f)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser])
def upload_property_gallery_view(request, pk):
    """Append any number of photos to one property without replacing its main photo."""
    prop = get_object_or_404(Property, pk=pk)
    files = list(request.FILES.getlist("images"))
    files.extend(request.FILES.getlist("gallery_images"))
    if not files:
        return Response({"detail": "No images were uploaded."}, status=400)
    created = []
    for f in files:
        obj = PropertyImage.objects.create(property=prop, image=f)
        created.append({"id": obj.id, "image": request.build_absolute_uri(obj.image.url)})
    return Response({"property": prop.id, "images": created}, status=201)


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def delete_property_gallery_image_view(request, pk):
    """Removes a single extra gallery photo from a property (used by the
    'Current Images' section on the edit form). Does not touch the
    property's main `image` — only additional PropertyImage rows."""
    get_object_or_404(PropertyImage, pk=pk).delete()
    return Response(status=204)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser])
def upload_vehicle_gallery_view(request, pk):
    """Append any number of photos to one vehicle without replacing its main photo."""
    vehicle = get_object_or_404(Vehicle, pk=pk)
    files = list(request.FILES.getlist("images"))
    files.extend(request.FILES.getlist("gallery_images"))
    if not files:
        return Response({"detail": "No images were uploaded."}, status=400)
    created = []
    for f in files:
        obj = VehicleImage.objects.create(vehicle=vehicle, image=f)
        created.append({"id": obj.id, "image": request.build_absolute_uri(obj.image.url)})
    return Response({"vehicle": vehicle.id, "images": created}, status=201)


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def delete_vehicle_gallery_image_view(request, pk):
    """Same as above, for vehicle gallery photos."""
    get_object_or_404(VehicleImage, pk=pk).delete()
    return Response(status=204)


class VehicleViewSet(viewsets.ModelViewSet):
    queryset = Vehicle.objects.all().prefetch_related("gallery")
    serializer_class = VehicleSerializer
    permission_classes = [ReadOnlyOrAdmin]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        qs = super().get_queryset()
        params = self.request.query_params
        status_param = params.get("status")
        featured = params.get("featured")
        published_only = params.get("published_only")
        vtype = params.get("type")
        fuel = params.get("fuel")
        transmission = params.get("transmission")
        year = params.get("year")
        if status_param:
            qs = qs.filter(status=status_param)
        if published_only == "1":
            qs = qs.filter(status="Published")
        if featured == "1":
            qs = qs.filter(featured=True)
        if vtype:
            qs = qs.filter(type=vtype)
        if fuel:
            qs = qs.filter(fuel=fuel)
        if transmission:
            qs = qs.filter(transmission__iexact=transmission)
        if year:
            qs = qs.filter(year=year)
        return qs

    def perform_create(self, serializer):
        instance = serializer.save()
        self._save_gallery(instance)

    def perform_update(self, serializer):
        instance = serializer.save()
        self._save_gallery(instance)

    def _save_gallery(self, instance):
        # Mirrors PropertyViewSet._save_gallery: accept `gallery_images` and
        # also plain `images` so a normal multipart form can upload multiple
        # vehicle photos directly (first becomes main, rest become gallery).
        files = list(self.request.FILES.getlist("gallery_images"))
        direct_images = list(self.request.FILES.getlist("images"))
        if direct_images:
            files.extend(direct_images)

        if not instance.image and files:
            instance.image = files.pop(0)
            instance.save(update_fields=["image", "updated_at"])

        for f in files:
            VehicleImage.objects.create(vehicle=instance, image=f)


class InquiryViewSet(viewsets.ModelViewSet):
    queryset = Inquiry.objects.all()
    serializer_class = InquirySerializer
    permission_classes = [PublicCreateAdminManage]

    def get_queryset(self):
        qs = super().get_queryset()
        status_param = self.request.query_params.get("status")
        if status_param:
            qs = qs.filter(status=status_param)
        return qs


class TestimonialViewSet(viewsets.ModelViewSet):
    queryset = Testimonial.objects.all()
    serializer_class = TestimonialSerializer
    permission_classes = [ReadOnlyOrAdmin]

    def get_queryset(self):
        qs = super().get_queryset()
        status_param = self.request.query_params.get("status")
        if status_param:
            qs = qs.filter(status=status_param)
        return qs


class BlogPostViewSet(viewsets.ModelViewSet):
    queryset = BlogPost.objects.all()
    serializer_class = BlogPostSerializer
    permission_classes = [ReadOnlyOrAdmin]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        qs = super().get_queryset()
        params = self.request.query_params
        status_param = params.get("status")
        category = params.get("category")
        if status_param:
            qs = qs.filter(status=status_param)
        if category:
            qs = qs.filter(category=category)
        return qs


@api_view(["POST"])
@permission_classes([AllowAny])
def login_view(request):
    email = (request.data.get("email") or "").strip()
    password = request.data.get("password") or ""
    if not email or not password:
        return Response({"detail": "Email and password are required."}, status=400)
    # Any email works for login as long as it belongs to an existing admin
    # user record in the database (a User with is_staff=True — created by
    # `seed_data`, `createsuperuser`, or promoted via /django-admin/). This
    # replaces the old fixed ADMIN_LOGIN_EMAILS allow-list in settings.py:
    # there's no hard-coded email list anymore, the database is the single
    # source of truth for who is allowed to log in.
    auth_user = User.objects.filter(email__iexact=email, is_staff=True).first()
    if not auth_user:
        # Same generic message as a wrong password, so we don't reveal
        # whether the email exists or is an admin account.
        return Response({"detail": "Incorrect email or password."}, status=400)

    # Per-client requirement: login does NOT check the password against one
    # fixed stored value. Instead, ANY password that matches the required
    # format (uppercase + lowercase + number + "thunderbird") is accepted,
    # for any email that is an admin user in the database (see above).
    try:
        validate_password(password, password_validators=[ThunderbirdPasswordValidator()])
    except DjangoValidationError:
        return Response({"detail": "Incorrect email or password."}, status=400)

    token, _ = Token.objects.get_or_create(user=auth_user)
    profile, _ = AdminProfile.objects.get_or_create(user=auth_user)
    return Response({
        "token": token.key,
        "name": profile.name or auth_user.get_full_name() or auth_user.username,
        "email": auth_user.email,
        "role": profile.role,
    })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def logout_view(request):
    Token.objects.filter(user=request.user).delete()
    return Response({"detail": "Logged out."})


@api_view(["GET"])
@permission_classes([AllowAny])
def dashboard_view(request):
    properties = Property.objects.all()
    vehicles = Vehicle.objects.all()
    inquiries = Inquiry.objects.all()
    return Response({
        "properties": properties.count(),
        "vehicles": vehicles.count(),
        "inquiries": inquiries.count(),
        "featured": properties.filter(featured=True).count(),
        "recent_inquiries": InquirySerializer(inquiries[:5], many=True, context={"request": request}).data,
        "recent_properties": PropertySerializer(properties[:5], many=True, context={"request": request}).data,
    })


@api_view(["GET", "POST"])
@permission_classes([ReadOnlyOrAdmin])
def featured_view(request):
    if request.method == "GET":
        props = Property.objects.filter(featured=True).order_by("featured_order", "-created_at")
        return Response([p.id for p in props])
    order = request.data.get("order") or []
    for index, prop_id in enumerate(order):
        Property.objects.filter(id=prop_id).update(featured_order=index, featured=True)
    return Response({"detail": "Featured order saved."})


@api_view(["GET", "PUT", "PATCH"])
@permission_classes([IsAuthenticated])
def profile_view(request):
    profile, _ = AdminProfile.objects.get_or_create(user=request.user)
    if request.method == "GET":
        return Response(AdminProfileSerializer(profile, context={"request": request}).data)
    serializer = AdminProfileSerializer(profile, data=request.data, partial=True, context={"request": request})
    serializer.is_valid(raise_exception=True)

    new_email = request.data.get("email")
    if new_email:
        try:
            validate_admin_email(new_email)
        except DjangoValidationError as exc:
            return Response({"email": exc.messages}, status=400)
        if User.objects.exclude(pk=request.user.pk).filter(email__iexact=new_email).exists():
            return Response({
                "email": ["Another account is already using this email address."]
            }, status=400)

    new_password = request.data.get("password")
    if new_password:
        try:
            validate_password(new_password, user=request.user)
        except DjangoValidationError as exc:
            return Response({"password": exc.messages}, status=400)
        request.user.set_password(new_password)

    serializer.save()
    if new_email:
        request.user.email = new_email
    if new_email or new_password:
        request.user.save()
    return Response(serializer.data)
