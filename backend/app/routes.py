import os
from dotenv import load_dotenv
from flask import Blueprint, jsonify, request
from collections import defaultdict
from app import db
from app.models import Sample, Attendance, MyClasses, Class, Student
from datetime import datetime
from app.facemodels import FacialRecognitionModel
from zoneinfo import ZoneInfo
from mailersend import MailerSendClient, EmailBuilder

load_dotenv()

api_bp = Blueprint("api", __name__)
face_model = FacialRecognitionModel(os.environ.get("INSIGHTFACE_ROOT"))

#Connection test
@api_bp.route("/health", methods=["GET"])
def health_check():
    return jsonify({"status": "healthy", "message": "API is running"})


#Database display test
@api_bp.route("/users", methods=["GET"])
def get_users():
    users = Sample.query.all()
    return jsonify({"users": [user.to_dict() for user in users]})


#Update attendance
@api_bp.route("/updateAttendance", methods=["POST"])
def update_attendance_from_photo():
    
    data = request.get_json()

    # testing
    # with open("D:\\facial-recognition-fyp\\member-pics\\eric2.jpg", "rb") as f:
    #     im_b64 = base64.b64encode(f.read())

    # data = {"id": 2, "week": 2, "group_photo": im_b64}

    if not data or not data.get("group_photo") or not data.get("id") or not data.get("week"):
        return jsonify({"error": "Missing data"}), 400

    student_who_should_attend = db.session.query(Attendance).join(
        Student, Attendance.studentid == Student.studentid
    ).filter(
        Attendance.classid == data["id"],
        Attendance.weekheld == data["week"],
        Attendance.presentstate == False
    ).all()

    # print(str(db.session.query(Attendance).join(
    #     Student, Attendance.studentid == Student.studentid
    # ).filter(
    #     Attendance.classid == data["id"],
    #     Attendance.weekheld == data["week"],
    #     Attendance.presentstate == False
    # )))

    if not student_who_should_attend:
        print("nope")
        return jsonify({"status":"All students are already marked present."}), 200

    query_emb = face_model.get_embeddings(data["group_photo"])

    # Only proceed if there are people in the captured photo
    if (len(query_emb) > 0):
        id_who_should_attend = [a.studentid for a in student_who_should_attend]
        gallery_emb = [a.student.refembedding for a in student_who_should_attend]

        ids_to_mark_attendance = face_model.find_match(id_who_should_attend, gallery_emb, query_emb, 0.5)

        # There are people in the captured photo, but none of them are students of this class
        if len(ids_to_mark_attendance) == 0:
                print("no matches")
                return jsonify({"status":"No matching students detected in the photo."}), 200
        
        for row in student_who_should_attend:
            if row.studentid in ids_to_mark_attendance:
                row.presentstate = True
            else:
                send_email(row.student.studentemail, data.get("className"), data.get("classCode"), data.get("timeSlot"), row.student.studentname)

        db.session.commit()
    else:
        for row in student_who_should_attend:
            send_email(row.student.studentemail, data.get("className"), data.get("classCode"), data.get("timeSlot"), row.student.studentname)

    return jsonify({"status":"attendances updated"}), 200

#Change attendance
@api_bp.route("/changeAttendance", methods=["POST"])
def change_attendance():

    #Data receival and verification
    data = request.get_json()
    if not data or not data.get("id") or not data.get("week") or not data.get("classId") or data.get("attending") == None:
        return jsonify({"error": "Missing data"}), 400

    # Check if user exists
    user = Attendance.query.filter_by(studentid = data["id"], classid = data["classId"], weekheld = data["week"]).first()
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    #update attendance
    if (data["attending"] == "present"):
        user.presentstate = True        
    else:
        user.presentstate = False
    db.session.commit()
    return jsonify({"status":"attendance updated"}), 200


