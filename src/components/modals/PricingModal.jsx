import React, { useState, useEffect, useRef } from 'react';
import { X, Zap, Crown, Flame, Check } from 'lucide-react';

const PricingModal = ({ onClose, onSelectPlan, activePlan, onShowAuth, isLoggedIn }) => {
    const retrieveAccessRef = useRef(null);

    const plans = [
        {
            id: 'day',
            name: "Crammer's Pass",
            tier: 1,
            price: "Rs 50",
            duration: "24 Hours",
            description: "Perfect for last-minute mock tests.",
            features: ["Unlimited UI Feedback", "24h AI Grading", "Instant Critique"],
            icon: <Flame className="text-orange-500" />,
            color: "border-orange-200"
        },
        {
            id: 'monthly',
            name: "Preparation Pack",
            tier: 2,
            price: "Rs 499",
            duration: "30 Days",
            description: "The most popular choice for serious prep.",
            features: ["Everything in Day Pass", "30 Days Access", "Academic Structure Tools"],
            icon: <Zap className="text-yellow-500" />,
            color: "border-yellow-400",
            popular: true,
            savings: "Save 67%"
        },
        {
            id: 'lifetime',
            name: "Lifetime Pack",
            tier: 3,
            price: "Rs 1,500",
            duration: "Lifetime",
            description: "One-time payment, forever yours.",
            features: ["Lifetime AI Grading", "Prioritized Suggestions", "All Future Updates"],
            icon: <Crown className="text-purple-500" />,
            color: "border-purple-500",
            savings: "Save 90%+"
        }
    ];


    const getPlanTier = (name) => {
        const p = plans.find(pl => pl.name === name);
        return p ? p.tier : 0;
    };

    const currentTier = getPlanTier(activePlan);

    return (
        <div className="fixed inset-0 bg-stone-900/95 z-[110] flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-[#f4f1ea] border-2 border-stone-900 shadow-[12px_12px_0px_0px_rgba(255,255,255,1)] max-w-4xl w-full relative max-h-[95vh] flex flex-col">
                <div className="flex justify-end p-2 border-b-2 border-stone-100 bg-[#f4f1ea] z-20 shrink-0">
                    <button
                        onClick={onClose}
                        className="p-1.5 bg-white text-stone-900 rounded-full border-2 border-stone-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-y-0.5 hover:shadow-none transition-all active:scale-95"
                    >
                        <X size={20} strokeWidth={3} />
                    </button>
                </div>

                <div className="overflow-y-auto custom-scrollbar flex-1 p-4 md:p-8">
                    <div className="text-center mb-10 pt-4 md:pt-0">
                        <span className="inline-block px-3 py-1 bg-stone-900 text-white text-[10px] font-black uppercase tracking-widest mb-4">Invest in your band score</span>
                        <h2 className="text-4xl font-serif font-black text-stone-900">Choose Your Plan</h2>
                        {activePlan && (
                            <p className="text-stone-500 mt-2 font-mono text-sm italic">You currently have the <span className="text-stone-900 font-bold">{activePlan}</span> active.</p>
                        )}
                        {!activePlan && (
                            <p className="text-stone-500 mt-2 font-mono text-sm italic">Affordable AI tutoring for the Nepali student.</p>
                        )}
                    </div>

                    <div className="grid md:grid-cols-3 gap-6">
                        {plans.map((plan) => {
                            const isActive = activePlan === plan.name;
                            const isLower = plan.tier < currentTier;
                            const isHigher = plan.tier > currentTier;

                            let buttonText = "Select Plan";
                            if (isActive) buttonText = "Currently Active";
                            if (isLower) buttonText = "Plan Owned";
                            if (isHigher && currentTier > 0) buttonText = `Upgrade to ${plan.id === 'lifetime' ? 'Lifetime' : 'Pack'}`;

                            return (
                                <div
                                    key={plan.id}
                                    className={`p-6 bg-white border-2 border-stone-900 relative flex flex-col h-full transform transition-transform hover:-translate-y-2 ${plan.popular ? 'shadow-[8px_8px_0px_0px_rgba(250,204,21,1)]' : 'shadow-[8px_8px_0px_0px_rgba(28,25,23,1)]'} ${(isActive || isLower) ? 'opacity-75' : ''}`}
                                >
                                    {plan.popular && (
                                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-400 text-stone-900 text-[10px] font-black px-3 py-1 border-2 border-stone-900 uppercase">
                                            Best Value
                                        </div>
                                    )}

                                    {plan.savings && !isActive && !isLower && (
                                        <div className="absolute -top-3 right-2 rotate-6">
                                            <span className="bg-green-100 text-green-700 text-[10px] font-black px-2 py-1 border border-green-700 rounded-sm uppercase tracking-wider shadow-[2px_2px_0px_0px_rgb(21,128,61)]">
                                                {plan.savings}
                                            </span>
                                        </div>
                                    )}

                                    <div className="flex justify-between items-start mb-4">
                                        <div className="p-2 bg-stone-50 border border-stone-100">{plan.icon}</div>
                                        <div className="text-right">
                                            <p className="text-3xl font-black text-stone-900 leading-none">{plan.price}</p>
                                            <p className="text-[10px] text-stone-400 uppercase tracking-widest mt-1">/ {plan.duration}</p>
                                        </div>
                                    </div>

                                    <h3 className="font-serif font-black text-xl mb-1">{plan.name}</h3>
                                    <p className="text-xs text-stone-500 mb-6 leading-relaxed">{plan.description}</p>

                                    <ul className="space-y-3 mb-8 flex-1">
                                        {plan.features.map((feat, i) => (
                                            <li key={i} className="flex items-center gap-2 text-[11px] font-bold text-stone-700">
                                                <Check size={12} className="text-green-600" />
                                                {feat}
                                            </li>
                                        ))}
                                    </ul>

                                    <button
                                        onClick={() => onSelectPlan(plan)}
                                        disabled={isActive || isLower}
                                        className={`w-full py-4 font-black uppercase tracking-widest transition-all border-2 border-stone-900 ${(isActive || isLower) ? 'bg-stone-200 text-stone-500 cursor-not-allowed border-stone-300' :
                                            plan.popular ? 'bg-yellow-400 text-stone-900 hover:bg-stone-900 hover:text-white' :
                                                'bg-stone-50 text-stone-900 hover:bg-stone-900 hover:text-white'
                                            }`}
                                    >
                                        {buttonText}
                                    </button>
                                </div>
                            );
                        })}
                    </div>

                    {!activePlan && !isLoggedIn && (
                        <div
                            ref={retrieveAccessRef}
                            className="mt-12 pt-8 border-t-2 border-dashed border-stone-200 text-center"
                        >
                            <p className="text-sm font-bold text-stone-900 mb-2 uppercase tracking-tighter italic">Already Paid?</p>
                            <p className="text-[10px] text-stone-500 mb-6 font-medium uppercase tracking-widest px-4">Your access is now tied to your account. Please log in to restore your premium features.</p>

                            <button
                                onClick={onShowAuth}
                                className="bg-stone-900 text-white px-8 py-4 text-xs font-black uppercase hover:bg-yellow-400 hover:text-stone-900 transition-colors border-2 border-stone-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1"
                            >
                                Sign In to My Account
                            </button>
                        </div>
                    )}

                    <p className="text-center mt-10 text-[10px] text-stone-400 font-mono">
                        Join a growing number of Nepali students using the Architect.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default PricingModal;
