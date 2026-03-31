import os
from dotenv import load_dotenv
from flask import Blueprint, jsonify, request
from collections import defaultdict
from app import db
from app.models import Sample, Attendance, MyClasses, Class, Student
from datetime import datetime
from app.facemodels import FacialRecognitionModel


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
# @api_bp.route("/updateAttendance", methods=["POST"])
def update_attendance_from_photo():
    import base64
    # data = request.get_json()

    # testing
    with open("D:\\facial-recognition-fyp\\member-pics\\eric2.jpg", "rb") as f:
        im_b64 = base64.b64encode(f.read())

    data = {"id": 2, "week": 2, "group_photo": im_b64}

    if not data or not data.get("group_photo") or not data.get("id") or not data.get("week"):
        return jsonify({"error": "Missing data"}), 400

    student_who_should_attend = db.session.query(Attendance).join(
        Student, Attendance.studentid == Student.studentid
    ).filter(
        Attendance.classid == data["id"],
        Attendance.weekheld == data["week"],
        Attendance.presentstate == False
    ).all()

    print(str(db.session.query(Attendance).join(
        Student, Attendance.studentid == Student.studentid
    ).filter(
        Attendance.classid == data["id"],
        Attendance.weekheld == data["week"],
        Attendance.presentstate == False
    )))

    if not student_who_should_attend:
        print("nope")
        return jsonify({"status":"All students are already marked present."}), 200

    query_emb = face_model.get_embeddings(data["group_photo"])
    id_who_should_attend = [a.studentid for a in student_who_should_attend]
    gallery_emb = [a.student.refembedding for a in student_who_should_attend]

    ids_to_mark_attendance = face_model.find_match(id_who_should_attend, gallery_emb, query_emb, 0.5)

    for row in student_who_should_attend:
        if row.studentid in ids_to_mark_attendance:
            row.presentstate = True

    db.session.commit()
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


#Get all assigned classes for a user for a given week
@api_bp.route("/getClasses", methods=["POST"])
def get_classes():

    #Data receival and verification
    data = request.get_json()
    if not data or not data.get("id") or not data.get("week"): #WEEK DATA SHOULD BE IN COOKIE ON LOGIN
        return jsonify({"error": "ID or week not provided"}), 400

    # Check if user exists and get id of all classes the user has access to
    class_ids = MyClasses.query.with_entities(MyClasses.classid).filter_by(educatorid = data["id"]).all()
    if not class_ids:
        return jsonify({"error": "No classes found for given user"}), 404
    
    if data.get("dashboard") == True:

        print("DASHBOARD DASHBOARD DASHBOARD")
        

        class_ids = [id[0] for id in class_ids]
        current_time = datetime.fromisoformat(data["time"].replace("Z", "+00:00"))
        current_day = current_time.strftime("%a").upper()

        class_data = Class.query.filter(Class.classid.in_(class_ids), Class.academicsession == data["session"], Class.classdayofweek == current_day).all()
        for cls in class_data:
            class_start = datetime.strptime(cls.classstarttime, "%I:%M %p")
            class_end = datetime.strptime(cls.classendtime, "%I:%M %p")

            #Make db timezone same as sys timezone
            class_start = current_time.astimezone().replace(hour=class_start.hour, minute=class_start.minute, second=0, microsecond=0)
            class_end = current_time.astimezone().replace(hour=class_end.hour, minute=class_end.minute, second=0, microsecond=0)

            if class_start < current_time and class_end > current_time:
                print ("Class found " + str(cls.classid))
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
                    Class.classid == cls.classid,
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
                print(response)
                print("OOOOOOOOOOOOOOOOOOOOOOOOOOOOO")
                
                return jsonify({"class": response})
    
    else:

        # Search for class information where its
        # Attendance records exist for the selected week
        class_records = db.session.query(
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
            Class.classid.in_(class_ids),
            Attendance.weekheld == data["week"]
        ).group_by(Class.classid,
            Class.academicsession,
            Class.subjectcode,
            Class.subjectname,
            Class.classstarttime,
            Class.classendtime,
            Class.classtype
        ).all()


        # Check for classes that were not returned
        # due to its non-onccurrence in the selected week
        returned_ids = set([record[0] for record in class_records])
        non_returned_ids = list(class_ids - returned_ids)

        # Recover these unreturned classes
        non_occurring_class_records = Class.query.filter(Class.classid.in_(non_returned_ids)).all()
        class_records = class_records + non_occurring_class_records

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
                "totalStudents": rec.total_count if hasattr(rec, "total_count") else 0,
                "presentStudents": rec.present_count if hasattr(rec, "present_count") else 0,
                "day": rec.classdayofweek
            })

        # Sort by subject code for easier search
        response.sort(key=lambda x: x["subjectCode"])
        
        return jsonify({"classes": response})

    print("error")
    #Default return for unexpected cases
    return jsonify({"error": "No dash bool prov"}), 500


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

def studentCount(class_id, week, present : None ):
    if present != None:
        count = Attendance.query.filter_by(classid = class_id, weekheld = week, presentstate = present).count()
    else:
        count = Attendance.query.filter_by(classid = class_id, weekheld = week).count()
    return count
