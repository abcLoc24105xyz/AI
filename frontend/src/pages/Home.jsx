import React, { useState, useEffect, useRef } from 'react';
import UploadImage from '../components/UploadImage';
import WebcamCapture from '../components/WebcamCapture';
import Result from './Result';

import { checkSessionStatus } from '../api/api';

const MAX_PHONE_SEND = 5;

const Home = () => {
    const [inputType, setInputType] = useState('upload');

    const [sessionId, setSessionId] = useState(() => {
        return localStorage.getItem('phone_qr_session_id') || null;
    });

    const [predictionResult, setPredictionResult] = useState(null);

    const [phoneReceiveCount, setPhoneReceiveCount] = useState(() => {
        return Number(localStorage.getItem('phone_qr_receive_count') || 0);
    });

    const [phoneStatus, setPhoneStatus] = useState('Đang chờ xử lý...');

    const intervalRef = useRef(null);
    const lastResultSignatureRef = useRef(null);

    const createSessionId = () => {
        return 'ss_' + Date.now() + '_' + Math.random().toString(36).substring(2, 11);
    };

    useEffect(() => {
        if (inputType === 'phone' && !sessionId) {
            const newSessionId = createSessionId();

            setSessionId(newSessionId);
            localStorage.setItem('phone_qr_session_id', newSessionId);
            localStorage.setItem('phone_qr_receive_count', '0');

            setPhoneReceiveCount(0);
            setPhoneStatus('Đang chờ xử lý...');
            lastResultSignatureRef.current = null;
        }
    }, [inputType, sessionId]);

    useEffect(() => {
        if (sessionId) {
            localStorage.setItem('phone_qr_session_id', sessionId);
        }
    }, [sessionId]);

    useEffect(() => {
        localStorage.setItem('phone_qr_receive_count', String(phoneReceiveCount));
    }, [phoneReceiveCount]);

    useEffect(() => {
        if (!sessionId) return;

        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }

        intervalRef.current = setInterval(async () => {
            try {
                if (phoneReceiveCount >= MAX_PHONE_SEND) {
                    setPhoneStatus(`QR này đã nhận đủ ${MAX_PHONE_SEND} ảnh. Hãy tạo QR mới.`);
                    return;
                }

                const res = await checkSessionStatus(sessionId);

                console.log('Phone polling:', res);

                if (!res) {
                    setPhoneStatus(`Đang chờ xử lý... (${phoneReceiveCount}/${MAX_PHONE_SEND})`);
                    return;
                }

                const isCompleted =
                    res.status === 'completed' ||
                    res.session_status === 'completed' ||
                    res.status === 'done' ||
                    res.status === 'success';

                const finalData =
                    res.result ||
                    res.data ||
                    res.prediction ||
                    (isCompleted ? res : null);

                if (isCompleted && finalData) {
                    const signature = JSON.stringify(finalData);

                    if (signature !== lastResultSignatureRef.current) {
                        lastResultSignatureRef.current = signature;

                        setPhoneReceiveCount((prev) => {
                            const newCount = Math.min(prev + 1, MAX_PHONE_SEND);
                            setPhoneStatus(`Đã nhận ảnh ${newCount}/${MAX_PHONE_SEND} từ điện thoại.`);
                            return newCount;
                        });

                        setPredictionResult(finalData);
                    } else {
                        setPhoneStatus(`Đang chờ ảnh mới... (${phoneReceiveCount}/${MAX_PHONE_SEND})`);
                    }
                } else {
                    setPhoneStatus(`Đang chờ xử lý... (${phoneReceiveCount}/${MAX_PHONE_SEND})`);
                }
            } catch (err) {
                console.error('Lỗi Polling:', err);
                setPhoneStatus('Lỗi polling. Kiểm tra backend/API.');
            }
        }, 2000);

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, [sessionId, phoneReceiveCount]);

    const handleReset = () => {
        setPredictionResult(null);

        if (inputType === 'phone') {
            setInputType('phone');
        } else {
            setInputType('upload');
        }
    };

    const handleCreateNewQr = () => {
        const oldSessionId = sessionId;
        const newSessionId = createSessionId();

        setSessionId(newSessionId);
        setPhoneReceiveCount(0);
        setPhoneStatus('Đang chờ xử lý...');
        setPredictionResult(null);
        setInputType('phone');

        localStorage.setItem('phone_qr_session_id', newSessionId);
        localStorage.setItem('phone_qr_receive_count', '0');

        if (oldSessionId) {
            localStorage.removeItem(`phone_send_count_${oldSessionId}`);
        }

        localStorage.removeItem(`phone_send_count_${newSessionId}`);
        lastResultSignatureRef.current = null;
    };

    const mobileLink = sessionId
        ? `${window.location.origin}/?session=${sessionId}`
        : '';

    const qrCodeUrl = mobileLink
        ? `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(mobileLink)}`
        : null;

    const phoneLocked = phoneReceiveCount >= MAX_PHONE_SEND;

    const inputOptions = [
        {
            key: 'upload',
            icon: '📁',
            title: 'Upload ảnh',
            desc: 'Chọn ảnh từ máy tính'
        },
        {
            key: 'webcam',
            icon: '🎥',
            title: 'Webcam',
            desc: 'Chụp ảnh trực tiếp'
        },
        {
            key: 'phone',
            icon: '📱',
            title: 'Phone',
            desc: 'Gửi ảnh từ điện thoại'
        }
    ];

    if (predictionResult) {
        return (
            <div className="relative">
                <Result
                    data={predictionResult}
                    result={predictionResult}
                    onReset={handleReset}
                    onAnalyzeNew={handleReset}
                />

                {inputType === 'phone' && (
                    <div className="fixed right-5 bottom-5 z-[9999] w-[calc(100%-40px)] max-w-sm rounded-3xl border border-slate-700/80 bg-slate-950/95 p-5 text-white shadow-2xl shadow-black/50 backdrop-blur-xl">
                        <div className="flex items-start gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/15 text-2xl border border-blue-400/20">
                                📱
                            </div>

                            <div className="flex-1">
                                <div className="font-black text-lg">
                                    Phone QR
                                </div>

                                <div className="mt-1 text-sm text-slate-400 leading-relaxed">
                                    {phoneStatus}
                                </div>

                                <div className="mt-3">
                                    <div className="mb-1 flex items-center justify-between text-xs text-slate-400">
                                        <span>Đã nhận</span>
                                        <span className="font-bold text-amber-300">
                                            {phoneReceiveCount}/{MAX_PHONE_SEND} ảnh
                                        </span>
                                    </div>

                                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                                        <div
                                            className="h-full rounded-full bg-gradient-to-r from-sky-400 to-purple-500"
                                            style={{
                                                width: `${Math.min(
                                                    (phoneReceiveCount / MAX_PHONE_SEND) * 100,
                                                    100
                                                )}%`
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={handleReset}
                                className="rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-500"
                            >
                                Quay lại
                            </button>

                            <button
                                type="button"
                                onClick={handleCreateNewQr}
                                className="rounded-xl bg-purple-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-purple-500"
                            >
                                QR mới
                            </button>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="relative min-h-screen w-full overflow-hidden bg-[#020617] text-slate-100">
            <div className="pointer-events-none absolute -top-40 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-blue-600/20 blur-3xl" />
            <div className="pointer-events-none absolute left-[-120px] top-40 h-80 w-80 rounded-full bg-purple-600/20 blur-3xl" />
            <div className="pointer-events-none absolute bottom-[-160px] right-[-120px] h-96 w-96 rounded-full bg-cyan-600/10 blur-3xl" />

            <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 pb-12 pt-10 md:px-8">
                {/* HEADER */}
                <div className="mx-auto mb-8 max-w-4xl text-center">
                    <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-500/10 px-4 py-2 text-sm font-bold text-blue-200">
                        <span className="relative flex h-2.5 w-2.5">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-400" />
                        </span>
                        Emotion AI System
                    </div>

                    <h1 className="bg-gradient-to-r from-white via-blue-100 to-purple-300 bg-clip-text text-4xl font-black leading-tight tracking-tight text-transparent md:text-6xl">
                        Nhận diện cảm xúc khuôn mặt
                    </h1>

                    <p className="mx-auto mt-5 max-w-2xl text-base font-medium leading-relaxed text-slate-400 md:text-lg">
                        Chọn một phương thức đầu vào để hệ thống phân tích khuôn mặt
                        và trả về cảm xúc chủ đạo bằng mô hình AI.
                    </p>
                </div>

                {/* INPUT TABS */}
                <div className="mx-auto mb-8 grid w-full max-w-4xl grid-cols-1 gap-4 sm:grid-cols-3">
                    {inputOptions.map((option) => {
                        const active = inputType === option.key;

                        return (
                            <button
                                key={option.key}
                                onClick={() => setInputType(option.key)}
                                className={`group rounded-3xl border p-5 text-left transition-all duration-300 hover:-translate-y-1 ${
                                    active
                                        ? 'border-blue-400/60 bg-gradient-to-br from-blue-600/30 to-purple-600/25 shadow-xl shadow-blue-950/40'
                                        : 'border-slate-800 bg-slate-900/55 hover:border-blue-400/30 hover:bg-slate-900'
                                }`}
                            >
                                <div
                                    className={`mb-4 flex h-12 w-12 items-center justify-center rounded-2xl text-2xl border ${
                                        active
                                            ? 'border-white/20 bg-white/15'
                                            : 'border-slate-700 bg-slate-950/70'
                                    }`}
                                >
                                    {option.icon}
                                </div>

                                <h3 className="text-lg font-black text-white">
                                    {option.title}
                                </h3>

                                <p className="mt-1 text-sm text-slate-400">
                                    {option.desc}
                                </p>
                            </button>
                        );
                    })}
                </div>

                {/* MAIN CARD */}
                <div className="mx-auto w-full max-w-4xl">
                    <div className="overflow-hidden rounded-[2rem] border border-slate-800 bg-slate-900/65 shadow-2xl shadow-black/30 backdrop-blur-xl">
                        <div className="border-b border-slate-800 px-6 py-5 md:px-8">
                            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                                <div>
                                    <h2 className="text-xl font-black text-white">
                                        {inputType === 'upload' && 'Tải ảnh lên để phân tích'}
                                        {inputType === 'webcam' && 'Chụp ảnh bằng webcam'}
                                        {inputType === 'phone' && 'Gửi ảnh từ điện thoại'}
                                    </h2>

                                    <p className="mt-1 text-sm text-slate-400">
                                        {inputType === 'upload' &&
                                            'Hỗ trợ chọn ảnh trực tiếp từ thiết bị của bạn.'}
                                        {inputType === 'webcam' &&
                                            'Cho phép trình duyệt truy cập camera để chụp ảnh.'}
                                        {inputType === 'phone' &&
                                            'Quét mã QR bằng điện thoại để gửi ảnh về hệ thống.'}
                                    </p>
                                </div>

                                <div className="w-fit rounded-full border border-slate-700 bg-slate-950/70 px-3 py-1.5 text-xs font-bold text-slate-400">
                                    {inputType === 'phone'
                                        ? `${phoneReceiveCount}/${MAX_PHONE_SEND} ảnh`
                                        : 'Ready'}
                                </div>
                            </div>
                        </div>

                        <div className="p-5 md:p-8">
                            {inputType === 'upload' && (
                                <UploadImage
                                    onPredictionSuccess={(data) => setPredictionResult(data)}
                                />
                            )}

                            {inputType === 'webcam' && (
                                <WebcamCapture
                                    onPredictionSuccess={(data) => setPredictionResult(data)}
                                />
                            )}

                            {inputType === 'phone' && (
                                <div className="text-center">
                                    <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl border border-blue-400/20 bg-blue-500/10 text-3xl">
                                        📱
                                    </div>

                                    <h3 className="text-2xl font-black text-white">
                                        Quét QR bằng điện thoại
                                    </h3>

                                    <p className="mx-auto mt-3 max-w-md text-slate-400">
                                        Mở camera điện thoại, quét mã QR bên dưới, sau đó chọn
                                        hoặc chụp ảnh để gửi về máy tính.
                                    </p>

                                    <div className="mt-7">
                                        {qrCodeUrl ? (
                                            <div className="inline-block rounded-[2rem] border border-slate-700 bg-white p-5 shadow-2xl shadow-black/30">
                                                <img
                                                    src={qrCodeUrl}
                                                    alt="QR Code"
                                                    className="h-56 w-56"
                                                />
                                            </div>
                                        ) : (
                                            <div className="mx-auto flex h-56 w-56 items-center justify-center rounded-[2rem] border border-dashed border-slate-700 bg-slate-950/60 text-slate-500">
                                                Đang tạo mã QR...
                                            </div>
                                        )}
                                    </div>

                                    <div
                                        className={`mx-auto mt-6 max-w-md rounded-2xl border px-5 py-4 text-sm font-bold ${
                                            phoneLocked
                                                ? 'border-red-400/30 bg-red-500/10 text-red-300'
                                                : 'border-amber-400/25 bg-amber-500/10 text-amber-300'
                                        }`}
                                    >
                                        <div className={phoneLocked ? '' : 'animate-pulse'}>
                                            {phoneStatus}
                                        </div>

                                        <div className="mt-3">
                                            <div className="mb-1 flex justify-between text-xs text-slate-400">
                                                <span>Tiến độ nhận ảnh</span>
                                                <span>
                                                    {phoneReceiveCount}/{MAX_PHONE_SEND}
                                                </span>
                                            </div>

                                            <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                                                <div
                                                    className="h-full rounded-full bg-gradient-to-r from-sky-400 via-blue-500 to-purple-500"
                                                    style={{
                                                        width: `${Math.min(
                                                            (phoneReceiveCount / MAX_PHONE_SEND) * 100,
                                                            100
                                                        )}%`
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-6 flex flex-wrap justify-center gap-3">
                                        <button
                                            type="button"
                                            onClick={handleCreateNewQr}
                                            className="rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-3 font-black text-white shadow-lg shadow-blue-950/40 transition hover:from-blue-500 hover:to-purple-500"
                                        >
                                            🔄 Tạo QR mới
                                        </button>
                                    </div>

                                    {mobileLink && (
                                        <div className="mx-auto mt-6 max-w-xl rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-left">
                                            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                                                Link cho điện thoại
                                            </p>

                                            <p className="break-all text-xs leading-relaxed text-slate-400">
                                                {mobileLink}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* FOOTER NOTE */}
                <div className="mx-auto mt-8 max-w-4xl text-center text-sm text-slate-500">
                    Hệ thống hỗ trợ phân tích từ ảnh tải lên, webcam và điện thoại trong cùng mạng.
                </div>
            </div>
        </div>
    );
};

export default Home;