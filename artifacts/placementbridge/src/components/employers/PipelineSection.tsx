import { motion } from "framer-motion";
import {
  FileText, Eye, Star, MessageSquareText, CheckCircle2, Plane,
  ArrowRight, Clock, Calendar, UserPlus
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

const pipelineStages = [
  {
    label: "Applied",
    icon: FileText,
    count: 48,
    color: "bg-blue-500lue-500",
    textColor: "text-blue-400lue-600",
    bgColor: "bg-blue-500lue-50",
    candidates: [
      { name: "James O.", role: "Construction Worker", time: "2h ago" },
      { name: "Mary A.", role: "Cleaner", time: "3h ago" },
      { name: "Peter K.", role: "Driver", time: "5h ago" },
    ],
  },
  {
    label: "Reviewed",
    icon: Eye,
    count: 32,
    color: "bg-indigo-500",
    textColor: "text-indigo-600",
    bgColor: "bg-indigo-50",
    candidates: [
      { name: "Sarah M.", role: "Security Guard", time: "1d ago" },
      { name: "John D.", role: "Electrician", time: "1d ago" },
    ],
  },
  {
    label: "Shortlisted",
    icon: Star,
    count: 18,
    color: "bg-amber-500",
    textColor: "text-amber-600",
    bgColor: "bg-amber-50",
    candidates: [
      { name: "Grace W.", role: "Domestic Worker", time: "2d ago" },
      { name: "David K.", role: "Foreman", time: "2d ago" },
    ],
  },
  {
    label: "Interviewed",
    icon: MessageSquareText,
    count: 12,
    color: "bg-purple-500",
    textColor: "text-purple-600",
    bgColor: "bg-purple-50",
    candidates: [
      { name: "Esther N.", role: "Nurse", time: "3d ago" },
      { name: "Michael S.", role: "Technician", time: "3d ago" },
    ],
  },
  {
    label: "Hired",
    icon: CheckCircle2,
    count: 8,
    color: "bg-emerald-500",
    textColor: "text-emerald-600",
    bgColor: "bg-emerald-50",
    candidates: [
      { name: "Joseph O.", role: "Foreman", time: "5d ago" },
      { name: "Faith P.", role: "Housekeeper", time: "5d ago" },
    ],
  },
  {
    label: "Deployed",
    icon: Plane,
    count: 5,
    color: "bg-cyan-500",
    textColor: "text-cyan-600",
    bgColor: "bg-cyan-50",
    candidates: [
      { name: "Robert M.", role: "Driver - Qatar", time: "Deployed" },
      { name: "Alice K.", role: "Nurse - UAE", time: "Deployed" },
    ],
  },
];

export function PipelineSection() {
  return (
    <section className="py-24 employer-gradient-light relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-blue opacity-50 pointer-events-none" />

      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-blue-400lue-600 font-bold text-sm tracking-widest uppercase mb-4 block">
            Recruitment Pipeline
          </span>
          <h2 className="text-4xl md:text-5xl font-heading font-black mb-4">
            From application to{" "}
            <span className="text-gradient-blue">deployment</span>
          </h2>
          <p className="text-gray-400 max-w-3xl mx-auto text-lg">
            Track every candidate through your hiring pipeline with our intuitive Kanban workflow.
          </p>
        </motion.div>

        {/* Pipeline Visualization */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-12">
          {pipelineStages.map((stage, i) => (
            <motion.div
              key={stage.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="bg-surface rounded-2xl border border-[#2C2C2E] overflow-hidden"
            >
              <div className={`${stage.bgColor} px-4 py-3 flex items-center justify-between`}>
                <div className="flex items-center gap-2">
                  <stage.icon className={`h-4 w-4 ${stage.textColor}`} />
                  <span className={`text-sm font-bold ${stage.textColor}`}>{stage.label}</span>
                </div>
                <Badge className={`${stage.color} text-white rounded-full px-2 py-0.5 text-xs`}>
                  {stage.count}
                </Badge>
              </div>
              <div className="p-3 space-y-2">
                {stage.candidates.map((candidate) => (
                  <div key={candidate.name} className="bg-elevated rounded-xl p-2.5 hover:bg-blue-500lue-50 transition-colors cursor-pointer">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-[10px] font-bold">
                          {candidate.name.charAt(0)}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-gray-100">{candidate.name}</div>
                          <div className="text-[10px] text-gray-400">{candidate.role}</div>
                        </div>
                      </div>
                      <span className="text-[10px] text-gray-400">{candidate.time}</span>
                    </div>
                  </div>
                ))}
                <div className="text-center pt-1">
                  <button className="text-xs text-blue-400lue-600 font-medium hover:text-blue-400lue-800 transition-colors">
                    + View all ({stage.count})
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Pipeline Features */}
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              icon: UserPlus,
              title: "Drag & Drop",
              description: "Move candidates between stages with intuitive drag and drop functionality.",
            },
            {
              icon: Calendar,
              title: "Interview Scheduling",
              description: "Schedule interviews directly from the pipeline with calendar integration.",
            },
            {
              icon: Clock,
              title: "Real-time Updates",
              description: "See candidate status changes and new applications in real time.",
            },
          ].map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-surface rounded-2xl p-6 border border-[#2C2C2E] card-hover flex items-start gap-4"
            >
              <div className="h-12 w-12 rounded-2xl bg-blue-500lue-50 flex items-center justify-center shrink-0">
                <feature.icon className="h-6 w-6 text-blue-400lue-600" />
              </div>
              <div>
                <h4 className="font-bold text-gray-100 mb-1">{feature.title}</h4>
                <p className="text-sm text-gray-400">{feature.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
