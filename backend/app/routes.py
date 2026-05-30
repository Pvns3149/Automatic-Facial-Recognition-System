import os
import jwt
from dotenv import load_dotenv
from flask import Blueprint, jsonify, request
from collections import defaultdict
from app import db
from app.models import Educator, Attendance, MyClasses, Class, Student
from datetime import datetime, timedelta
from app.facemodels import FacialRecognitionModel
from zoneinfo import ZoneInfo
from functools import wraps
import mailtrap as mt

# Routes that specify endpoints to be called by the frontend for processing requests

load_dotenv()

api_bp = Blueprint("api", __name__)
face_model = FacialRecognitionModel(os.environ.get("INSIGHTFACE_ROOT"))
AUTH_KEY = os.environ.get("AUTH_KEY")

#Generate auth token for persistent user and embed id
def generate_auth_token(user_id):
    payload = {
        "user_id": user_id,
        "exp": datetime.now(ZoneInfo("Australia/Sydney")) + timedelta(hours = 2.5)
    }
    token = jwt.encode(payload, AUTH_KEY, algorithm="HS256")
    return token

#validate token on request
def validate_token(token):
    try:
        payload = jwt.decode(token, AUTH_KEY, algorithms=["HS256"])
        return payload["user_id"]
    except jwt.ExpiredSignatureError:
        return "Token expired"
    except jwt.InvalidTokenError:
        return "Invalid token"


