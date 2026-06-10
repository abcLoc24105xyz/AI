import React, { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";

import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import History from "./pages/History";
import Analytics from "./pages/Analytics";

import { predictEmotion } from "./api/api";

const MAX_PHONE_SEND = 5;

function MobileCameraScreen({ sessionId }) {
  const storageKey = `phone_send_count_${sessionId}`;

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [preview, setPreview] = useState(null);
  const [sendCount, setSendCount] = useState(() => {
    return Number(localStorage.getItem(storageKey) || 0);
  });

  const convertImageToJpeg = async (file) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);

      img.onload = () => {
        try {
          const maxSize = 1024;

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

          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              URL.revokeObjectURL(objectUrl);

              if (!blob) {
                reject(new Error("Không thể chuyển ảnh sang JPG."));
                return;
              }

              const jpegFile = new File(
                [blob],
                `phone-image-${Date.now()}.jpg`,
                {
                  type: "image/jpeg",
                }
              );

              resolve(jpegFile);
            },
            "image/jpeg",
            0.9
          );
        } catch (err) {
          URL.revokeObjectURL(objectUrl);
          reject(err);
        }
      };

      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error("Không đọc được ảnh. Hãy chọn ảnh JPG/PNG khác."));
      };

      img.src = objectUrl;
    });
  };

  const handleMobileCapture = async (e) => {
    const originalFile = e.target.files?.[0];
    if (!originalFile) return;

    if (sendCount >= MAX_PHONE_SEND) {
      setMessage(
        `❌ QR này đã gửi đủ ${MAX_PHONE_SEND} ảnh. Hãy tạo QR mới trên máy tính.`
      );
      e.target.value = "";
      return;
    }

    setLoading(true);
    setMessage("");

    const previewUrl = URL.createObjectURL(originalFile);
    setPreview(previewUrl);

    try {
      const uploadFile = await convertImageToJpeg(originalFile);

      console.log("Original file:", originalFile);
      console.log("Converted upload file:", uploadFile);

      await predictEmotion(uploadFile, sessionId, "mobile");

      const newCount = sendCount + 1;

      setSendCount(newCount);
      localStorage.setItem(storageKey, String(newCount));

      if (newCount >= MAX_PHONE_SEND) {
        setMessage(
          `Gửi ảnh ${newCount}/${MAX_PHONE_SEND} thành công. QR này đã hết lượt.`
        );
      } else {
        setMessage(
          `Gửi ảnh ${newCount}/${MAX_PHONE_SEND} thành công. Bạn có thể gửi tiếp.`
        );
      }
    } catch (err) {
      console.error("Mobile upload error:", err);

      if (err?.response) {
        console.error("API status:", err.response.status);
        console.error("API data:", err.response.data);
      }

      setMessage(
        "Gửi ảnh thất bại. Ảnh có thể quá lớn hoặc định dạng không hỗ trợ. Hãy thử ảnh JPG/PNG khác."
      );
    } finally {
      setLoading(false);
      e.target.value = "";
    }
  };

  const canSendMore = sendCount < MAX_PHONE_SEND;

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white p-5">
      <div className="bg-slate-900 p-8 rounded-3xl w-full max-w-md border border-slate-700">
        <h2 className="text-3xl font-bold mb-4">
          📱 Camera Điện Thoại
        </h2>

        <p className="text-slate-300 mb-2">
          QR này dùng được tối đa {MAX_PHONE_SEND} lần.
        </p>

        <p className="text-yellow-400 mb-6 break-all">
          Session: {sessionId}
        </p>

        <p
          className={
            canSendMore
              ? "text-green-400 mb-4 font-bold"
              : "text-red-400 mb-4 font-bold"
          }
        >
          Đã gửi: {sendCount}/{MAX_PHONE_SEND}
        </p>

        <div className="flex flex-col gap-4">
          <label
            className={`px-6 py-4 rounded-xl block text-center font-bold ${
              canSendMore && !loading
                ? "bg-blue-600 cursor-pointer hover:bg-blue-700"
                : "bg-slate-600 cursor-not-allowed"
            }`}
          >
            {loading
              ? "Đang gửi ảnh..."
              : canSendMore
              ? "📷 Chụp Ảnh Bằng Camera"
              : "QR này đã hết lượt"}

            <input
              type="file"
              accept="image/*"
              capture="environment"
              hidden
              disabled={loading || !canSendMore}
              onChange={handleMobileCapture}
            />
          </label>

          <label
            className={`px-6 py-4 rounded-xl block text-center font-bold ${
              canSendMore && !loading
                ? "bg-purple-600 cursor-pointer hover:bg-purple-700"
                : "bg-slate-600 cursor-not-allowed"
            }`}
          >
            {loading
              ? "Đang gửi ảnh..."
              : canSendMore
              ? "🖼️ Chọn Ảnh Trong Máy"
              : "QR này đã hết lượt"}

            <input
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp,image/*"
              hidden
              disabled={loading || !canSendMore}
              onChange={handleMobileCapture}
            />
          </label>
        </div>

        {preview && (
          <div className="mt-6">
            <img
              src={preview}
              alt="Ảnh đã chọn"
              className="w-full max-h-96 object-contain rounded-xl border border-slate-700"
            />
          </div>
        )}

        {message && (
          <p className="mt-4 font-bold">
            {message}
          </p>
        )}
      </div>
    </div>
  );
}

function MainLayout() {
  const [page, setPage] = useState("dashboard");

  const renderPage = () => {
    switch (page) {
      case "dashboard":
        return <Dashboard />;

      case "detection":
        return <Home />;

      case "history":
        return <History />;

      case "analytics":
        return <Analytics />;

      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex min-h-screen dashboard-bg">
      <Sidebar active={page} setActive={setPage} />

      <div className="flex-1">
        <Navbar />

        <div className="p-8">
          {renderPage()}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [mobileSession, setMobileSession] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    const session =
      params.get("session") ||
      params.get("sessionId");

    if (session) {
      setMobileSession(session);
    }
  }, []);

  if (mobileSession) {
    return <MobileCameraScreen sessionId={mobileSession} />;
  }

  return <MainLayout />;
}