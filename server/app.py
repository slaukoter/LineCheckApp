from flask import Flask, request, session, jsonify
from flask_migrate import Migrate
from flask_cors import CORS
from werkzeug.exceptions import BadRequest, Unauthorized, HTTPException, NotFound
from functools import wraps

from config import Config
from models import db, bcrypt, User, Item

app = Flask(__name__)
app.config.from_object(Config)

db.init_app(app)
bcrypt.init_app(app)
Migrate(app, db)

CORS(app, supports_credentials=True, origins=["http://localhost:5173"])

def require_user():
    user = current_user()
    if not user:
        raise Unauthorized("You must be logged in.")
    return user

def get_user_item_or_404(user, item_id):
    item = Item.query.filter_by(id=item_id, user_id=user.id).first()
    if not item:
        raise NotFound("Item not found.")
    return item

def current_user():
    uid = session.get("user_id")
    if not uid:
        return None
    return db.session.get(User, uid)

def login_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        user = current_user()
        if not user:
            raise Unauthorized("You must be logged in.")
        return fn(*args, **kwargs)
    return wrapper


@app.errorhandler(Exception)
def handle_error(err):
    if isinstance(err, HTTPException):
        return jsonify(error=err.description), err.code

    app.logger.exception(err)
    return jsonify(error="Internal Server Error"), 500

@app.post("/api/signup")
def signup():
    data = request.get_json(silent=True) or {}

    try:
        user = User(username=data.get("username", ""))
        user.password_hash = data.get("password", "")
        db.session.add(user)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        raise BadRequest(description=str(e))

    session["user_id"] = user.id
    session.permanent = True
    return jsonify(user.to_dict()), 201


@app.post("/api/login")
def login():
    data = request.get_json(silent=True) or {}
    username = (data.get("username") or "").strip()
    password = data.get("password") or ""

    user = User.query.filter_by(username=username).first()
    if not user or not user.authenticate(password):
        raise Unauthorized(description="Invalid username or password.")

    session["user_id"] = user.id
    session.permanent = True
    return jsonify(user.to_dict()), 200


@app.get("/api/check_session")
def check_session():
    user = require_user()
    return jsonify(user.to_dict()), 200


@app.delete("/api/logout")
@login_required
def logout():
    session.pop("user_id", None)
    return ("", 204)


@app.post("/api/items")
@login_required
def items_create():
    user = require_user()
    data = request.get_json(silent=True) or {}

    name = (data.get("name") or "").strip()
    if not name:
        raise BadRequest(description="Name is required.")

    try:
        item = Item(
            name=name,
            quantity=data.get("quantity", 0),
            par_level=data.get("par_level", 0),
            unit=data.get("unit"),
            user_id=user.id,
        )
        db.session.add(item)
        db.session.commit()
        return jsonify(item.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        raise BadRequest(description=str(e))


@app.get("/api/items")
@login_required
def items_index():
    user = require_user()
    items = Item.query.filter_by(user_id=user.id).order_by(Item.id.desc()).all()
    return jsonify([i.to_dict() for i in items]), 200



@app.patch("/api/items/<int:item_id>")
@login_required
def items_update(item_id):
    user = require_user()
    item = get_user_item_or_404(user, item_id)

    data = request.get_json(silent=True) or {}

    if "name" in data:
        item.name = data.get("name") 
    if "unit" in data:
        item.unit = data.get("unit") or None

    if "quantity" in data:
        q = data.get("quantity")
        if q == "": 
            q = 0
        item.quantity = q  

    if "par_level" in data:
        p = data.get("par_level")
        if p == "":
            p = 0
        item.par_level = p

    db.session.commit()
    return jsonify(item.to_dict()), 200


@app.delete("/api/items/<int:item_id>")
@login_required
def items_delete(item_id):
    user = require_user()
    item = get_user_item_or_404(user, item_id)

    db.session.delete(item)
    db.session.commit()
    return ("", 204)


@app.get("/api/health")
def health():
    return {"ok": True}, 200



if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5555, debug=True)
