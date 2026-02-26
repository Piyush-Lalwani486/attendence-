from flask import Flask
from extension import db
from flask_cors import CORS

app = Flask(__name__)
app.secret_key = "secret123"

app.config['SQLALCHEMY_DATABASE_URI']        = 'sqlite:///school.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db.init_app(app)

CORS(app,
     origins      = ["http://localhost:3000", "http://127.0.0.1:3000"],
     methods      = ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
     allow_headers= ["Content-Type", "Authorization"],
     supports_credentials=True
)

# ── Model Imports ────────────────────────────────────────────────────
from modules.student        import StudentProfile
from modules.attendence     import Attend
from modules.courses        import Course
from modules.teacher        import TeacherDetail
from modules.login          import User
from modules.activity_log   import ActivityLog
from modules.teacher_attend import TeacherAttend

# ── Blueprint Imports ────────────────────────────────────────────────
from blueprints.login               import login_bp
from blueprints.students            import student_bp
from blueprints.teachers            import teacher_details_bp
from blueprints.attendence          import attend_bp
from blueprints.Cources             import courses_bp
from blueprints.activity            import activity_bp
from blueprints.teacher_attendance  import teacher_attend_bp

# ── Register Blueprints ──────────────────────────────────────────────
app.register_blueprint(login_bp,           url_prefix='/login')
app.register_blueprint(student_bp,         url_prefix='/students')
app.register_blueprint(teacher_details_bp, url_prefix='/teacher_details')
app.register_blueprint(attend_bp,          url_prefix='/attendance')
app.register_blueprint(courses_bp,         url_prefix='/courses')
app.register_blueprint(activity_bp,        url_prefix='/activity')
app.register_blueprint(teacher_attend_bp,  url_prefix='/teacher-attendance')

@app.route('/')
def index():
    return "Flask is running! ✅"

with app.app_context():
    db.create_all()
    print("✅ Database tables created!")

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)
