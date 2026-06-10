import React, { useState } from 'react';
import { predictEmotion } from '../api/api';

const UploadImage = ({ onPredictionSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const convertImageToJpeg = async (file) => {
        return new Promise((resolve, reject) => {
            if (!file.type.startsWith('image/')) {
                reject(new Error('File không phải là ảnh.'));
                return;
            }

            const img = new Image();
            const objectUrl = URL.createObjectURL(file);

            img.onload = () => {
                try {
                    const maxSize = 1280;

                    let width = img.width;
                    let height = img.height;

                    if (width > height && width > maxSize) {
                        height = Math.round((height * maxSize) / width);
                        width = maxSize;
                    } else if (height > width && height > maxSize) {
                        width = Math.round((width * maxSize) / height);
                        height = maxSize;
                    } else if (width === height && width > maxSize) {
                        width = maxSize;
                        height = maxSize;
                    }

                    const canvas = document.createElement('canvas');
                    canvas.width = width;
                    canvas.height = height;

                    const ctx = canvas.getContext('2d');

                    ctx.fillStyle = '#ffffff';
                    ctx.fillRect(0, 0, width, height);
                    ctx.drawImage(img, 0, 0, width, height);

                    const previewImage = canvas.toDataURL('image/jpeg', 0.92);

                    canvas.toBlob(
                        (blob) => {
                            URL.revokeObjectURL(objectUrl);

                            if (!blob) {
                                reject(new Error('Không thể chuyển ảnh sang JPG.'));
                                return;
                            }

                            const jpegFile = new File(
                                [blob],
                                `upload-${Date.now()}.jpg`,
                                {
                                    type: 'image/jpeg'
                                }
                            );

                            resolve({
                                file: jpegFile,
                                previewImage
                            });
                        },
                        'image/jpeg',
                        0.92
                    );
                } catch (err) {
                    URL.revokeObjectURL(objectUrl);
                    reject(err);
                }
            };

            img.onerror = () => {
                URL.revokeObjectURL(objectUrl);
                reject(new Error('Không đọc được ảnh. Hãy chọn ảnh JPG/PNG khác.'));
            };

            img.src = objectUrl;
        });
    };

    const handleFileChange = async (e) => {
        const file = e.target.files?.[0];

        if (!file) return;

        setLoading(true);
        setError(null);

        try {
            const converted = await convertImageToJpeg(file);

            sessionStorage.setItem('last_input_image', converted.previewImage);

            const data = await predictEmotion(
                converted.file,
                null,
                'upload'
            );

            const fixedResult = {
                ...data,
                captured_image: converted.previewImage,
                preview_image: converted.previewImage,
                input_image: converted.previewImage,
                image: converted.previewImage
            };

            if (onPredictionSuccess) {
                onPredictionSuccess(fixedResult);
            }
        } catch (err) {
            console.error('Upload error:', err);

            setError(
                err.response?.data?.detail ||
                err.message ||
                'Không thể upload hoặc nhận diện khuôn mặt.'
            );
        } finally {
            setLoading(false);
            e.target.value = '';
        }
    };

    return (
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <label
                style={{
                    display: 'block',
                    maxWidth: '450px',
                    margin: '0 auto',
                    padding: '40px 20px',
                    border: '2px dashed #3b82f6',
                    borderRadius: '12px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    background: '#eff6ff',
                    transition: '0.2s',
                    opacity: loading ? 0.7 : 1
                }}
            >
                <span
                    style={{
                        fontSize: '40px',
                        display: 'block',
                        marginBottom: '10px'
                    }}
                >
                    📁
                </span>

                <span
                    style={{
                        color: '#1d4ed8',
                        fontWeight: 'bold',
                        fontSize: '16px'
                    }}
                >
                    Bấm vào đây để chọn tập tin ảnh
                </span>

                <p
                    style={{
                        color: '#64748b',
                        fontSize: '13px',
                        margin: '8px 0 0 0'
                    }}
                >
                    Hỗ trợ JPG, JPEG, PNG, WEBP. Ảnh sẽ tự chuyển về JPG trước khi gửi.
                </p>

                <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                    disabled={loading}
                />
            </label>

            {loading && (
                <p
                    style={{
                        marginTop: '20px',
                        fontWeight: 'bold',
                        color: '#3b82f6'
                    }}
                >
                    ⌛ Đang đẩy ảnh lên Server xử lý mô hình AI...
                </p>
            )}

            {error && (
                <p
                    style={{
                        marginTop: '20px',
                        color: '#ef4444',
                        fontWeight: 'bold'
                    }}
                >
                    ❌ Lỗi: {error}
                </p>
            )}
        </div>
    );
};

export default UploadImage;