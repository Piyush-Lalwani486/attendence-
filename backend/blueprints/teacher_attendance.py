from flask import Blueprint, jsonify, request
from extension import db
from datetime import datetime
from modules.teacher_attend import TeacherAttend
from modules.teacher import TeacherDetail
from modules.activity_log import ActivityLog

teacher_attend_bp = Blueprint('teacher_attend_bp', __name__)

@teacher_attend_bp.route('/', methods=['GET'])
def api_get_teachers():
    try:
        teachers = TeacherDetail.query.all()
        result = [{"id": t.teacher_id, "name": t.name, "email": t.email, "subject": t.subject} for t in teachers]
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@teacher_attend_bp.route('/save', methods=['POST'])
def api_save_attendance():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "Invalid body"}), 400

        selected_date = datetime.strptime(data["date"], "%Y-%m-%d").date()
        records       = data.get("records", [])
        if not records:
            return jsonify({"error": "No records provided"}), 400

        saved = 0
        for record in records:
            teacher_id = record.get("teacher_id")
            status     = record.get("status")
            if not teacher_id or not status:
                continue
            existing = TeacherAttend.query.filter_by(teacher_id=teacher_id, date=selected_date).first()
            if existing:
                existing.status = status
            else:
                db.session.add(TeacherAttend(teacher_id, selected_date, status))
            saved += 1

        db.session.add(ActivityLog(
            action="Marked teacher attendance for " + data['date'],
            user="Admin", role="Admin", icon_type="user_check"
        ))
        db.session.commit()
        return jsonify({"message": f"Saved {saved} records"}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


@teacher_attend_bp.route('/records', methods=['GET'])
def api_get_records():
    try:
        query      = TeacherAttend.query.order_by(TeacherAttend.date.desc())
        date_param = request.args.get("date")
        if date_param:
            query = query.filter(TeacherAttend.date == datetime.strptime(date_param, "%Y-%m-%d").date())
        result = []
        for r in query.all():
            teacher = TeacherDetail.query.get(r.teacher_id)
            result.append({
                "id":           r.id,
                "teacher_name": teacher.name    if teacher else "Unknown",
                "subject":      teacher.subject if teacher else "N/A",
                "date":         r.date.isoformat(),
                "status":       r.status,
            })
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
