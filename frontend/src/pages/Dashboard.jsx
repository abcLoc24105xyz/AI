import React, { useEffect, useState } from "react";
import { getHistory } from "../api/api";

const Dashboard = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    fetchData();

    const interval = setInterval(() => {
      fetchData(false);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const fetchData = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);

      const data = await getHistory();
      setHistory(data || []);
      setLastUpdated(new Date());
    } catch (e) {
      console.error(e);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const normalizeType = (type) => String(type || "").toLowerCase();
  const normalizeEmotion = (emotion) => String(emotion || "").toLowerCase();

  const upload = history.filter(
    (x) => normalizeType(x.detection_type) === "upload"
  ).length;

  const webcam = history.filter(
    (x) => normalizeType(x.detection_type) === "webcam"
  ).length;

  const mobile = history.filter(
    (x) => normalizeType(x.detection_type) === "mobile"
  ).length;

  const emotions = [
    "angry",
    "disgust",
    "fear",
    "happy",
    "neutral",
    "sad",
    "surprised",
  ];

  const emotionCounts = emotions.map((emotion) => ({
    emotion,
    count: history.filter((x) => {
      const value = normalizeEmotion(x.emotion);

      if (emotion === "disgust") {
        return value === "disgust" || value === "disgusted";
      }

      if (emotion === "fear") {
        return value === "fear" || value === "fearful";
      }

      if (emotion === "surprised") {
        return value === "surprised" || value === "surprise";
      }

      return value === emotion;
    }).length,
  }));

  const sourceChart = [
    {
      name: "Upload",
      value: upload,
      icon: "🖼️",
      desc: "Ảnh tải lên",
    },
    {
      name: "Webcam",
      value: webcam,
      icon: "📷",
      desc: "Camera máy tính",
    },
    {
      name: "Mobile",
      value: mobile,
      icon: "📱",
      desc: "Thiết bị di động",
    },
  ];

  const emotionChart = emotionCounts.map((x) => ({
    name: x.emotion,
    value: x.count,
    icon: getEmotionIcon(x.emotion),
    label: formatEmotion(x.emotion),
  }));

  const total = history.length;

  const mostEmotion = [...emotionChart].sort((a, b) => b.value - a.value)[0];

  const lastTimeText = lastUpdated
    ? lastUpdated.toLocaleTimeString("vi-VN")
    : "--:--:--";

  const getPercent = (value) => {
    if (!total) return 0;
    return (value / total) * 100;
  };

  return (
    <div className="min-h-screen text-white">
      <div className="max-w-7xl mx-auto space-y-9">
        {/* HEADER */}
        <div className="relative overflow-hidden rounded-[2rem] border border-slate-800 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6 md:p-8 shadow-2xl shadow-black/30">
          <div className="absolute -top-24 -right-24 w-72 h-72 bg-blue-600/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-purple-600/20 rounded-full blur-3xl" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-end md:justify-between gap-5">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-400/20 text-blue-200 text-sm font-bold mb-4">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-400"></span>
                </span>
                Realtime Analytics
              </div>

              <h1 className="text-3xl md:text-5xl font-black tracking-tight">
                Emotion AI Dashboard
              </h1>

              <p className="text-slate-400 mt-3 max-w-2xl leading-relaxed">
                Bảng điều khiển theo dõi số lượt phân tích, nguồn nhận diện và
                phân bố cảm xúc theo thời gian thực.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="px-5 py-3 rounded-2xl bg-slate-900/80 border border-slate-800">
                <p className="text-slate-500 text-xs font-bold uppercase">
                  Cập nhật lần cuối
                </p>
                <p className="text-white font-black mt-1">{lastTimeText}</p>
              </div>

              <button
                onClick={() => fetchData()}
                className="px-5 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 font-black transition shadow-lg shadow-blue-950/40"
              >
                🔄 Tải lại
              </button>
            </div>
          </div>
        </div>

        {/* LOADING */}
        {loading && (
          <div className="bg-slate-900/70 border border-slate-800 rounded-3xl p-10 text-center">
            <div className="text-4xl mb-4">⏳</div>
            <p className="text-slate-300 font-semibold">
              Đang tải dữ liệu dashboard...
            </p>
          </div>
        )}

        {!loading && (
          <>
            {/* STATS */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <StatCard
                title="Tổng phân tích"
                value={total}
                icon="📊"
                desc="Tất cả lượt nhận diện"
                highlight
              />

              <StatCard
                title="Upload"
                value={upload}
                icon="🖼️"
                desc="Phân tích từ ảnh tải lên"
              />

              <StatCard
                title="Webcam"
                value={webcam}
                icon="📷"
                desc="Phân tích từ camera"
              />

              <StatCard
                title="Mobile"
                value={mobile}
                icon="📱"
                desc="Phân tích từ điện thoại"
              />
            </div>

            {/* SUMMARY */}
            <div className="grid md:grid-cols-3 gap-5">
              <div className="md:col-span-2 bg-slate-900/70 border border-slate-800 rounded-3xl p-6 shadow-xl shadow-black/20">
                <div className="flex items-start justify-between gap-4 mb-6">
                  <div>
                    <h2 className="text-2xl font-black">
                      Tổng quan hệ thống
                    </h2>
                    <p className="text-slate-400 mt-1">
                      Dữ liệu được tự động làm mới sau mỗi 3 giây.
                    </p>
                  </div>

                  <div className="px-3 py-1.5 rounded-full bg-green-500/10 text-green-300 border border-green-400/20 text-sm font-bold">
                    Live
                  </div>
                </div>

                <div className="grid sm:grid-cols-3 gap-4">
                  {sourceChart.map((item) => (
                    <div
                      key={item.name}
                      className="rounded-2xl bg-slate-950/70 border border-slate-800 p-5"
                    >
                      <div className="text-3xl mb-3">{item.icon}</div>
                      <p className="text-slate-500 text-sm">{item.desc}</p>
                      <p className="text-3xl font-black mt-1">
                        {item.value}
                      </p>
                      <p className="text-blue-300 text-sm font-bold mt-2">
                        {getPercent(item.value).toFixed(1)}%
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-600/20 to-blue-600/20 border border-purple-400/20 rounded-3xl p-6 shadow-xl shadow-black/20">
                <p className="text-purple-200 font-bold mb-2">
                  Cảm xúc xuất hiện nhiều nhất
                </p>

                {mostEmotion && mostEmotion.value > 0 ? (
                  <>
                    <div className="text-6xl mb-4">{mostEmotion.icon}</div>
                    <h2 className="text-3xl font-black">
                      {mostEmotion.label}
                    </h2>
                    <p className="text-slate-300 mt-2">
                      {mostEmotion.value} lượt, chiếm{" "}
                      {getPercent(mostEmotion.value).toFixed(1)}% tổng số kết quả.
                    </p>
                  </>
                ) : (
                  <>
                    <div className="text-6xl mb-4">🤖</div>
                    <h2 className="text-3xl font-black">Chưa có dữ liệu</h2>
                    <p className="text-slate-300 mt-2">
                      Sau khi phân tích ảnh, thống kê cảm xúc sẽ xuất hiện ở đây.
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* CHARTS */}
            <div className="grid lg:grid-cols-2 gap-8">
              <ChartCard
                title="Detection Source Distribution"
                subtitle="Tỷ lệ nguồn đầu vào được sử dụng để phân tích."
                data={sourceChart}
                total={total}
              />

              <ChartCard
                title="Emotion Distribution"
                subtitle="Phân bố số lượng kết quả theo từng cảm xúc."
                data={emotionChart}
                total={total}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, desc, highlight }) => {
  return (
    <div
      className={`relative overflow-hidden rounded-3xl p-6 border shadow-xl shadow-black/20 transition hover:-translate-y-1 duration-300 ${
        highlight
          ? "bg-gradient-to-br from-blue-600 to-purple-600 border-blue-300/20"
          : "bg-slate-900/70 border-slate-800 hover:border-blue-400/40"
      }`}
    >
      {!highlight && (
        <div className="absolute -top-14 -right-14 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl" />
      )}

      <div className="relative z-10">
        <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center text-2xl mb-5">
          {icon}
        </div>

        <p className={highlight ? "text-white/80" : "text-slate-400"}>
          {title}
        </p>

        <h2 className="text-4xl md:text-5xl font-black mt-1">
          {value}
        </h2>

        <p className={highlight ? "text-white/70 text-sm mt-3" : "text-slate-500 text-sm mt-3"}>
          {desc}
        </p>
      </div>
    </div>
  );
};

const ChartCard = ({ title, subtitle, data, total }) => {
  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-3xl p-6 shadow-xl shadow-black/20">
      <div className="mb-6">
        <h2 className="text-white text-2xl font-black">{title}</h2>
        <p className="text-slate-400 mt-1">{subtitle}</p>
      </div>

      <div className="space-y-5">
        {data.map((item, i) => {
          const percent = total ? (item.value / total) * 100 : 0;

          return (
            <div key={i}>
              <div className="flex justify-between items-center gap-4 mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center">
                    {item.icon}
                  </div>

                  <div>
                    <p className="text-slate-200 font-bold capitalize">
                      {item.label || item.name}
                    </p>
                    <p className="text-slate-500 text-xs">
                      {percent.toFixed(1)}% tổng số lượt
                    </p>
                  </div>
                </div>

                <span className="text-blue-200 font-black">
                  {item.value}
                </span>
              </div>

              <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden border border-slate-700/50">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-sky-400 via-blue-500 to-purple-500 transition-all duration-500"
                  style={{
                    width: `${Math.min(percent, 100)}%`,
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

const getEmotionIcon = (emotion) => {
  const key = String(emotion || "").toLowerCase();

  const icons = {
    angry: "😠",
    disgust: "🤢",
    disgusted: "🤢",
    fear: "😨",
    fearful: "😨",
    happy: "😊",
    neutral: "😐",
    sad: "😢",
    surprised: "😲",
    surprise: "😲",
  };

  return icons[key] || "🤖";
};

const formatEmotion = (emotion) => {
  const key = String(emotion || "").toLowerCase();

  const map = {
    angry: "Angry",
    disgust: "Disgusted",
    disgusted: "Disgusted",
    fear: "Fearful",
    fearful: "Fearful",
    happy: "Happy",
    neutral: "Neutral",
    sad: "Sad",
    surprised: "Surprised",
    surprise: "Surprised",
  };

  return map[key] || emotion || "Unknown";
};

export default Dashboard;