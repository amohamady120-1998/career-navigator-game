
-- Insert post-impact journey step between simulation (order_index=4) and report (order_index=5)
-- First shift report to order_index=6
UPDATE journey_steps SET order_index = 6 WHERE slug = 'report';

-- Insert post-impact step
INSERT INTO journey_steps (order_index, name_ar, slug, is_locked) 
VALUES (5, 'قياس الأثر البعدي', 'post-impact', true);

-- Insert 8 post-impact questions
INSERT INTO questions (category, order_index, text_ar, options_json) VALUES
('post_impact', 1, 'بعد هذه التجربة، أشعر بوضوح أكبر تجاه مستقبلي المهني', '[{"value":"1","label":"لا أوافق بشدة"},{"value":"2","label":"لا أوافق"},{"value":"3","label":"محايد"},{"value":"4","label":"أوافق"},{"value":"5","label":"أوافق بشدة"}]'),
('post_impact', 2, 'أستطيع الآن تحديد نقاط قوتي المهنية بشكل أفضل', '[{"value":"1","label":"لا أوافق بشدة"},{"value":"2","label":"لا أوافق"},{"value":"3","label":"محايد"},{"value":"4","label":"أوافق"},{"value":"5","label":"أوافق بشدة"}]'),
('post_impact', 3, 'تغيّرت نظرتي للتخصصات الجامعية بعد تجربة المحاكاة', '[{"value":"1","label":"لا أوافق بشدة"},{"value":"2","label":"لا أوافق"},{"value":"3","label":"محايد"},{"value":"4","label":"أوافق"},{"value":"5","label":"أوافق بشدة"}]'),
('post_impact', 4, 'أشعر بثقة أكبر في قدرتي على اتخاذ قرار التخصص', '[{"value":"1","label":"لا أوافق بشدة"},{"value":"2","label":"لا أوافق"},{"value":"3","label":"محايد"},{"value":"4","label":"أوافق"},{"value":"5","label":"أوافق بشدة"}]'),
('post_impact', 5, 'ساعدتني المحاكاة في فهم طبيعة العمل الحقيقي في التخصصات', '[{"value":"1","label":"لا أوافق بشدة"},{"value":"2","label":"لا أوافق"},{"value":"3","label":"محايد"},{"value":"4","label":"أوافق"},{"value":"5","label":"أوافق بشدة"}]'),
('post_impact', 6, 'أصبحت أكثر وعياً بالمهارات المطلوبة في سوق العمل', '[{"value":"1","label":"لا أوافق بشدة"},{"value":"2","label":"لا أوافق"},{"value":"3","label":"محايد"},{"value":"4","label":"أوافق"},{"value":"5","label":"أوافق بشدة"}]'),
('post_impact', 7, 'أرغب في استكشاف تخصصات لم أكن أعرف عنها سابقاً', '[{"value":"1","label":"لا أوافق بشدة"},{"value":"2","label":"لا أوافق"},{"value":"3","label":"محايد"},{"value":"4","label":"أوافق"},{"value":"5","label":"أوافق بشدة"}]'),
('post_impact', 8, 'أنصح زملائي بخوض هذه التجربة لمساعدتهم في اختيار تخصصهم', '[{"value":"1","label":"لا أوافق بشدة"},{"value":"2","label":"لا أوافق"},{"value":"3","label":"محايد"},{"value":"4","label":"أوافق"},{"value":"5","label":"أوافق بشدة"}]');
