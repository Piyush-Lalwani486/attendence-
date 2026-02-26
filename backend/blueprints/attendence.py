from flask import Blueprint, render_template, request, redirect, url_for, jsonify
from extension import db
from datetime import datetime
from modules.attendence import Attend
from modules.teacher_attend import TeacherAttend
from modules.student import StudentProfile
from modules.teacher import TeacherDetail
from modules.activity_log import ActivityLog

attend_bp = Blueprint('attend_bp', __name__, template_folder='templates')

# ── HTML Routes (unchanged) ──────────────────────────────────────────
@attend_bp.route("/", methods=["GET"])
def attendance_form():
    students = StudentProfile.query.all()
    return render_template("attendance.html", students=students)

@attend_bp.route("/attendance", methods=["POST"])
def save_attendance():
    selected_date = datetime.strptime(request.form.get("date"), "%Y-%m-%d").date()
    for s in StudentProfile.query.all():
        status = request.form.get(f"student_{s.id}")
        if status:
            db.session.add(Attend(s.id, selected_date, status))
    db.session.commit()
    return redirect(url_for("attend_bp.attendance_list"))

@attend_bp.route("/attendance-list")
def attendance_list():
    records = Attend.query.order_by(Attend.date.desc()).all()
    return render_template("attendance_list.html", records=records)

# ── JSON API Routes ──────────────────────────────────────────────────
@attend_bp.route("/save", methods=["POST"])
def api_save_attendance():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "Invalid request body"}), 400

        raw_date = data.get("date")
        course   = data.get("course", "all")
        records  = data.get("records", [])

        if not raw_date or not records:
            return jsonify({"error": "Date and records are required"}), 400

        selected_date = datetime.strptime(raw_date, "%Y-%m-%d").date()
        saved_count   = 0

        for record in records:
            student_id = record.get("student_id")
            status     = record.get("status")
            if not student_id or not status:
                continue
            existing = Attend.query.filter_by(student_id=student_id, date=selected_date).first()
            if existing:
                existing.status = status
                existing.course = course if course != "all" else existing.course
            else:
                db.session.add(Attend(
                    student_id=student_id, date=selected_date, status=status,
                    course=course if course != "all" else None
                ))
            saved_count += 1

        db.session.add(ActivityLog(
            action    = f"Marked student attendance for {raw_date}" + (f" - {course.upper()}" if course != "all" else ""),
            user      = "Admin",
            role      = "Admin",
            icon_type = "users"
        ))
        db.session.commit()
        return jsonify({"message": f"Saved {saved_count} records", "count": saved_count}), 200

    except Exception as e:
        db.session.rollback()
        print(f"SAVE ATTENDANCE ERROR: {e}")
        return jsonify({"error": str(e)}), 500


@attend_bp.route("/records", methods=["GET"])
def api_get_records():
    try:
        query        = Attend.query.order_by(Attend.date.desc())
        date_param   = request.args.get("date")
        course_param = request.args.get("course")
        if date_param:
            query = query.filter(Attend.date == datetime.strptime(date_param, "%Y-%m-%d").date())
        if course_param and course_param != "all":
            query = query.filter(Attend.course == course_param)

        result = []
        for r in query.all():
            student = StudentProfile.query.get(r.student_id)
            result.append({
                "id":           r.id,
                "student_name": f"{student.first_name} {student.last_name}" if student else "Unknown",
                "course":       r.course if r.course else "N/A",
                "date":         r.date.isoformat(),
                "status":       r.status,
            })
        return jsonify(result), 200
    except Exception as e:
        print(f"GET RECORDS ERROR: {e}")
        return jsonify({"error": str(e)}), 500


@attend_bp.route("/reports", methods=["GET"])
def api_get_reports():
    try:
        date_from_param = request.args.get("date_from")
        date_to_param   = request.args.get("date_to")
        status_param    = request.args.get("status",    "all")
        user_type_param = request.args.get("user_type", "all")
        result          = []

        if user_type_param in ("all", "student"):
            q = Attend.query
            if date_from_param:
                q = q.filter(Attend.date >= datetime.strptime(date_from_param, "%Y-%m-%d").date())
            if date_to_param:
                q = q.filter(Attend.date <= datetime.strptime(date_to_param, "%Y-%m-%d").date())
            if status_param != "all":
                q = q.filter(Attend.status.ilike(status_param))
            for r in q.order_by(Attend.date.desc()).all():
                student = StudentProfile.query.get(r.student_id)
                result.append({
                    "date":   r.date.isoformat(),
                    "name":   f"{student.first_name} {student.last_name}" if student else "Unknown",
                    "type":   "Student",
                    "class":  r.course if r.course else "N/A",
                    "status": r.status.lower(),
                })

        if user_type_param in ("all", "teacher"):
            q = TeacherAttend.query
            if date_from_param:
                q = q.filter(TeacherAttend.date >= datetime.strptime(date_from_param, "%Y-%m-%d").date())
            if date_to_param:
                q = q.filter(TeacherAttend.date <= datetime.strptime(date_to_param, "%Y-%m-%d").date())
            if status_param != "all":
                q = q.filter(TeacherAttend.status.ilike(status_param))
            for r in q.order_by(TeacherAttend.date.desc()).all():
                teacher = TeacherDetail.query.get(r.teacher_id)
                result.append({
                    "date":   r.date.isoformat(),
                    "name":   teacher.name    if teacher else "Unknown",
                    "type":   "Teacher",
                    "class":  teacher.subject if teacher else "N/A",
                    "status": r.status.lower(),
                })

        result.sort(key=lambda x: x["date"], reverse=True)
        return jsonify(result), 200

    except Exception as e:
        print(f"GET REPORTS ERROR: {e}")
        return jsonify({"error": str(e)}), 500
