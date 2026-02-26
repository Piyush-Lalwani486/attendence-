from flask import Blueprint, jsonify, request
from modules.activity_log import ActivityLog
from extension import db

activity_bp = Blueprint('activity_bp', __name__)

@activity_bp.route('/', methods=['GET'])
def api_get_activities():
    try:
        limit = request.args.get('limit', 10, type=int)
        logs  = ActivityLog.query.order_by(ActivityLog.created_at.desc()).limit(limit).all()
        result = []
        for log in logs:
            result.append({
                "id":        log.id,
                "action":    log.action,
                "user":      log.user,
                "role":      log.role,
                "icon_type": log.icon_type,
                "date":      log.created_at.strftime("%Y-%m-%d"),
                "time":      log.created_at.strftime("%I:%M %p"),
            })
        return jsonify(result), 200
    except Exception as e:
        print(f"GET ACTIVITY ERROR: {e}")
        return jsonify({"error": str(e)}), 500


@activity_bp.route('/add', methods=['POST'])
def api_add_activity():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "Invalid body"}), 400
        log = ActivityLog(
            action    = data.get("action", ""),
            user      = data.get("user",   "Admin"),
            role      = data.get("role",   "Admin"),
            icon_type = data.get("icon_type", "clock"),
        )
        db.session.add(log)
        db.session.commit()
        return jsonify({"message": "Activity logged", "id": log.id}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500
