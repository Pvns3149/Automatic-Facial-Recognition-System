from app import db
from sqlalchemy.dialects.postgresql import ARRAY

class Sample(db.Model):
    #student table

    __tablename__ = "sample"

    col1 = db.Column(db.String(3), nullable=False, primary_key=True)
    col2 = db.Column(db.String(3), nullable=False)

    #Dict for JSON response
    def to_dict(self):
        """Convert user object to dictionary."""
        return {
            "col1": self.col1,
            "col2": self.col2

        }

    #Identifier
    def __repr__(self):
        return f"<User {self.col1}>"

class Vector(db.Model):
    #Vector table

    __tablename__ = "tblvector"

    id = db.Column(db.String(100), nullable=False, primary_key=True)
    embedding = db.Column(ARRAY(db.Float), nullable=False)



    #Identifier
    def __repr__(self):
        return f"<User {self.id}>"