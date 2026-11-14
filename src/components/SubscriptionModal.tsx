/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Crown, Sparkles, Check, Flame, Trophy, Heart, ShieldCheck, CreditCard, 
  HelpCircle 
} from 'lucide-react';
import { SubscriptionPlan } from '../types';

export default function SubscriptionModal() {
  const [selectedPlanID, setSelectedPlanID] = useState<'base' | 'premium' | 'luxury'>('premium');
  const [isProcessing, setIsProcessing] = useState(false);
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);

  const plansList: SubscriptionPlan[] = [
    {
      id: 'base',
      name: 'Base Wellness Plan',
      price: 99,
      billing: 'per month',
      features: [
        'Standard Calorie & Eats Logger',
        '20+ Regional Andhra & Telugu foods offline DB',
        'Chat with Jai or Raya (10 msgs / day limit)',
        'Weekly basic progression summaries'
      ]
    },
    {
      id: 'premium',
      name: 'Premium Elite Plan',
      price: 149,
      billing: 'per month',
      badge: 'Best Value',
      features: [
        'Everything in Base (Unlimited Logs)',
        'Bilingual Food AI Analyzer (unlimited queries)',
        'Full Clinical Programs integrated (Diabetes, PCOS, Thyroid)',
        'WhatsApp direct real-time notifications & logs checks',
        'Morning motivational Jai or Jaya Speech syntheses'
      ]
    },
    {
      id: 'luxury',
      name: 'Luxury Platinum Plan',
      price: 249,
      billing: 'per month',
      features: [
        'Everything in Premium + Unlimited Everything',
        'Personalized family menu planners (up to 4 members)',
        'Monthly clinical blood panel analyst by expert doctors',
        'Simulated audio/video clone priority calls twice a month',
        'Premium elite gift boxes delivered (Organic millets seeds)'
      ]
    }
  ];

  const handleCheckout = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setPurchaseSuccess(true);
    }, 1500);
  };

  const activePlanDetails = plansList.find(p => p.id === selectedPlanID);

  return (
    <div className="max-w-4xl mx-auto pb-24 px-4 sm:px-0 mt-4 space-y-6">
      
      {/* Header banner */}
      <div className="bg-slate-900/60 p-6 rounded-3xl border border-slate-850 backdrop-blur-md text-center relative overflow-hidden">
        <div className="absolute top-0 right-1/2 translate-x-1/2 w-48 h-48 bg-[#FF8A24]/10 rounded-full blur-[80px]" />
        
        <Crown className="w-10 h-10 text-[#FF8A24] mx-auto animate-bounce mb-3" />
        <span className="text-xs text-[#FF8A24] font-bold uppercase tracking-wider font-mono">Premium Club Joinings</span>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1.5">
          Choose Mee Wellness Flight 🚀
        </h1>
        <p className="text-xs sm:text-sm text-gray-400 mt-2 max-w-xl mx-auto leading-relaxed">
          Unlock customized South Indian clinical models. Choose premium subscription tiers to clear diabetes indicators and elevate daily habit streaking.
        </p>
      </div>

      <AnimatePresence mode="wait">
        {!purchaseSuccess ? (
          <motion.div 
            key="pricingDeck"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            {plansList.map((plan) => {
              const isSelected = selectedPlanID === plan.id;
              const isPremium = plan.id === 'premium';
              return (
                <div
                  key={plan.id}
                  id={`plan-card-${plan.id}`}
                  onClick={() => setSelectedPlanID(plan.id)}
                  className={`bg-slate-900/60 p-6 rounded-3xl border flex flex-col justify-between h-[480px] cursor-pointer transition-all relative overflow-hidden ${
                    isSelected 
                      ? isPremium 
                        ? 'border-[#FF8A24] ring-1 ring-[#FF8A24]/30 bg-slate-850/60' 
                        : 'border-[#1FA45B] ring-1 ring-[#1FA45B]/30 bg-slate-850/60'
                      : 'border-slate-850 opacity-80 hover:opacity-100 hover:border-slate-800'
                  }`}
                >
                  {/* Badge */}
                  {plan.badge && (
                    <span className="absolute top-3 right-3 bg-gradient-to-r from-[#FF8A24] to-orange-400 text-black text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
                      {plan.badge}
                    </span>
                  )}

                  <div>
                    {/* Plan Heading */}
                    <span className="text-[10px] text-gray-500 font-mono uppercase tracking-wider">Fit Me Club</span>
                    <h3 className="text-base font-black text-white mt-0.5 uppercase tracking-wide">{plan.name}</h3>
                    
                    {/* Price Tag */}
                    <div className="mt-4 flex items-baseline gap-1">
                      <span className="text-3xl font-black text-white font-mono">₹{plan.price}</span>
                      <span className="text-xs text-gray-400 font-mono">/ {plan.billing}</span>
                    </div>

                    {/* Features list */}
                    <div className="mt-6 space-y-2.5">
                      {plan.features.slice(0, 4).map((f, i) => (
                        <div key={i} className="flex gap-2 text-xs leading-normal">
                          <Check className={`w-4 h-4 shrink-0 ${isSelected ? 'text-[#1FA45B]' : 'text-gray-500'}`} />
                          <span className="text-gray-200">{f}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Complete selection button indicator */}
                  <div className="pt-4 border-t border-slate-850/60 flex items-center justify-between">
                    <span className="text-[10px] text-gray-500 font-mono">Mee selection</span>
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                      isSelected 
                        ? isPremium ? 'bg-[#FF8A24] border-[#FF8A24]' : 'bg-[#1FA45B] border-[#1FA45B]'
                        : 'border-slate-700'
                    }`}>
                      {isSelected && <span className="text-xs text-white">✓</span>}
                    </div>
                  </div>

                </div>
              );
            })}
          </motion.div>
        ) : (
          <motion.div
            key="successSplash"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-900 border border-[#1FA45B]/30 p-8 rounded-3xl text-center max-w-md mx-auto space-y-4"
          >
            <div className="w-14 h-14 bg-[#1FA45B]/10 rounded-full flex items-center justify-center mx-auto border border-[#1FA45B]/35">
              <ShieldCheck className="w-8 h-8 text-[#1FA45B] animate-pulse" />
            </div>

            <div className="space-y-1">
              <h2 className="text-xl font-bold text-white">Jai / Jaya Club Unlocked! 🎉</h2>
              <p className="text-xs text-[#1FA45B] font-mono leading-none">Mee Subscription Successfully Activated</p>
            </div>

            <p className="text-xs text-gray-300 leading-relaxed">
              Super banna! You have successfully unlocked <strong>{activePlanDetails?.name}</strong>. WhatsApp integration, voice quotes, and specialty therapeutic indicators are fully online. Let's conquer the health game!
            </p>

            <button
              id="back-to-pricing-deck-btn"
              onClick={() => setPurchaseSuccess(false)}
              className="w-full py-2 bg-slate-800 hover:bg-slate-750 text-xs font-bold text-gray-200 rounded-xl transition-colors border border-slate-700"
            >
              Back to plans configuration
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Checkout Actions panel */}
      {!purchaseSuccess && (
        <div className="bg-slate-900/60 p-5 rounded-3xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <span className="text-[10px] text-gray-500 font-mono uppercase">Outstanding order summary</span>
            <p className="text-sm font-bold text-white mt-0.5">
              Selected plan: <span className="text-[#FF8A24] uppercase font-black">{activePlanDetails?.name}</span>
            </p>
            <p className="text-xs text-gray-400">Total charge: ₹{activePlanDetails?.price} per month (Includes taxes).</p>
          </div>

          <button
            id="subscription-checkout-btn"
            onClick={handleCheckout}
            disabled={isProcessing}
            className="w-full sm:w-auto bg-gradient-to-r from-[#1FA45B] to-[#FF8A24] text-white px-8 py-3 rounded-xl font-bold text-xs sm:text-sm shadow-md hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-1.5 uppercase tracking-wide"
          >
            {isProcessing ? (
              <>
                <div className="animate-spin w-4 h-4 rounded-full border-2 border-slate-300 border-t-transparent" />
                Processing UPI checkout...
              </>
            ) : (
              <>
                <CreditCard className="w-4 h-4" /> Secure checkout with UPI
              </>
            )}
          </button>
        </div>
      )}

      {/* Trust factors */}
      <div className="bg-[#1FA45B]/5 border border-[#1FA45B]/15 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between text-xs text-gray-400 gap-4">
        <span>🔒 256-Bit SSL Encryption secures your transaction.</span>
        <span>⚡ Cancel membership in any 1 click anytime. No lock-in fees.</span>
      </div>

    </div>
  );
}
