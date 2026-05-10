import { motion } from "framer-motion";
import { Star, Quote, ArrowLeft, ArrowRight } from "lucide-react";
import { useState } from "react";

const testimonials = [
  {
    quote: "KeFeL has completely transformed how we hire. We deployed 200+ construction workers from Uganda to Qatar in just 3 months. The AI matching and verification system saved us months of manual screening.",
    author: "Abdulaziz Al-Thani",
    role: "Chief HR Officer",
    company: "Qatar Construction Group",
    rating: 5,
    image: null,
  },
  {
    quote: "The bulk hiring feature is a game-changer. We needed 50 security guards urgently and KeFeL delivered pre-screened, verified candidates within a week. The visa processing support was invaluable.",
    author: "Fatima Al-Mansouri",
    role: "Talent Acquisition Director",
    company: "Gulf Security Services",
    rating: 5,
    image: null,
  },
  {
    quote: "As a healthcare provider, finding qualified nurses is our biggest challenge. KeFeL's verification system gives us confidence that every candidate is properly certified and medically cleared.",
    author: "Dr. Omar Hassan",
    role: "Medical Director",
    company: "Dubai Healthcare City",
    rating: 5,
    image: null,
  },
  {
    quote: "The AI-powered shortlisting reduced our screening time by 80%. We can now review the top 10% of candidates instantly and focus on what matters - making the right hire.",
    author: "Sarah Williams",
    role: "VP of People",
    company: "Saudi Telecom Company",
    rating: 5,
    image: null,
  },
  {
    quote: "We use KeFeL for all our domestic worker placements. The verification badges give our clients complete peace of mind. Every worker is passport-verified, medically cleared, and trained.",
    author: "Layla Ibrahim",
    role: "Operations Manager",
    company: "Emirates Household Services",
    rating: 5,
    image: null,
  },
];

export function TestimonialsSection() {
  const [current, setCurrent] = useState(0);
  const t = testimonials[current];

  return (
    <section className="py-24 employer-gradient-light relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-blue opacity-30 pointer-events-none" />

      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-blue-400lue-600 font-bold text-sm tracking-widest uppercase mb-4 block">
            Client Success
          </span>
          <h2 className="text-4xl md:text-5xl font-heading font-black mb-4">
            Trusted by industry{" "}
            <span className="text-gradient-blue">leaders</span>
          </h2>
          <p className="text-gray-400 max-w-3xl mx-auto text-lg">
            See how leading employers use KeFeL to build world-class teams.
          </p>
        </motion.div>

        <div className="max-w-4xl mx-auto">
          <motion.div
            key={current}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="bg-surface rounded-3xl p-10 md:p-14 border border-[#2C2C2E] shadow-xl relative"
          >
            <Quote className="h-12 w-12 text-blue-400lue-100 absolute top-8 left-8" />

            <div className="relative z-10">
              <div className="flex gap-1 mb-6">
                {Array.from({ length: t.rating }).map((_, i) => (
                  <Star key={i} className="h-5 w-5 fill-amber-400 text-amber-400" />
                ))}
              </div>

              <p className="text-xl md:text-2xl text-gray-700 leading-relaxed mb-8 font-medium italic">
                &ldquo;{t.quote}&rdquo;
              </p>

              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-black text-lg">
                    {t.author.split(" ").map(n => n[0]).join("")}
                  </div>
                  <div>
                    <div className="font-bold text-gray-100 text-lg">{t.author}</div>
                    <div className="text-sm text-gray-400">{t.role}</div>
                    <div className="text-sm text-blue-400lue-600 font-medium">{t.company}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrent(current === 0 ? testimonials.length - 1 : current - 1)}
                    className="h-12 w-12 rounded-full border border-[#2C2C2E] flex items-center justify-center hover:border-blue-300 hover:bg-blue-500lue-50 transition-all"
                  >
                    <ArrowLeft className="h-5 w-5 text-gray-300" />
                  </button>
                  <button
                    onClick={() => setCurrent(current === testimonials.length - 1 ? 0 : current + 1)}
                    className="h-12 w-12 rounded-full bg-blue-500lue-600 flex items-center justify-center hover:bg-blue-500lue-700 transition-all"
                  >
                    <ArrowRight className="h-5 w-5 text-white" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Dots */}
          <div className="flex justify-center mt-8 gap-2">
            {testimonials.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === current ? "w-8 bg-blue-500lue-600" : "w-2 bg-gray-300 hover:bg-gray-400"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
