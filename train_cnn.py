import os
import numpy as np
import matplotlib.pyplot as plt
import tensorflow as tf

from tensorflow.keras.models import Sequential

from tensorflow.keras.layers import (
    Conv2D,
    MaxPooling2D,
    Dense,
    Dropout,
    BatchNormalization,
    Flatten,
    LeakyReLU
)

from tensorflow.keras.preprocessing.image import ImageDataGenerator

from tensorflow.keras.optimizers import Adam

from tensorflow.keras.callbacks import (
    EarlyStopping,
    ReduceLROnPlateau,
    ModelCheckpoint,
    CSVLogger
)

from sklearn.utils.class_weight import compute_class_weight

# ======================
# CONFIG
# ======================

IMAGE_SIZE = (48, 48)

BATCH_SIZE = 16

EPOCHS = 50

TRAIN_DIR = "dataset/train"
TEST_DIR = "dataset/test"

MODEL_DIR = "backend/model"

os.makedirs(MODEL_DIR, exist_ok=True)

# ======================
# DATA AUGMENTATION
# ======================

train_datagen = ImageDataGenerator(

    rescale=1.0 / 255,

    rotation_range=20,

    width_shift_range=0.2,
    height_shift_range=0.2,

    zoom_range=0.2,

    shear_range=0.15,

    horizontal_flip=True,

    brightness_range=[0.8, 1.2],

    fill_mode="nearest"
)

test_datagen = ImageDataGenerator(
    rescale=1.0 / 255
)

print("Đang load dữ liệu...")

train_generator = train_datagen.flow_from_directory(
    TRAIN_DIR,

    target_size=IMAGE_SIZE,

    batch_size=BATCH_SIZE,

    class_mode="categorical",

    color_mode="grayscale",

    shuffle=True
)

test_generator = test_datagen.flow_from_directory(
    TEST_DIR,

    target_size=IMAGE_SIZE,

    batch_size=BATCH_SIZE,

    class_mode="categorical",

    color_mode="grayscale",

    shuffle=False
)

labels = train_generator.class_indices

print(labels)

np.save(
    os.path.join(MODEL_DIR, "labels.npy"),
    labels
)

# ======================
# CLASS WEIGHTS
# ======================

class_weights = compute_class_weight(
    class_weight="balanced",

    classes=np.unique(train_generator.classes),

    y=train_generator.classes
)

class_weights = dict(enumerate(class_weights))

print(class_weights)

# ======================
# MODEL CNN IMPROVED
# ======================

model = Sequential([

    # BLOCK 1
    Conv2D(
        64,
        (3,3),
        padding="same",
        input_shape=(48,48,1)
    ),

    BatchNormalization(),

    LeakyReLU(0.1),

    Conv2D(
        64,
        (3,3),
        padding="same"
    ),

    BatchNormalization(),

    LeakyReLU(0.1),

    MaxPooling2D(2,2),

    Dropout(0.25),

    # BLOCK 2
    Conv2D(
        128,
        (3,3),
        padding="same"
    ),

    BatchNormalization(),

    LeakyReLU(0.1),

    Conv2D(
        128,
        (3,3),
        padding="same"
    ),

    BatchNormalization(),

    LeakyReLU(0.1),

    MaxPooling2D(2,2),

    Dropout(0.3),

    # BLOCK 3
    Conv2D(
        256,
        (3,3),
        padding="same"
    ),

    BatchNormalization(),

    LeakyReLU(0.1),

    Conv2D(
        256,
        (3,3),
        padding="same"
    ),

    BatchNormalization(),

    LeakyReLU(0.1),

    MaxPooling2D(2,2),

    Dropout(0.35),

    # BLOCK 4
    Conv2D(
        512,
        (3,3),
        padding="same"
    ),

    BatchNormalization(),

    LeakyReLU(0.1),

    MaxPooling2D(2,2),

    Dropout(0.4),

    Flatten(),

    # DENSE
    Dense(512),

    BatchNormalization(),

    LeakyReLU(0.1),

    Dropout(0.5),

    Dense(256),

    LeakyReLU(0.1),

    Dropout(0.4),

    Dense(
        train_generator.num_classes,

        activation="softmax"
    )
])

# ======================
# COMPILE
# ======================

model.compile(

    optimizer=Adam(
        learning_rate=1e-4
    ),

    loss=tf.keras.losses.CategoricalCrossentropy(
        label_smoothing=0.1
    ),

    metrics=["accuracy"]
)

model.summary()

# ======================
# CALLBACKS
# ======================

early_stopping = EarlyStopping(

    monitor="val_loss",

    patience=8,

    restore_best_weights=True
)

reduce_lr = ReduceLROnPlateau(

    monitor="val_loss",

    factor=0.5,

    patience=3,

    min_lr=1e-6,

    verbose=1
)

checkpoint = ModelCheckpoint(

    os.path.join(MODEL_DIR, "best_model.keras"),

    monitor="val_accuracy",

    save_best_only=True,

    mode="max",

    verbose=1
)

csv_logger = CSVLogger(

    os.path.join(MODEL_DIR, "training_log.csv")
)

# ======================
# TRAIN
# ======================

history = model.fit(

    train_generator,

    validation_data=test_generator,

    epochs=EPOCHS,

    class_weight=class_weights,

    callbacks=[
        early_stopping,
        reduce_lr,
        checkpoint,
        csv_logger
    ]
)

# ======================
# SAVE MODEL
# ======================

model.save(

    os.path.join(MODEL_DIR, "emotion_model.keras")
)

# ======================
# EVALUATE
# ======================

train_loss, train_acc = model.evaluate(
    train_generator
)

test_loss, test_acc = model.evaluate(
    test_generator
)

print(f"\nTrain Accuracy: {train_acc*100:.2f}%")

print(f"Test Accuracy: {test_acc*100:.2f}%")

# ======================
# PLOT
# ======================

plt.figure(figsize=(12,5))

# ACCURACY
plt.subplot(1,2,1)

plt.plot(history.history["accuracy"])
plt.plot(history.history["val_accuracy"])

plt.title("Accuracy")

plt.xlabel("Epoch")
plt.ylabel("Accuracy")

plt.legend(["Train","Validation"])

# LOSS
plt.subplot(1,2,2)

plt.plot(history.history["loss"])
plt.plot(history.history["val_loss"])

plt.title("Loss")

plt.xlabel("Epoch")
plt.ylabel("Loss")

plt.legend(["Train","Validation"])

plt.tight_layout()

plt.show()