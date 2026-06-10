import React from "react";

const Sidebar = ({ active, setActive }) => {
    const menus = [
        {
            id: "dashboard",
            icon: "🏠",
            title: "Dashboard"
        },
        {
            id: "detection",
            icon: "😊",
            title: "Nhận diện cảm xúc"
        },
        {
            id: "history",
            icon: "📜",
            title: "Lịch sử"
        }
    ];

    return (
        <div className="w-[260px] bg-slate-950 border-r border-slate-800 min-h-screen p-5">
            <div className="mb-10">
                <h1 className="text-white font-black text-xl">
                    EMO-VISION AI
                </h1>
                <p className="text-blue-400 text-xs">
                    CORE ENGINE v2.0
                </p>
            </div>

            <div className="space-y-2">
                {menus.map(menu => (
                    <button
                        key={menu.id}
                        onClick={() => setActive(menu.id)}
                        className={`w-full text-left px-4 py-3 rounded-xl transition ${
                            active === menu.id
                                ? "bg-blue-600 text-white"
                                : "text-slate-400 hover:bg-slate-800"
                        }`}
                    >
                        {menu.icon} {menu.title}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default Sidebar;