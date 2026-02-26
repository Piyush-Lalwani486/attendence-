from extension import db
from datetime import datetime

class ActivityLog(db.Model):
    __tablename__ = "activity_log"

    id         = db.Column(db.Integer, primary_key=True)
    action     = db.Column(db.String(255), nullable=False)
    user       = db.Column(db.String(100), nullable=False)
    role       = db.Column(db.String(50),  nullable=False, default="Admin")
    icon_type  = db.Column(db.String(50),  nullable=False, default="clock")
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def __init__(self, action, user, role="Admin", icon_type="clock"):
        self.action    = action
        self.user      = user
        self.role      = role
        self.icon_type = icon_type
