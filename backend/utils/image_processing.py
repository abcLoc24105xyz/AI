import cv2
import numpy as np

from config import IMAGE_SIZE

def preprocess_image(face):

    img = cv2.resize(face, IMAGE_SIZE)

    img = img.astype("float32") / 255.0

    img = np.expand_dims(img, axis=0)

    img = np.expand_dims(img, axis=-1)

    return img