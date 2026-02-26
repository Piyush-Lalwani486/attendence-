from flask import Blueprint, request, redirect, url_for, render_template, jsonify
from modules.courses import Course
from modules.teacher import TeacherDetail
from extension import db

courses_bp = Blueprint('courses_bp', __name__, template_folder='../templates')

# ── HTML Routes (unchanged) ──────────────────────────────────────────
@courses_bp.route('/html')
def courses_page():
    courses  = Course.query.all()
    teachers = TeacherDetail.query.all()
    return render_template("courses_TEMPLATE.html", courses=courses, teachers=teachers)

@courses_bp.route('/html/<int:id>')
def course_detail(id):
    course = Course.query.get_or_404(id)
    return render_template("COURSE_DETAIL_TEMPLATE.html", course=course)

@courses_bp.route('/html/add', methods=['POST'])
def add_course_html():
    name = request.form.get('name')
    if not name:
        return redirect(url_for('courses_bp.courses_page'))
    teacher_id = request.form.get('teacher_id')
    teacher_id = int(teacher_id) if teacher_id and teacher_id.isdigit() else None
    db.session.add(Course(name=name, description=request.form.get('description', ''), teacher_id=teacher_id))
    db.session.commit()
    return redirect(url_for('courses_bp.courses_page'))

@courses_bp.route('/html/delete/<int:id>', methods=['POST'])
def delete_course_html(id):
    course = Course.query.get_or_404(id)
    db.session.delete(course)
    db.session.commit()
    return redirect(url_for('courses_bp.courses_page'))

# ── JSON API Routes ──────────────────────────────────────────────────
@courses_bp.route('/', methods=['GET'])
def api_get_courses():
    try:
        courses = Course.query.all()
        result  = []
        for c in courses:
            result.append({
                "id":            c.id,
                "name":          c.name,
                "description":   c.description or "",
                "teacher_id":    c.teacher_id,
                "teacher_name":  f"{c.teacher.name}" if c.teacher else None,
                "student_count": c.students.count() if c.students else 0,
            })
        return jsonify(result), 200
    except Exception as e:
        print(f"GET COURSES ERROR: {e}")
        return jsonify({"error": str(e)}), 500


@courses_bp.route('/<int:id>', methods=['GET'])
def api_get_course(id):
    try:
        course = Course.query.get(id)
        if not course:
            return jsonify({"error": "Course not found"}), 404
        students = [{"id": s.id, "first_name": s.first_name, "last_name": s.last_name} for s in course.students]
        return jsonify({
            "id":            course.id,
            "name":          course.name,
            "description":   course.description or "",
            "teacher_id":    course.teacher_id,
            "teacher_name":  course.teacher.name if course.teacher else None,
            "students":      students,
            "student_count": len(students),
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@courses_bp.route('/add', methods=['POST'])
def api_add_course():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "Invalid request body"}), 400
        name = data.get("name", "").strip()
        if not name:
            return jsonify({"error": "Course name is required"}), 400
        teacher_id = data.get("teacher_id")
        if teacher_id:
            teacher_id = int(teacher_id)
        course = Course(name=name, description=data.get("description", "").strip(), teacher_id=teacher_id)
        db.session.add(course)
        db.session.commit()
        return jsonify({"message": "Course added", "id": course.id}), 201
    except Exception as e:
        db.session.rollback()
        print(f"ADD COURSE ERROR: {e}")
        return jsonify({"error": str(e)}), 500


@courses_bp.route('/<int:id>', methods=['PUT'])
def api_update_course(id):
    try:
        course = Course.query.get(id)
        if not course:
            return jsonify({"error": "Course not found"}), 404
        data = request.get_json()
        course.name        = data.get("name",        course.name).strip()
        course.description = data.get("description", course.description or "").strip()
        teacher_id         = data.get("teacher_id")
        course.teacher_id  = int(teacher_id) if teacher_id else None
        db.session.commit()
        return jsonify({"message": "Course updated"}), 200
    except Exception as e:
        db.session.rollback()
        print(f"UPDATE COURSE ERROR: {e}")
        return jsonify({"error": str(e)}), 500


@courses_bp.route('/delete/<int:id>', methods=['DELETE'])
def api_delete_course(id):
    try:
        course = Course.query.get(id)
        if not course:
            return jsonify({"error": "Course not found"}), 404
        db.session.delete(course)
        db.session.commit()
        return jsonify({"message": "Course deleted"}), 200
    except Exception as e:
        db.session.rollback()
        print(f"DELETE COURSE ERROR: {e}")
        return jsonify({"error": str(e)}), 500


@courses_bp.route('/teachers/all', methods=['GET'])
def api_get_teachers():
    try:
        teachers = TeacherDetail.query.all()
        return jsonify([{"id": t.teacher_id, "name": t.name} for t in teachers]), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
