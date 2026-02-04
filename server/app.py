from flask import Flask, request, session, jsonify
from flask_migrate import Migrate
from flask_cors import CORS
from werkzeug.exceptions import BadRequest, Unauthorized, Forbidden, NotFound

from config import Config
from models import db, bcrypt, User, Inventory, InventoryMember, Item

# App Setup
app = Flask(__name__)
app.config.from_object(Config)

db.init_app(app)
bcrypt.init_app(app)
Migrate(app, db)

CORS(app, supports_credentials=True, origins=["http://localhost:5173"])

# Helpers
def current_user():
    uid = session.get("user_id")
    if not uid:
        return None
    return db.session.get(User, uid)

def require_login():
    user = current_user()
    if not user:
        raise Unauthorized("You must be logged in.")
    return user

def require_inventory_member(inventory_id: int):
    user = require_login()
    member = InventoryMember.query.filter_by(
        user_id=user.id,
        inventory_id=inventory_id
    ).first()
    if not member:
        raise Forbidden("You do not have access to this inventory.")
    return member

# Error Handling
@app.errorhandler(Exception)
def handle_error(err):
    code = 500
    msg = "Server error"

    if hasattr(err, "code"):
        code = err.code
    if hasattr(err, "description"):
        msg = err.description
    else:
        msg = str(err)

    return jsonify(error=msg), code

# Auth Routes
@app.post("/api/signup")
def signup():
    data = request.get_json() or {}
    username = (data.get("username") or "").strip()
    password = data.get("password") or ""

    if not username or not password:
        raise BadRequest("Username and password required.")

    user = User(username=username)
    user.password_hash = password

    db.session.add(user)
    db.session.commit()

    session["user_id"] = user.id

    return {"id": user.id, "username": user.username}, 201

@app.post("/api/login")
def login():
    data = request.get_json() or {}
    username = (data.get("username") or "").strip()
    password = data.get("password") or ""

    user = User.query.filter_by(username=username).first()
    if not user or not user.authenticate(password):
        raise Unauthorized("Invalid username or password.")

    session["user_id"] = user.id
    return {"id": user.id, "username": user.username}, 200

@app.delete("/api/logout")
def logout():
    session.pop("user_id", None)
    return "", 204

@app.get("/api/check_session")
def check_session():
    user = current_user()
    if not user:
        raise Unauthorized("Not logged in.")
    return {"id": user.id, "username": user.username}, 200

# Inventory Routes
@app.get("/api/inventories")
def list_inventories():
    user = require_login()

    invs = (
        Inventory.query
        .join(InventoryMember, InventoryMember.inventory_id == Inventory.id)
        .filter(InventoryMember.user_id == user.id)
        .order_by(Inventory.id.desc())
        .all()
    )

    return [{"id": i.id, "name": i.name} for i in invs], 200

@app.post("/api/inventories")
def create_inventory():
    user = require_login()
    data = request.get_json() or {}
    name = data.get("name") or ""

    inv = Inventory(name=name, created_by_user_id=user.id)
    db.session.add(inv)
    db.session.flush()

    # creator automatically becomes a member
    mem = InventoryMember(user_id=user.id, inventory_id=inv.id, role="manager")
    db.session.add(mem)
    db.session.commit()

    return {"id": inv.id, "name": inv.name}, 201


# Delete Inventory (owner only)
@app.delete("/api/inventories/<int:inventory_id>")
def delete_inventory(inventory_id):
    user = require_login()

    inv = db.session.get(Inventory, inventory_id)
    if not inv:
        raise NotFound("Inventory not found.")

    if inv.created_by_user_id != user.id:
        raise Forbidden("Only the creator can delete this inventory.")

    db.session.delete(inv)
    db.session.commit()
    return "", 204



# Sharing Route (add member by username)
@app.post("/api/inventories/<int:inventory_id>/members")
def add_member(inventory_id):
    require_inventory_member(inventory_id)

    data = request.get_json() or {}
    username = (data.get("username") or "").strip()
    role = (data.get("role") or "manager").strip().lower()

    if not username:
        raise BadRequest("username is required.")

    user_to_add = User.query.filter_by(username=username).first()
    if not user_to_add:
        raise NotFound("User not found.")

    existing = InventoryMember.query.filter_by(
        user_id=user_to_add.id,
        inventory_id=inventory_id
    ).first()

    if existing:
        return {
            "id": existing.id,
            "inventory_id": existing.inventory_id,
            "user_id": existing.user_id,
            "role": existing.role,
            "username": user_to_add.username
        }, 200

    mem = InventoryMember(
        user_id=user_to_add.id,
        inventory_id=inventory_id,
        role=role
    )
    db.session.add(mem)
    db.session.commit()

    return {
        "id": mem.id,
        "inventory_id": mem.inventory_id,
        "user_id": mem.user_id,
        "role": mem.role,
        "username": user_to_add.username
    }, 201

# Item Routes (CRUD + Pagination)
@app.get("/api/inventories/<int:inventory_id>/items")
def list_items(inventory_id):
    require_inventory_member(inventory_id)

    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 10, type=int)
    if per_page > 50:
        per_page = 50

    q = Item.query.filter_by(inventory_id=inventory_id).order_by(Item.id.desc())
    pagination = q.paginate(page=page, per_page=per_page, error_out=False)

    return jsonify({
        "items": [
            {"id": i.id, "name": i.name, "quantity": i.quantity, "unit": i.unit}
            for i in pagination.items
        ],
        "page": pagination.page,
        "per_page": pagination.per_page,
        "total": pagination.total
    }), 200

@app.post("/api/inventories/<int:inventory_id>/items")
def create_item(inventory_id):
    require_inventory_member(inventory_id)
    data = request.get_json() or {}

    item = Item(
        name=data.get("name"),
        quantity=data.get("quantity", 0),
        unit=data.get("unit"),
        inventory_id=inventory_id
    )

    db.session.add(item)
    db.session.commit()

    return {"id": item.id, "name": item.name, "quantity": item.quantity, "unit": item.unit}, 201

@app.patch("/api/items/<int:item_id>")
def update_item(item_id):
    item = db.session.get(Item, item_id)
    if not item:
        raise NotFound("Item not found.")

    require_inventory_member(item.inventory_id)

    data = request.get_json() or {}
    for key in ("name", "quantity", "unit"):
        if key in data:
            setattr(item, key, data[key])

    db.session.commit()

    return {"id": item.id, "name": item.name, "quantity": item.quantity, "unit": item.unit}, 200

@app.delete("/api/items/<int:item_id>")
def delete_item(item_id):
    item = db.session.get(Item, item_id)
    if not item:
        raise NotFound("Item not found.")

    require_inventory_member(item.inventory_id)

    db.session.delete(item)
    db.session.commit()
    return "", 204

if __name__ == "__main__":
    app.run(port=5555, debug=True)
