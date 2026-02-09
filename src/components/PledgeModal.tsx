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
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 px-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="w-full max-w-lg bg-card rounded-xl p-8 text-center shadow-2xl"
          >
            <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-6">
              <ShieldCheck className="w-8 h-8 text-accent" />
            </div>

            <h2 className="text-2xl font-bold mb-4">عهد أثر</h2>

            <p className="text-lg leading-loose text-muted-foreground mb-8">
              أعدُ نفسي أن أكون صادقاً تماماً في كل إجابة، وأن أختار ما يعبّر عنّي حقاً لا ما
              يتوقعه مني الآخرون. هذه الرحلة هي لي، ونتائجها ستكون انعكاساً حقيقياً لشخصيتي.
            </p>

            <Button
              onClick={onAccept}
              className="bg-accent text-accent-foreground hover:bg-accent/90 font-bold text-lg px-10 h-12"
            >
              أعدُ بذلك
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
