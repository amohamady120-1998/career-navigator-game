/**
 * TEMPORARY — visual preview of the explore-screen video player only.
 * No guards, no Supabase. Remove this page and its route in App.tsx after review.
 */
import { HeroBand, HeroBandSubtle } from "@/components/HeroBand";
import { MajorVideoPlayer, type VideoSegment } from "@/components/MajorVideoPlayer";

const PREVIEW_SEGMENTS: VideoSegment[] = [
  {
    id: "TRkTKt440uk",
    title: "ليه الذكاء الاصطناعي؟ — قصة البداية",
    desc: "كيف يغيّر الذكاء الاصطناعي حياتنا — من قصة واقعية إلى قرار دراسته.",
    duration: "١:٢٥",
  },
];

export default function PreviewExplore() {
  return (
    <div className="min-h-screen bg-background px-4 py-6 text-foreground md:px-6" dir="rtl">
      <div className="athar-page">
        <HeroBand
          eyebrow="الفصل الثالث · تعمّق · معاينة"
          title={<>الذكاء الاصطناعي <HeroBandSubtle>من الداخل</HeroBandSubtle></>}
          description="عبر مقاطع قصيرة، كل واحد يشرح جانبًا مختلفًا."
        />
        <div className="athar-card">
          <MajorVideoPlayer segments={PREVIEW_SEGMENTS} />
        </div>
      </div>
    </div>
  );
}