#Get the class happening right now
@api_bp.route("/getDashboardClass", methods=["POST"])
def get_dashboard_class():

    #Data receival
    data = request.get_json()
    class_ids = get_classes_by_educator_id(data)

    # Frontend always return UTC+0 at the time of interacting with the dashboard
    current_time = datetime.fromisoformat(data["time"].replace("Z", "+00:00"))
    current_day = current_time.strftime("%a").upper()

    class_records = Class.query.filter(Class.classid.in_(class_ids), Class.academicsession == data["session"], Class.classdayofweek == current_day).all()
    
    # Loop through every class, find class that matches the current time
    for class_record in class_records:

        # Get start and end times as returned from class records metadata
        class_start = datetime.strptime(class_record.classstarttime, "%I:%M %p")
        class_end = datetime.strptime(class_record.classendtime, "%I:%M %p")

        # Turn start and end times' date (maintaining hour and minutes) field to reflect the current date of current_time from the frontend
        # Set start and end times' time zone to Sydney time, consistent with the uni's time zone
        class_start = current_time.astimezone(ZoneInfo("Australia/Sydney")).replace(hour=class_start.hour, minute=class_start.minute, second=0, microsecond=0)
        class_end = current_time.astimezone(ZoneInfo("Australia/Sydney")).replace(hour=class_end.hour, minute=class_end.minute, second=0, microsecond=0)

        if class_start < current_time and class_end > current_time:
            print ("Class found " + str(class_record.classid))
            class_record = db.session.query(
                Class.classid,
                Class.academicsession,
                Class.subjectcode,
                Class.subjectname,
                Class.classstarttime,
                Class.classendtime,
                Class.classtype,
                Class.classdayofweek,
                db.func.count().filter(Attendance.presentstate == True).label("present_count"),
                db.func.count().label("total_count")
            ).join(Attendance, Class.classid == Attendance.classid).filter(
                Class.classid == class_record.classid,
                Attendance.weekheld == data["week"]
            ).group_by(Class.classid,
                Class.academicsession,
                Class.subjectcode,
                Class.subjectname,
                Class.classstarttime,
                Class.classendtime,
                Class.classtype
            ).first()

            print("Class record found " + str(class_record.classid))

            response = {
                "id": class_record.classid,
                "session": class_record.academicsession,
                "subjectCode": class_record.subjectcode,
                "subjectName": class_record.subjectname,
                "timeSlot": class_record.classstarttime + " - " + class_record.classendtime,
                "classType": class_record.classtype,
                "totalStudents": class_record.total_count,
                "presentStudents": class_record.present_count,
                "day": class_record.classdayofweek
            }
            #print(response)
            #print("OOOOOOOOOOOOOOOOOOOOOOOOOOOOO")
            
            return jsonify({"class": response})
        
    # Failure to find any classes
    return jsonify({"error": "No classes happening now"}), 601


#Get all assigned classes for a user for a given week
@api_bp.route("/getClasses", methods=["POST"])
def get_classes():

    #Data receival
    data = request.get_json()
    class_ids = get_classes_by_educator_id(data)

    # Retrieve class information
    class_records = Class.query.filter(Class.classid.in_(class_ids)).all()

    # Format and send response with each class details
    response = []
    for rec in class_records:
        response.append({
            "id": rec.classid,
            "session": rec.academicsession,
            "subjectCode": rec.subjectcode,
            "subjectName": rec.subjectname,
            "timeSlot": rec.classstarttime + " - " + rec.classendtime,
            "classType": rec.classtype,
            "day": rec.classdayofweek
        })

    # Sort by subject code for easier search
    response.sort(key=lambda x: x["subjectCode"])

    #print(response)
    
    return jsonify({"classes": response})

#Get all classes
@api_bp.route("/getAllClasses", methods=["POST"])
def get_all_classes():
    # Retrieve class information
    class_records = Class.query.all()

    # Format and send response with each class details
    response = []
    for rec in class_records:
        response.append({
            "id": rec.classid,
            "session": rec.academicsession,
            "subjectCode": rec.subjectcode,
            "subjectName": rec.subjectname,
            "timeSlot": rec.classstarttime + " - " + rec.classendtime,
            "classType": rec.classtype,
            "day": rec.classdayofweek
        })

    # Sort by subject code for easier search
    response.sort(key=lambda x: x["subjectCode"])

    print(response)
    
    return jsonify({"classes": response})


#Get all assigned students for a user for a given week and class
@api_bp.route("/getStudents", methods=["POST"])
def get_students():
    # Data receival and verification
    data = request.get_json()
    if not data.get("classId"):  
        return jsonify({"error": "Class ID not provided"}), 400

    print(data.get("week"))

    # Parse all other parameters
    # Convert to Boolean masks
    queried_class_id = (Attendance.classid == data["classId"])
    queried_week_held = (Attendance.weekheld == int(data["week"])) if (data.get("week") != None and int(data.get("week")) != 0) else True # None or 0 means all weeks
    queried_stud_id = (Attendance.studentid == data["id"]) if data.get("id") != None else True
    queried_stud_name = Student.studentname.ilike(f"%{data['name'].strip()}%") if (data.get("name") != None and data.get("name").strip()) != "" else True # Empty string means no searching by name

    print(queried_stud_name)

  # Query attendance and student data
    attendance_records = db.session.query(
        Attendance.studentid,
        Attendance.weekheld,
        Attendance.presentstate,
        Student.studentname,
        Student.studentemail
    ).join(Student, Attendance.studentid == Student.studentid).filter(
        queried_class_id,
        queried_week_held,
        queried_stud_id,
        queried_stud_name
    ).order_by(Attendance.studentid, Attendance.weekheld).all()

    # Process the results into the desired format
    students = defaultdict(lambda: {"weeks": {}})
    for record in attendance_records:
        student_id = record.studentid
        if student_id not in students:
            students[student_id].update({
                "id": record.studentid,
                "email": record.studentemail,
                "name": record.studentname,
            })
        students[student_id]["weeks"][record.weekheld] = "present" if record.presentstate else "absent"

    # Convert to list
    print(students)
    response = list(students.values())
    return jsonify({"students" : response})

