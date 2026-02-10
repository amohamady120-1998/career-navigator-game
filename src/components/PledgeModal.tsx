import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ShieldCheck } from "lucide-react";

interface PledgeModalProps {
  open: boolean;
  onAccept: () => void;
}

export function PledgeModal({ open, onAccept }: PledgeModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-primary/95 backdrop-blur-sm px-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="w-full max-w-lg bg-card rounded-2xl p-10 text-center shadow-2xl border border-border/50"
          >
            <motion.div
              className="w-18 h-18 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-6"
              style={{ width: '4.5rem', height: '4.5rem' }}
              initial={{ rotate: -15, scale: 0 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ type: "spring", delay: 0.2 }}
            >
              <ShieldCheck className="w-9 h-9 text-accent" />
            </motion.div>

            <h2 className="text-2xl font-extrabold mb-4">عهد أثر</h2>

            <p className="text-lg leading-loose text-muted-foreground mb-8">
              أعدُ نفسي أن أكون صادقاً تماماً في كل إجابة، وأن أختار ما يعبّر عنّي حقاً لا ما
              يتوقعه مني الآخرون. هذه الرحلة هي لي، ونتائجها ستكون انعكاساً حقيقياً لشخصيتي.
            </p>

            <Button
              onClick={onAccept}
              className="btn-gradient text-lg px-12 h-12 rounded-xl shadow-premium hover:shadow-premium-lg transition-all"
            >
              أعدُ بذلك ✨
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
