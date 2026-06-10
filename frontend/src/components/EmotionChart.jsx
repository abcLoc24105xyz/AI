import React from "react";

const emotionColors = {
    happy: "bg-emerald-500",
    sad: "bg-blue-500",
    angry: "bg-red-500",
    fear: "bg-orange-500",
    surprised: "bg-yellow-500",
    neutral: "bg-slate-500"
};

const EmotionChart = ({ scores }) => {
    const getColor = (emotion) => {
        const normalizedEmotion = emotion.toLowerCase();

        return (
            emotionColors[normalizedEmotion] ||
            "bg-purple-500"
        );
    };

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
            <h3 className="text-xl font-bold text-white mb-6">
                Phân bố cảm xúc
            </h3>

            <div className="space-y-5">
                {Object.entries(scores).map(([key, value]) => {
                    const emotionLabel = key.replace(
                        "_score",
                        ""
                    );

                    const percentage = (
                        value * 100
                    ).toFixed(2);

                    return (
                        <div key={key}>
                            <div className="flex justify-between mb-2">
                                <span className="text-slate-300 font-semibold uppercase">
                                    {emotionLabel}
                                </span>

                                <span className="text-slate-400">
                                    {percentage}%
                                </span>
                            </div>

                            <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all duration-1000 ${getColor(
                                        emotionLabel
                                    )}`}
                                    style={{
                                        width: `${percentage}%`
                                    }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default EmotionChart;