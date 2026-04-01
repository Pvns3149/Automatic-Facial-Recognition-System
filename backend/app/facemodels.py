import insightface
import zipfile
import glob
import cv2
import base64
import numpy as np
from insightface.app.common import Face
from insightface.model_zoo import model_zoo
from pgvector.sqlalchemy import Vector
import sqlalchemy as db
from sqlalchemy.engine import URL
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy import Integer, Text, Column
import matplotlib.pyplot as plt

class FacialRecognitionModel:
    def __init__(self, root: str = ""):
        self.prepare_models(root=root)

    """
    Initialises the detection and recognition models for image processing
    The models expected are only buffalo_l models.
    root: Specifies the root where buffalo_l models are found / should be downloaded.
    """
    def prepare_models(self, root: str):
        # If either path is empty, download bufallo_l
        if not (root.strip()):
            print("No paths passed. Model initialisation failed.")
            return
        
        model_zoo.download_onnx(sub_dir=root, model_file="buffalo_l.zip", root=".")
        with zipfile.ZipFile(f"{root}/buffalo_l.zip", 'r') as zipref:
            zipref.extractall(path=f"{root}/", members=["w600k_r50.onnx", "det_10g.onnx"])
        self.detector = model_zoo.get_model(f"{root}/det_10g.onnx")
        self.recogniser = model_zoo.get_model(f"{root}/w600k_r50.onnx")

        self.detector.prepare(ctx_id=0, input_size=(640, 640))
        self.recogniser.prepare(ctx_id=0)


    """
    img_path (String): The image to generate embeddings for
    Returns a list of embeddings for each detected face in the image, or
    None when no face is detected or when no images are found in the specified
    img_path.
    """
    def get_embeddings(self, base64_string: str):
        # Return None if no base64 image is passed
        if base64_string is None: print(f"No image passed."); return None

        # Strip the header if it exists
        if "," in base64_string:
            base64_string = base64_string.split(",")[1]

        im_bytes = base64.b64decode(base64_string)
        im_arr = np.frombuffer(im_bytes, dtype=np.uint8)
        img = cv2.imdecode(im_arr, flags=cv2.IMREAD_COLOR)

        bboxes, kpss = self.detector.detect(img)
        # Return None if no face is detected
        if len(bboxes) < 1: 
            print("No face detected.")
            return []
        

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
    def find_match(self, ids: list, gallery: list, query: list, threshold: float):
        if query is None:
            return None
        gallery = np.array(gallery)
        query = np.array(query)
        
        scores = np.dot(query, gallery.T)
        scores = np.clip(scores, 0., 1.)
        # print(scores)
        indexes = np.argmax(scores, axis=1)
        
        comparison_res = [idx for score, idx in zip(scores, indexes) if score[idx] >= threshold]
        detected_students = [ids[idx] for idx in comparison_res]
        print(f"Detected students: {detected_students}")

        return detected_students
