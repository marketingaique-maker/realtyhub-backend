from django.core.management.base import BaseCommand

from api.models import (
    BlogPost,
    Category,
    Inquiry,
    Property,
    PropertyImage,
    Testimonial,
    Vehicle,
    VehicleImage,
)


class Command(BaseCommand):
    help = (
        "Delete demo/seed content (properties, vehicles, inquiries, "
        "testimonials, blog posts, and their images) from the database. "
        "Categories are KEPT by default (they're reference data the "
        "property/vehicle forms depend on) — pass --with-categories to "
        "also delete them. Does NOT touch the frontend, and by default does "
        "NOT touch the admin login — pass --with-admin-user to also delete "
        "the seeded admin account."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--with-categories", action="store_true",
            help="Also delete Categories (kept by default).",
        )
        parser.add_argument(
            "--with-admin-user", action="store_true",
            help="Also delete the admin user account created by seed_data "
                 "(you will need to run 'python manage.py createsuperuser' "
                 "afterwards to be able to log in again).",
        )

    def handle(self, *args, **options):
        counts = {
            "Property images": PropertyImage.objects.count(),
            "Vehicle images": VehicleImage.objects.count(),
            "Properties": Property.objects.count(),
            "Vehicles": Vehicle.objects.count(),
            "Inquiries": Inquiry.objects.count(),
            "Testimonials": Testimonial.objects.count(),
            "Blog posts": BlogPost.objects.count(),
        }

        PropertyImage.objects.all().delete()
        VehicleImage.objects.all().delete()
        Property.objects.all().delete()
        Vehicle.objects.all().delete()
        Inquiry.objects.all().delete()
        Testimonial.objects.all().delete()
        BlogPost.objects.all().delete()

        for label, count in counts.items():
            self.stdout.write(f"  removed {count} {label}")

        if options["with_categories"]:
            cat_count = Category.objects.count()
            Category.objects.all().delete()
            self.stdout.write(f"  removed {cat_count} Categories")
        else:
            self.stdout.write(
                f"  kept {Category.objects.count()} Categories "
                "(pass --with-categories to remove them too)"
            )

        if options["with_admin_user"]:
            from django.contrib.auth.models import User
            deleted, _ = User.objects.filter(is_superuser=True).delete()
            self.stdout.write(self.style.WARNING(
                f"  removed {deleted} admin user account(s) — run "
                "'python manage.py createsuperuser' to create a new login."
            ))

        self.stdout.write(self.style.SUCCESS(
            "Seed/demo data cleared. Frontend files were not touched."
        ))
