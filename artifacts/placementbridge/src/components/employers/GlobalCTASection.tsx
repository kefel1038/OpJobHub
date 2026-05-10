import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ArrowRight, Sparkles, MessageSquare, Phone } from "lucide-react";

export function GlobalCTASection() {
  return (
    <section className="py-28 employer-gradient relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-white opacity-[0.03] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500lue-500/5 rounded-full blur-[150px]" />

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto text-center"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-6 py-2 mb-8"
          >
            <Sparkles className="h-4 w-4 text-blue-400lue-400" />
            <span className="text-blue-400lue-300 font-medium">Start hiring in minutes</span>
          </motion.div>

          <h2 className="text-5xl md:text-7xl font-heading font-black text-white mb-6 leading-[1.05]">
            Ready to build your{" "}
            <span className="text-gradient">global workforce</span>
            ?
          </h2>

          <p className="text-xl text-blue-400lue-200/60 max-w-2xl mx-auto mb-12 leading-relaxed">
            Join 500+ employers who trust KeFeL for their recruitment needs.
            From a single hire to a thousand, we've got you covered.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button asChild className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white border-0 rounded-full px-12 h-14 text-lg font-bold shadow-xl shadow-blue-600/25 group">
              <Link href="/post-job">
                Post a Job Free
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <Button variant="outline" asChild className="border-blue-400/30 text-blue-400lue-300 hover:bg-blue-500lue-500/10 hover:text-blue-400lue-200 rounded-full px-10 h-14 text-lg font-bold">
              <Link href="/contact">
                <MessageSquare className="mr-2 h-5 w-5" />
                Talk to Sales
              </Link>
            </Button>
            <Button variant="ghost" asChild className="text-blue-400lue-300 hover:text-white hover:bg-white/5 rounded-full px-8 h-14 text-lg font-medium gap-2">
              <a href="tel:+97451306916">
                <Phone className="h-5 w-5" />
                +974 5130 6916
              </a>
            </Button>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="mt-12 flex items-center justify-center gap-8 text-sm text-blue-400lue-300/40"
          >
            <span>No credit card required</span>
            <span className="h-1 w-1 rounded-full bg-blue-500lue-300/20" />
            <span>Free plan available</span>
            <span className="h-1 w-1 rounded-full bg-blue-500lue-300/20" />
            <span>Cancel anytime</span>
          </motion.div>
        </motion.div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
    </section>
  );
}
