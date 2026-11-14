/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  Calendar, Activity, Home, Dumbbell, ShoppingBag 
} from 'lucide-react';

interface BottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function BottomNav({ activeTab, setActiveTab }: BottomNavProps) {
  // Ordered exactly as requested globally: Planner, Trackings, Home, Workout, Store
  const navItems = [
    { id: 'planner', label: 'Planner', icon: Calendar },
    { id: 'trackings', label: 'Trackings', icon: Activity },
    { id: 'home', label: 'Home', icon: Home, isCenter: true },
    { id: 'workout', label: 'Workout', icon: Dumbbell },
    { id: 'store', label: 'Store', icon: ShoppingBag }
  ];

  return (
    <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[94vw] max-w-2xl z-[9000] bg-[#0E1521]/80 backdrop-blur-2xl border border-white/10 rounded-2xl px-2 py-1 shadow-[0_20px_50px_rgba(0,0,0,0.7)]">
      <div className="flex items-center justify-between gap-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          
          return (
            <button
              key={item.id}
              id={`nav-tab-${item.id}`}
              onClick={() => setActiveTab(item.id)}
              className="flex flex-col items-center justify-center flex-1 py-1 transition-all relative group cursor-pointer"
            >
              <div 
                className={`p-2 rounded-xl transition-all ${
                  isActive 
                    ? 'text-emerald-400 bg-emerald-500/10 scale-105 font-bold' 
                    : item.isCenter 
                      ? 'text-slate-100 bg-white/5 hover:bg-white/10' 
                      : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                }`}
              >
                <Icon className={`w-5 h-5 ${item.isCenter ? 'scale-110' : ''}`} />
              </div>
              
              <span className={`text-[9px] mt-0.5 font-sans font-extrabold tracking-tight transition-colors uppercase ${
                isActive ? 'text-emerald-400' : 'text-gray-500 group-hover:text-gray-300'
              }`}>
                {item.label}
              </span>

              {/* Slider Indicator line */}
              {isActive && (
                <div className="absolute top-0 left-1/4 right-1/4 h-[2.5px] bg-gradient-to-r from-emerald-400 to-[#FF8A24] rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
