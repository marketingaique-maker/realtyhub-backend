from django.db import migrations, models


NEW_CATEGORIES = [
    ("House", "Independent houses."),
    ("Villa", "Villas available for sale or rent."),
    ("Apartment", "Apartments and flats available for sale or rent."),
    ("Commercial", "Offices, shops and other commercial properties."),
]


def seed_categories(apps, schema_editor):
    Category = apps.get_model("api", "Category")
    for name, description in NEW_CATEGORIES:
        Category.objects.get_or_create(name=name, defaults={"description": description})


def unseed_categories(apps, schema_editor):
    Category = apps.get_model("api", "Category")
    Category.objects.filter(name__in=[n for n, _ in NEW_CATEGORIES]).delete()


class Migration(migrations.Migration):
    dependencies = [("api", "0003_normalize_main_property_categories")]

    operations = [
        # UI review: the vehicle "Power" spec is now shown as "Odometer".
        migrations.AddField(
            model_name="vehicle",
            name="odometer",
            field=models.CharField(blank=True, default="", max_length=50),
        ),
        # UI review: property menu / filter is Land-Plot, House, Villa, Apartment, Commercial.
        migrations.RunPython(seed_categories, unseed_categories),
    ]
