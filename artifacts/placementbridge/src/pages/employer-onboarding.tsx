import { useState } from "react";
import { useLocation } from "wouter";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Sparkles, ArrowRight, BrainCircuit, Globe, Shield } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function EmployerOnboarding() {
  const [, navigate] = useLocation();
  const [step, setStep] = useState(1);
  const totalSteps = 3;
  const [error, setError] = useState("");

  const [data, setData] = useState({
    companyName: "",
    industry: "",
    regions: [] as string[],
    sponsorship: false,
    hiringUrgency: "Medium",
    skillPriorities: "",
  });

  const validate = () => {
    setError("");
    if (step === 1 && (!data.companyName.trim() || !data.industry)) {
      setError("Please enter your company name and select an industry.");
      return false;
    }
    if (step === 2 && data.regions.length === 0) {
      setError("Please select at least one target region.");
      return false;
    }
    return true;
  };

  const next = () => {
    if (!validate()) return;
    if (step < totalSteps) setStep(step + 1);
    else navigate("/employer/dashboard");
  };

  return (
    <Layout>
      <div className="pt-32 pb-20 bg-[#050505] min-h-screen">
        <div className="container mx-auto px-4 max-w-2xl">
          <div className="mb-12">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-blue-500 font-bold text-xs uppercase tracking-widest">
                <Sparkles className="h-4 w-4" />
                Intelligence Initialization
              </div>
              <div className="text-gray-500 text-xs font-bold uppercase">
                Step {step} of {totalSteps}
              </div>
            </div>
            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-blue-600" 
                initial={{ width: 0 }}
                animate={{ width: `${(step / totalSteps) * 100}%` }}
              />
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card className="bg-[#0a0a0a] border-white/10 p-4">
                <CardHeader>
                  {step === 1 && (
                    <>
                      <CardTitle className="text-3xl font-black text-white">Identify Your Workspace</CardTitle>
                      <CardDescription className="text-gray-400">Tell us about your organization to begin workforce intelligence mapping.</CardDescription>
                    </>
                  )}
                  {step === 2 && (
                    <>
                      <CardTitle className="text-3xl font-black text-white">Target Ecosystems</CardTitle>
                      <CardDescription className="text-gray-400">Define the labor migration corridors you wish to activate.</CardDescription>
                    </>
                  )}
                  {step === 3 && (
                    <>
                      <CardTitle className="text-3xl font-black text-white">Priority & Compliance</CardTitle>
                      <CardDescription className="text-gray-400">Configure your hiring urgency and sponsorship capabilities.</CardDescription>
                    </>
                  )}
                </CardHeader>
                <CardContent className="space-y-8">
                  {step === 1 && (
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <Label className="text-xs font-bold text-gray-500 uppercase">Company Name</Label>
                        <Input 
                          placeholder="e.g. Qatar Engineering Group" 
                          className="bg-white/5 border-white/10 h-12 focus:ring-blue-500"
                          value={data.companyName}
                          onChange={e => setData({...data, companyName: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-bold text-gray-500 uppercase">Industry Domain</Label>
                        <Select onValueChange={v => setData({...data, industry: v})}>
                          <SelectTrigger className="bg-white/5 border-white/10 h-12">
                            <SelectValue placeholder="Select Industry" />
                          </SelectTrigger>
                          <SelectContent className="bg-[#0a0a0a] border-white/10 text-white">
                            <SelectItem value="construction">Construction & Infrastructure</SelectItem>
                            <SelectItem value="healthcare">Healthcare & Life Sciences</SelectItem>
                            <SelectItem value="telecom">Telecommunications</SelectItem>
                            <SelectItem value="oilgas">Oil & Gas</SelectItem>
                            <SelectItem value="tech">Technology</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}

                  {step === 2 && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        {[
                          { label: "East Africa", icon: Globe },
                          { label: "West Africa", icon: Globe },
                          { label: "GCC Region", icon: Globe },
                          { label: "Southeast Asia", icon: Globe },
                        ].map(r => (
                          <div 
                            key={r.label}
                            onClick={() => {
                              const regions = data.regions.includes(r.label)
                                ? data.regions.filter(x => x !== r.label)
                                : [...data.regions, r.label];
                              setData({...data, regions});
                            }}
                            className={`p-6 rounded-2xl border cursor-pointer transition-all ${
                              data.regions.includes(r.label) 
                                ? 'bg-blue-600/10 border-blue-600' 
                                : 'bg-white/5 border-white/10 hover:border-white/20'
                            }`}
                          >
                            <r.icon className={`h-6 w-6 mb-3 ${data.regions.includes(r.label) ? 'text-blue-500' : 'text-gray-500'}`} />
                            <div className="text-sm font-bold text-white">{r.label}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {step === 3 && (
                    <div className="space-y-6">
                      <div className="flex items-center space-x-3 p-4 rounded-2xl bg-blue-500/5 border border-blue-500/10">
                        <Checkbox 
                          id="sponsorship" 
                          checked={data.sponsorship}
                          onCheckedChange={v => setData({...data, sponsorship: !!v})}
                        />
                        <div className="grid gap-1.5 leading-none">
                          <label htmlFor="sponsorship" className="text-sm font-bold text-white">Sponsorship Ready</label>
                          <p className="text-xs text-gray-500">We provide visa and relocation support for international talent.</p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs font-bold text-gray-500 uppercase">Hiring Urgency</Label>
                        <div className="flex gap-2">
                          {["Low", "Medium", "High", "Critical"].map(u => (
                            <button
                              key={u}
                              onClick={() => setData({...data, hiringUrgency: u})}
                              className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all ${
                                data.hiringUrgency === u 
                                  ? 'bg-white text-black' 
                                  : 'bg-white/5 text-gray-500 border border-white/10'
                              }`}
                            >
                              {u}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {error && (
                    <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium">
                      {error}
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-8 border-t border-white/5">
                    <div className="text-[10px] font-bold text-gray-600 uppercase flex items-center gap-2">
                       <BrainCircuit className="h-4 w-4" />
                       Intelligence Syncing...
                    </div>
                    <Button 
                      size="lg" 
                      onClick={next}
                      className="rounded-full bg-blue-600 hover:bg-blue-700 text-white px-8 group h-14 font-bold"
                    >
                      {step === totalSteps ? "Launch Dashboard" : "Continue"}
                      <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </Layout>
  );
}
