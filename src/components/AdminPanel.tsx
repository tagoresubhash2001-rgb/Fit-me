/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Users, BarChart3, Shield, PlusCircle, Trash, RefreshCw, Layers, Layout, 
  Terminal, Globe 
} from 'lucide-react';

export default function AdminPanel() {
  // Simulated initial food records
  const [foods, setFoods] = useState([
    { id: '1', name: 'Natu Kodi Fry (Guntur Style)', calories: 380, protein: 32, carbs: 4, fats: 22, region: 'Andhra' },
    { id: '2', name: 'Jonna Rotte (Sorghum Bread)', calories: 150, protein: 5, carbs: 32, fats: 1, region: 'Telangana' },
    { id: '3', name: 'Ulavacharu (Horsegram Soup)', calories: 240, protein: 12, carbs: 38, fats: 6, region: 'Rayalaseema' }
  ]);

  const [newFoodName, setNewFoodName] = useState('');
  const [newFoodCal, setNewFoodCal] = useState<number>(200);
  const [newFoodProtein, setNewFoodProtein] = useState<number>(10);
  const [newFoodCarbs, setNewFoodCarbs] = useState<number>(30);
  const [newFoodFats, setNewFoodFats] = useState<number>(5);
  const [newFoodRegion, setNewFoodRegion] = useState('Andhra');

  const handleAddFood = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFoodName.trim()) return;
    const item = {
      id: Date.now().toString(),
      name: newFoodName,
      calories: Number(newFoodCal),
      protein: Number(newFoodProtein),
      carbs: Number(newFoodCarbs),
      fats: Number(newFoodFats),
      region: newFoodRegion,
    };
    setFoods([...foods, item]);
    setNewFoodName('');
  };

  const handleDeleteFood = (id: string) => {
    setFoods(foods.filter(f => f.id !== id));
  };

  return (
    <div className="max-w-4xl mx-auto pb-24 px-4 sm:px-0 mt-4 space-y-6">
      
      {/* Header Banner */}
      <div className="bg-[#0F1720]/40 p-5 rounded-3xl border border-slate-800 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-red-500 animate-pulse" />
          <span className="text-xs text-red-400 font-bold uppercase tracking-wider font-mono">Central Administrative Grid</span>
        </div>
        <h1 className="text-2xl font-black text-white tracking-tight mt-1">
          Ecosystem Admin Dashboard
        </h1>
        <p className="text-xs text-gray-400 mt-1">
          Monitor system metrics, aggregate custom Andhra base items, track platform MRR subscription trends, and oversee AI operations.
        </p>
      </div>

      {/* Analytics KPI counters */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        
        <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
          <span className="text-[9px] text-gray-500 font-mono block uppercase">Active Subscribers (AP/TG)</span>
          <span className="text-2xl font-black text-white font-mono mt-1 block">42,840</span>
          <span className="text-[10px] text-emerald-400 font-medium">+12% this week</span>
        </div>

        <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
          <span className="text-[9px] text-gray-500 font-mono block uppercase">Monthly Recurring Revenue</span>
          <span className="text-2xl font-black text-white font-mono mt-1 block">₹6,83,500</span>
          <span className="text-[10px] text-emerald-400 font-medium">₹149 plan dominant</span>
        </div>

        <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
          <span className="text-[9px] text-gray-500 font-mono block uppercase">AI Coach API Queries</span>
          <span className="text-2xl font-black text-white font-mono mt-1 block">1,82,492</span>
          <span className="text-[10px] text-gray-500 font-mono">99.8% Success rate</span>
        </div>

        <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
          <span className="text-[9px] text-gray-500 font-mono block uppercase">Avg Cal Consumption</span>
          <span className="text-2xl font-black text-white font-mono mt-1 block">1,840 kcal</span>
          <span className="text-[10px] text-[#FF8A24] font-medium">Protein peak: 68g</span>
        </div>

      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Manage Foods List */}
        <div className="bg-slate-900/60 p-5 rounded-3xl border border-slate-800 space-y-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-tight">
            Manage Regional Food Directory
          </h2>

          <form onSubmit={handleAddFood} className="space-y-3 bg-slate-950 p-4 rounded-2xl border border-slate-850">
            <span className="text-[10px] text-slate-400 block uppercase font-mono leading-none font-bold">Register New Dish Record</span>
            
            <div className="grid grid-cols-2 gap-2">
              <input
                id="new-food-name-input"
                type="text"
                required
                value={newFoodName}
                onChange={(e) => setNewFoodName(e.target.value)}
                placeholder="Dish Name (e.g. Gongura Pappu)"
                className="w-full bg-slate-850 border border-slate-700 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-[#1FA45B]"
              />
              <select
                id="new-food-region-select"
                value={newFoodRegion}
                onChange={(e) => setNewFoodRegion(e.target.value)}
                className="bg-slate-850 border border-slate-700 rounded-xl py-2 px-2 text-xs text-white uppercase focus:outline-none"
              >
                <option value="Andhra">Andhra</option>
                <option value="Telangana">Telangana</option>
                <option value="Rayalaseema">Rayalaseema</option>
              </select>
            </div>

            <div className="grid grid-cols-4 gap-1.5">
              <input
                id="new-food-cal-input"
                type="number"
                placeholder="Kcal"
                value={newFoodCal || ''}
                onChange={(e) => setNewFoodCal(Number(e.target.value))}
                className="bg-slate-850 border border-slate-700 rounded-lg p-1.5 text-xs text-center text-white focus:outline-none"
              />
              <input
                id="new-food-protein-input"
                type="number"
                placeholder="Prot"
                value={newFoodProtein || ''}
                onChange={(e) => setNewFoodProtein(Number(e.target.value))}
                className="bg-slate-850 border border-slate-700 rounded-lg p-1.5 text-xs text-center text-white focus:outline-none"
              />
              <input
                id="new-food-carbs-input"
                type="number"
                placeholder="Carb"
                value={newFoodCarbs || ''}
                onChange={(e) => setNewFoodCarbs(Number(e.target.value))}
                className="bg-slate-850 border border-slate-700 rounded-lg p-1.5 text-xs text-center text-white focus:outline-none"
              />
              <input
                id="new-food-fats-input"
                type="number"
                placeholder="Fat"
                value={newFoodFats || ''}
                onChange={(e) => setNewFoodFats(Number(e.target.value))}
                className="bg-slate-850 border border-slate-700 rounded-lg p-1.5 text-xs text-center text-white focus:outline-none"
              />
            </div>

            <button
              id="admin-add-food-btn"
              type="submit"
              className="w-full py-2 bg-[#1FA45B] hover:bg-emerald-605 text-white font-bold text-xs rounded-xl shadow-md transition-all uppercase tracking-wide"
            >
              Add Food Record
            </button>
          </form>

          {/* Directory Listings */}
          <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
            {foods.map((food) => (
              <div key={food.id} className="bg-slate-850/60 p-2.5 rounded-xl border border-slate-850 flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-white">{food.name}</p>
                  <p className="text-[10px] text-[#FFA244] font-semibold mt-0.5">{food.region} Origin • P: {food.protein}g C: {food.carbs}g</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-gray-300 font-bold">{food.calories} kcal</span>
                  <button 
                    id={`admin-delete-food-${food.id}`}
                    onClick={() => handleDeleteFood(food.id)} 
                    className="text-gray-500 hover:text-red-400"
                  >
                    <Trash className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

        </div>

        {/* Live System Telemetry Stream */}
        <div className="bg-slate-900/60 p-5 rounded-3xl border border-slate-800 flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-tight flex items-center gap-1.5">
              <Terminal className="w-4 h-4 text-emerald-400" />
              AI Telemetry Stream
            </h2>
            <p className="text-xs text-gray-400 mt-0.5 leading-normal">
              Visualizes real-time logs processed using Gemini 3.5-flash matching Indian regional accounts:
            </p>

            <div className="mt-4 bg-slate-950 p-4 rounded-2xl border border-slate-850 font-mono text-[10px] text-emerald-400 space-y-3 h-[240px] overflow-y-auto">
              <div>
                <span className="text-slate-500">[10:48:10Z]</span> <span className="text-white">INFO:</span> Server initialized on port 3000.
              </div>
              <div>
                <span className="text-slate-500">[10:48:11Z]</span> <span className="text-purple-400">GEMINI:</span> Verified client agent HTTP 'aistudio-build'.
              </div>
              <div className="border-t border-slate-900 my-1 pt-1.5">
                <span className="text-slate-500">[10:48:12Z]</span> <span className="text-[#1FA45B]">USER:</span> logged 'Ragi Sangati' (estimated 290kcal).
              </div>
              <div>
                <span className="text-slate-500">[10:48:14Z]</span> <span className="text-[#FF8A24]">AI PROXY:</span> analyzing meal 'Kakarakaya Pappu'.
              </div>
              <div>
                <span className="text-slate-550">[10:48:16Z]</span> <span className="text-purple-400">RESPONSE (200 OK):</span> returned JSON payload matching diabetes care index schema.
              </div>
              <div className="border-t border-slate-900 my-1 pt-1.5">
                <span className="text-slate-500">[10:48:18Z]</span> <span className="text-[#1FA45B]">USER:</span> "Nenu biryani thinna evening what to do?"
              </div>
              <div>
                <span className="text-slate-500">[10:48:21Z]</span> <span className="text-white">COACH JAI:</span> "Approx 620 calories. Evening match light ga teesukondi..."
              </div>
            </div>
          </div>

          <div className="text-[10px] text-gray-500 text-center font-mono border-t border-slate-850 pt-4 mt-2">
            Secure administrative console. Platform operates as single-node instance.
          </div>
        </div>

      </div>

    </div>
  );
}
