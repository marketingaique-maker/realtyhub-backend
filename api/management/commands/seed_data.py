from django.contrib.auth.models import User
from django.core.management.base import BaseCommand, CommandError

from api.models import (
    AdminProfile,
    BlogPost,
    Category,
    Inquiry,
    Property,
    Testimonial,
    Vehicle,
)


class Command(BaseCommand):
    help = "Seed the database with demo data equivalent to the old localStorage seed data, and create an admin login."

    def add_arguments(self, parser):
        parser.add_argument(
            "--email", default="admin@realtyhub.com",
            help="Email address for the seeded admin account (default: admin@realtyhub.com).",
        )
        parser.add_argument(
            "--password", default="Thunderbird1",
            help="Password for the seeded admin account (default: Thunderbird1). "
                 "Only used the first time the account is created.",
        )
        parser.add_argument(
            "--username", default="admin",
            help="Username for the seeded admin account (default: admin).",
        )

    def handle(self, *args, **options):
        self.seed_categories()
        self.seed_properties()
        self.seed_vehicles()
        self.seed_inquiries()
        self.seed_testimonials()
        self.seed_blog()
        self.seed_admin_user(options["email"], options["password"], options["username"])
        self.stdout.write(self.style.SUCCESS("Seed data created."))

    def seed_categories(self):
        data = [
            ("Land / Plot", "Land and plot properties."),
            ("Villa / Apartment", "Villa and apartment properties available for sale."),
            ("Rental House / Apartment", "Houses and apartments available for rent."),
        ]
        for name, desc in data:
            Category.objects.get_or_create(name=name, defaults={"description": desc})

    def seed_properties(self):
        if Property.objects.exists():
            return
        rows = [
            dict(title="The Grand Horizon Villa", category="Villa / Apartment", location="Kazhakootam, Trivandrum",
                 price="\u20b91,82,50,000", bedrooms=4, bathrooms=3.5, area="3,450 sq.ft", status="Published",
                 featured=True, listingType="Sale",
                 amenities="Swimming Pool, Fitness Center, Private Garden, Covered Parking, 24/7 Security, Clubhouse",
                 description="Located in a premium secure gated community, this gorgeous home offers open-plan "
                             "living, custom designer kitchen fittings, floor-to-ceiling panoramic windows and "
                             "state-of-the-art automation.",
                 builtYear=2022, agent="Dev Nevell Osborne", agentRole="Senior Property Consultant"),
            dict(title="Minimalist Urban Oasis", category="Villa / Apartment", location="Kawdiar, Trivandrum",
                 price="\u20b92,82,50,000", bedrooms=4, bathrooms=3.5, area="3,450 sq.ft", status="Published",
                 featured=True, listingType="Sale", amenities="Sky Lounge, Gym, Parking, Power Backup",
                 description="A high-rise residence with panoramic city views, a private sky lounge and premium "
                             "interior finishes throughout.",
                 builtYear=2023, agent="Sarah Jenkins", agentRole="Property Consultant"),
            dict(title="Redwood Suburban Estate", category="Villa / Apartment", location="Kozhikode, Kerala",
                 price="\u20b998,00,000", bedrooms=4, bathrooms=3, area="3,900 sq.ft", status="Published",
                 featured=False, listingType="Sale", amenities="Garden, Parking, Security, Solar Panels",
                 description="A spacious suburban family residence with a landscaped garden and dedicated "
                             "home-office space.",
                 builtYear=2021, agent="Dev Nevell Osborne", agentRole="Senior Property Consultant"),
            dict(title="Waterfront Estate Retreat", category="Villa / Apartment", location="Alappuzha, Kerala",
                 price="\u20b92,95,00,000", bedrooms=5, bathrooms=6, area="5,800 sq.ft", status="Published",
                 featured=False, listingType="Sale", amenities="Private Jetty, Pool, Garden, Home Theatre",
                 description="An exclusive waterfront retreat with private outdoor entertaining spaces and "
                             "uninterrupted backwater views.",
                 builtYear=2024, agent="Sarah Jenkins", agentRole="Property Consultant"),
            dict(title="Traditional Kerala Retreat", category="Villa / Apartment", location="Attingal, Trivandrum",
                 price="\u20b995,00,000", bedrooms=4, bathrooms=3.5, area="3,450 sq.ft", status="Published",
                 featured=True, listingType="Sale", amenities="Courtyard, Parking, Garden",
                 description="A traditional Kerala-style residence blending heritage architecture with modern "
                             "comforts.",
                 builtYear=2020, agent="Dev Nevell Osborne", agentRole="Senior Property Consultant"),
            dict(title="Technopark City Apartment", category="Rental House / Apartment", location="Kazhakootam, Trivandrum",
                 price="\u20b992,00,000", bedrooms=3, bathrooms=2, area="1,650 sq.ft", status="Published",
                 featured=False, listingType="Rent", amenities="Gym, Parking, Lift, Security",
                 description="A well-connected city apartment close to Technopark, ideal for young professional "
                             "families.",
                 builtYear=2022, agent="Sarah Jenkins", agentRole="Property Consultant"),
            dict(title="Harborview Rental Apartment", category="Rental House / Apartment", location="Marine Drive, Kochi",
                 price="\u20b945,000", bedrooms=2, bathrooms=2, area="1,250 sq.ft", status="Published",
                 featured=False, listingType="Rent", amenities="Gym, Parking, Lift, Power Backup",
                 description="A fully furnished rental apartment with harbor views, ideal for professionals "
                             "seeking a premium city base.",
                 builtYear=2023, agent="Sarah Jenkins", agentRole="Property Consultant"),
            dict(title="Palm Grove Villa for Rent", category="Rental House / Apartment", location="Kovalam, Trivandrum",
                 price="\u20b975,000", bedrooms=3, bathrooms=3, area="2,600 sq.ft", status="Published",
                 featured=False, listingType="Rent", amenities="Garden, Parking, Security, Solar Panels",
                 description="A serene rental villa near Kovalam beach, offering private outdoor space and a "
                             "quiet, gated setting.",
                 builtYear=2021, agent="Dev Nevell Osborne", agentRole="Senior Property Consultant"),
        ]
        for row in rows:
            Property.objects.create(**row)

    def seed_vehicles(self):
        if Vehicle.objects.exists():
            return
        rows = [
            dict(title="AeroStream City Hatch", type="Hatchback", brand="AeroStream", year=2026,
                 price="\u20b98,25,000", fuel="Petrol", transmission="Manual", power="90 hp", range="\u2014",
                 status="Published", featured=False, drivetrain="1.2L Petrol \u00b7 FWD",
                 specifications="A compact, fuel-efficient hatchback built for city driving, with a peppy engine, "
                                "tight turning radius and a spacious cabin for everyday commutes."),
            dict(title="Apex Electra Concept SUV", type="SUV/MUV", brand="Apex Electra", year=2026,
                 price="\u20b918,49,000", fuel="Electric", transmission="Automatic", power="480 hp",
                 range="310 mi", status="Published", featured=True, drivetrain="Dual-Motor Electric \u00b7 AWD",
                 specifications="A high-performance electric concept SUV with premium cabin technology and one of "
                                "the longest ranges in its class."),
            dict(title="AeroStream Sport GT", type="Sedan", brand="AeroStream", year=2026, price="\u20b916,25,000",
                 fuel="Petrol", transmission="Automatic", power="480 hp", range="310 mi", status="Published",
                 featured=True, drivetrain="3.0L Turbocharged I6",
                 specifications="A sharp-handling sport GT built for spirited touring, with a turbocharged "
                                "inline-six and a driver-focused cabin."),
            dict(title="Ion Electric Cruiser", type="SUV/MUV", brand="Ion Motors", year=2025, price="\u20b922,00,000",
                 fuel="Electric", transmission="Automatic", power="380 hp", range="300 mi", status="Published",
                 featured=False,
                 specifications="A family-focused electric crossover with three-row seating and best-in-class "
                                "cargo space."),
            dict(title="Vanguard Volt Scooter", type="Bike/Scooter", brand="Vanguard", year=2026,
                 price="\u20b91,45,000", fuel="Electric", transmission="Automatic", power="8 hp", range="120 km",
                 status="Published", featured=False,
                 specifications="A zippy electric scooter with a swappable battery pack, ideal for quick city "
                                "commutes and low running costs."),
        ]
        for row in rows:
            Vehicle.objects.create(**row)

    def seed_inquiries(self):
        if Inquiry.objects.exists():
            return
        rows = [
            dict(name="Robert Fox", phone="+91 98765 43210", email="robert@example.com",
                 interest="The Grand Horizon Villa", type="Property",
                 message="Hi, I would like to schedule a viewing for this weekend if possible. What is the latest "
                         "availability?", status="New"),
            dict(name="Jane Cooper", phone="+91 98989 11223", email="jane@example.com",
                 interest="Apex Electra Concept SUV", type="Vehicle",
                 message="Is the battery health still at 94%? I want to request the diagnostic report before "
                         "making an offer.", status="Pending"),
            dict(name="Arlene McCoy", phone="+91 99001 33445", email="arlene@example.com",
                 interest="Minimalist Urban Oasis", type="Property",
                 message="Is there a designated parking spot included in the price? Or is there an additional "
                         "fee required?", status="Answered"),
            dict(name="Albert Flores", phone="+91 99220 44556", email="albert@example.com",
                 interest="AeroStream Sport GT", type="Vehicle",
                 message="Are you open to trade-in deals? I have a 2020 Macan in perfect condition and would "
                         "like to upgrade.", status="Answered"),
        ]
        for row in rows:
            Inquiry.objects.create(**row)

    def seed_testimonials(self):
        if Testimonial.objects.exists():
            return
        rows = [
            dict(name="Alexander Wright", role="Verified Client", rating=5, status="Published",
                 review="Realty Hub transformed our searching experience entirely. The ability to explore both "
                        "high-end penthouses and find matching premium vehicles saved us countless hours. "
                        "Unmatched interface."),
            dict(name="Eleanor Vance", role="Verified Client", rating=5, status="Published",
                 review="Excellent customer service and highly realistic portal data. Secure transaction support "
                        "and direct access to trustworthy agents made buying our family home a delightful "
                        "journey."),
            dict(name="Robert Fox", role="Home Buyer", rating=5, status="Published",
                 review="Extremely professional service. The team helped us locate the perfect villa and "
                        "finalized everything inside of three weeks."),
            dict(name="Jane Cooper", role="Vehicle Seller", rating=5, status="Published",
                 review="Selling my vehicle through Realty Hub was remarkably effortless. The automated enquiry "
                        "filtering routed serious buyers directly to me."),
        ]
        for row in rows:
            Testimonial.objects.create(**row)

    def seed_blog(self):
        if BlogPost.objects.exists():
            return
        rows = [
            dict(title="5 Crucial Steps to Secure a Low-Interest Mortgage in 2026", category="Finance Tips",
                 author="Sarah Jenkins", status="Published", date="Aug 15, 2026", views=1310,
                 tags="finance, mortgage, buying guide",
                 excerpt="Navigating the updated economic metrics requires an analytical strategy. Learn how "
                         "modern home buyers optimize their borrowing power.",
                 content="Navigating the modern property market requires a strategic understanding of fiscal "
                         "policies. As we approach late 2026, lenders have introduced refined criteria that "
                         "prioritize secure debt-to-income frameworks over traditional credit scores alone.",
                 seoTitle="5 Crucial Steps to Secure a Low-Interest Mortgage in 2026",
                 metaDescription="A practical guide to securing a low-interest mortgage in 2026."),
            dict(title="Understanding the Premium Villa Market in Kerala", category="Property Guides",
                 author="Sarah Jenkins", status="Published", date="Aug 15, 2026", views=642,
                 tags="villa, kerala, market",
                 excerpt="Detailed breakdown of upcoming infrastructure corridors and luxury community "
                         "developments designed for investors.",
                 content="Kerala's premium villa market continues to mature around gated communities, "
                         "backwater-adjacent plots and infrastructure-led corridors.",
                 seoTitle="Understanding the Premium Villa Market in Kerala",
                 metaDescription="A breakdown of the premium villa market in Kerala for investors."),
            dict(title="10 Trends Shaping Luxury Real Estate in 2026", category="Market Insights",
                 author="Sophia Harris", status="Published", date="Jan 10, 2026", views=2482,
                 tags="luxury, real estate, 2026",
                 excerpt="Explore the key trends shaping premium property decisions this year.",
                 content="Luxury real estate is evolving around experience, location, technology and thoughtful "
                         "design.",
                 seoTitle="10 Trends Shaping Luxury Real Estate in 2026",
                 metaDescription="A practical overview of emerging luxury real estate trends for 2026."),
            dict(title="The Ultimate Home Buying Checklist", category="Buying Guides", author="Sophia Harris",
                 status="Draft", date="Jan 02, 2026", views=0, tags="buying, property, checklist",
                 excerpt="A checklist for buyers preparing to evaluate their next home.",
                 content="Use this checklist to organize your property buying journey from budgeting through to "
                         "final handover.",
                 seoTitle="Home Buying Checklist", metaDescription="A practical home buying checklist."),
        ]
        for row in rows:
            BlogPost.objects.create(**row)

    def seed_admin_user(self, email, password, username):
        self._validate_password(password)
        user, created = User.objects.get_or_create(
            username=username,
            defaults={"email": email, "is_staff": True, "is_superuser": True},
        )
        if created:
            user.set_password(password)
            user.save()
            self.stdout.write(self.style.SUCCESS(
                f"Created admin login -> email: {email}  username: {username}  password: {password}"
            ))
        else:
            self.stdout.write(self.style.WARNING(
                f"Admin user '{username}' already exists — leaving its email/password unchanged. "
                f"Use 'python manage.py changepassword {username}' to change the password, "
                f"or edit the account in django-admin / the shell to change the email."
            ))
        AdminProfile.objects.get_or_create(
            user=user, defaults={"name": "Admin User", "role": "Super Admin"}
        )

    def _validate_password(self, password):
        """Enforce: at least one uppercase letter, one lowercase letter, one
        digit, and the word 'thunderbird' (case-insensitive) somewhere in
        the password — matching the site's required password format."""
        errors = []
        if not any(c.isupper() for c in password):
            errors.append("at least one UPPERCASE letter")
        if not any(c.islower() for c in password):
            errors.append("at least one lowercase letter")
        if not any(c.isdigit() for c in password):
            errors.append("at least one number")
        if "thunderbird" not in password.lower():
            errors.append('the word "thunderbird" (any casing)')
        if errors:
            raise CommandError(
                "Password does not meet the required format. It must contain: "
                + ", ".join(errors) + f".  Got: {password!r}"
            )
