from django.db import migrations


DEFAULT_CATEGORIES = [
    ("Land / Plot", "Land and plot properties."),
    ("Villa / Apartment", "Villa and apartment properties available for sale."),
    ("Rental House / Apartment", "Houses and apartments available for rent."),
]


def seed_categories(apps, schema_editor):
    Category = apps.get_model("api", "Category")
    for name, description in DEFAULT_CATEGORIES:
        Category.objects.get_or_create(
            name=name,
            defaults={"description": description},
        )


def remove_seeded_categories(apps, schema_editor):
    Category = apps.get_model("api", "Category")
    names = [name for name, _ in DEFAULT_CATEGORIES]
    Category.objects.filter(name__in=names).delete()


class Migration(migrations.Migration):
    dependencies = [
        ("api", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(seed_categories, remove_seeded_categories),
    ]
