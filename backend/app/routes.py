from flask import Blueprint, jsonify, request

from app import db
from app.models import Sample

api_bp = Blueprint("api", __name__)


@api_bp.route("/health", methods=["GET"])
def health_check():
    """Health check endpoint."""
    return jsonify({"status": "healthy", "message": "API is running"})


@api_bp.route("/users", methods=["GET"])
def get_users():
    """Get all users."""
    users = Sample.query.all()
    return jsonify({"users": [user.to_dict() for user in users]})


@api_bp.route("/users/<int:user_id>", methods=["GET"])
def get_user(user_id):
    """Get a specific user by ID."""
    user = Sample.query.get_or_404(user_id)
    return jsonify({"user": user.to_dict()})


# Sample databse actions

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