@api_bp.route("/addClass", methods=["POST"])
def add_class():    
    data = request.get_json()

    #Data verification
    if not data.get("classId") and not data.get("userId"):  
        return jsonify({"error": "Class ID not provided"}), 400
    
    #Assign class for user
    existing_user = MyClasses.query.filter_by( educatorid = data["id"], classid = data["classId"]).first()
    if existing_user:
        return jsonify({"error": "User is already assigned to this class"}), 409

    newClass = MyClasses(educatorid = data["id"], classid = data["classId"])
    db.session.add(newClass)
    db.session.commit()

    # Implementation for adding a new class
    return jsonify({"message": "Class added successfully"}), 200

@api_bp.route("/removeClass", methods=["POST"])
def remove_class():    
    data = request.get_json()

    #Data verification
    if not data.get("classId") and not data.get("userId"):  
        return jsonify({"error": "Class ID not provided"}), 400
    
    #Remove class for user if exists
    existing_user = MyClasses.query.filter_by( educatorid = data["id"], classid = data["classId"]).first()
    if existing_user:
        db.session.delete(existing_user)
        db.session.commit()
        return jsonify({"message": "Class removed successfully"}), 200
    else:
        return jsonify({"error": "User is not assigned to this class"}), 404

# Sample databse actions

# @api_bp.route("/users/<int:user_id>", methods=["GET"])
# def get_user(user_id):
#     """Get a specific user by ID."""
#     user = Sample.query.get_or_404(user_id)
#     return jsonify({"user": user.to_dict()})


# @api_bp.route("/users", methods=["POST"])
# def create_user():
#     """Create a new user."""
#     data = request.get_json()

#     if not data:
#         return jsonify({"error": "No data provided"}), 400

#     if not data.get("name") or not data.get("email"):
#         return jsonify({"error": "Name and email are required"}), 400

#     # Check if email already exists
#     existing_user = Sample.query.filter_by(email=data["email"]).first()
#     if existing_user:
#         return jsonify({"error": "Email already exists"}), 409

#     user = User(name=data["name"], email=data["email"])
#     db.session.add(user)
#     db.session.commit()

#     return jsonify({"user": user.to_dict()}), 201


# @api_bp.route("/users/<int:user_id>", methods=["PUT"])
# def update_user(user_id):
#     """Update an existing user."""
#     user = User.query.get_or_404(user_id)
#     data = request.get_json()

#     if not data:
#         return jsonify({"error": "No data provided"}), 400

#     if "name" in data:
#         user.name = data["name"]
#     if "email" in data:
#         # Check if new email already exists for another user
#         existing_user = User.query.filter_by(email=data["email"]).first()
#         if existing_user and existing_user.id != user_id:
#             return jsonify({"error": "Email already exists"}), 409
#         user.email = data["email"]

#     db.session.commit()

#     return jsonify({"user": user.to_dict()})


# @api_bp.route("/users/<int:user_id>", methods=["DELETE"])
# def delete_user(user_id):
#     """Delete a user."""
#     user = User.query.get_or_404(user_id)
#     db.session.delete(user)
#     db.session.commit()

#     return jsonify({"message": "User deleted successfully"})


# Helper functions
def studentCount(class_id, week, present : None ):
    if present != None:
        count = Attendance.query.filter_by(classid = class_id, weekheld = week, presentstate = present).count()
    else:
        count = Attendance.query.filter_by(classid = class_id, weekheld = week).count()
    return count

def get_classes_by_educator_id(data):
    #Data verification
    if not data or not data.get("id") or not data.get("week"): #WEEK DATA SHOULD BE IN COOKIE ON LOGIN
        return jsonify({"error": "ID or week not provided"}), 400
    
    # Check if user exists and get id of all classes the user has access to
    class_ids = MyClasses.query.with_entities(MyClasses.classid).filter_by(educatorid = data["id"]).all()
    if not class_ids:
        return jsonify({"error": "No classes found for given user"}), 404
    
    return [id[0] for id in class_ids]

def send_email(toEmail, className, classCode, timeSlot, name):
    return
    
    # Implementation for sending email using Mailtrap
    api_key = os.environ.get("EMAIL_API_KEY")
    ms = MailerSendClient(api_key = api_key)

    email = (EmailBuilder()
            .from_email("test@test-zxk54v80rwpljy6v.mlsender.net", "Automatic Student Attendance System")
            .to_many([{"email": toEmail, "name": name}])
            .subject("Non-Attendance Notification for " + classCode)
            .html(f"""
                <p>Dear {name},</p>
                <p>You were marked absent for the class <strong>{className} ({classCode})</strong> held at <strong>{timeSlot}</strong>.</p>
                <p>Please contact your instructor if you believe this is an error.</p>
                <p>Best regards,<br>Automatic Student Attendance System</p>
            """)
            .text(f"""
                Dear {name},

                You were marked absent for the class {className} ({classCode}) held at {timeSlot}.
                Please contact your instructor if you believe this is an error.

                Best regards,
                Automatic Student Attendance System
            """)
            .build())

    ms.emails.send(email)