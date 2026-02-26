from extension import db

class Attend(db.Model):
    __tablename__ = "attend"

    id         = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey("student_profile.id"), nullable=False)
    date       = db.Column(db.Date,    nullable=False)
    status     = db.Column(db.String(20), nullable=False)
    course     = db.Column(db.String(100), nullable=True)

    student = db.relationship("StudentProfile", backref="attendances")

    def __init__(self, student_id, date, status, course=None):
        self.student_id = student_id
        self.date       = date
        self.status     = status
        self.course     = course
