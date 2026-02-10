import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Question {
  id: string;
  text_ar: string;
  category: string;
  options_json: unknown;
  riasec_code?: string | null;
}

interface QuestionWizardProps {
  questions: Question[];
  onComplete: (answers: Record<string, string>) => void;
  batchSize?: number;
}

export function QuestionWizard({ questions, onComplete, batchSize = 6 }: QuestionWizardProps) {
  const [currentBatch, setCurrentBatch] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const totalBatches = Math.ceil(questions.length / batchSize);
  const start = currentBatch * batchSize;
  const batch = questions.slice(start, start + batchSize);
  const isHolland = batch[0]?.category === "holland";

  const allBatchAnswered = batch.every((q) => answers[q.id] !== undefined);

  const handleAnswer = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleNext = () => {
    if (currentBatch < totalBatches - 1) {
      setCurrentBatch((prev) => prev + 1);
    } else {
      onComplete(answers);
    }
  };

  const handlePrev = () => {
    if (currentBatch > 0) setCurrentBatch((prev) => prev - 1);
  };

  const likertLabels = ["لا أوافق أبداً", "لا أوافق", "محايد", "أوافق", "أوافق بشدة"];

  return (
    <div className="max-w-3xl mx-auto">
      {/* Progress */}
      <div className="mb-8">
        <div className="flex justify-between text-sm text-muted-foreground mb-2">
          <span className="font-medium">المجموعة {currentBatch + 1} من {totalBatches}</span>
          <span className="font-bold text-accent">{Math.round(((start + batch.length) / questions.length) * 100)}%</span>
        </div>
        <div className="progress-premium">
          <motion.div
            initial={false}
            animate={{ width: `${((start + batch.length) / questions.length) * 100}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>
      </div>

      {/* Questions */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentBatch}
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -40 }}
          transition={{ duration: 0.3 }}
          className="space-y-5"
        >
          {batch.map((q, idx) => (
            <motion.div
              key={q.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="card-premium p-6"
            >
              <p className="text-lg font-medium mb-4">
                <span className="text-gradient font-extrabold ml-2">{start + idx + 1}.</span>
                {q.text_ar}
              </p>

              {isHolland ? (
                /* Yes / No */
                <div className="flex gap-3">
                  {["نعم", "لا"].map((opt) => {
                    const val = opt === "نعم" ? "yes" : "no";
                    const isSelected = answers[q.id] === val;
                    return (
                      <button
                        key={val}
                        onClick={() => handleAnswer(q.id, val)}
                        className={`
                          flex-1 py-3.5 rounded-xl border-2 font-bold text-lg transition-all duration-200
                          ${isSelected
                            ? "border-accent bg-accent/10 text-accent shadow-sm"
                            : "border-border hover:border-accent/40 hover:bg-secondary/50"
                          }
                        `}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              ) : (
                /* Likert 1-5 */
                <div className="flex gap-2">
                  {likertLabels.map((label, i) => {
                    const val = String(i + 1);
                    const isSelected = answers[q.id] === val;
                    return (
                      <button
                        key={val}
                        onClick={() => handleAnswer(q.id, val)}
                        className={`
                          flex-1 py-3 px-1 rounded-xl border-2 text-xs sm:text-sm font-medium
                          transition-all duration-200 leading-tight
                          ${isSelected
                            ? "border-accent bg-accent/10 text-accent shadow-sm"
                            : "border-border hover:border-accent/40 hover:bg-secondary/50"
                          }
                        `}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              )}
            </motion.div>
          ))}
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex justify-between mt-8">
        <Button
          variant="outline"
          onClick={handlePrev}
          disabled={currentBatch === 0}
          className="gap-2 rounded-xl h-11"
        >
          <ChevronRight className="w-4 h-4" />
          السابق
        </Button>
        <Button
          onClick={handleNext}
          disabled={!allBatchAnswered}
          className="gap-2 btn-gradient rounded-xl h-11 px-8"
        >
          {currentBatch === totalBatches - 1 ? "إنهاء ✓" : "التالي"}
          <ChevronLeft className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
