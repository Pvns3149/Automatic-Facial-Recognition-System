from app import db
from pgvector.sqlalchemy import VECTOR
from sqlalchemy.dialects.postgresql import TEXT, INTEGER, BOOLEAN
from sqlalchemy.dialects.postgresql import ARRAY
from werkzeug.security import generate_password_hash, check_password_hash

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
    
class Student(db.Model):
    __tablename__ = "student"
    studentid = db.Column(TEXT, nullable=False, primary_key=True)
    studentname = db.Column(TEXT)
    studentemail = db.Column(TEXT)
    refembedding = db.Column(VECTOR(512))

    # Link to Attendance table, referring to student's attendances
    stud_attendances = db.relationship("Attendance", back_populates="student")

    # Link to Enrolment table, referring to student's enrolments
    stud_enrolments = db.relationship("Enrolment", back_populates="student")

    def to_dict(self):
        """Convert Student object to dictionary."""
        return {
            "id": self.studentid,
            "name": self.studentname,
            "email": self.studentemail
        }

    def __repr__(self):
        return f"<Student {self.studentid}>"
    
class Educator(db.Model):
    __tablename__ = "educator"
    educatorid = db.Column(TEXT, nullable=False, primary_key=True)
    educatorname = db.Column(TEXT)
    educatoremail = db.Column(TEXT)
    educatorpass = db.Column(TEXT)
    educatorphone = db.Column(TEXT)
    educatorfaculty = db.Column(TEXT)
    educatorlocation = db.Column(TEXT)
    

    # Link to My_Classes table, referring to the educator's currently selected classes on the system
    educator_my_classes = db.relationship("MyClasses", back_populates="educator")

    def to_dict(self):
        "Convert Educator object to dictionary."
        return {
            "id": self.educatorid,
            "name": self.educatorname,
            "email": self.educatoremail,
            "phone": self.educatorphone,
            "faculty": self.educatorfaculty,
            "location": self.educatorlocation
        }
    

    def __repr__(self):
        return f"<Educator {self.educatorid}>"

    
        # Prevent plaintext password from being read
    @property
    def password(self):
        raise AttributeError('password is not a readable attribute')
    
    @password.setter
    def password(self, password):
        self.educatorpass = generate_password_hash(password)

    def verify_password(self, password):  
        return check_password_hash(self.educatorpass, password)

class Class(db.Model):
    __tablename__ = "class"
    classid = db.Column(INTEGER, nullable=False, primary_key=True)
    classdesc = db.Column(TEXT)
    classvenue = db.Column(TEXT)
    subjectcode = db.Column(TEXT)
    subjectname = db.Column(TEXT)
    classdayofweek = db.Column(TEXT)
    classstarttime = db.Column(TEXT)
    classendtime = db.Column(TEXT)
    academicsession = db.Column(TEXT)
    classtype = db.Column(TEXT)

    # Link to Attendance table, referring to the class's occurrence in a certain week
    class_attendances = db.relationship("Attendance", back_populates="aclass")

    # Link to Enrolment table, referring to the classes that have been enrolled by students
    class_enrolments = db.relationship("Enrolment", back_populates="aclass")

    # Link to My_Classes table, referring to the classes that have been selected by educators
    class_my_classes = db.relationship("MyClasses", back_populates="aclass")

    def to_dict(self):
        """Convert Class object to dictionary."""
        return {
            "id": self.classid,
            "name": f"{self.academicsession} {self.subjectcode}\
                  {self.classtype} {self.classstarttime} - {self.classendtime}",
            "venue": self.classvenue,
            "description": self.classdesc
        }

    def __repr__(self):
        return f"<Class {self.classid}>"

class Attendance(db.Model):
    __tablename__ = "attendance"
    # Foreign key StudentID
    studentid = db.Column(TEXT, db.ForeignKey('student.studentid'), primary_key=True)
    student = db.relationship("Student", back_populates="stud_attendances")
    # Foreign key ClassID
    classid = db.Column(INTEGER, db.ForeignKey('class.classid'), primary_key=True)
    aclass = db.relationship("Class", back_populates="class_attendances")

    weekheld = db.Column(INTEGER, primary_key=True)
    presentstate = db.Column(BOOLEAN)

    def to_dict(self):
        """Convert Attendance object to dictionary."""
        return {
            "studentid": self.studentid,
            "classid": self.classid,
            "weekheld": self.educatoremail,
            "presentstate": self.presentstate
        }

    def __repr__(self):
        return f"<Attendance {self.studentid}-{self.classid}>"

class Enrolment(db.Model):
    __tablename__ = "enrolment"
    # Foreign key StudentID
    studentid = db.Column(TEXT, db.ForeignKey('student.studentid'), primary_key=True)
    student = db.relationship("Student", back_populates="stud_enrolments")
    # Foreign key ClassID
    classid = db.Column(INTEGER, db.ForeignKey('class.classid'), primary_key=True)
    aclass = db.relationship("Class", back_populates="class_enrolments")

    def to_dict(self):
        """Convert Enrolment object to dictionary."""
        return {
            "studentid": self.studentid,
            "classid": self.classid
        }

    def __repr__(self):
        return f"<Enrolment {self.studentid}-{self.classid}>"

class MyClasses(db.Model):
    __tablename__ = "my_classes"
    # Foreign key EducatorID
    educatorid = db.Column(TEXT, db.ForeignKey('educator.educatorid'), primary_key=True)
    educator = db.relationship("Educator", back_populates="educator_my_classes")
    # Foreign key ClassID
    classid = db.Column(INTEGER, db.ForeignKey('class.classid'), primary_key=True)
    aclass = db.relationship("Class", back_populates="class_my_classes")

    def to_dict(self):
        """Convert MyClasses object to dictionary."""
        return {
            "educatorid": self.educatorid,
            "classid": self.classid
        }

    def __repr__(self):
        return f"<MyClasses {self.educatorid}-{self.classid}>"