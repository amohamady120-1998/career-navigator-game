import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Plus, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Major {
  id: string;
  name_ar: string;
  is_active: boolean;
}

interface SectionData {
  stage_title_ar: string;
  reality_snapshot_ar: string;
  challenges_ar: string[];
  scenario_prompt_ar: string;
  scenario_options_ar: string[];
}

const STAGE_KEYS = ['year1', 'year2', 'year3', 'year4', 'post_grad'];
const STAGE_LABELS: Record<string, string> = {
  year1: "سنة 1",
  year2: "سنة 2",
  year3: "سنة 3",
  year4: "سنة 4",
  post_grad: "العمل"
};

export default function AdminExploreManager({ embedded = false }: { embedded?: boolean }) {
  const [majors, setMajors] = useState<Major[]>([]);
  const [selectedMajorId, setSelectedMajorId] = useState<string | null>(null);
  const [activeStage, setActiveStage] = useState('year1');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [newMajorName, setNewMajorName] = useState("");
  const [sectionData, setSectionData] = useState<SectionData>({
    stage_title_ar: "",
    reality_snapshot_ar: "",
    challenges_ar: [""],
    scenario_prompt_ar: "",
    scenario_options_ar: ["", ""]
  });

  useEffect(() => {
    loadMajors();
  }, []);

  useEffect(() => {
    if (selectedMajorId) {
      loadSectionData(selectedMajorId, activeStage);
    }
  }, [selectedMajorId, activeStage]);

  const loadMajors = async () => {
    setIsLoading(true);
    try {
      const { data } = await supabase.from('majors').select('*').order('created_at', { ascending: false });
      if (data) setMajors(data);
    } catch (e) {
      toast.error("خطأ في تحميل التخصصات");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateMajor = async () => {
    if (!newMajorName.trim()) return;
    try {
      const { data, error } = await supabase.from('majors').insert({ name_ar: newMajorName }).select().single();
      if (!error && data) {
        setMajors([data, ...majors]);
        setNewMajorName("");
        toast.success("تم إضافة التخصص بنجاح");
      }
    } catch (e) {
      toast.error("خطأ في إضافة التخصص");
    }
  };

  const loadSectionData = async (majorId: string, stage: string) => {
    try {
      const { data } = await supabase.from('major_explore_sections')
        .select('*').eq('major_id', majorId).eq('stage_key', stage).maybeSingle();
      
      if (data) {
        setSectionData({
          stage_title_ar: data.stage_title_ar || "",
          reality_snapshot_ar: data.reality_snapshot_ar || "",
          challenges_ar: (Array.isArray(data.challenges_ar) ? data.challenges_ar : []) as string[],
          scenario_prompt_ar: data.scenario_prompt_ar || "",
          scenario_options_ar: (Array.isArray(data.scenario_options_ar) ? data.scenario_options_ar : []) as string[]
        });
      } else {
        setSectionData({
          stage_title_ar: "",
          reality_snapshot_ar: "",
          challenges_ar: [""],
          scenario_prompt_ar: "",
          scenario_options_ar: ["", ""]
        });
      }
    } catch (e) {
      toast.error("خطأ في تحميل محتوى المرحلة");
    }
  };

  const handleSaveSection = async () => {
    if (!selectedMajorId) return;
    setIsSaving(true);
    try {
      const cleanedChallenges = sectionData.challenges_ar.filter(c => c.trim() !== "");
      const cleanedOptions = sectionData.scenario_options_ar.filter(o => o.trim() !== "");

      const payload = {
        major_id: selectedMajorId,
        stage_key: activeStage,
        stage_title_ar: sectionData.stage_title_ar,
        reality_snapshot_ar: sectionData.reality_snapshot_ar,
        challenges_ar: cleanedChallenges,
        scenario_prompt_ar: sectionData.scenario_prompt_ar,
        scenario_options_ar: cleanedOptions,
        updated_at: new Date().toISOString()
      };

      const { data: existing } = await supabase.from('major_explore_sections')
        .select('id').eq('major_id', selectedMajorId).eq('stage_key', activeStage).maybeSingle();

      if (existing) {
        await supabase.from('major_explore_sections').update(payload).eq('id', existing.id);
      } else {
        await supabase.from('major_explore_sections').insert(payload);
      }
      toast.success("تم الحفظ بنجاح");
    } catch (e) {
      toast.error("خطأ في الحفظ");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className={embedded ? "" : "min-h-screen bg-background text-foreground p-6"} dir="rtl">
      <div className={embedded ? "" : "max-w-6xl mx-auto"}>
        <h1 className="text-3xl font-bold mb-8">مدير محتوى الرحلة التفاعلية</h1>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar: Majors List */}
          <div className="lg:col-span-1">
            <Card className="p-4 bg-card border border-border shadow-sm">
              <h2 className="font-bold text-foreground mb-4 flex items-center gap-2">التخصصات</h2>
              
              <div className="flex gap-2 mb-4">
                <Input
                  placeholder="اسم التخصص..."
                  value={newMajorName}
                  onChange={(e) => setNewMajorName(e.target.value)}
                  className="text-sm"
                />
                <Button
                  size="sm"
                  onClick={handleCreateMajor}
                  variant="default"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {majors.map(m => (
                  <button
                    key={m.id}
                    onClick={() => setSelectedMajorId(m.id)}
                    className={`w-full text-right p-3 rounded-lg border text-sm font-bold transition-colors ${
                      selectedMajorId === m.id 
                        ? 'bg-primary text-primary-foreground border-primary' 
                        : 'bg-card border-border hover:border-primary/50'
                    }`}
                  >
                    {m.name_ar}
                  </button>
                ))}
              </div>
            </Card>
          </div>

          {/* Main Content: Section Editor */}
          <div className="lg:col-span-3">
            {!selectedMajorId ? (
              <Card className="p-8 bg-secondary/30 border border-border shadow-sm text-center">
                <p className="text-muted-foreground">اختر تخصصاً من القائمة لتعديل محتواه</p>
              </Card>
            ) : (
              <Card className="p-6 bg-card border border-border shadow-sm space-y-6">
                {/* Stage Selector */}
                <div className="flex gap-2 bg-secondary/30 p-3 rounded-lg">
                  {STAGE_KEYS.map(key => (
                    <button
                      key={key}
                      onClick={() => setActiveStage(key)}
                      className={`flex-1 py-2 rounded-lg font-bold text-sm transition-all ${
                        activeStage === key 
                          ? 'bg-primary text-primary-foreground shadow-sm' 
                          : 'text-muted-foreground'
                      }`}
                    >
                      {STAGE_LABELS[key]}
                    </button>
                  ))}
                </div>

                {/* Save Button */}
                <div className="flex justify-end">
                  <Button onClick={handleSaveSection} disabled={isSaving} className="gap-2">
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    حفظ
                  </Button>
                </div>

                {/* Content Fields */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-foreground mb-2">عنوان المرحلة</label>
                    <Input
                      value={sectionData.stage_title_ar}
                      onChange={(e) => setSectionData({...sectionData, stage_title_ar: e.target.value})}
                      placeholder="مثال: سنة أولى في الجامعة"
                      className="bg-secondary/30"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-foreground mb-2">الواقع في هذه المرحلة</label>
                    <Textarea
                      value={sectionData.reality_snapshot_ar}
                      onChange={(e) => setSectionData({...sectionData, reality_snapshot_ar: e.target.value})}
                      placeholder="وصف واقعي لما سيواجهه الطالب..."
                      rows={3}
                      className="bg-secondary/30"
                    />
                  </div>

                  <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                    <label className="block text-sm font-bold text-amber-900 mb-3">التحديات الشائعة</label>
                    {sectionData.challenges_ar.map((ch, i) => (
                      <div key={i} className="flex gap-2 mb-2">
                        <Input
                          value={ch}
                          onChange={(e) => {
                            const newArr = [...sectionData.challenges_ar];
                            newArr[i] = e.target.value;
                            setSectionData({...sectionData, challenges_ar: newArr});
                          }}
                          placeholder="تحدي..."
                          className="bg-white"
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => setSectionData({
                            ...sectionData,
                            challenges_ar: sectionData.challenges_ar.filter((_, idx) => idx !== i)
                          })}
                        >
                          <Trash2 className="w-4 h-4 text-red-500"/>
                        </Button>
                      </div>
                    ))}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSectionData({
                        ...sectionData,
                        challenges_ar: [...sectionData.challenges_ar, ""]
                      })}
                      className="mt-2"
                    >
                      <Plus className="w-4 h-4 ml-2"/> أضف تحدي
                    </Button>
                  </div>

                  <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                    <label className="block text-sm font-bold text-blue-900 mb-2">سؤال المحاكاة</label>
                    <Textarea
                      value={sectionData.scenario_prompt_ar}
                      onChange={(e) => setSectionData({...sectionData, scenario_prompt_ar: e.target.value})}
                      placeholder="موقف حقيقي أو سؤال..."
                      rows={2}
                      className="mb-4 bg-white"
                    />
                    <label className="block text-sm font-bold text-blue-900 mb-3">الخيارات (بحد أقصى 3)</label>
                    {sectionData.scenario_options_ar.map((opt, i) => (
                      <div key={i} className="flex gap-2 mb-2">
                        <Input
                          value={opt}
                          onChange={(e) => {
                            const newArr = [...sectionData.scenario_options_ar];
                            newArr[i] = e.target.value;
                            setSectionData({...sectionData, scenario_options_ar: newArr});
                          }}
                          placeholder="خيار..."
                          className="bg-white"
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => setSectionData({
                            ...sectionData,
                            scenario_options_ar: sectionData.scenario_options_ar.filter((_, idx) => idx !== i)
                          })}
                          disabled={sectionData.scenario_options_ar.length <= 1}
                        >
                          <Trash2 className="w-4 h-4 text-red-500"/>
                        </Button>
                      </div>
                    ))}
                    {sectionData.scenario_options_ar.length < 3 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSectionData({
                          ...sectionData,
                          scenario_options_ar: [...sectionData.scenario_options_ar, ""]
                        })}
                        className="mt-2"
                      >
                        <Plus className="w-4 h-4 ml-2"/> أضف خيار
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
