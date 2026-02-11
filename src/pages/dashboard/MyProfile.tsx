import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import StudentProfileView from "@/components/StudentProfileView";

export default function MyProfile() {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setUserId(session.user.id);
    });
  }, []);

  if (!userId) return <LoadingSpinner />;

  return <StudentProfileView studentId={userId} />;
}
