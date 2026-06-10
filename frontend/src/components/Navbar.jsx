import React from 'react';

const Navbar = () => {
    return (
        <nav className="bg-gradient-to-r from-slate-950 to-slate-900 px-8 py-4 flex justify-between items-center border-b border-slate-800 shadow-2xl w-full">
            <div className="flex items-center gap-3">
                <div className="bg-gradient-to-br from-blue-500 to-purple-600 w-10 h-10 rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(59,130,246,0.5)]">
                    <span className="text-xl">🧠</span>
                </div>
                <div>
                    <span className="text-white text-lg font-black tracking-wider block">EMO-VISION AI</span>
                    <span className="text-blue-400 text-xs font-bold block -mt-0.5">CORE ENGINE v2.0</span>
                </div>
            </div>
            
            <div className="flex items-center gap-5">
                <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full inline-block animate-pulse shadow-[0_0_10px_#10b981]"></span>
                    <span className="text-slate-400 text-sm font-semibold">Server Ready</span>
                </div>
                <div className="bg-slate-800/80 px-4 py-1.5 rounded-full text-slate-300 text-xs font-bold border border-slate-700 backdrop-blur-sm">
                    Nhóm AI
                </div>
            </div>
        </nav>
    );
};

export default Navbar;