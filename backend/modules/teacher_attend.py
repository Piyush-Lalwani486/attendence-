from extension import db

class TeacherAttend(db.Model):
    __tablename__ = "teacher_attend"

    id         = db.Column(db.Integer, primary_key=True)
    teacher_id = db.Column(db.Integer, db.ForeignKey("teacher_details.teacher_id"), nullable=False)
    date       = db.Column(db.Date,    nullable=False)
    status     = db.Column(db.String(20), nullable=False)

    teacher = db.relationship("TeacherDetail", backref="attendances")

    def __init__(self, teacher_id, date, status):
        self.teacher_id = teacher_id
        self.date       = date
        self.status     = status
