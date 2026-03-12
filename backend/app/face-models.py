import insightface
import zipfile
import glob
import cv2
import numpy as np
from insightface.app.common import Face
from insightface.model_zoo import model_zoo
from pgvector.sqlalchemy import Vector
import sqlalchemy as db
from sqlalchemy.engine import URL
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy import Integer, Text, Column

class FacialRecognitionModel:
    def __init__(self):
        self.prepare_models()

    """
    Initialises the detection and recognition models for image processing
    """
    def prepare_models(self, detector_path: str = "", recogniser_path: str = "", detector_input_size: tuple = (640, 640)):
        # If either path is empty, download bufallo_l
        if not (detector_path.strip() and recogniser_path.strip()):
            model_zoo.download_onnx(sub_dir=".insightface/models/buffalo_l", model_file="buffalo_l.zip", root=".")
            with zipfile.ZipFile(".insightface/models/buffalo_l/buffalo_l.zip", 'r') as zipref:
                zipref.extractall(path=".insightface/models/buffalo_l/", members=["w600k_r50.onnx", "det_10g.onnx"])

        self.detector = model_zoo.get_model(".insightface/models/buffalo_l/det_10g.onnx")
        self.recogniser = model_zoo.get_model(".insightface/models/buffalo_l/w600k_r50.onnx")

        self.detector.prepare(ctx_id=0, input_size=detector_input_size)
        self.recogniser.prepare(ctx_id=0)


    """
    img_path (String): The image to generate embeddings for
    Returns a list of embeddings for each detected face in the image, or
    None when no face is detected or when no images are found in the specified
    img_path.
    """
    def get_embeddings(self, img_path: str):
        img = cv2.imread(img_path)
        # Return None if there is no image
        if img is None: print(f"No image in specified {img_path}."); return None

        bboxes, kpss = self.detector.detect(img)
        # Return None if no face is detected
        if len(bboxes) < 1: 
            print("No face detected.")
            return None
        

        # Handle more than one face in the image
        if len(bboxes > 1):
            embeddings = []
            for landmark in kpss:
                face = Face(kps=landmark)
                self.recogniser.get(img, face)
                embeddings.append(face.normed_embedding)
            embeddings = np.array(embeddings)
            return embeddings

        # Handle more than one face in the image (Batch solution)
        # if len(bboxes > 1):
        #     aligned_imgs = []
        #     for landmark in kpss:
        #         face = Face(kps=landmark)
        #         aligned_imgs.append(face_align.norm_crop(img, face.kps))

        #     embs = np.array(recogniser.get_feat(aligned_imgs))
        #     normalised_embeddings = embs.T / l2norm(embs, axis=1)
        #     return normalised_embeddings

        # Only one face in the image
        face = Face(kps=kpss[0])
        self.recogniser.get(img, face)
        return face.normed_embedding


    """
    ids (list): The list of student IDs to check against
    gallery (np.ndarray): The list of embeddings associated with the student IDs
    query (np.ndarray): The list of embeddings to check for student matches
    threshold (float): The minimum threshold to treat as a positive match
    Returns a list of student IDs corresponding to the students whose
    identities match the query.
    """
    def find_match(self, ids: list, gallery: np.ndarray, query: np.ndarray, threshold: float):
        if query is None:
            return None
        # gallery = np.array(gallery)
        scores = np.dot(query, gallery.T)
        scores = np.clip(scores, 0., 1.)
        # print(scores)
        indexes = np.argmax(scores, axis=1)
        
        comparison_res = [idx for score, idx in zip(scores, indexes) if score[idx] >= threshold]
        detected_students = [ids[idx] for idx in comparison_res]

        return detected_students

# For testing purposes
# Base = declarative_base()

# class Student(Base):
#     __tablename__ = "student"
#     studentid = Column(Text, primary_key=True)
#     studentname = Column(Text)
#     studentemail = Column(Text)
#     refembedding = Column(Vector(512))


# url_object = URL.create(
#     "postgresql+psycopg2",
#     username="groupw14",
#     password="autoattsys@2500",
#     host="autoattendsys-csit321.postgres.database.azure.com",
#     port=5432,
#     database="campus_db"
# )

# engine = db.create_engine(url_object)
# session = sessionmaker(bind=engine)()

# model = FacialRecognitionModel()

# member_names = ["Adel Al Jasry", "Alyan Babar Alam", "Ernest Teh", "Puvannesan Sandranesan"]
# ids = ["8469532", "8070799", "8359118", "9783210"]
# emails = ["aaj950@uowmail.edu.au", "aba193@uowmail.edu.au", "et485@uowmail.edu.au", "ps603@uowmail.edu.au"]

# # img_paths = glob.glob(f'member-pics/*1.jpg')
# img_paths = glob.glob(f'D:/facial-recognition-fyp/member-pics/*2.jpg')
# embeddings = []
# for path in img_paths:
#     print(path)
#     embeddings.append(model.get_embeddings(path)[0])

# gallery = []
# results = session.query(Student).all()
# for result in results:
#     gallery.append(result.refembedding)

# gallery = np.array(gallery)
# print(model.find_match(ids, gallery, np.array(embeddings), 0.5))