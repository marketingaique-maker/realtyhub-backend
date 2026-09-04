from django.db import migrations


def normalize_categories(apps, schema_editor):
    Category = apps.get_model("api", "Category")
    Property = apps.get_model("api", "Property")

    # Keep only the three property types used by the public Properties menu.
    for old in ["Residential Villa", "Luxury Apartment", "Single Family Home", "Modern Waterfront", "Commercial Space", "Plot / Land"]:
        if old == "Plot / Land":
            Property.objects.filter(category=old).update(category="Land / Plot")
        else:
            Property.objects.filter(category=old).update(category="Villa / Apartment")

    Category.objects.filter(name__in=[
        "Residential Villa", "Luxury Apartment", "Single Family Home",
        "Modern Waterfront", "Commercial Space", "Plot / Land",
    ]).delete()

    for name, description in [
        ("Land / Plot", "Land and plot properties."),
        ("Villa / Apartment", "Villa and apartment properties available for sale."),
        ("Rental House / Apartment", "Houses and apartments available for rent."),
    ]:
        Category.objects.get_or_create(name=name, defaults={"description": description})


def reverse_normalize(apps, schema_editor):
    pass


class Migration(migrations.Migration):
    dependencies = [("api", "0002_seed_property_categories")]
    operations = [migrations.RunPython(normalize_categories, reverse_normalize)]
