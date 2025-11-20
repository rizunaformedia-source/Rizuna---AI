import React from 'react';
import { Icon } from './Icon';

interface SubscriptionGateProps {
  onUnlock: () => void;
}

export const SubscriptionGate: React.FC<SubscriptionGateProps> = ({ onUnlock }) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white/70 backdrop-blur-md animate-fade-in">
      <div className="bg-white/80 border border-white rounded-2xl shadow-2xl shadow-slate-200 p-8 m-4 max-w-lg text-center flex flex-col items-center animate-materialize relative overflow-hidden">
        
        <div className="absolute inset-0 bg-gradient-to-br from-orange-100 via-transparent to-violet-100 pointer-events-none" />
        
        <div className="relative w-24 h-24 flex items-center justify-center mb-6">
            <div className="absolute w-2 h-2 bg-orange-500 rounded-full" style={{ animation: 'orbit 8s linear infinite', '--orbit-radius': '35px' } as React.CSSProperties} />
            <div className="absolute w-3 h-3 bg-violet-600 rounded-full" style={{ animation: 'orbit 12s linear infinite reverse', '--orbit-radius': '50px' } as React.CSSProperties} />
            <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-violet-600 rounded-full shadow-lg shadow-orange-200" style={{ animation: 'pulse-core 3s infinite ease-in-out' }} />
        </div>

        <h1 className="font-header text-3xl font-bold text-slate-800 mb-3 relative z-10">Unlock Rizuna AI</h1>
        <p className="font-subtitle text-slate-600 mb-6 relative z-10">
         هذه النسخة تحت تطوير فريق عمل ريزونا للميديا
         <br/>
         <span className="text-indigo-600 font-medium">تحت رعاية م.أحمد ماهر المهدي</span>
        </p>

        <a
          href="https://www.instagram.com/rizunaformedia"
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex items-center justify-center gap-3 px-6 py-3 text-lg font-semibold text-white bg-gradient-to-r from-orange-500 to-violet-600 border border-transparent rounded-lg transition-all duration-300 hover:shadow-lg hover:shadow-orange-500/30 focus:outline-none focus:ring-2 focus:ring-orange-400 mb-4 relative z-10"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
            <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
            <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
          </svg>
          للتواصل
        </a>

        <button
          onClick={onUnlock}
          className="w-full flex items-center justify-center gap-3 px-6 py-3 text-base font-semibold text-slate-600 bg-white/60 border border-slate-300 rounded-lg transition-all duration-200 hover:bg-indigo-600 hover:border-indigo-500 hover:text-white focus:outline-none focus:ring-2 focus:ring-indigo-400 relative z-10"
        >
          <Icon path="M13.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75M3.75 10.5h16.5v10.5A2.25 2.25 0 0118 23.25H6A2.25 2.25 0 013.75 21V10.5z" className="w-5 h-5" />
          I've Subscribed, Unlock App
        </button>
      </div>
    </div>
  );
};