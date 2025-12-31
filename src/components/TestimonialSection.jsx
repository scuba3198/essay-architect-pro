import React from 'react';
import { Star } from 'lucide-react';

const TestimonialCard = ({ name, role, text, stars = 5 }) => (
    <div className="bg-stone-100 p-8 border-2 border-stone-200 hover:border-stone-900 transition-colors relative">
        <div className="flex gap-1 mb-4 text-yellow-500">
            {[...Array(stars)].map((_, i) => (
                <Star key={i} size={16} fill="currentColor" />
            ))}
        </div>
        <p className="text-stone-800 font-medium mb-6 leading-relaxed italic">"{text}"</p>
        <div>
            <h4 className="font-serif font-black text-lg text-stone-900">{name}</h4>
            <p className="text-stone-500 text-xs font-bold uppercase tracking-widest">{role}</p>
        </div>
    </div>
);

const TestimonialSection = () => {
    const testimonials = [
        {
            name: "Aarav Sharma",
            role: "IELTS Band 8.0",
            text: "I was stuck at 6.5 in writing for months. Essay Architect's structure wizard forced me to organize my thoughts before writing. The AI grading is scarily accurate to the real exam."
        },
        {
            name: "Priya Karki",
            role: "PTE 79+",
            text: "The instant feedback on my vocabulary was a game changer. It doesn't just correct grammar; it suggests better academic words. Finally got my desired score for Australia!"
        },
        {
            name: "Sital Adhikari",
            role: "IELTS Band 7.5",
            text: "As a Nepali student, I struggled with 'academic tone'. This tool taught me exactly how to sound formal and objective. Highly recommended for anyone serious about study abroad."
        },
        {
            name: "Rohan Maharjan",
            role: "IELTS Band 8.0",
            text: "Worth every rupee. The 'Examiner' mode is like having a private tutor available 24/7. It highlighted my cohesion errors instantly."
        }
    ];

    return (
        <section className="py-20 bg-white border-b-2 border-stone-900">
            <div className="max-w-7xl mx-auto px-6 md:px-12">
                <div className="mb-12 text-center">
                    <h2 className="text-4xl md:text-5xl font-black font-serif text-stone-900 mb-4">
                        Trusted by High Achievers
                    </h2>
                    <p className="text-stone-500 font-medium max-w-2xl mx-auto">
                        Join hundreds of students from Nepal who have smashed their writing goals.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {testimonials.map((t, index) => (
                        <TestimonialCard key={index} {...t} />
                    ))}
                </div>
            </div>
        </section>
    );
};

export default TestimonialSection;
