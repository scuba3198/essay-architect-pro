import { Heart, Send, Star, X } from 'lucide-react';
import type React from 'react';
import { useState } from 'react';
import { DeviceService } from '../../../infrastructure/device/device-id';
import { supabase } from '../../../infrastructure/db/supabase';

import { Effect } from 'effect';
import { appRuntime } from '../../../infrastructure/runtime';

interface FeedbackModalProps {
  onClose: () => void;
  initialEmail?: string;
  deviceService: DeviceService;
}

const FeedbackModal: React.FC<FeedbackModalProps> = ({
  onClose,
  deviceService,
  initialEmail = '',
}) => {
  const [rating, setRating] = useState<number>(0);
  const [comment, setComment] = useState<string>('');
  const [email, setEmail] = useState<string>(initialEmail);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const sendDiscordNotification = (feedbackData: {
    rating: number | null;
    email: string | null;
    comment: string | null;
    visitor_id: string;
  }) => {
    const webhookUrl = import.meta.env.VITE_DISCORD_WEBHOOK_URL;
    if (!webhookUrl) return Effect.succeed(void 0);

    const stars = feedbackData.rating ? '⭐'.repeat(feedbackData.rating) : 'No rating';

    const embed = {
      title: '🏗️ New Feedback Received!',
      color: 0xfacc15, // Yellow matches yellow-400
      fields: [
        { name: 'Rating', value: stars, inline: true },
        {
          name: 'Email',
          value: feedbackData.email || 'Anonymous',
          inline: true,
        },
        {
          name: 'Comment',
          value: feedbackData.comment || 'No comment provided',
        },
        { name: 'Visitor ID', value: `\`${feedbackData.visitor_id}\`` },
      ],
      footer: { text: 'Essay Architect Pro Notification System' },
      timestamp: new Date().toISOString(),
    };

    return Effect.tryPromise({
      try: () =>
        fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: '🔔 **New feedback architected!** @here',
            embeds: [embed],
          }),
        }),
      catch: (err) => new Error(`Discord notification failed: ${err}`),
    }).pipe(
      Effect.catchAll((err) => {
        console.error(err);
        return Effect.succeed(void 0);
      }),
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0 && !comment.trim()) {
      setError('Please provide a rating or a comment.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    appRuntime.runPromise(
      Effect.gen(function* () {
        const visitorID = yield* deviceService.getVisitorID();
        const feedbackRecord = {
          visitor_id: visitorID,
          rating: rating > 0 ? rating : null,
          comment: comment.trim() || null,
          email: email.trim() || null,
        };

        const { error: supabaseError } = yield* Effect.tryPromise({
          try: () => supabase.from('feedback').insert([feedbackRecord]),
          catch: (err) => new Error(`Supabase insert failed: ${err}`),
        });

        if (supabaseError) return yield* Effect.fail(supabaseError);

        // Send Discord Notification (Fire and forget)
        yield* Effect.forkDaemon(sendDiscordNotification(feedbackRecord));

        setSubmitted(true);
        yield* Effect.forkDaemon(
          Effect.gen(function* () {
            yield* Effect.sleep('3 seconds');
            onClose();
          }),
        );
      }).pipe(
        Effect.catchAll((err) => {
          console.error('Feedback submission error:', err);
          setError('Failed to send feedback. Please try again later.');
          return Effect.succeed(void 0);
        }),
        Effect.ensuring(Effect.sync(() => setIsSubmitting(false))),
      ),
    );
  };

  if (submitted) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm animate-in fade-in duration-300">
        <div className="bg-white border-4 border-stone-900 shadow-[12px_12px_0px_0px_rgba(28,25,23,1)] w-full max-w-md p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-green-500"></div>
          <div className="mb-6 flex justify-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-green-600 animate-bounce">
              <Heart size={32} fill="currentColor" />
            </div>
          </div>
          <h2 className="text-3xl font-serif font-black text-stone-900 mb-2 uppercase tracking-tighter">
            THANK YOU!
          </h2>
          <p className="text-stone-600 font-medium mb-6">
            Your feedback helps us architect a better experience for everyone.
          </p>
          <button
            onClick={onClose}
            className="w-full py-4 bg-stone-900 text-white font-black uppercase tracking-widest hover:bg-stone-800 transition-colors"
          >
            Close Wizard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-[#fcfaf7] border-4 border-stone-900 shadow-[12px_12px_0px_0px_rgba(28,25,23,1)] w-full max-w-lg relative overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-stone-900 text-white p-6 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-yellow-400 flex items-center justify-center font-serif font-black text-stone-900">
              F
            </div>
            <h2 className="text-xl font-serif font-black uppercase tracking-widest">
              Feedback Architect
            </h2>
          </div>
          <button
            onClick={onClose}
            className="hover:rotate-90 transition-transform duration-300 p-1"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-8 overflow-y-auto custom-scrollbar">
          <p className="text-stone-500 font-bold text-xs uppercase tracking-[0.2em] mb-8 border-l-4 border-yellow-400 pl-4">
            What do you think of Essay Architect Pro? Be brutal, we can take it.
          </p>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Rating */}
            <div>
              <div className="block text-stone-900 font-black uppercase text-xs tracking-widest mb-3">
                Overall Rating
              </div>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(rating === star ? 0 : star)}
                    className={`w-12 h-12 flex items-center justify-center border-2 border-stone-900 transition-all ${
                      rating >= star
                        ? 'bg-yellow-400 text-stone-900'
                        : 'bg-white text-stone-300 hover:border-yellow-400'
                    }`}
                  >
                    <Star
                      size={24}
                      fill={rating >= star ? 'currentColor' : 'none'}
                      strokeWidth={3}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Comment */}
            <div>
              <label
                htmlFor="feedback-comment"
                className="block text-stone-900 font-black uppercase text-xs tracking-widest mb-3"
              >
                Your Suggestions / Thoughts
              </label>
              <textarea
                id="feedback-comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full h-32 p-4 bg-white border-2 border-stone-900 font-medium focus:ring-4 focus:ring-yellow-400/20 focus:outline-none resize-none placeholder:text-stone-300"
                placeholder="Feature ideas, bugs, or just generic appreciation..."
              ></textarea>
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="feedback-email"
                className="block text-stone-900 font-black uppercase text-xs tracking-widest mb-3"
              >
                Email (Optional)
              </label>
              <div className="relative">
                <input
                  id="feedback-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-4 bg-white border-2 border-stone-900 font-medium focus:ring-4 focus:ring-yellow-400/20 focus:outline-none placeholder:text-stone-300"
                  placeholder="your@email.com"
                />
                <p className="mt-2 text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                  Only if you want a response back.
                </p>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border-2 border-red-500 p-4 text-red-600 text-xs font-bold uppercase tracking-wider animate-pulse">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-5 flex items-center justify-center gap-3 font-black uppercase tracking-[0.2em] transition-all border-2 border-stone-900 ${
                isSubmitting
                  ? 'bg-stone-100 text-stone-400 cursor-not-allowed'
                  : 'bg-stone-900 text-white hover:bg-yellow-400 hover:text-stone-900 shadow-[6px_6px_0px_0px_rgba(28,25,23,1)] hover:shadow-none'
              }`}
            >
              {isSubmitting ? (
                'PROCESSING...'
              ) : (
                <>
                  SUBMIT FEEDBACK <Send size={18} />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default FeedbackModal;
