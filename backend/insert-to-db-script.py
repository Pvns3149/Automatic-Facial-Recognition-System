import os
import csv
import glob
import sqlalchemy
import numpy as np
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
from app.facemodels import FacialRecognitionModel
from app.models import Student, Educator, Class, Enrolment, Attendance, MyClasses

def to_bool(value):
    if value == "true": return True 
    else: return False

def insert_students(data_path: str, img_path: str):
    face_rec_model = FacialRecognitionModel()

    with open(data_path, newline='') as csv_file:
        reader = csv.reader(csv_file)
        next(reader, None)

        img_paths = glob.glob(img_path)
        for path in img_paths:
            refembedding = face_rec_model.get_embeddings(path)[0]
            studentid, studentname, studentemail = next(reader, None)
            stud = Student(studentid=studentid, studentname=studentname, studentemail=studentemail, refembedding=refembedding)
            session.add(stud)

        session.commit()

def insert_educators(data_path: str):
    with open(data_path, newline='') as csv_file:
        reader = csv.reader(csv_file)
        next(reader, None)

        for educatorid, educatorname, educatoremail, educatorpass in reader:
            educator = Educator(educatorid=educatorid, educatorname=educatorname, educatoremail=educatoremail, educatorpass=educatorpass)
            session.add(educator)

        session.commit()

def insert_classes(data_path: str):
    with open(data_path, newline='') as csv_file:
        reader = csv.reader(csv_file)
        next(reader, None)

        for classid, classdesc, classvenue, \
            subjectcode, subjectname, classdayofweek, \
            classstarttime, classendtime, academicsession, \
            classtype in reader:

            aclass = Class(classid=classid, classdesc=classdesc, classvenue=classvenue, \
                           subjectcode=subjectcode, subjectname=subjectname, classdayofweek=classdayofweek, \
                           classstarttime=classstarttime, classendtime=classendtime, academicsession=academicsession, \
                           classtype=classtype)
            
            session.add(aclass)
        
        session.commit()

def insert_enrolments(data_path: str):
    with open(data_path, newline='') as csv_file:
        reader = csv.reader(csv_file)
        next(reader, None)

        for studentid, classid in reader:
            enrol = Enrolment(studentid=studentid, classid=classid)
            session.add(enrol)
        
        session.commit()

def insert_attendances(data_path: str):
    with open(data_path, newline='') as csv_file:
        reader = csv.reader(csv_file)
        next(reader, None)

        for studentid, classid, weekheld, presentstate in reader:
            enrol = Attendance(studentid=studentid, classid=classid, weekheld=weekheld, presentstate=to_bool(presentstate))
            session.add(enrol)
        
        session.commit()

def insert_myclasses(data_path: str):
    with open(data_path, newline='') as csv_file:
        reader = csv.reader(csv_file)
        next(reader, None)

        for educatorid, classid in reader:
            class_added = MyClasses(educatorid=educatorid, classid=classid)
            session.add(class_added)
        
        session.commit()

load_dotenv("backend")
db_url = os.environ.get("DATABASE_URL")

engine = sqlalchemy.create_engine(db_url)
session = sessionmaker(bind=engine)()
insert_students("sample-data/students.csv", "D:/facial-recognition-fyp/member-pics/*1.jpg")
insert_educators("sample-data/educators.csv")
insert_classes("sample-data/classes.csv")
insert_enrolments("sample-data/enrolments.csv")
insert_attendances("sample-data/attendances.csv")
insert_myclasses("sample-data/my_classes.csv")