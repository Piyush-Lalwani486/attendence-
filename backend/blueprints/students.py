from flask import Blueprint, render_template, request, redirect, url_for, jsonify
from extension import db
from modules.student import StudentProfile
from modules.courses import Course
from datetime import datetime

student_bp = Blueprint('student_bp', __name__, template_folder='templates')

# ── HTML Routes (unchanged) ──────────────────────────────────────────
@student_bp.route("/html")
def student_list():
    students = StudentProfile.query.all()
    return render_template("students.html", students=students)

@student_bp.route("/html/add", methods=["GET", "POST"])
def add_student_html():
    if request.method == "POST":
        joining_date = datetime.strptime(request.form.get("joining_date"), "%Y-%m-%d").date()
        student = StudentProfile(
            request.form.get("first_name"), request.form.get("last_name"),
            int(request.form.get("age")), joining_date
        )
        db.session.add(student)
        db.session.commit()
        return redirect(url_for("student_bp.student_list"))
    return render_template("add_student.html")

@student_bp.route("/html/delete/<int:id>")
def delete_student_html(id):
    student = StudentProfile.query.get_or_404(id)
    db.session.delete(student)
    db.session.commit()
    return redirect(url_for("student_bp.student_list"))

# ── JSON API Routes ──────────────────────────────────────────────────
@student_bp.route("/", methods=["GET"])
def api_get_students():
    try:
        students = StudentProfile.query.all()
        result   = []
        for s in students:
            enrolled_courses = [c.name for c in s.courses] if s.courses else []
            result.append({
                "id":           s.id,
                "first_name":   s.first_name,
                "last_name":    s.last_name,
                "age":          s.age,
                "joining_date": s.joining_date.isoformat() if s.joining_date else None,
                "courses":      enrolled_courses,
                "course":       enrolled_courses[0] if enrolled_courses else None,
                "status":       "enrolled" if enrolled_courses else "unenrolled",
            })
        return jsonify(result), 200
    except Exception as e:
        print(f"GET STUDENTS ERROR: {e}")
        return jsonify({"error": str(e)}), 500


@student_bp.route("/add", methods=["POST"])
def api_add_student():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "Invalid request body"}), 400

        joining_date = None
        if data.get("joining_date"):
            joining_date = datetime.strptime(data["joining_date"], "%Y-%m-%d").date()

        student = StudentProfile(
            first_name   = data.get("first_name", "").strip(),
            last_name    = data.get("last_name",  "").strip(),
            age          = int(data.get("age", 0)),
            joining_date = joining_date
        )
        db.session.add(student)
        db.session.flush()

        for cid in data.get("course_ids", []):
            course = Course.query.get(cid)
            if course and course not in student.courses:
                student.courses.append(course)

        db.session.commit()
        return jsonify({"message": "Student added", "id": student.id}), 201

    except Exception as e:
        db.session.rollback()
        print(f"ADD STUDENT ERROR: {e}")
        return jsonify({"error": str(e)}), 500


@student_bp.route("/<int:id>", methods=["PUT"])
def api_update_student(id):
    try:
        student = StudentProfile.query.get(id)
        if not student:
            return jsonify({"error": "Student not found"}), 404

        data = request.get_json()
        if not data:
            return jsonify({"error": "Invalid request body"}), 400

        student.first_name = data.get("first_name", student.first_name).strip()
        student.last_name  = data.get("last_name",  student.last_name).strip()
        student.age        = int(data.get("age", student.age))

        if data.get("joining_date"):
            student.joining_date = datetime.strptime(data["joining_date"], "%Y-%m-%d").date()

        course_ids = data.get("course_ids")
        if course_ids is not None:
            student.courses = []
            for cid in course_ids:
                course = Course.query.get(cid)
                if course:
                    student.courses.append(course)

        db.session.commit()
        return jsonify({"message": "Student updated"}), 200

    except Exception as e:
        db.session.rollback()
        print(f"UPDATE STUDENT ERROR: {e}")
        return jsonify({"error": str(e)}), 500


@student_bp.route("/<int:id>", methods=["DELETE"])
def api_delete_student(id):
    try:
        student = StudentProfile.query.get(id)
        if not student:
            return jsonify({"error": "Student not found"}), 404
        db.session.delete(student)
        db.session.commit()
        return jsonify({"message": "Student deleted"}), 200
    except Exception as e:
        db.session.rollback()
        print(f"DELETE STUDENT ERROR: {e}")
        return jsonify({"error": str(e)}), 500


@student_bp.route("/courses/all", methods=["GET"])
def api_get_all_courses():
    try:
        courses = Course.query.all()
        return jsonify([{"id": c.id, "name": c.name} for c in courses]), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@student_bp.route("/<int:id>/enrollment", methods=["PATCH"])
def api_toggle_enrollment(id):
    try:
        student = StudentProfile.query.get(id)
        if not student:
            return jsonify({"error": "Student not found"}), 404
        data = request.get_json() or {}
        course_ids = data.get("course_ids")
        if course_ids is None:
            student.courses = []
        else:
            student.courses = []
            for cid in course_ids:
                from modules.courses import Course
                course = Course.query.get(cid)
                if course:
                    student.courses.append(course)
        db.session.commit()
        enrolled = [c.name for c in student.courses]
        return jsonify({
            "message": "Enrollment updated",
            "status": "enrolled" if enrolled else "unenrolled",
            "courses": enrolled
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500
