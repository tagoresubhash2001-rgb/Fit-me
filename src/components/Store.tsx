import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShoppingBag,
  Star,
  ShieldCheck,
  Sparkles,
  Check,
  ArrowRight,
  TrendingUp,
  Compass,
  Smile,
  Eye,
  Award,
  DollarSign,
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
    {
      id: '1',
      name: 'Zero-Spike Ayurvedic Stevia Extract',
      category: 'supplement',
      price: '₹420',
      rating: 4.9,
      badge: 'Diabetic Safe',
      imageAlt: 'Stevia Bottle',
      desc: '100% organic liquid extract with zero glucose feedback bounds.',
    },
    {
      id: '2',
      name: 'Premium Cold-Filtered Grass-Fed Whey Isolate',
      category: 'supplement',
      price: '₹3,299',
      rating: 5.0,
      badge: 'High Protein',
      imageAlt: 'Whey Pack',
      desc: 'Pre-digested isolate with zero lactose bloat enzymes.',
    },
    {
      id: '3',
      name: 'Therapeutic Back support cork roller block',
      category: 'wellness',
      price: '₹1,249',
      rating: 4.8,
      badge: 'Biomechanics',
      imageAlt: 'Cork roller',
      desc: 'Sustainable solid cork block engineered for thoracic release and spine traction.',
    },
    {
      id: '4',
      name: 'Continuous Glucose Monitor (CGM) Reader Package',
      category: 'wellness',
      price: '₹5,499',
      rating: 4.9,
      badge: 'Device',
      imageAlt: 'CGM Sensor',
      desc: 'Real-time interstitial fluid glucose reader with bluetooth sync.',
    },
    {
      id: '5',
      name: 'Fit Me Elite 1-on-1 coaching subscription',
      category: 'coaching',
      price: '₹2,500/mo',
      rating: 5.0,
      badge: 'Elite Care',
      imageAlt: 'Elite Coach',
      desc: 'Daily timeline audits and biochemist updates with Jai or Jaya.',
    },
    {
      id: '6',
      name: 'Organic Ashwagandha & L-Theanine stress buffers',
      category: 'supplement',
      price: '₹680',
      rating: 4.7,
      badge: 'Wellness',
      imageAlt: 'Stress pills',
      desc: 'Capsules formulated to control elevated evening cortisol surges.',
    },
  ];

  const filteredMerchandise = activeTab === 'all' ? merchandiseList : merchandiseList.filter((item) => item.category === activeTab);

  const handleAddToCart = (productName: string) => {
    setCartCount((prev) => prev + 1);
    setPurchasedProduct(`Added "${productName}" to wellness checkout cart!`);
    setTimeout(() => setPurchasedProduct(null), 3500);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6 pb-24">
      {/* 1. Header Segment */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-caption text-primary block font-semibold">Store</span>
          <h2 className="text-display font-semibold text-ink mt-1">Wellness store</h2>
        </div>

        {/* Cart items counter button */}
        <button className="flex items-center gap-2 bg-surface px-4 py-2 border border-line rounded-xl text-caption font-semibold text-ink shadow-card shrink-0">
          <ShoppingBag className="w-4 h-4 text-primary" />
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
            className="bg-primary-subtle border border-primary/30 p-4 rounded-xl text-caption text-primary flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              <span>{purchasedProduct}</span>
            </div>
            <span className="text-caption bg-primary-subtle text-primary px-2 py-0.5 rounded-full border border-primary/30">Synced</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. Wellness Segment controls */}
      <div className="flex flex-wrap gap-1.5 bg-canvas p-1.5 rounded-2xl border border-line w-fit">
        {(
          [
            { key: 'all', label: 'All apothecary' },
            { key: 'supplement', label: 'Clinics Supplements' },
            { key: 'wellness', label: 'Smart wellness Hardware' },
            { key: 'coaching', label: 'Coaching plans' },
          ] as const
        ).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-caption  font-semibold transition-all rounded-xl cursor-pointer ${
              activeTab === tab.key ? 'bg-primary-subtle border border-primary/30 text-primary font-semibold' : 'text-muted hover:text-ink'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 3. Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {filteredMerchandise.map((product) => (
          <div
            key={product.id}
            className="bg-surface border border-line p-5 rounded-2xl hover:border-line transition-colors flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-caption bg-primary-subtle text-primary border border-primary/30 px-2 py-0.5 rounded-full font-semibold">
                  {product.badge || 'Merchandise'}
                </span>
                <div className="flex items-center gap-0.5 text-accent text-caption">
                  <Star className="w-3 h-3 fill-accent-fill" />
                  <span>{product.rating}</span>
                </div>
              </div>

              <div>
                <h3 className="text-small font-semibold text-ink line-clamp-2">{product.name}</h3>
                <p className="text-caption text-muted leading-relaxed mt-1">{product.desc}</p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 mt-6 border-t border-line">
              <span className="text-small font-semibold text-ink">{product.price}</span>
              <button
                onClick={() => handleAddToCart(product.name)}
                className="px-3.5 py-1.5 bg-primary hover:bg-primary font-semibold text-caption text-on-primary rounded-xl shadow-card cursor-pointer transition-transform duration-200 active:scale-95"
              >
                Add To Cart
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Future Brand Affiliate Partner Box */}
      <div className="p-6 border border-line rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h4 className="text-caption text-primary font-semibold">Our brand partners</h4>
          <p className="text-caption text-muted max-w-lg mt-1">
            We partner with certified CGMs providers, organic farmers, and elite vitamin labs. Every product is reviewed by our team before
            it is listed.
          </p>
        </div>
        <span className="text-caption text-muted">Affiliate program ready</span>
      </div>
    </div>
  );
}
