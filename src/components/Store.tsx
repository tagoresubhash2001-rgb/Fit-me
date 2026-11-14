import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShoppingBag, Star, ShieldCheck, Sparkles, Check, ArrowRight,
  TrendingUp, Compass, Smile, Eye, Award, DollarSign
} from 'lucide-react';
import { UserProfile } from '../types';

interface StoreProps {
  profile: UserProfile;
}

interface ProductItem {
  id: string;
  name: string;
  category: 'supplement' | 'wellness' | 'accessory' | 'coaching';
  price: string;
  rating: number;
  badge?: string;
  imageAlt: string;
  desc: string;
}

export default function Store({ profile }: StoreProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'supplement' | 'wellness' | 'coaching'>('all');
  const [cartCount, setCartCount] = useState(0);
  const [purchasedProduct, setPurchasedProduct] = useState<string | null>(null);

  const merchandiseList: ProductItem[] = [
    { id: '1', name: 'Zero-Spike Ayurvedic Stevia Extract', category: 'supplement', price: '₹420', rating: 4.9, badge: 'Diabetic Safe', imageAlt: 'Stevia Bottle', desc: '100% organic liquid extract with zero glucose feedback bounds.' },
    { id: '2', name: 'Premium Cold-Filtered Grass-Fed Whey Isolate', category: 'supplement', price: '₹3,299', rating: 5.0, badge: 'High Protein', imageAlt: 'Whey Pack', desc: 'Pre-digested isolate with zero lactose bloat enzymes.' },
    { id: '3', name: 'Therapeutic Back support cork roller block', category: 'wellness', price: '₹1,249', rating: 4.8, badge: 'Biomechanics', imageAlt: 'Cork roller', desc: 'Sustainable solid cork block engineered for thoracic release and spine traction.' },
    { id: '4', name: 'Continuous Glucose Monitor (CGM) Reader Package', category: 'wellness', price: '₹5,499', rating: 4.9, badge: 'Surveillance Hardware', imageAlt: 'CGM Sensor', desc: 'Real-time interstitial fluid glucose reader with bluetooth sync.' },
    { id: '5', name: 'Fit Me Elite 1-on-1 Clinical coaching subscription', category: 'coaching', price: '₹2,500/mo', rating: 5.0, badge: 'Elite Care', imageAlt: 'Elite Coach', desc: 'Daily timeline audits and biochemist updates with Jai or Jaya.' },
    { id: '6', name: 'Organic Ashwagandha & L-Theanine stress buffers', category: 'supplement', price: '₹680', rating: 4.7, badge: 'Vagal regulator', imageAlt: 'Stress pills', desc: 'Capsules formulated to control elevated evening cortisol surges.' }
  ];

  const filteredMerchandise = activeTab === 'all' 
    ? merchandiseList 
    : merchandiseList.filter(item => item.category === activeTab);

  const handleAddToCart = (productName: string) => {
    setCartCount(prev => prev + 1);
    setPurchasedProduct(`Added "${productName}" to wellness checkout cart!`);
    setTimeout(() => setPurchasedProduct(null), 3500);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6 pb-24">
      
      {/* 1. Header Segment */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-[10px] uppercase font-mono tracking-widest text-emerald-400 block font-extrabold">E-Commerce OS</span>
          <h2 className="text-2xl font-black text-white tracking-tight uppercase mt-1">Metabolic & Wellness Apothecary</h2>
        </div>

        {/* Cart items counter button */}
        <button className="flex items-center gap-2 bg-[#0c1219] px-4 py-2 border border-white/5 rounded-xl text-xs font-mono font-bold text-white shadow-lg shrink-0">
          <ShoppingBag className="w-4 h-4 text-emerald-400" />
          <span>Cart: {cartCount} items</span>
        </button>
      </div>

      {/* Banner / Flash Messaging */}
      <AnimatePresence>
        {purchasedProduct && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-emerald-900/25 border border-emerald-400/20 p-4 rounded-xl text-xs text-emerald-300 flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              <span>{purchasedProduct}</span>
            </div>
            <span className="text-[9px] uppercase font-mono bg-emerald-500/10 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/20">Synced</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. Wellness Segment controls */}
      <div className="flex flex-wrap gap-1.5 bg-[#070D14] p-1.5 rounded-2xl border border-white/5 w-fit">
        {([
          { key: 'all', label: 'All apothecary' },
          { key: 'supplement', label: 'Clinics Supplements' },
          { key: 'wellness', label: 'Smart wellness Hardware' },
          { key: 'coaching', label: 'Coaching plans' }
        ] as const).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-xs font-mono font-bold transition-all rounded-xl cursor-pointer ${
              activeTab === tab.key 
                ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-extrabold' 
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 3. Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {filteredMerchandise.map((product) => (
          <div key={product.id} className="bg-[#0c1219] border border-white/5 p-5 rounded-2xl hover:border-white/10 transition-colors flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-[9px] font-mono uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/15 px-2 py-0.5 rounded-full font-bold">
                  {product.badge || 'Merchandise'}
                </span>
                <div className="flex items-center gap-0.5 text-amber-400 font-mono text-xs">
                  <Star className="w-3 h-3 fill-amber-400" />
                  <span>{product.rating}</span>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-white line-clamp-2">{product.name}</h3>
                <p className="text-xs text-slate-400 leading-relaxed mt-1">{product.desc}</p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 mt-6 border-t border-white/5">
              <span className="text-sm font-mono font-black text-white">{product.price}</span>
              <button
                onClick={() => handleAddToCart(product.name)}
                className="px-3.5 py-1.5 bg-[#1FA45B] hover:bg-emerald-600 font-mono font-black text-[10px] uppercase tracking-wider text-white rounded-xl shadow-md cursor-pointer transition-transform duration-200 active:scale-95"
              >
                Add To Cart
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Future Brand Affiliate Partner Box */}
      <div className="bg-gradient-to-br from-indigo-950/20 via-slate-900 to-black p-6 border border-indigo-500/10 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h4 className="text-xs uppercase font-mono text-indigo-400 font-extrabold tracking-wider">Clinical Brand Partnerships</h4>
          <p className="text-xs text-slate-400 leading-normal max-w-lg mt-1">
            We partner with certified CGMs providers, organic farmers, and elite vitamin labs. All brands undergo rigorous clinical test metrics matching HIPAA and glycemic-index criteria.
          </p>
        </div>
        <span className="text-[10px] text-gray-400 font-mono">Affiliate program ready</span>
      </div>

    </div>
  );
}