#create wrapper for token authentication
def token_required(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        token = request.cookies.get('auth_token')
        if not token:
            return jsonify({"error": "No token provided"}), 401
        
        user_id = validate_token(token)
        if user_id == "Token expired":
            return jsonify({"error": "Token has expired."}), 401
        elif user_id == "Invalid token":
            return jsonify({"error": "Invalid token."}), 401
        
        #Extract id
        request.user_id = user_id  
        return f(*args, **kwargs)
    return wrapper


#Connection test
@api_bp.route("/health", methods=["GET"])
def health_check():
    return jsonify({"status": "healthy", "message": "API is running"})


#Database display test
@api_bp.route("/users", methods=["GET"])
def get_users():
    users = Educator.query.all()
    return jsonify({"users": [user.to_dict() for user in users]})


#Update attendance using a photo passed from the frontend, for Dashboard page
@api_bp.route("/updateAttendance", methods=["POST"])
def update_attendance_from_photo():
    
    data = request.get_json()

    if not data or not data.get("group_photo") or not data.get("id") or not data.get("week"):
        return jsonify({"error": "Missing data"}), 400

    student_who_should_attend = db.session.query(Attendance).join(
        Student, Attendance.studentid == Student.studentid
    ).filter(
        Attendance.classid == data["id"],
        Attendance.weekheld == data["week"],
        Attendance.presentstate == False
    ).all()

    # All students are already present, no need to mark attendance further for this class
    if not student_who_should_attend:
        return jsonify({"status":"All students are already marked present."}), 200

    query_emb = face_model.get_embeddings(data["group_photo"])

    # Only proceed to match identities if there are people in the captured photo
    if (len(query_emb) > 0):
        id_who_should_attend = [a.studentid for a in student_who_should_attend]
        gallery_emb = [a.student.refembedding for a in student_who_should_attend]

        ids_to_mark_attendance = face_model.find_match(id_who_should_attend, gallery_emb, query_emb, 0.5)

        # There are people in the captured photo, but none of them are students of this class
        if len(ids_to_mark_attendance) == 0:
                # Debug print statement, then proceed to next step
                print("no matches")
                
        # Mark attendance for detected students, send email to absent students
        for row in student_who_should_attend:
            if row.studentid in ids_to_mark_attendance:
                row.presentstate = True
            else:
                send_email(row.student.studentemail, data.get("className"), data.get("classCode"), data.get("timeSlot"), row.student.studentname)

        db.session.commit()
    
    # No people in the photo, still send email to absent students
    else:
        for row in student_who_should_attend:
            send_email(row.student.studentemail, data.get("className"), data.get("classCode"), data.get("timeSlot"), row.student.studentname)

    return jsonify({"status":"attendances updated"}), 200

#Change attendance from Students page
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
    
    #update attendance for the student selected from the frontend
    if (data["attending"] == "present"):
        user.presentstate = True        
    else:
        user.presentstate = False
    db.session.commit()
    return jsonify({"status":"attendance updated"}), 200


#Get the class happening right now, for display on Dashboard
@api_bp.route("/getDashboardClass", methods=["POST"])
@token_required
def get_dashboard_class():

    #Data receival
    data = request.get_json()
    
    #Data verification
    if not data or not data.get("session") or not data.get("time") or not data.get("week"):
        return jsonify({"error": "Missing data"}), 400
    
    # The current week, mathematically speaking, is a break week, refuse to show any running classes
    # "-1" is passed from the frontend to indicate that this week is either a break week, or out of session
    if data.get("week") == -1:
        return jsonify({"error": "Break, no classes happening now"}), 602

    # Get the IDs of classes in the user's class list
    class_ids = get_classes_by_educator_id(request.user_id)

    #Check if there are classes
    if (len(class_ids) == 0):
        return jsonify({"error": "No classes found for given user"}), 404

    # Frontend always return UTC+0 at the time of interacting with the dashboard
    current_time = datetime.fromisoformat(data["time"].replace("Z", "+00:00"))
    current_day = current_time.strftime("%a").upper()

    # Retrieve all classes happening on this week day in this session
    class_records = Class.query.filter(Class.classid.in_(class_ids), Class.academicsession == data["session"], Class.classdayofweek == current_day).all()
    
    # Loop through every class happening on this week day in this session, find class that matches the current time
    for class_record in class_records:

        # Get start and end times as returned from class records metadata
        class_start = datetime.strptime(class_record.classstarttime, "%I:%M %p")
        class_end = datetime.strptime(class_record.classendtime, "%I:%M %p")

        # Turn start and end times' date (maintaining hour and minutes) field to reflect the current date of current_time from the frontend
        # Set start and end times' time zone to Sydney time, consistent with the uni's time zone
        class_start = current_time.astimezone(ZoneInfo("Australia/Sydney")).replace(hour=class_start.hour, minute=class_start.minute, second=0, microsecond=0)
        class_end = current_time.astimezone(ZoneInfo("Australia/Sydney")).replace(hour=class_end.hour, minute=class_end.minute, second=0, microsecond=0)

        # Find the class happening right now from the previous retrieved results list
        if class_start < current_time and class_end > current_time:
            # Debug statement to confirm the class found
            print ("Class found " + str(class_record.classid))
            # Query the database to fetch all details of this matched class
            class_stats = db.session.query(
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

            # If no class records have been found for the current week.
            # This error will happen if the current week is set to a week
            # where the Attendance table has no records of yet
            # due to admin-related human errors.
            if not class_stats:
                return jsonify({"error": "No classes happening now"}), 601

            # Debug statement to confirm the class details
            print("Class record found " + str(class_stats.classid))

            # Format and send response with class details
            response = {
                "id": class_stats.classid,
                "session": class_stats.academicsession,
                "subjectCode": class_stats.subjectcode,
                "subjectName": class_stats.subjectname,
                "timeSlot": class_stats.classstarttime + " - " + class_stats.classendtime,
                "classType": class_stats.classtype,
                "totalStudents": class_stats.total_count,
                "presentStudents": class_stats.present_count,
                "day": class_stats.classdayofweek
            }
            
            return jsonify({"class": response})
        
    # Failure to find any classes happening now
    return jsonify({"error": "No classes happening now"}), 601


#Get info of all selected classes the user has added to their class list
@api_bp.route("/getClasses", methods=["POST"])
@token_required
def get_classes():
    # /getClasses endpoint requires no parameters
    # Get the IDs of classes in the user's class list
    class_ids = get_classes_by_educator_id(request.user_id)

    #Check if there are classes
    if (len(class_ids) == 0):
        # Happens when the user has not added any classes to their class list
        return jsonify({"error": "No classes found for given user"}), 404

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

    
    return jsonify({"classes": response})


#Get all students enrolled in a class of a given week for a user
@api_bp.route("/getStudents", methods=["POST"])
def get_students():
    # Data receival and verification
    data = request.get_json()
    if not data.get("classId"):  
        return jsonify({"error": "Class ID not provided"}), 400

    # Parse all other parameters
    # Convert to Boolean masks
    queried_class_id = (Attendance.classid == data["classId"])
    queried_week_held = (Attendance.weekheld == int(data["week"])) if (data.get("week") != None and int(data.get("week")) != 0) else True # None or 0 means all weeks
    queried_stud_id = (Attendance.studentid == data["id"]) if data.get("id") != None else True
    queried_stud_name = Student.studentname.ilike(f"%{data['name'].strip()}%") if (data.get("name") != None and data.get("name").strip() != "") else True # Empty string means no searching by name

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
    response = list(students.values())
    return jsonify({"students" : response})

#Persistently add a class to the user's class list 
@api_bp.route("/addClass", methods=["POST"])
@token_required
def add_class():    
    data = request.get_json()

    #Data verification
    if not data.get("classId"):  
        return jsonify({"error": "Class ID not provided"}), 400
    
    #Assign/add class for user
    existing_class_assignment = MyClasses.query.filter_by( educatorid = request.user_id, classid = data["classId"]).first()

    # Return error if the class is already in the user's class list
    if existing_class_assignment:
        return jsonify({"error": "User is already assigned to this class"}), 409

    # Otherwise, persistently assign/add the class to the user's class list
    newClass = MyClasses(educatorid = request.user_id, classid = data["classId"])
    db.session.add(newClass)
    db.session.commit()

    # Implementation for adding a new class
    return jsonify({"message": "Class added successfully"}), 200

#Persistently remove a class from the user's class list 
@api_bp.route("/removeClass", methods=["POST"])
@token_required
def remove_class():    
    data = request.get_json()

    #Data verification
    if not data.get("classId"):  
        return jsonify({"error": "Class ID not provided"}), 400
    
    #Remove class for user if the class was assigned to the user
    existing_class_assignment = MyClasses.query.filter_by( educatorid = request.user_id, classid = data["classId"]).first()
    if existing_class_assignment:
        db.session.delete(existing_class_assignment)
        db.session.commit()
        return jsonify({"message": "Class removed successfully"}), 200
    else:
        return jsonify({"error": "User is not assigned to this class"}), 404
    
#Get user/educator details to display on the Profile page
@api_bp.route("/getEducator", methods=["POST"])
@token_required
def get_educator():

    # Find the user and their details
    educator = Educator.query.filter_by(educatorid=request.user_id).first()

    # Cannot find the user, return error
    if not educator:
        return jsonify({"error": "Educator not found"}), 404

    # Format and send response with the user details
    response = educator.to_dict()
    
    return jsonify({"educator": response}), 200

#Log the user into the system
@api_bp.route('/login', methods=['POST'])
def login():
    # Get entered email and password
    email = request.json.get('email')
    passwd = request.json.get('passwd')

    # Query the database to see if the user by the provided email already exists
    login=Educator.query.filter_by(educatoremail=email).first()

    # If the user by the provided email exists, and the hash for the entered password matches the database, proceed
    if login and login.verify_password(passwd):

        #Generate token
        token = generate_auth_token(login.educatorid)

        # Set cookie with auth_token
        response = jsonify({"message": "Login successful"})
        response.set_cookie("auth_token", token, httponly=True, samesite="lax", secure=False, path="/") #change secure if HTTPS is used
        return response
    # User by the email does not exist, or the password is incorrect 
    else:
        #show the login page with an error message
        return jsonify({"success": False, "message": "Invalid credentials"}), 401

#Check whether the user is still logged in, judging by whether the cookie still exists on their browser
@api_bp.route('/authCheck', methods=['GET'])
def auth_status():
    # Get the token from the cookie
    token = request.cookies.get('auth_token')

    # No token found, user should not be logged in
    if not token:
        return jsonify({"err": "No Auth token"}), 200

    # Check if the token is still active
    user_id = validate_token(token)

    # Token has expired, user should not be logged in
    if user_id in ("Token expired", "Invalid token"):
        response = jsonify({"authenticated": False})
        response.delete_cookie("auth_token", path="/")
        return response, 200

    # Otherwise, the user is still authenticated
    return jsonify({"authenticated": True}), 200

   
#Register a new user/educator into the system
@api_bp.route('/register', methods=['POST'])
def register(): 
    # Get all register detail from the frontend form
    data = request.get_json()

    # If no register detail is provided, return error
    if not data:
        return jsonify({"error": "No data provided"}), 400

    # Check if email already exists
    existing_user = Educator.query.filter_by(educatoremail=data["email"]).first()
    if existing_user:
        return jsonify({"error": "Email already exists"}), 409

    # Check if ID already exists
    existing_id = Educator.query.filter_by(educatorid=data["id"]).first()
    if existing_id:
        return jsonify({"error": "ID already exists"}), 409

    # Create the new educator based on provided user details and push to the database
    new_educator = Educator(
        educatorid=data["id"],
        educatorname=data["name"],
        educatoremail=data["email"],
        educatorphone=data.get("phone", ""),
        educatorfaculty=data.get("faculty", ""),
        educatorlocation=data.get("officeBuilding", "")
    )
    # Store the password hash in the database for authentication later for login
    new_educator.password = data["password"] 
    db.session.add(new_educator)
    db.session.commit()

    return jsonify({"message": "Registration successful"}), 200

#Log the user out from the current session
@api_bp.route('/logout', methods=['POST'])
@token_required
def logout():
 
    # Properly reset the token and destroy the cookie upon logout
    response = jsonify({"message": "Logout successful"})
    response.set_cookie("reset", expires=0)
    response.delete_cookie("auth_token", path="/")
    return response, 200


# Reusable Helper functions
#Get the IDs of classes in the user's class list
def get_classes_by_educator_id(id):    
    # Check if user exists and get id of all classes the user has access to
    class_ids = MyClasses.query.with_entities(MyClasses.classid).filter_by(educatorid = id).all()
    # Return empty list if the user has not added any classes to their class list yet
    if not class_ids:
        return []
    
    return [id[0] for id in class_ids]

#Send an email to a specific student about their absence
def send_email(toEmail, className, classCode, timeSlot, name):
    #uncomment return during testing to avoid sending too many emails
    #return
    # Implementation for sending email using MailerSend
    api_key = os.environ.get("EMAIL_API_KEY")

    mail = mt.Mail(
        sender=mt.Address(email="Attendance-sys@uow.com", name="Automatic Student Attendance System"),
        to=[mt.Address(email=toEmail)],
        subject="Non-Attendance Notification for " + classCode,
        text=(f"""
                Dear {name},

                You were marked absent for the class {className} ({classCode}) held at {timeSlot}.
                Please contact your instructor if you believe this is an error.

                Best regards,
                Automatic Student Attendance System
            """),
        category="Integration Test",
    )

    client = mt.MailtrapClient(token=api_key, sandbox=True, inbox_id=4622247)
    client.send(mail)
    return
   

