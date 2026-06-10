import React from "react";

const EmotionCard = ({ emotion, confidence }) => {

    const getColor = () => {
        const e = emotion?.toLowerCase();

        if (e === "happy")
            return "text-emerald-400";

        if (e === "sad")
            return "text-blue-400";

        if (e === "angry")
            return "text-red-400";

        if (e === "fear")
            return "text-orange-400";

        if (e === "surprised")
            return "text-yellow-400";

        return "text-purple-400";
    };

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">

            <div className="text-xs uppercase tracking-widest text-slate-500 font-bold mb-3">
                Cảm xúc chủ đạo
            </div>

            <h2
                className={`text-4xl font-black mb-4 capitalize ${getColor()}`}
            >
                {emotion}
            </h2>

            <div className="text-slate-400">
                Độ tin cậy mô hình
            </div>

            <div className="mt-2 text-2xl font-black text-white">
                {confidence}%
            </div>

            <div className="w-full h-3 bg-slate-800 rounded-full mt-4 overflow-hidden">
                <div
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-1000"
                    style={{
                        width: `${confidence}%`
                    }}
                />
            </div>

        </div>
    );
};

export default EmotionCard;