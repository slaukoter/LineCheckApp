from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
from sqlalchemy.orm import validates
from sqlalchemy_serializer import SerializerMixin
from sqlalchemy import UniqueConstraint

# Setup
db = SQLAlchemy()
bcrypt = Bcrypt()

# User Model
class User(db.Model, SerializerMixin):
    __tablename__ = "users"
    serialize_rules = ("-_password_hash", "-memberships", "-inventories")

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String, unique=True, nullable=False)
    _password_hash = db.Column(db.String, nullable=False)

    memberships = db.relationship(
        "InventoryMember",
        back_populates="user",
        cascade="all, delete-orphan"
    )

    inventories = db.relationship(
        "Inventory",
        secondary="inventory_members",
        back_populates="users",
        viewonly=True
    )

    @validates("username")
    def validate_username(self, key, value):
        if not value or len(value.strip()) < 3:
            raise ValueError("Username must be at least 3 characters.")
        return value.strip()

    @property
    def password_hash(self):
        raise AttributeError("Password hashes are not readable.")

    @password_hash.setter
    def password_hash(self, plaintext):
        if not plaintext or len(plaintext) < 6:
            raise ValueError("Password must be at least 6 characters.")
        self._password_hash = bcrypt.generate_password_hash(plaintext).decode("utf-8")

    def authenticate(self, plaintext):
        return bcrypt.check_password_hash(self._password_hash, plaintext)

# Inventory Model (shared space)
class Inventory(db.Model, SerializerMixin):
    __tablename__ = "inventories"

    serialize_rules = ("-memberships", "-users", "-items")

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String, nullable=False)

    created_by_user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)

    memberships = db.relationship(
        "InventoryMember",
        back_populates="inventory",
        cascade="all, delete-orphan"
    )

    users = db.relationship(
        "User",
        secondary="inventory_members",
        back_populates="inventories",
        viewonly=True
    )

    items = db.relationship(
        "Item",
        back_populates="inventory",
        cascade="all, delete-orphan"
    )

    @validates("name")
    def validate_name(self, key, value):
        if not value or len(value.strip()) < 2:
            raise ValueError("Inventory name must be at least 2 characters.")
        return value.strip()

# InventoryMember (sharing join table)
class InventoryMember(db.Model, SerializerMixin):
    __tablename__ = "inventory_members"
    __table_args__ = (
        UniqueConstraint("user_id", "inventory_id", name="uq_user_inventory"),
    )

    serialize_rules = ("-user", "-inventory")

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    inventory_id = db.Column(db.Integer, db.ForeignKey("inventories.id"), nullable=False)
    role = db.Column(db.String, nullable=False, default="manager")

    user = db.relationship("User", back_populates="memberships")
    inventory = db.relationship("Inventory", back_populates="memberships")

    @validates("role")
    def validate_role(self, key, value):
        value = (value or "").strip().lower()
        return value if value in ("manager", "staff") else "manager"

# Item Model (belongs to inventory)
class Item(db.Model, SerializerMixin):
    __tablename__ = "items"

    serialize_rules = ("-inventory",)

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String, nullable=False)
    quantity = db.Column(db.Integer, nullable=False, default=0)
    unit = db.Column(db.String, nullable=True)

    inventory_id = db.Column(db.Integer, db.ForeignKey("inventories.id"), nullable=False)
    inventory = db.relationship("Inventory", back_populates="items")

    @validates("name")
    def validate_item_name(self, key, value):
        if not value or len(value.strip()) < 2:
            raise ValueError("Item name must be at least 2 characters.")
        return value.strip()

    @validates("quantity")
    def validate_quantity(self, key, value):
        if value is None:
            return 0
        try:
            value = int(value)
        except:
            raise ValueError("Quantity must be a number.")
        if value < 0:
            raise ValueError("Quantity cannot be negative.")
        return value
