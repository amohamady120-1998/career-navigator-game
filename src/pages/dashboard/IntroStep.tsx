import { motion } from "framer-motion";
import { Rocket } from "lucide-react";

export default function IntroStep() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto text-center py-12"
    >
      <div className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-6">
        <Rocket className="w-10 h-10 text-accent" />
      </div>
      <h2 className="text-3xl font-bold mb-4">مرحباً بك في رحلة أثر ستارت</h2>
      <p className="text-lg text-muted-foreground leading-loose">
        ستمرّ خلال هذه الرحلة بعدة مراحل مصمّمة بعناية لمساعدتك على اكتشاف ميولك المهنية وتحديد
        التخصص الجامعي الأنسب لشخصيتك. كل مرحلة ستُفتح تلقائياً بعد إكمال المرحلة السابقة.
      </p>
    </motion.div>
  );
}
