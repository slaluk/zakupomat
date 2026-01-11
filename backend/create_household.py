#!/usr/bin/env python3
"""
CLI script to create a new household.

Usage:
    python create_household.py [--name "Family Name"] [--key "custom-key"] [--url "https://example.com"]

If --key is not provided, a random key will be generated.
If --url is provided, a shareable login link will be generated.
"""

import argparse
import secrets
import string
import hashlib
import sys
from urllib.parse import urlencode

from sqlalchemy.orm import Session
from database import engine
from models import Household, Product, Base

# Ensure tables exist
Base.metadata.create_all(bind=engine)

# Default products to add when creating a new household
DEFAULT_PRODUCTS = [
    "Ciasto francuskie",
    "Banany",
    "Mandarynki",
    "Pomarańcze",
    "Imbir",
    "Cytryny",
    "Dynia",
    "Łosoś wędzony w plastrach",
    "Śledzie",
    "Pomidory",
    "Kabanosy",
    "Wędlina",
    "Ser żółty",
    "Łosoś świeży",
    "Serek wiejski",
    "Ser feta",
    "Serek waniliowy",
    "Twaróg",
    "Serek Almette",
    "Jogurt naturalny",
    "Serek homo",
    "Jogurt owocowy",
    "Fantazja",
    "Jogurt pitny",
    "Masło",
    "Śmietana",
    "Bułka tarta",
    "Tortilla (pizza)",
    "Wafle paprykowe",
    "Chleb",
    "Goździki",
    "Piersi z kurczaka",
    "Mięso do rosołu",
    "Frytki",
    "Ryż arborio",
    "Kasza manna",
    "Cukierki",
    "Migdały blanszowane",
    "Lubisie",
    "Herbata jakaś dobra zimowa",
    "Herbata malinowa",
    "Ziemniaki",
    "Czosnek",
    "Cebula",
    "Brokuł",
    "Warzywa do rosołu",
    "Kalafior",
    "Jabłka",
    "Gruszka",
    "Awokado",
    "Płatki corn flakes",
    "Płatki owsiane",
    "Kakao do picia dla Kacpra",
    "Śmietanka",
    "Dżem truskawkowy",
    "Dżem wiśniowy",
    "Dżem malinowy",
    "Mąka",
    "Cukier",
    "Cukier waniliowy",
    "Cukier puder",
    "Ekstrakt waniliowy",
    "Aromat migdałowy",
    "Drożdże",
    "Mleko",
    "Jajka",
    "Olej",
    "Musztarda",
    "Ketchup",
    "Pomidory w puszce",
    "Passata pomidorowa",
    "Szpinak w liściach mrożony",
    "Tuńczyk w puszce",
    "Kukurydza",
    "Ocet",
    "Makaron",
    "Papier toaletowy",
    "Ręcznik papierowy",
    "Żel do kąpieli (Sławka)",
    "Płyn do mycia naczyń",
    "Płyn do płukania",
    "Kapsułki do zmywarki",
    "Żel pod prysznic Dove",
    "Worki na śmieci",
    "Cola",
    "Sok pomarańczowy",
    "Sok jabłkowy",
    "Tubki",
    "Popcorn",
]


def generate_key(length: int = 12) -> str:
    """Generate a random access key."""
    alphabet = string.ascii_lowercase + string.digits
    return ''.join(secrets.choice(alphabet) for _ in range(length))


def hash_key(key: str) -> str:
    """Hash the access key."""
    return hashlib.sha256(key.encode()).hexdigest()


def create_household(name: str | None = None, key: str | None = None) -> tuple[int, str]:
    """Create a new household and return its ID and access key."""
    if key is None:
        key = generate_key()

    key_hash = hash_key(key)

    with Session(engine) as db:
        # Check if key already exists
        existing = db.query(Household).filter(
            Household.access_key_hash == key_hash
        ).first()
        if existing:
            raise ValueError("A household with this access key already exists")

        household = Household(
            access_key_hash=key_hash,
            name=name
        )
        db.add(household)
        db.commit()
        db.refresh(household)

        # Add default products
        for idx, product_name in enumerate(DEFAULT_PRODUCTS, start=1):
            product = Product(
                household_id=household.id,
                name=product_name,
                sort_order=idx
            )
            db.add(product)

        db.commit()

        return household.id, key


def main():
    parser = argparse.ArgumentParser(description="Create a new household")
    parser.add_argument(
        "--name", "-n",
        type=str,
        help="Name of the household (optional)"
    )
    parser.add_argument(
        "--key", "-k",
        type=str,
        help="Custom access key (optional, random if not provided)"
    )
    parser.add_argument(
        "--url", "-u",
        type=str,
        help="Base URL of the application (optional, generates a shareable link)"
    )

    args = parser.parse_args()

    try:
        household_id, access_key = create_household(name=args.name, key=args.key)

        print("\n" + "=" * 50)
        print("Household created successfully!")
        print("=" * 50)
        print(f"Household ID: {household_id}")
        if args.name:
            print(f"Name: {args.name}")
        print(f"Access Key: {access_key}")
        print(f"Default Products Added: {len(DEFAULT_PRODUCTS)}")

        if args.url:
            # Generate shareable login link
            base_url = args.url.rstrip('/')
            query_params = urlencode({'key': access_key})
            login_link = f"{base_url}/?{query_params}"
            print(f"\nShareable Login Link:")
            print(f"{login_link}")

        print("=" * 50)
        print("\nShare this access key or link with your family members.")
        print("They will use it to log in to the app.")
        print()

    except ValueError as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"Database error: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
