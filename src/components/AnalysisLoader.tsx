"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, Brain, FileText, CheckCircle2 } from "lucide-react";

const steps = [
    { id: 1, text: "Transcribing audio...", icon: FileText },
    { id: 2, text: "Analyzing conversation flow...", icon: Brain },
    { id: 3, text: "Extracting key insights...", icon: Sparkles },
    { id: 4, text: "Generating ticket...", icon: CheckCircle2 },
];

export function AnalysisLoader({ onComplete }: { onComplete: () => void }) {
    const [currentStep, setCurrentStep] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentStep((prev) => {
                if (prev >= steps.length - 1) {
                    clearInterval(interval);
                    setTimeout(onComplete, 800); // Small delay before finishing
                    return prev;
                }
                return prev + 1;
            });
        }, 1500); // 1.5s per step

        return () => clearInterval(interval);
    }, [onComplete]);

    return (
        <div className="flex flex-col items-center justify-center py-12">
            <div className="relative mb-8 h-24 w-24">
                {/* Pulsing rings */}
                <motion.div
                    animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0, 0.3] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute inset-0 rounded-full bg-indigo-500/20"
                />
                <motion.div
                    animate={{ scale: [1, 1.5, 1], opacity: [0.2, 0, 0.2] }}
                    transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                    className="absolute inset-0 rounded-full bg-indigo-500/20"
                />

                {/* Center Icon */}
                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-white dark:bg-slate-900 shadow-xl ring-1 ring-slate-100">
                    <motion.div
                        key={currentStep}
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.5, opacity: 0 }}
                    >
                        {(() => {
                            const Icon = steps[currentStep].icon;
                            return <Icon className="h-10 w-10 text-indigo-600" />;
                        })()}
                    </motion.div>
                </div>
            </div>

            <div className="space-y-4 text-center">
                <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-50 min-w-[250px]">
                    {steps[currentStep].text}
                </h3>

                <div className="flex justify-center gap-2">
                    {steps.map((step, idx) => (
                        <motion.div
                            key={step.id}
                            initial={false}
                            animate={{
                                backgroundColor: idx <= currentStep ? "#4f46e5" : "#e2e8f0",
                                scale: idx === currentStep ? 1.2 : 1,
                            }}
                            className="h-2 w-2 rounded-full"
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
