from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
from sqlalchemy_serializer import SerializerMixin
from sqlalchemy.orm import validates

db = SQLAlchemy()
bcrypt = Bcrypt()


class User(db.Model, SerializerMixin):
    __tablename__ = "users"

    serialize_rules = ("-_password_hash", "-items.user")

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String, unique=True, nullable=False)
    _password_hash = db.Column(db.String, nullable=False)

    items = db.relationship(
        "Item",
        back_populates="user",
        cascade="all, delete-orphan"
    )

    @validates("username")
    def validate_username(self, key, value):
        if not value or len(value.strip()) < 3:
            raise ValueError("Username must be at least 3 characters.")
        return value.strip()

    @property
    def password_hash(self):
        raise AttributeError("Password hash is not readable.")

    @password_hash.setter
    def password_hash(self, password):
        if not password or len(password) < 6:
            raise ValueError("Password must be at least 6 characters.")
        self._password_hash = bcrypt.generate_password_hash(password).decode("utf-8")

    def authenticate(self, password):
        return bcrypt.check_password_hash(self._password_hash, password)

    def __repr__(self):
        return f"<User id={self.id} username={self.username!r}>"


class Item(db.Model, SerializerMixin):
    __tablename__ = "items"

    serialize_rules = ("-user",)

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String, nullable=False)

    quantity = db.Column(db.Integer, nullable=False, default=0)
    par_level = db.Column(db.Integer, nullable=False, default=0)
    unit = db.Column(db.String)

    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    user = db.relationship("User", back_populates="items")

    @validates("name")
    def validate_name(self, key, value):
        if not value or not value.strip():
            raise ValueError("Item name is required.")
        return value.strip()

    @validates("quantity", "par_level")
    def validate_numbers(self, key, value):
        if value is None:
            return 0
        value = int(value)
        if value < 0:
            raise ValueError(f"{key} cannot be negative.")
        return value

    def __repr__(self):
        return f"<Item id={self.id} name={self.name!r} user_id={self.user_id}>"
