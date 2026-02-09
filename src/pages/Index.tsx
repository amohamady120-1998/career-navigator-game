import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { GraduationCap, Users, Building2 } from "lucide-react";

type UserType = "student" | "parent" | "institution";

const roles: { type: UserType; label: string; icon: typeof GraduationCap; description: string }[] = [
  {
    type: "student",
    label: "طالب",
    icon: GraduationCap,
    description: "اكتشف ميولك واختر تخصصك الجامعي بثقة",
  },
  {
    type: "parent",
    label: "ولي أمر",
    icon: Users,
    description: "ساعد ابنك في اتخاذ القرار الأنسب لمستقبله",
  },
  {
    type: "institution",
    label: "مؤسسة تعليمية",
    icon: Building2,
    description: "قدّم لطلابك أدوات التوجيه المهني الذكية",
  },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.15 },
  },
};

const item = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } },
};

const Index = () => {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<UserType | null>(null);

  const handleSelect = (type: UserType) => {
    setSelected(type);
    localStorage.setItem("athar_user_type", type);
    setTimeout(() => navigate("/auth"), 400);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-primary px-4 py-12">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-12"
      >
        <h1 className="text-5xl font-black text-primary-foreground mb-3 tracking-tight">
          أثر ستارت
        </h1>
        <p className="text-xl text-primary-foreground/70 max-w-md mx-auto">
          رحلتك لاكتشاف المسار المهني الأنسب لك تبدأ من هنا
        </p>
      </motion.div>

      {/* Role Cards */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl w-full"
      >
        {roles.map((role) => {
          const Icon = role.icon;
          const isSelected = selected === role.type;
          return (
            <motion.button
              key={role.type}
              variants={item}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => handleSelect(role.type)}
              className={`
                relative flex flex-col items-center gap-4 p-8 rounded-xl
                bg-card text-card-foreground border-2 transition-colors duration-200
                cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent
                ${isSelected ? "border-accent shadow-lg shadow-accent/20" : "border-transparent hover:border-accent/40"}
              `}
            >
              <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center">
                <Icon className="w-8 h-8 text-accent" />
              </div>
              <h2 className="text-2xl font-bold">{role.label}</h2>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {role.description}
              </p>
            </motion.button>
          );
        })}
      </motion.div>
    </div>
  );
};

export default Index;
