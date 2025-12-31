import React, { useState } from 'react';
import { X, Upload, CheckCircle2, QrCode, Phone, Loader2, ArrowLeft } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const PaymentModal = ({ onClose, plan, onSuccess, userEmail }) => {
    const [step, setStep] = useState(1); // 1: Info, 2: Upload, 3: Success
    const [fileName, setFileName] = useState("");
    const [email, setEmail] = useState(userEmail || "");
    const [isUploading, setIsUploading] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState('gbime'); // 'gbime' or 'esewa'

    const sendDiscordNotification = async (imageUrl, planName, price) => {
        // ... rest of the function (no changes until step 3 button)
        const webhookUrl = import.meta.env.VITE_DISCORD_WEBHOOK_URL;
        if (!webhookUrl || webhookUrl.includes("YOUR_")) return;

        const payload = {
            embeds: [{
                title: "💰 New Payment Submission",
                color: 16766720, // Yellow
                fields: [
                    { name: "Plan", value: planName, inline: true },
                    { name: "Amount", value: price, inline: true },
                    { name: "User Email", value: email || "Not provided", inline: false },
                    { name: "Status", value: "Pending Verification", inline: false }
                ],
                image: { url: imageUrl },
                timestamp: new Date().toISOString()
            }]
        };

        try {
            await fetch(webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
        } catch (err) {
            console.error("Discord integration failed:", err);
        }
    };

    const handleUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setIsUploading(true);
        setFileName(file.name);

        try {
            // 1. Upload to Supabase Storage
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `screenshots/${fileName}`;

            const { error: uploadError, data } = await supabase.storage
                .from('payments')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            // 2. Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('payments')
                .getPublicUrl(filePath);

            // 3. Save to Database
            const { error: dbError } = await supabase
                .from('payments')
                .insert([{
                    user_email: email,
                    plan_name: plan.name,
                    amount: plan.price,
                    screenshot_url: publicUrl,
                    status: 'pending',
                    created_at: new Date().toISOString()
                }]);

            if (dbError) throw dbError;

            // 4. Notify Discord
            await sendDiscordNotification(publicUrl, plan.name, plan.price);

            // 5. Track Facebook Pixel
            if (window.fbq) {
                window.fbq('track', 'Purchase', {
                    value: plan.price,
                    currency: 'NPR', // Assuming NPR as per the context of eSewa/Khalti, or use 'USD' if that's the base
                    content_name: plan.name
                });
            }

            setStep(3);
        } catch (error) {
            console.error("Upload failed:", error);
            alert(`Upload failed: ${error.message || 'Unknown error'}. Please check your Supabase settings.`);
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div
            className="fixed inset-0 bg-stone-900/95 z-[120] flex items-center justify-center p-4 animate-in fade-in duration-300"
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <div className="bg-[#f4f1ea] border-2 border-stone-900 shadow-[12px_12px_0px_0px_rgba(255,255,255,1)] max-w-md w-full p-8 relative max-h-[90vh] overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-stone-300 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-stone-400">
                <button onClick={onClose} className="absolute top-4 right-4 text-stone-400 hover:text-stone-900 transition-colors">
                    <X size={24} strokeWidth={3} />
                </button>

                {step === 1 && (
                    <div className="animate-in slide-in-from-right-4 duration-300">
                        <h2 className="text-2xl font-serif font-black text-stone-900 mb-6 uppercase tracking-tight italic">
                            Select Payment Method
                        </h2>

                        <div className="flex gap-2 mb-4">
                            <button
                                onClick={() => setPaymentMethod('gbime')}
                                className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest border-2 border-stone-900 transition-all ${paymentMethod === 'gbime' ? 'bg-stone-900 text-white' : 'bg-white text-stone-900 hover:bg-stone-50'}`}
                            >
                                FonePay/Khalti/eSewa
                            </button>
                            <button
                                onClick={() => setPaymentMethod('esewa')}
                                className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest border-2 border-stone-900 transition-all ${paymentMethod === 'esewa' ? 'bg-stone-900 text-white' : 'bg-white text-stone-900 hover:bg-stone-50'}`}
                            >
                                eSewa QR
                            </button>
                        </div>

                        <div className="bg-white border-2 border-stone-900 p-4 mb-6">
                            <div className="aspect-square w-full max-w-[240px] mx-auto bg-stone-50 border border-stone-100 mb-4 overflow-hidden">
                                <img
                                    src={paymentMethod === 'gbime' ? '/qrs/gbime_qr.jpg' : '/qrs/esewa_qr.jpg'}
                                    alt={`${paymentMethod} QR Code`}
                                    className="w-full h-full object-contain"
                                />
                            </div>

                            <p className="text-[10px] font-mono mb-2 text-stone-500 uppercase tracking-widest text-center">
                                {paymentMethod === 'gbime' ? 'FonePay / Khalti / eSewa' : 'eSewa Direct Payment'}
                            </p>

                            <div className="border-t border-stone-100 pt-4 mt-4">
                                <p className="text-xs font-mono mb-2 text-stone-500 uppercase tracking-widest">Your Email (To unlock access)</p>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="student@example.com"
                                    className="w-full bg-stone-50 border-2 border-stone-900 p-3 text-sm mb-4 outline-none focus:bg-yellow-50 transition-colors"
                                    required
                                />

                                <div className="flex justify-between items-end">
                                    <div>
                                        <p className="text-[10px] text-stone-400 uppercase tracking-widest mb-1">Total Amount</p>
                                        <p className="text-xl font-bold text-stone-900">{plan.price} <span className="text-xs font-normal text-stone-400">({plan.name})</span></p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] text-stone-400 uppercase tracking-widest mb-1">Recipient</p>
                                        <p className="text-xs font-bold text-stone-900">Mumukshu D.C</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex gap-3 items-start">
                                <div className="w-5 h-5 rounded-full bg-stone-900 text-white flex items-center justify-center text-[10px] shrink-0 mt-0.5">1</div>
                                <p className="text-xs text-stone-600">Scan the QR code above using your preferred banking app or eSewa.</p>
                            </div>
                            <div className="flex gap-3 items-start">
                                <div className="w-5 h-5 rounded-full bg-stone-900 text-white flex items-center justify-center text-[10px] shrink-0 mt-0.5">2</div>
                                <p className="text-xs text-stone-600">Take a screenshot of the successful transaction.</p>
                            </div>
                        </div>

                        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 mt-6 mb-2">
                            <p className="text-[10px] font-bold text-stone-900 uppercase tracking-wider mb-1">⚠️ Account Policy</p>
                            <p className="text-xs text-stone-700 leading-relaxed">
                                Please ensure you use the <strong>same email</strong> associated with your account. Your access will be unlocked across all your devices.
                            </p>
                        </div>

                        <button
                            onClick={() => {
                                if (!email || !email.includes('@')) {
                                    alert("Please enter a valid email to receive your access!");
                                    return;
                                }
                                setStep(2);
                            }}
                            className="w-full mt-8 bg-stone-900 text-white py-4 font-black uppercase tracking-widest hover:bg-yellow-400 hover:text-stone-900 transition-all flex items-center justify-center gap-2"
                        >
                            Next: Verify Payment <CheckCircle2 size={18} />
                        </button>
                    </div>
                )}

                {step === 2 && (
                    <div className="animate-in slide-in-from-right-4 duration-300">
                        <button
                            onClick={() => setStep(1)}
                            className="absolute top-8 left-8 text-stone-400 hover:text-stone-900 transition-colors"
                            title="Go Back"
                        >
                            <ArrowLeft size={24} strokeWidth={3} />
                        </button>

                        <h2 className="text-2xl font-serif font-black text-stone-900 mb-6 uppercase tracking-tight italic text-center">
                            Verify Payment
                        </h2>

                        <div className="space-y-6">
                            {/* Desktop Upload Option */}
                            <div className="bg-white border-2 border-stone-900 p-4">
                                <p className="text-[10px] font-black uppercase text-stone-400 mb-4 tracking-widest">Option A: Upload from this Device</p>
                                <div className={`aspect-video border-4 border-dashed border-stone-100 bg-stone-50 flex flex-col items-center justify-center p-8 text-center transition-colors relative ${isUploading ? 'opacity-50 pointer-events-none' : 'hover:border-stone-900 cursor-pointer group'}`}>
                                    {!isUploading && (
                                        <input
                                            type="file"
                                            className="absolute inset-0 opacity-0 cursor-pointer"
                                            onChange={handleUpload}
                                            accept="image/*"
                                        />
                                    )}
                                    {isUploading ? (
                                        <>
                                            <Loader2 size={32} className="text-stone-900 animate-spin mb-4" />
                                            <p className="text-xs font-bold text-stone-900 mb-1">Uploading...</p>
                                        </>
                                    ) : (
                                        <>
                                            <Upload size={32} className="text-stone-200 group-hover:text-stone-900 transition-colors mb-4" />
                                            <p className="text-xs font-bold text-stone-900 mb-1">Select Screenshot</p>
                                            <p className="text-[10px] text-stone-400">JPG, PNG, WEBP</p>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Mobile/WhatsApp Option */}
                            <div className="bg-yellow-400 border-2 border-stone-900 p-6 relative overflow-hidden group">
                                <div className="absolute -right-4 -top-4 text-stone-900 opacity-5 group-hover:rotate-12 transition-transform">
                                    <QrCode size={100} />
                                </div>
                                <p className="text-[10px] font-black uppercase text-stone-900 mb-2 tracking-widest">Option B: Paying from Mobile?</p>
                                <h3 className="font-serif font-black text-xl text-stone-900 mb-4 tracking-tight leading-none">Send Proof via WhatsApp</h3>

                                <p className="text-xs text-stone-800 font-medium mb-6 leading-relaxed">
                                    Paid using eSewa/Khalti on your phone? Send the screenshot to <strong>+977 986-2329617</strong> on WhatsApp and we'll unlock your access!
                                </p>

                                <a
                                    href={`https://wa.me/9779862329617?text=${encodeURIComponent(`Hi, I just paid for Essay Architect Pro (Email: ${email}). Here is my screenshot proof!`)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full bg-stone-900 text-white py-3 px-6 font-black uppercase tracking-widest hover:bg-white hover:text-stone-900 transition-all flex items-center justify-center gap-2 text-sm shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] hover:shadow-none"
                                >
                                    Open WhatsApp
                                </a>

                                <div className="mt-4 flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 bg-stone-900 rounded-full animate-pulse"></div>
                                    <p className="text-[9px] font-bold text-stone-800 uppercase tracking-widest">Instant Verification (10 AM - 10 PM)</p>
                                </div>
                            </div>
                        </div>

                        <p className="mt-6 text-[10px] leading-relaxed text-stone-500 italic text-center">
                            Verification is manual. Please allow up to 2 hours for access to be granted.
                        </p>
                    </div>
                )}

                {step === 3 && (
                    <div className="animate-in zoom-in-95 duration-500 text-center py-8">
                        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle2 size={40} />
                        </div>
                        <h2 className="text-3xl font-serif font-black text-stone-900 mb-2 uppercase tracking-tight italic">
                            Sent for Review!
                        </h2>
                        <p className="text-sm text-stone-500 mb-8 max-w-xs mx-auto">
                            We've received your screenshot ({fileName}). Your account will be upgraded as soon as the transaction is confirmed.
                        </p>

                        <div className="bg-white border text-left p-4 mb-8">
                            <p className="text-[10px] font-black uppercase text-stone-400 mb-2">Verification Window</p>
                            <p className="text-xs font-bold text-stone-800">10:00 AM - 10:00 PM (NST)</p>
                            <p className="text-[10px] text-stone-400 mt-1">Expected unlock time: 1-2 hours.</p>
                        </div>

                        <button
                            onClick={() => {
                                if (onSuccess) onSuccess(email);
                                onClose();
                            }}
                            className="w-full bg-stone-900 text-white py-4 font-black uppercase tracking-widest hover:bg-yellow-400 hover:text-stone-900 transition-all shadow-[4px_4px_0px_0px_rgba(28,25,23,0.2)]"
                        >
                            Retrieve My Access
                        </button>
                    </div>
                )}
            </div>
        </div >
    );
};

export default PaymentModal;
