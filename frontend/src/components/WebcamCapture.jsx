import React, { useRef, useState, useEffect } from 'react';
import { predictEmotion } from '../api/api';

const WebcamCapture = ({ onPredictionSuccess }) => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);

    const [stream, setStream] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [cameraReady, setCameraReady] = useState(false);

    const startWebcam = async () => {
        setError(null);
        setCameraReady(false);

        try {
            if (!window.isSecureContext) {
                throw new Error('Trang cần chạy bằng HTTPS hoặc localhost để mở webcam.');
            }

            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error('Trình duyệt không hỗ trợ camera.');
            }

            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                    facingMode: 'user'
                },
                audio: false
            });

            setStream(mediaStream);
        } catch (err) {
            console.error('Webcam error:', err);

            if (err.name === 'NotAllowedError') {
                setError('Trình duyệt đang chặn camera. Hãy cấp quyền Camera = Allow.');
            } else if (err.name === 'NotFoundError') {
                setError('Không tìm thấy webcam trên thiết bị.');
            } else if (err.name === 'NotReadableError') {
                setError('Webcam đang bị ứng dụng khác sử dụng. Hãy tắt Camera, Zoom, Teams, Meet, OBS rồi thử lại.');
            } else {
                setError(err.message || 'Không thể mở webcam.');
            }
        }
    };

    useEffect(() => {
        if (!stream || !videoRef.current) return;

        const video = videoRef.current;
        video.srcObject = stream;

        const handleLoadedMetadata = async () => {
            try {
                await video.play();
                setCameraReady(true);
                setError(null);
            } catch (err) {
                console.error('Video play error:', err);
                setCameraReady(false);
                setError('Đã lấy được camera nhưng không phát được video. Hãy reload trang và thử lại.');
            }
        };

        video.addEventListener('loadedmetadata', handleLoadedMetadata);

        if (video.readyState >= 1) {
            handleLoadedMetadata();
        }

        return () => {
            video.removeEventListener('loadedmetadata', handleLoadedMetadata);
            video.srcObject = null;
        };
    }, [stream]);

    const stopWebcam = () => {
        if (stream) {
            stream.getTracks().forEach((track) => track.stop());
        }

        setStream(null);
        setCameraReady(false);

        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
    };

    const captureImage = async () => {
        if (!videoRef.current || !canvasRef.current) {
            setError('Video chưa sẵn sàng để chụp ảnh.');
            return;
        }

        const video = videoRef.current;
        const canvas = canvasRef.current;

        if (!cameraReady || video.videoWidth === 0 || video.videoHeight === 0) {
            setError('Webcam chưa có khung hình. Hãy chờ vài giây rồi chụp lại.');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;

            const ctx = canvas.getContext('2d');
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

            const capturedImage = canvas.toDataURL('image/jpeg', 0.95);
            sessionStorage.setItem('last_input_image', capturedImage);

            const blob = await new Promise((resolve) => {
                canvas.toBlob(
                    (resultBlob) => resolve(resultBlob),
                    'image/jpeg',
                    0.95
                );
            });

            if (!blob) {
                setError('Không thể tạo ảnh từ webcam.');
                setLoading(false);
                return;
            }

            const file = new File(
                [blob],
                `webcam-${Date.now()}.jpg`,
                {
                    type: 'image/jpeg'
                }
            );

            const result = await predictEmotion(file, null, 'webcam');

            const fixedResult = {
                ...result,
                captured_image: capturedImage,
                preview_image: capturedImage,
                input_image: capturedImage,
                image: capturedImage
            };

            if (onPredictionSuccess) {
                onPredictionSuccess(fixedResult);
            }
        } catch (err) {
            console.error('Capture/API error:', err);

            setError(
                err.response?.data?.detail ||
                'Chụp được ảnh nhưng gửi lên server thất bại. Kiểm tra backend/API.'
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        return () => {
            if (stream) {
                stream.getTracks().forEach((track) => track.stop());
            }
        };
    }, [stream]);

    return (
        <div className="webcam-container">
            {!stream && (
                <button
                    type="button"
                    onClick={startWebcam}
                    className="btn-webcam"
                >
                    🎥 Kích Hoạt Webcam Máy Tính
                </button>
            )}

            {stream && (
                <div className="webcam-preview">
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        controls={false}
                        style={{
                            width: '100%',
                            maxWidth: '640px',
                            minHeight: '360px',
                            borderRadius: '16px',
                            backgroundColor: '#000',
                            objectFit: 'cover'
                        }}
                    />

                    <canvas
                        ref={canvasRef}
                        style={{ display: 'none' }}
                    />

                    <div
                        style={{
                            marginTop: '16px',
                            display: 'flex',
                            gap: '12px',
                            justifyContent: 'center',
                            flexWrap: 'wrap'
                        }}
                    >
                        <button
                            type="button"
                            onClick={captureImage}
                            disabled={loading || !cameraReady}
                            className="btn-capture"
                        >
                            {loading
                                ? 'Đang phân tích...'
                                : cameraReady
                                ? '📸 Chụp & Phân Tích'
                                : 'Đang mở camera...'}
                        </button>

                        <button
                            type="button"
                            onClick={stopWebcam}
                            className="btn-stop"
                        >
                            ⛔ Tắt Webcam
                        </button>
                    </div>
                </div>
            )}

            {error && (
                <p className="error-message">
                    ❌ {error}
                </p>
            )}
        </div>
    );
};

export default WebcamCapture;backend/config.py