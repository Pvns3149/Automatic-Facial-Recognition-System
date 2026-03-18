from flask import Blueprint, jsonify, request

from app import db
from app.models import Sample, Attendance, MyClasses, Class


api_bp = Blueprint("api", __name__)


#Connection test
@api_bp.route("/health", methods=["GET"])
def health_check():
    return jsonify({"status": "healthy", "message": "API is running"})


#Database display test
@api_bp.route("/users", methods=["GET"])
def get_users():
    users = Sample.query.all()
    return jsonify({"users": [user.to_dict() for user in users]})


#Change attendance
@api_bp.route("/change_attendance", methods=["POST"])
def change_attendance():

    #Data receival and verification
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400

    if not data.get("user_id") or not data.get("class_id") or not data.get("week") or not data.get("attending"):
        return jsonify({"error": "user_id, class_id, week, and attendance are required"}), 400

    # Check if user exists
    user = Attendance.query.filter_by(studentid = data["user_id"], classid = data["class_id"], weekheld = data["week"]).first()
    if not user:
        return jsonify({"error": "User not found for given class and week"}), 404
    
    #update attendance
    user.presentstate = data["attending"]
    db.session.commit()
    return jsonify({"message": "Attendance status updated successfully"})


#Get all assigned classes for a user for a given week
@api_bp.route("/getClasses", methods=["POST"])
def get_classes():

    #Data receival and verification
    data = request.get_json()
    if not data or not data.get("id") or not data.get("week"): #WEEK DATA SHOULD BE IN COOKIE ON LOGIN
        return jsonify({"error": "ID or week not provided"}), 400

    # Check if user exists and get id of all classes the user has access to
    classId = MyClasses.query.filter_by(educatorid = data["id"]).all()
    if not classId:
        return jsonify({"error": "No classes found for given user"}), 404
    
    #Format and send response with each class details
    response = []
    for c in classId:
        classDetails = Class.query.filter_by(classid = c.classid).first()
        totalStd = studentCount(classDetails.classid, data["week"], None)
        response.append({
            "id": classDetails.classid,
            "session": classDetails.academicsession,
            "subjectCode": classDetails.subjectcode,
            "subjectName": classDetails.subjectname,
            "timeSlot": classDetails.classstarttime + " - " + classDetails.classendtime,
            "classType": classDetails.classtype,
            "totalStudents": totalStd,
            "presentPercent": round(studentCount(classDetails.classid, data["week"], True) / totalStd, 2) if totalStd > 0 else 0
        })

    #Sort by Class ID
    response.sort(key=lambda x: x["subjectCode"])
    
    return jsonify({"classes": response})

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
