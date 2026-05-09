import { motion } from "framer-motion";
import { Star } from "lucide-react";

const logos = [
  { name: "Qatar Construction Co", industry: "Construction" },
  { name: "Gulf Security Services", industry: "Security" },
  { name: "Dubai Hospitality Group", industry: "Hospitality" },
  { name: "Saudi Telecom", industry: "Telecom" },
  { name: "Emirates Healthcare", industry: "Healthcare" },
  { name: "Kuwait Oil & Gas", industry: "Oil & Gas" },
  { name: "Abu Dhabi Engineering", industry: "Engineering" },
  { name: "Bahrain Logistics", industry: "Logistics" },
];

const testimonials = [
  {
    quote: "KeFeL transformed our hiring. We filled 50+ construction positions in 2 weeks with verified workers from Uganda. The AI matching is incredible.",
    author: "Ahmed Al-Mansouri",
    role: "HR Director",
    company: "Qatar Construction Co",
    rating: 5,
  },
  {
    quote: "The verification system gives us confidence. Every candidate is passport-verified, medically cleared, and ready for deployment. Game changer for Gulf hiring.",
    author: "Sarah Johnson",
    role: "Talent Acquisition Lead",
    company: "Dubai Hospitality Group",
    rating: 5,
  },
  {
    quote: "We reduced our time-to-hire from 3 months to 2 weeks. The AI-powered shortlisting and bulk hiring features are exactly what we needed for our workforce expansion.",
    author: "Khalid Al-Rashid",
    role: "VP of Operations",
    company: "Saudi Telecom",
    rating: 5,
  },
];

export function TrustedBySection() {
  return (
    <section className="py-24 bg-white relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-200 to-transparent" />

      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-blue-600 font-bold text-sm tracking-widest uppercase mb-4 block">Trusted By Industry Leaders</span>
          <h2 className="text-4xl md:text-5xl font-heading font-black text-navy-900 mb-4">
            Leading employers choose KeFeL
          </h2>
          <p className="text-gray-500 max-w-2xl mx-auto text-lg">
            From construction to healthcare, companies across the Gulf trust us for their workforce recruitment needs.
          </p>
        </motion.div>

        {/* Logo Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-20">
          {logos.map((logo, i) => (
            <motion.div
              key={logo.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="group bg-gray-50 hover:bg-blue-50 rounded-2xl p-6 text-center transition-all duration-300 border border-gray-100 hover:border-blue-200"
            >
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center mx-auto mb-3">
                <span className="text-white font-black text-lg">{logo.name.charAt(0)}</span>
              </div>
              <div className="font-bold text-gray-800 text-sm">{logo.name}</div>
              <div className="text-xs text-gray-400 mt-1">{logo.industry}</div>
            </motion.div>
          ))}
        </div>

        {/* Testimonials */}
        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.author}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-gray-50 rounded-3xl p-8 border border-gray-100 hover:border-blue-200 transition-all duration-300 card-hover"
            >
              <div className="flex gap-1 mb-5">
                {Array.from({ length: t.rating }).map((_, j) => (
                  <Star key={j} className="h-4 w-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-gray-600 leading-relaxed mb-6 italic">
                &ldquo;{t.quote}&rdquo;
              </p>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                  {t.author.split(" ").map(n => n[0]).join("")}
                </div>
                <div>
                  <div className="font-bold text-gray-800 text-sm">{t.author}</div>
                  <div className="text-xs text-gray-400">{t.role}, {t.company}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
