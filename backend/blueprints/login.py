from flask import Blueprint, request, jsonify
from modules.login import User
from extension import db

login_bp = Blueprint('login_bp', __name__)

@login_bp.route('/admin', methods=['POST'])
def api_login():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "Invalid request body"}), 400
        username = data.get('email', '').strip()
        password = data.get('password', '').strip()
        user = User.query.filter(db.func.lower(User.name) == username.lower()).first()
        if user and user.password.strip() == password:
            return jsonify({"message": "Login successful"}), 200
        return jsonify({"error": "Invalid username or password"}), 401
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@login_bp.route('/debug/users', methods=['GET'])
def debug_users():
    try:
        users = User.query.all()
        return jsonify([{"id": u.id, "name": u.name} for u in users])
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@login_bp.route('/add', methods=['POST'])
def api_add_user():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "Invalid request body"}), 400
        new_name = data.get('name', '').strip()
        new_pw   = data.get('password', '').strip()
        if not new_name or not new_pw:
            return jsonify({"error": "Name and password are required"}), 400
        existing = User.query.filter(db.func.lower(User.name) == new_name.lower()).first()
        if existing:
            return jsonify({"error": "User already exists"}), 409
        user = User(new_name, new_pw)
        db.session.add(user)
        db.session.commit()
        return jsonify({"message": "User created successfully"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@login_bp.route('/users/<int:user_id>', methods=['PUT'])
def api_update_user(user_id):
    try:
        user = User.query.get(user_id)
        if not user:
            return jsonify({"error": "User not found"}), 404
        data = request.get_json()
        new_name = data.get('name', '').strip()
        new_pw   = data.get('password', '').strip()
        if new_name and new_name != user.name:
            existing = User.query.filter(db.func.lower(User.name) == new_name.lower()).first()
            if existing:
                return jsonify({"error": "Username already exists"}), 409
            user.name = new_name
        if new_pw:
            user.password = new_pw
        db.session.commit()
        return jsonify({"message": "User updated"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@login_bp.route('/users/<int:user_id>', methods=['DELETE'])
def api_delete_user(user_id):
    try:
        user = User.query.get(user_id)
        if not user:
            return jsonify({"error": "User not found"}), 404
        db.session.delete(user)
        db.session.commit()
        return jsonify({"message": "User deleted"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500
