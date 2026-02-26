from extension import db

class TeacherDetail(db.Model):
    __tablename__ = "teacher_details"

    teacher_id = db.Column(db.Integer, primary_key=True)
    name       = db.Column(db.String(100), nullable=False)
    email      = db.Column(db.String(120), unique=True, nullable=False)
    subject    = db.Column(db.String(100), nullable=False)

    def __init__(self, name, email, subject):
        self.name    = name
        self.email   = email
        self.subject = subject
