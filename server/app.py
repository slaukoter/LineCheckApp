from flask import Flask, request, session, jsonify
from flask_migrate import Migrate
from flask_cors import CORS
from werkzeug.exceptions import BadRequest, Unauthorized, HTTPException
from functools import wraps

from config import Config
from models import db, bcrypt, User, Item

app = Flask(__name__)
app.config.from_object(Config)

db.init_app(app)
bcrypt.init_app(app)
Migrate(app, db)

CORS(app, supports_credentials=True, origins=["http://localhost:5173"])


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
            return jsonify(error="Unauthorized"), 401
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
    user = current_user()
    if not user:
        raise Unauthorized(description="Not logged in.")
    return jsonify(user.to_dict()), 200


@app.delete("/api/logout")
@login_required
def logout():
    session.pop("user_id", None)
    return ("", 204)


@app.post("/api/items")
@login_required
def items_create():
    user = current_user()
   
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
    user = current_user()
    items = Item.query.filter_by(user_id=user.id).all()
    return jsonify([i.to_dict() for i in items]), 200


@app.delete("/api/items/<int:item_id>")
@login_required
def items_delete(item_id):
    user = current_user()
    
    item = Item.query.filter_by(id=item_id, user_id=user.id).first()
    if not item:
        return jsonify(error="Not found"), 404

    db.session.delete(item)
    db.session.commit()
    return ("", 204)

@app.get("/api/health")
def health():
    return {"ok": True}, 200



if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5555, debug=True)
