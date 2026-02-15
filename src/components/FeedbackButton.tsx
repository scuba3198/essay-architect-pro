import React from 'react';
import { MessageSquarePlus } from 'lucide-react';

interface FeedbackButtonProps {
    onClick: () => void;
}

const FeedbackButton: React.FC<FeedbackButtonProps> = ({ onClick }) => {

    return (
        <button
            onClick={onClick}
            className="fixed md:absolute bottom-16 md:bottom-0 left-6 z-[60] group flex items-center gap-2 bg-yellow-400 text-stone-900 border-2 border-stone-900 px-4 py-3 shadow-[4px_4px_0px_0px_rgba(28,25,23,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-200"
            title="Give Feedback"
        >
            <MessageSquarePlus size={20} className="group-hover:scale-110 transition-transform" />
            <span className="text-xs font-black uppercase tracking-widest hidden md:block">Feedback?</span>
        </button>
    );
};

export default FeedbackButton;
