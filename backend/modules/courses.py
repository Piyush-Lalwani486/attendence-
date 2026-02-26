from extension import db

class Course(db.Model):
    __tablename__ = "courses"

    id          = db.Column(db.Integer, primary_key=True)
    name        = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    teacher_id  = db.Column(db.Integer, db.ForeignKey('teacher_details.teacher_id'), nullable=True)
    teacher     = db.relationship("TeacherDetail", backref="courses", lazy=True)

    def __init__(self, name, description, teacher_id):
        self.name        = name
        self.description = description
        self.teacher_id  = teacher_id
