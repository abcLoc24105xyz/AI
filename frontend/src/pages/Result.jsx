import React from 'react';

const ResultDisplay = ({
    result,
    prediction,
    data,
    onAnalyzeNew,
    onReset
}) => {
    const finalResult = result || prediction || data || {};

    const storedImage = sessionStorage.getItem('last_input_image');

    const imageSrc =
        storedImage ||
        finalResult?.captured_image ||
        finalResult?.preview_image ||
        finalResult?.input_image ||
        finalResult?.image_url ||
        finalResult?.image_path ||
        finalResult?.image ||
        finalResult?.uploaded_image ||
        finalResult?.file_url ||
        null;

    const getMainEmotion = () => {
        return (
            finalResult?.emotion ||
            finalResult?.dominant_emotion ||
            finalResult?.main_emotion ||
            finalResult?.label ||
            finalResult?.prediction ||
            finalResult?.predicted_emotion ||
            'Unknown'
        );
    };

    const getConfidence = () => {
        const value =
            finalResult?.confidence ??
            finalResult?.score ??
            finalResult?.probability ??
            finalResult?.max_probability;

        if (value === undefined || value === null) return null;

        if (typeof value === 'number') {
            if (value <= 1) return `${(value * 100).toFixed(2)}%`;
            return `${value.toFixed(2)}%`;
        }

        return value;
    };

    const getEmotionDistribution = () => {
        const emotions =
            finalResult?.emotions ||
            finalResult?.probabilities ||
            finalResult?.scores ||
            finalResult?.distribution ||
            finalResult?.emotion_scores ||
            finalResult?.all_predictions ||
            finalResult?.percentages ||
            {};

        if (Array.isArray(emotions)) {
            const converted = {};

            emotions.forEach((item) => {
                if (Array.isArray(item) && item.length >= 2) {
                    converted[item[0]] = item[1];
                } else if (item?.label && item?.score !== undefined) {
                    converted[item.label] = item.score;
                } else if (item?.emotion && item?.probability !== undefined) {
                    converted[item.emotion] = item.probability;
                } else if (item?.name && item?.value !== undefined) {
                    converted[item.name] = item.value;
                }
            });

            return converted;
        }

        if (typeof emotions === 'object' && emotions !== null) {
            return emotions;
        }

        return {};
    };

    const formatEmotionName = (emotion) => {
        if (!emotion) return 'Unknown';

        const map = {
            angry: 'Angry',
            disgusted: 'Disgusted',
            disgust: 'Disgusted',
            fearful: 'Fearful',
            fear: 'Fearful',
            happy: 'Happy',
            neutral: 'Neutral',
            sad: 'Sad',
            surprised: 'Surprised',
            surprise: 'Surprised'
        };

        const key = String(emotion).toLowerCase();
        return map[key] || String(emotion);
    };

    const getEmotionIcon = (emotion) => {
        const key = String(emotion || '').toLowerCase();

        const icons = {
            angry: '😠',
            disgusted: '🤢',
            disgust: '🤢',
            fearful: '😨',
            fear: '😨',
            happy: '😊',
            neutral: '😐',
            sad: '😢',
            surprised: '😲',
            surprise: '😲'
        };

        return icons[key] || '🤖';
    };

    const formatPercent = (value) => {
        let rawValue = value;

        if (typeof value === 'object' && value !== null) {
            rawValue =
                value?.score ??
                value?.probability ??
                value?.value ??
                value?.percent ??
                0;
        }

        const numberValue =
            typeof rawValue === 'number'
                ? rawValue
                : parseFloat(rawValue) || 0;

        if (numberValue <= 1) return numberValue * 100;
        return numberValue;
    };

    const mainEmotion = getMainEmotion();
    const confidence = getConfidence();
    const emotions = getEmotionDistribution();

    const emotionEntries = Object.entries(emotions).sort((a, b) => {
        return formatPercent(b[1]) - formatPercent(a[1]);
    });

    const handleAnalyzeNew = () => {
        sessionStorage.removeItem('last_input_image');

        if (onAnalyzeNew) {
            onAnalyzeNew();
            return;
        }

        if (onReset) {
            onReset();
            return;
        }

        window.location.reload();
    };

    return (
        <div style={styles.page}>
            <style>
                {`
                    @media (max-width: 900px) {
                        .result-header-custom {
                            flex-direction: column;
                            align-items: flex-start !important;
                        }

                        .result-grid-custom {
                            grid-template-columns: 1fr !important;
                        }

                        .result-title-custom {
                            font-size: 30px !important;
                        }

                        .result-page-custom {
                            padding: 22px 16px !important;
                        }
                    }

                    .result-card-custom {
                        transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
                    }

                    .result-card-custom:hover {
                        transform: translateY(-4px);
                        border-color: rgba(96, 165, 250, 0.65) !important;
                        box-shadow: 0 24px 70px rgba(15, 23, 42, 0.55);
                    }

                    .btn-analyze-custom {
                        transition: transform 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease;
                    }

                    .btn-analyze-custom:hover {
                        transform: translateY(-2px);
                        box-shadow: 0 14px 30px rgba(59, 130, 246, 0.35);
                        opacity: 0.95;
                    }
                `}
            </style>

            <div className="result-page-custom" style={styles.container}>
                <div className="result-header-custom" style={styles.header}>
                    <div>
                        <div style={styles.badge}>AI Emotion Recognition</div>

                        <h1 className="result-title-custom" style={styles.title}>
                            Kết quả phân tích cảm xúc
                        </h1>

                        <p style={styles.subtitle}>
                            Hệ thống đã phân tích khuôn mặt và trả về cảm xúc có xác suất cao nhất.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={handleAnalyzeNew}
                        className="btn-analyze-custom"
                        style={styles.newButton}
                    >
                        <span style={{ fontSize: 18 }}>↻</span>
                        Phân tích mới
                    </button>
                </div>

                <div className="result-grid-custom" style={styles.grid}>
                    <div className="result-card-custom" style={styles.card}>
                        <div style={styles.cardHeader}>
                            <div>
                                <h2 style={styles.cardTitle}>Ảnh đầu vào</h2>
                                <p style={styles.cardDesc}>
                                    Ảnh được sử dụng để nhận diện cảm xúc khuôn mặt.
                                </p>
                            </div>
                        </div>

                        <div style={styles.imageWrapper}>
                            {imageSrc ? (
                                <img
                                    src={imageSrc}
                                    alt="Ảnh đầu vào"
                                    onError={(e) => {
                                        console.error('Không load được ảnh:', imageSrc);
                                        e.currentTarget.style.display = 'none';
                                    }}
                                    style={styles.image}
                                />
                            ) : (
                                <div style={styles.emptyImage}>
                                    Không có ảnh đầu vào để hiển thị.
                                </div>
                            )}
                        </div>

                        <div style={styles.mainEmotionBox}>
                            <div style={styles.emotionIcon}>
                                {getEmotionIcon(mainEmotion)}
                            </div>

                            <div>
                                <p style={styles.label}>Cảm xúc chủ đạo</p>

                                <h2 style={styles.mainEmotionText}>
                                    {formatEmotionName(mainEmotion)}
                                </h2>

                                {confidence && (
                                    <p style={styles.confidenceText}>
                                        Độ tin cậy: <strong>{confidence}</strong>
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="result-card-custom" style={styles.card}>
                        <div style={styles.cardHeader}>
                            <div>
                                <h2 style={styles.cardTitle}>Phân bố cảm xúc</h2>
                                <p style={styles.cardDesc}>
                                    Tỷ lệ dự đoán của từng nhãn cảm xúc.
                                </p>
                            </div>
                        </div>

                        <div style={styles.distributionBox}>
                            {emotionEntries.length > 0 ? (
                                emotionEntries.map(([emotion, value]) => {
                                    const percent = formatPercent(value);
                                    const safePercent = Math.min(Math.max(percent, 0), 100);

                                    return (
                                        <div key={emotion} style={styles.emotionRow}>
                                            <div style={styles.emotionRowTop}>
                                                <div style={styles.emotionNameBox}>
                                                    <span style={styles.smallIcon}>
                                                        {getEmotionIcon(emotion)}
                                                    </span>
                                                    <strong style={styles.emotionName}>
                                                        {formatEmotionName(emotion)}
                                                    </strong>
                                                </div>

                                                <span style={styles.percentText}>
                                                    {percent.toFixed(2)}%
                                                </span>
                                            </div>

                                            <div style={styles.progressOuter}>
                                                <div
                                                    style={{
                                                        ...styles.progressInner,
                                                        width: `${safePercent}%`
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div style={styles.emptyData}>
                                    Chưa có dữ liệu phân bố cảm xúc.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const styles = {
    page: {
        minHeight: '100vh',
        background:
            'radial-gradient(circle at top left, rgba(37, 99, 235, 0.25), transparent 35%), linear-gradient(135deg, #020617 0%, #0f172a 45%, #111827 100%)',
        color: '#ffffff'
    },

    container: {
        padding: '36px 40px',
        maxWidth: '1200px',
        margin: '0 auto'
    },

    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '24px',
        marginBottom: '30px'
    },

    badge: {
        display: 'inline-flex',
        alignItems: 'center',
        padding: '8px 14px',
        borderRadius: '999px',
        background: 'rgba(59, 130, 246, 0.14)',
        border: '1px solid rgba(96, 165, 250, 0.35)',
        color: '#bfdbfe',
        fontSize: '13px',
        fontWeight: 700,
        marginBottom: '14px'
    },

    title: {
        margin: 0,
        fontSize: '40px',
        lineHeight: 1.15,
        fontWeight: 900,
        letterSpacing: '-0.8px'
    },

    subtitle: {
        margin: '10px 0 0',
        color: '#94a3b8',
        fontSize: '16px',
        maxWidth: '620px',
        lineHeight: 1.6
    },

    newButton: {
        border: 'none',
        borderRadius: '16px',
        padding: '14px 22px',
        color: '#ffffff',
        fontWeight: 800,
        cursor: 'pointer',
        background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '9px',
        whiteSpace: 'nowrap',
        boxShadow: '0 16px 35px rgba(37, 99, 235, 0.28)'
    },

    grid: {
        display: 'grid',
        gridTemplateColumns: '1.05fr 0.95fr',
        gap: '24px'
    },

    card: {
        background: 'rgba(15, 23, 42, 0.82)',
        border: '1px solid rgba(148, 163, 184, 0.18)',
        borderRadius: '26px',
        overflow: 'hidden',
        backdropFilter: 'blur(14px)',
        boxShadow: '0 20px 60px rgba(2, 6, 23, 0.35)'
    },

    cardHeader: {
        padding: '24px 26px',
        borderBottom: '1px solid rgba(148, 163, 184, 0.16)'
    },

    cardTitle: {
        margin: '0 0 8px',
        fontSize: '23px',
        fontWeight: 850
    },

    cardDesc: {
        margin: 0,
        color: '#94a3b8',
        fontSize: '14.5px',
        lineHeight: 1.5
    },

    imageWrapper: {
        padding: '24px 26px 18px'
    },

    image: {
        width: '100%',
        maxHeight: '380px',
        objectFit: 'contain',
        borderRadius: '20px',
        display: 'block',
        backgroundColor: '#020617',
        border: '1px solid rgba(148, 163, 184, 0.24)',
        boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.02)'
    },

    emptyImage: {
        minHeight: '220px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fecaca',
        background: 'rgba(15, 23, 42, 0.65)',
        border: '1px dashed rgba(148, 163, 184, 0.4)',
        borderRadius: '20px',
        textAlign: 'center',
        padding: '20px'
    },

    mainEmotionBox: {
        margin: '0 26px 26px',
        padding: '22px',
        background:
            'linear-gradient(135deg, rgba(37, 99, 235, 0.16), rgba(168, 85, 247, 0.16))',
        border: '1px solid rgba(129, 140, 248, 0.32)',
        borderRadius: '22px',
        display: 'flex',
        alignItems: 'center',
        gap: '18px'
    },

    emotionIcon: {
        width: '70px',
        height: '70px',
        borderRadius: '22px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '34px',
        background: 'rgba(255, 255, 255, 0.08)',
        border: '1px solid rgba(255, 255, 255, 0.12)'
    },

    label: {
        margin: '0 0 6px',
        color: '#c4b5fd',
        textTransform: 'uppercase',
        fontSize: '12px',
        letterSpacing: '1.2px',
        fontWeight: 850
    },

    mainEmotionText: {
        margin: 0,
        fontSize: '34px',
        color: '#ffffff',
        fontWeight: 900
    },

    confidenceText: {
        margin: '8px 0 0',
        color: '#cbd5e1',
        fontSize: '15px'
    },

    distributionBox: {
        padding: '24px 26px 28px'
    },

    emotionRow: {
        marginBottom: '22px'
    },

    emotionRowTop: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '16px',
        marginBottom: '10px'
    },

    emotionNameBox: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px'
    },

    smallIcon: {
        width: '34px',
        height: '34px',
        borderRadius: '12px',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(255, 255, 255, 0.07)',
        border: '1px solid rgba(255, 255, 255, 0.1)'
    },

    emotionName: {
        color: '#e5e7eb',
        fontSize: '15px'
    },

    percentText: {
        color: '#bfdbfe',
        fontWeight: 800,
        fontSize: '14px'
    },

    progressOuter: {
        width: '100%',
        height: '13px',
        borderRadius: '999px',
        background: 'rgba(30, 41, 59, 0.95)',
        overflow: 'hidden',
        border: '1px solid rgba(148, 163, 184, 0.12)'
    },

    progressInner: {
        height: '100%',
        borderRadius: '999px',
        background: 'linear-gradient(90deg, #38bdf8, #6366f1, #a855f7)',
        boxShadow: '0 0 18px rgba(99, 102, 241, 0.45)'
    },

    emptyData: {
        minHeight: '180px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fde68a',
        background: 'rgba(15, 23, 42, 0.65)',
        border: '1px dashed rgba(148, 163, 184, 0.35)',
        borderRadius: '18px',
        textAlign: 'center',
        padding: '20px'
    }
};

export default ResultDisplay;