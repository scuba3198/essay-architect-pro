import type { User } from "@supabase/supabase-js";
import { ArrowLeft, CheckCircle2, Loader2, QrCode, Upload, X } from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import type { Plan } from "../../types";

interface PaymentModalProps {
  onClose: () => void;
  plan: Plan;
  onSuccess: (email: string) => void;
  userEmail: string | null;
  user: User | null;
}

const PaymentModal: React.FC<PaymentModalProps> = ({
  onClose,
  plan,
  onSuccess,
  userEmail,
  user: passedUser,
}) => {
  const [step, setStep] = useState<number>(1); // 1: Info, 2: Upload, 3: Success
  const [fileName, setFileName] = useState<string>("");
  const [email] = useState<string>(userEmail || "");
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [paymentMethod, setPaymentMethod] = useState<"gbime" | "esewa">("gbime");
  const [isMobile, setIsMobile] = useState<boolean>(false);

  // Detect if user is on mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      console.log("No file selected");
      return;
    }

    console.log("Starting upload process for:", file.name, "Size:", file.size);
    setIsUploading(true);
    setFileName(file.name);

    try {
      // 1. Get User ID for RLS policies (Use passedUser if available to avoid extra DB roundtrip)
      let user = passedUser;
      if (!user) {
        console.log("No user prop, fetching user...");
        const {
          data: { user: fetchedUser },
          error: authError,
        } = await supabase.auth.getUser();
        if (authError || !fetchedUser)
          throw new Error("User authentication failed. Please try logging in again.");
        user = fetchedUser;
      }

      console.log("Authenticated as:", user.email, "id:", user.id);

      // 2. Upload to Supabase Storage
      const fileExt = file.name.split(".").pop() || "png";
      const uniqueFileName = `${Date.now()}-${Math.floor(Math.random() * 1000)}.${fileExt}`;
      const filePath = `screenshots/${user.id}/${uniqueFileName}`;

      console.log("Uploading to storage path:", filePath);
      const { error: uploadError } = await supabase.storage.from("payments").upload(filePath, file);

      if (uploadError) {
        console.error("Storage upload error:", uploadError);
        throw uploadError;
      }

      console.log("Upload successful, getting public URL...");

      // 3. Get Public URL
      const { data: urlData } = supabase.storage.from("payments").getPublicUrl(filePath);
      const publicUrl = urlData.publicUrl;

      console.log("Public URL generated:", publicUrl);

      // 4. Save to Database (include user_id for RLS policy)
      console.log("Saving payment record to database...");
      const { error: dbError } = await supabase.from("payments").insert([
        {
          user_id: user.id, // Required for RLS policy
          user_email: user.email, // Keep for display/notification purposes
          plan_name: plan.name,
          amount: plan.price,
          screenshot_url: publicUrl,
          status: "pending",
          created_at: new Date().toISOString(),
        },
      ]);

      if (dbError) {
        console.error("Database insert error:", dbError);
        throw dbError;
      }

      console.log("Database record saved. Triggering notification and pixel...");

      // 4. Notify Backend (which notifies Discord)
      try {
        const { callProAI } = await import("../../lib/api");
        console.log("API module loaded, sending payment notification...");
        await callProAI(
          `NEW_PAYMENT_SUBMITTED: ${plan.name} (${plan.price}) by ${user.email}`,
          "",
          "payment",
        );
        console.log("Payment notification sent successfully!");
      } catch (err) {
        console.error("Backend notification signal failed:", err);
        // Don't block the user flow, but log it
      }

      // 5. Track Facebook Pixel (Non-blocking)
      if (window.fbq) {
        try {
          window.fbq("track", "Purchase", {
            value: plan.price,
            currency: "NPR",
            content_name: plan.name,
          });
        } catch (fbError) {
          console.error("FB Pixel tracking failed:", fbError);
        }
      }

      console.log("Process complete! Moving to success screen.");
      setStep(3);
    } catch (error: unknown) {
      console.error("Critical upload flow failure:", error);
      const message = error instanceof Error ? error.message : "Unknown error";
      alert(
        `Upload failed: ${message}. Please try again or contact support if the issue persists.`,
      );
    } finally {
      console.log("Setting isUploading to false");
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
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-stone-400 hover:text-stone-900 transition-colors"
        >
          <X size={24} strokeWidth={3} />
        </button>

        {step === 1 && (
          <div className="animate-in slide-in-from-right-4 duration-300">
            <h2 className="text-2xl font-serif font-black text-stone-900 mb-6 uppercase tracking-tight italic">
              Select Payment Method
            </h2>

            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setPaymentMethod("gbime")}
                className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest border-2 border-stone-900 transition-all ${paymentMethod === "gbime" ? "bg-stone-900 text-white" : "bg-white text-stone-900 hover:bg-stone-50"}`}
              >
                FonePay/Khalti/eSewa
              </button>
              <button
                onClick={() => setPaymentMethod("esewa")}
                className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest border-2 border-stone-900 transition-all ${paymentMethod === "esewa" ? "bg-stone-900 text-white" : "bg-white text-stone-900 hover:bg-stone-50"}`}
              >
                eSewa QR
              </button>
            </div>

            <div className="bg-white border-2 border-stone-900 p-4 mb-6">
              <div className="aspect-square w-full max-w-[240px] mx-auto bg-stone-50 border border-stone-100 mb-4 overflow-hidden">
                <img
                  src={paymentMethod === "gbime" ? "/qrs/gbime_qr.jpg" : "/qrs/esewa_qr.jpg"}
                  alt={`${paymentMethod} QR Code`}
                  className="w-full h-full object-contain"
                />
              </div>

              <p className="text-[10px] font-mono mb-2 text-stone-500 uppercase tracking-widest text-center">
                {paymentMethod === "gbime" ? "FonePay / Khalti / eSewa" : "eSewa Direct Payment"}
              </p>

              <div className="border-t border-stone-100 pt-4 mt-4">
                <p className="text-xs font-mono mb-2 text-stone-500 uppercase tracking-widest px-1">
                  Tied to Account
                </p>
                <input
                  type="email"
                  value={email}
                  readOnly
                  className="w-full bg-stone-100 border-2 border-stone-900 p-3 text-sm mb-4 outline-none font-bold text-stone-500 cursor-not-allowed"
                  required
                />
                <p className="text-[10px] text-stone-400 mb-4 px-1 italic">
                  Note: Access will be unlocked for this account after verification.
                </p>

                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-[10px] text-stone-400 uppercase tracking-widest mb-1">
                      Total Amount
                    </p>
                    <p className="text-xl font-bold text-stone-900">
                      {plan.price}{" "}
                      <span className="text-xs font-normal text-stone-400">({plan.name})</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-stone-400 uppercase tracking-widest mb-1">
                      Recipient
                    </p>
                    <p className="text-xs font-bold text-stone-900">Mumukshu D.C</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex gap-3 items-start">
                <div className="w-5 h-5 rounded-full bg-stone-900 text-white flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                  1
                </div>
                <p className="text-xs text-stone-600">
                  Scan the QR code above using your preferred banking app or eSewa.
                </p>
              </div>
              <div className="flex gap-3 items-start">
                <div className="w-5 h-5 rounded-full bg-stone-900 text-white flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                  2
                </div>
                <p className="text-xs text-stone-600">
                  Take a screenshot of the successful transaction.
                </p>
              </div>
            </div>

            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 mt-6 mb-2">
              <p className="text-[10px] font-bold text-stone-900 uppercase tracking-wider mb-1">
                ⚠️ Account Policy
              </p>
              <p className="text-xs text-stone-700 leading-relaxed">
                Please ensure you use the <strong>same email</strong> associated with your account.
                Your access will be unlocked across all your devices.
              </p>
            </div>

            <button
              onClick={() => {
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
              {/* Option A: Upload from this Device - MOBILE ONLY */}
              {isMobile && (
                <div className="bg-white border-2 border-stone-900 p-4">
                  <p className="text-[10px] font-black uppercase text-stone-400 mb-4 tracking-widest">
                    Upload from this Device
                  </p>
                  <div
                    className={`aspect-video border-4 border-dashed border-stone-100 bg-stone-50 flex flex-col items-center justify-center p-8 text-center transition-colors relative ${isUploading ? "opacity-50 pointer-events-none" : "hover:border-stone-900 cursor-pointer group"}`}
                  >
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
                        <Upload
                          size={32}
                          className="text-stone-200 group-hover:text-stone-900 transition-colors mb-4"
                        />
                        <p className="text-xs font-bold text-stone-900 mb-1">Select Screenshot</p>
                        <p className="text-[10px] text-stone-400">JPG, PNG, WEBP</p>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Option B: WhatsApp - DESKTOP ONLY */}
              {!isMobile && (
                <div className="bg-yellow-400 border-2 border-stone-900 p-6 relative overflow-hidden group">
                  <div className="absolute -right-4 -top-4 text-stone-900 opacity-5 group-hover:rotate-12 transition-transform">
                    <QrCode size={100} />
                  </div>
                  <p className="text-[10px] font-black uppercase text-stone-900 mb-2 tracking-widest">
                    Send Proof via WhatsApp
                  </p>
                  <h3 className="font-serif font-black text-xl text-stone-900 mb-4 tracking-tight leading-none">
                    Verify Your Payment
                  </h3>

                  <p className="text-xs text-stone-800 font-medium mb-6 leading-relaxed">
                    Send the payment screenshot to <strong>+977 986-2329617</strong> on WhatsApp and
                    we'll unlock your access!
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
                    <p className="text-[9px] font-bold text-stone-800 uppercase tracking-widest">
                      Instant Verification (10 AM - 10 PM)
                    </p>
                  </div>
                </div>
              )}
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
              We've received your screenshot ({fileName}). Your account will be upgraded as soon as
              the transaction is confirmed.
            </p>

            <div className="bg-white border text-left p-4 mb-8">
              <p className="text-[10px] font-black uppercase text-stone-400 mb-2">
                Verification Window
              </p>
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
    </div>
  );
};

export default PaymentModal;
