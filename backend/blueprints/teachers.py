from flask import Blueprint, render_template, request, redirect, flash, jsonify
from modules.teacher import TeacherDetail
from extension import db

teacher_details_bp = Blueprint('teacher_details', __name__, template_folder='../templates')

# ── HTML Routes (unchanged) ──────────────────────────────────────────
@teacher_details_bp.route('/html')
def index():
    teachers = TeacherDetail.query.all()
    return render_template('index.html', teachers=teachers)

@teacher_details_bp.route('/html/add')
def add_page():
    return render_template('add.html')

@teacher_details_bp.route('/html/save', methods=['POST'])
def save():
    name = request.form.get("name"); email = request.form.get("email"); subject = request.form.get("subject")
    if name and email and subject:
        db.session.add(TeacherDetail(name=name, email=email, subject=subject))
        db.session.commit()
        flash("Teacher added successfully!")
    return redirect('/teacher_details')

@teacher_details_bp.route('/html/delete/<int:id>')
def delete_html(id):
    teacher = TeacherDetail.query.get(id)
    db.session.delete(teacher)
    db.session.commit()
    flash("Teacher deleted successfully!")
    return redirect('/teacher_details')

@teacher_details_bp.route('/html/edit/<int:id>', methods=['GET', 'POST'])
def edit_html(id):
    teacher = TeacherDetail.query.get(id)
    if request.method == "POST":
        teacher.name = request.form.get("name"); teacher.email = request.form.get("email"); teacher.subject = request.form.get("subject")
        db.session.commit()
        flash("Teacher updated successfully!")
        return redirect('/teacher_details')
    return render_template('edit.html', teacher=teacher)

# ── JSON API Routes ──────────────────────────────────────────────────
@teacher_details_bp.route('/', methods=['GET'])
def api_get_teachers():
    try:
        teachers = TeacherDetail.query.all()
        result   = []
        for t in teachers:
            course_count = len(t.courses) if t.courses else 0
            result.append({
                "id":           t.teacher_id,
                "name":         t.name,
                "email":        t.email,
                "subject":      t.subject,
                "course_count": course_count,
                "courses":      [c.name for c in t.courses] if t.courses else [],
            })
        return jsonify(result), 200
    except Exception as e:
        print(f"GET TEACHERS ERROR: {e}")
        return jsonify({"error": str(e)}), 500


@teacher_details_bp.route('/add', methods=['POST'])
def api_add_teacher():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "Invalid request body"}), 400

        name    = data.get("name",    "").strip()
        email   = data.get("email",   "").strip()
        subject = data.get("subject", "").strip()

        if not name or not email or not subject:
            return jsonify({"error": "Name, email and subject are required"}), 400

        if TeacherDetail.query.filter_by(email=email).first():
            return jsonify({"error": "A teacher with this email already exists"}), 409

        teacher = TeacherDetail(name=name, email=email, subject=subject)
        db.session.add(teacher)
        db.session.commit()
        return jsonify({"message": "Teacher added", "id": teacher.teacher_id}), 201

    except Exception as e:
        db.session.rollback()
        print(f"ADD TEACHER ERROR: {e}")
        return jsonify({"error": str(e)}), 500


@teacher_details_bp.route('/<int:id>', methods=['PUT'])
def api_update_teacher(id):
    try:
        teacher = TeacherDetail.query.get(id)
        if not teacher:
            return jsonify({"error": "Teacher not found"}), 404

        data      = request.get_json()
        new_email = data.get("email", teacher.email).strip()

        if new_email != teacher.email and TeacherDetail.query.filter_by(email=new_email).first():
            return jsonify({"error": "A teacher with this email already exists"}), 409

        teacher.name    = data.get("name",    teacher.name).strip()
        teacher.email   = new_email
        teacher.subject = data.get("subject", teacher.subject).strip()
        db.session.commit()
        return jsonify({"message": "Teacher updated"}), 200

    except Exception as e:
        db.session.rollback()
        print(f"UPDATE TEACHER ERROR: {e}")
        return jsonify({"error": str(e)}), 500


@teacher_details_bp.route('/<int:id>', methods=['DELETE'])
def api_delete_teacher(id):
    try:
        teacher = TeacherDetail.query.get(id)
        if not teacher:
            return jsonify({"error": "Teacher not found"}), 404
        db.session.delete(teacher)
        db.session.commit()
        return jsonify({"message": "Teacher deleted"}), 200
    except Exception as e:
        db.session.rollback()
        print(f"DELETE TEACHER ERROR: {e}")
        return jsonify({"error": str(e)}), 500
