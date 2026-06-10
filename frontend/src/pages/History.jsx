import React, { useEffect, useState } from "react";
import {
  getHistory,
  deleteAllHistory,
  deleteHistoryItem,
  BACKEND_URL,
} from "../api/api";

const History = () => {
  const [history, setHistory] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      setLoading(true);
      setMessage("");

      const data = await getHistory();
      setHistory(data || []);
    } catch (err) {
      console.error(err);
      setMessage("Không tải được lịch sử phân tích.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAllHistory = async () => {
    const ok = window.confirm(
      "Bạn có chắc chắn muốn xóa toàn bộ lịch sử ảnh không?"
    );

    if (!ok) return;

    try {
      setDeleting(true);
      setMessage("");

      await deleteAllHistory();

      setHistory([]);
      setSelected(null);
      setMessage("Đã xóa toàn bộ lịch sử ảnh.");
    } catch (err) {
      console.error(err);

      setMessage(
        err.response?.data?.detail ||
          "Không xóa được lịch sử ảnh. Hãy kiểm tra backend."
      );
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteOneHistory = async (item) => {
    if (!item?.id) return;

    const ok = window.confirm(
      "Bạn có chắc chắn muốn xóa ảnh lịch sử này không?"
    );

    if (!ok) return;

    try {
      setDeleting(true);
      setMessage("");

      await deleteHistoryItem(item.id);

      setHistory((prev) => prev.filter((x) => x.id !== item.id));
      setSelected(null);
      setMessage("Đã xóa ảnh lịch sử này.");
    } catch (err) {
      console.error(err);

      setMessage(
        err.response?.data?.detail ||
          "Không xóa được ảnh lịch sử này. Hãy kiểm tra backend."
      );
    } finally {
      setDeleting(false);
    }
  };

  const imageUrl = (item) => {
    if (!item?.image_url) return "";

    return item.image_url.startsWith("http")
      ? item.image_url
      : `${BACKEND_URL}${item.image_url}`;
  };

  const formatDate = (isoString) => {
    if (!isoString) return "";

    const date = new Date(isoString);
    const pad = (n) => String(n).padStart(2, "0");

    return `${pad(date.getDate())}/${pad(
      date.getMonth() + 1
    )}/${date.getFullYear()} ${pad(date.getHours())}:${pad(
      date.getMinutes()
    )}:${pad(date.getSeconds())}`;
  };

  const formatEmotion = (emotion) => {
    if (!emotion) return "Unknown";

    const map = {
      angry: "Angry",
      disgusted: "Disgusted",
      disgust: "Disgusted",
      fearful: "Fearful",
      fear: "Fearful",
      happy: "Happy",
      neutral: "Neutral",
      sad: "Sad",
      surprised: "Surprised",
      surprise: "Surprised",
    };

    const key = String(emotion).toLowerCase();
    return map[key] || emotion;
  };

  const getEmotionIcon = (emotion) => {
    const key = String(emotion || "").toLowerCase();

    const icons = {
      angry: "😠",
      disgusted: "🤢",
      disgust: "🤢",
      fearful: "😨",
      fear: "😨",
      happy: "😊",
      neutral: "😐",
      sad: "😢",
      surprised: "😲",
      surprise: "😲",
    };

    return icons[key] || "🤖";
  };

  const formatConfidence = (value) => {
    if (value === undefined || value === null) return "0";

    const numberValue =
      typeof value === "number" ? value : parseFloat(value) || 0;

    if (numberValue <= 1) {
      return (numberValue * 100).toFixed(2);
    }

    return numberValue.toFixed(2);
  };

  return (
    <div className="min-h-screen px-4 py-8 md:px-8 text-white">
      <div className="max-w-7xl mx-auto mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-400/20 text-blue-200 text-sm font-bold mb-4">
          📊 Emotion Analysis History
        </div>

        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight">
              Lịch sử phân tích
            </h1>

            <p className="text-slate-400 mt-3 max-w-2xl">
              Danh sách các lần hệ thống đã nhận diện cảm xúc khuôn mặt.
              Bấm vào từng ảnh để xem chi tiết hoặc xóa riêng từng ảnh.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={loadHistory}
              disabled={loading || deleting}
              className="w-fit px-5 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed font-bold shadow-lg shadow-blue-900/30 transition"
            >
              🔄 Tải lại
            </button>

            <button
              onClick={handleDeleteAllHistory}
              disabled={loading || deleting || history.length === 0}
              className="w-fit px-5 py-3 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 disabled:opacity-50 disabled:cursor-not-allowed font-bold shadow-lg shadow-red-900/30 transition"
            >
              {deleting ? "Đang xóa..." : "🗑️ Xóa tất cả"}
            </button>
          </div>
        </div>

        {message && (
          <div className="mt-5 rounded-2xl border border-slate-700 bg-slate-900/80 px-5 py-4 text-slate-200 font-semibold">
            {message}
          </div>
        )}
      </div>

      <div className="max-w-7xl mx-auto">
        {loading && (
          <div className="bg-slate-900/70 border border-slate-800 rounded-3xl p-10 text-center">
            <div className="text-4xl mb-4">⏳</div>
            <p className="text-slate-300 font-semibold">
              Đang tải lịch sử phân tích...
            </p>
          </div>
        )}

        {!loading && history.length === 0 && (
          <div className="bg-slate-900/70 border border-slate-800 rounded-3xl p-10 text-center">
            <div className="text-5xl mb-4">📭</div>

            <h2 className="text-2xl font-black mb-2">
              Chưa có lịch sử phân tích
            </h2>

            <p className="text-slate-400">
              Sau khi bạn phân tích ảnh hoặc webcam, kết quả sẽ được hiển thị tại đây.
            </p>
          </div>
        )}

        {!loading && history.length > 0 && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {history.map((item) => {
              const confidence = formatConfidence(item.confidence);

              return (
                <div
                  key={item.id}
                  className="group bg-slate-900/70 border border-slate-800 hover:border-blue-400/50 rounded-3xl overflow-hidden shadow-xl shadow-black/20 hover:-translate-y-1 hover:shadow-blue-950/30 transition-all duration-300"
                >
                  <div
                    onClick={() => setSelected(item)}
                    className="relative h-60 bg-slate-950 overflow-hidden cursor-pointer"
                  >
                    <img
                      src={imageUrl(item)}
                      alt={item.emotion}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    />

                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-transparent to-transparent" />

                    <div className="absolute top-4 left-4 px-3 py-1.5 rounded-full bg-black/45 backdrop-blur-md border border-white/10 text-sm font-bold">
                      {getEmotionIcon(item.emotion)} {formatEmotion(item.emotion)}
                    </div>

                    <div className="absolute bottom-4 left-4 right-4">
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-slate-300">Độ tin cậy</span>
                        <span className="font-black text-blue-200">
                          {confidence}%
                        </span>
                      </div>

                      <div className="w-full h-2 rounded-full bg-slate-700 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-sky-400 via-blue-500 to-purple-500"
                          style={{
                            width: `${Math.min(Number(confidence), 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="p-5">
                    <h3
                      onClick={() => setSelected(item)}
                      className="text-white font-black text-xl capitalize mb-2 cursor-pointer"
                    >
                      {getEmotionIcon(item.emotion)} {formatEmotion(item.emotion)}
                    </h3>

                    <div className="space-y-2 text-sm">
                      <p className="text-slate-400">
                        Confidence:{" "}
                        <span className="text-slate-200 font-bold">
                          {confidence}%
                        </span>
                      </p>

                      <p className="text-slate-500">
                        Thời gian: {formatDate(item.created_at)}
                      </p>
                    </div>

                    <div className="mt-5 flex gap-3">
                      <button
                        onClick={() => setSelected(item)}
                        className="flex-1 px-4 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 font-bold transition"
                      >
                        👁️ Xem
                      </button>

                      <button
                        onClick={() => handleDeleteOneHistory(item)}
                        disabled={deleting}
                        className="flex-1 px-4 py-3 rounded-2xl bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed font-bold transition"
                      >
                        🗑️ Xóa
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {selected && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 md:p-6"
          onClick={() => setSelected(null)}
        >
          <div
            className="relative bg-slate-950 w-full max-w-5xl rounded-3xl border border-slate-800 shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelected(null)}
              className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-slate-900/80 hover:bg-red-500 text-white border border-white/10 font-black transition"
            >
              ×
            </button>

            <div className="grid md:grid-cols-2">
              <div className="bg-slate-900 p-5 flex items-center justify-center">
                <img
                  src={imageUrl(selected)}
                  alt={selected.emotion}
                  className="rounded-2xl w-full max-h-[560px] object-contain border border-slate-800"
                />
              </div>

              <div className="p-6 md:p-8">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-400/20 text-purple-200 text-sm font-bold mb-5">
                  Chi tiết kết quả
                </div>

                <h2 className="text-3xl md:text-4xl font-black capitalize mb-3">
                  {getEmotionIcon(selected.emotion)}{" "}
                  {formatEmotion(selected.emotion)}
                </h2>

                <p className="text-slate-400 mb-8">
                  Kết quả nhận diện cảm xúc được lưu lại từ lần phân tích trước.
                </p>

                <div className="space-y-4">
                  <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
                    <p className="text-slate-500 text-sm mb-1">Độ tin cậy</p>
                    <p className="text-2xl font-black text-blue-300">
                      {formatConfidence(selected.confidence)}%
                    </p>
                  </div>

                  <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
                    <p className="text-slate-500 text-sm mb-1">Thời gian</p>
                    <p className="text-lg font-bold text-slate-200">
                      {formatDate(selected.created_at)}
                    </p>
                  </div>

                  <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
                    <p className="text-slate-500 text-sm mb-1">
                      Kiểu nhận diện
                    </p>
                    <p className="text-lg font-bold text-slate-200">
                      {selected.detection_type || "Không xác định"}
                    </p>
                  </div>
                </div>

                <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    onClick={() => setSelected(null)}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 py-4 rounded-2xl font-black transition shadow-lg shadow-blue-950/40"
                  >
                    Đóng
                  </button>

                  <button
                    onClick={() => handleDeleteOneHistory(selected)}
                    disabled={deleting}
                    className="w-full bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 disabled:opacity-50 disabled:cursor-not-allowed py-4 rounded-2xl font-black transition shadow-lg shadow-red-950/40"
                  >
                    {deleting ? "Đang xóa..." : "🗑️ Xóa ảnh này"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default History;