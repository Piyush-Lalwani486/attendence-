from extension import db
from datetime import datetime

enrollments = db.Table(
    'enrollments',
    db.Column('student_id',    db.Integer, db.ForeignKey('student_profile.id'), primary_key=True),
    db.Column('course_id',     db.Integer, db.ForeignKey('courses.id'),         primary_key=True),
    db.Column('enrolled_date', db.DateTime, default=datetime.utcnow)
)

class StudentProfile(db.Model):
    __tablename__ = "student_profile"

    id           = db.Column(db.Integer, primary_key=True)
    first_name   = db.Column(db.String(50),  nullable=False)
    last_name    = db.Column(db.String(50),  nullable=False)
    age          = db.Column(db.Integer,     nullable=False)
    joining_date = db.Column(db.Date)

    courses = db.relationship(
        "Course",
        secondary=enrollments,
        backref=db.backref("students", lazy="dynamic")
    )

    def __init__(self, first_name, last_name, age, joining_date):
        self.first_name   = first_name
        self.last_name    = last_name
        self.age          = age
        self.joining_date = joining_date
