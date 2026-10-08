CREATE TABLE public.study_topics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_name text NOT NULL,
  subject_name text NOT NULL,
  term text NOT NULL,
  topic_order int NOT NULL DEFAULT 0,
  title text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.study_topics TO authenticated;
GRANT ALL ON public.study_topics TO service_role;
ALTER TABLE public.study_topics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "signed in read topics" ON public.study_topics FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin manages topics" ON public.study_topics FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.student_topic_progress (
  student_id uuid NOT NULL DEFAULT auth.uid(),
  topic_id uuid NOT NULL REFERENCES public.study_topics(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (student_id, topic_id)
);
GRANT SELECT, INSERT, DELETE ON public.student_topic_progress TO authenticated;
GRANT ALL ON public.student_topic_progress TO service_role;
ALTER TABLE public.student_topic_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own progress read" ON public.student_topic_progress FOR SELECT TO authenticated USING (student_id = auth.uid());
CREATE POLICY "own progress add" ON public.student_topic_progress FOR INSERT TO authenticated WITH CHECK (student_id = auth.uid());
CREATE POLICY "own progress remove" ON public.student_topic_progress FOR DELETE TO authenticated USING (student_id = auth.uid());

INSERT INTO public.study_topics (class_name, subject_name, term, topic_order, title)
SELECT c, s, t, o, x FROM (VALUES
('SS 1','Mathematics','1st Term',1,'Number bases'),('SS 1','Mathematics','1st Term',2,'Modular arithmetic'),('SS 1','Mathematics','1st Term',3,'Indices and logarithms'),
('SS 1','Mathematics','2nd Term',1,'Sets and Venn diagrams'),('SS 1','Mathematics','2nd Term',2,'Simple equations and variation'),('SS 1','Mathematics','3rd Term',1,'Quadratic equations'),('SS 1','Mathematics','3rd Term',2,'Trigonometric ratios'),
('SS 2','Mathematics','1st Term',1,'Approximation and sequences'),('SS 2','Mathematics','1st Term',2,'Simultaneous equations'),('SS 2','Mathematics','2nd Term',1,'Circle geometry'),('SS 2','Mathematics','2nd Term',2,'Bearings and distances'),('SS 2','Mathematics','3rd Term',1,'Statistics: mean, median, mode'),('SS 2','Mathematics','3rd Term',2,'Probability'),
('SS 3','Mathematics','1st Term',1,'Surds and matrices'),('SS 3','Mathematics','1st Term',2,'Differentiation'),('SS 3','Mathematics','2nd Term',1,'Integration'),('SS 3','Mathematics','2nd Term',2,'Mensuration of solids'),('SS 3','Mathematics','3rd Term',1,'Revision for WAEC/JAMB'),
('SS 1','English','1st Term',1,'Parts of speech'),('SS 1','English','1st Term',2,'Vowel sounds'),('SS 1','English','2nd Term',1,'Comprehension and summary'),('SS 1','English','2nd Term',2,'Informal letter writing'),('SS 1','English','3rd Term',1,'Consonant sounds'),('SS 1','English','3rd Term',2,'Concord'),
('SS 2','English','1st Term',1,'Formal letter writing'),('SS 2','English','1st Term',2,'Phrases and clauses'),('SS 2','English','2nd Term',1,'Stress and intonation'),('SS 2','English','2nd Term',2,'Synonyms and antonyms'),('SS 2','English','3rd Term',1,'Argumentative essays'),('SS 2','English','3rd Term',2,'Idioms and figurative language'),
('SS 3','English','1st Term',1,'Lexis and structure'),('SS 3','English','1st Term',2,'Speech writing and articles'),('SS 3','English','2nd Term',1,'Oral English revision'),('SS 3','English','2nd Term',2,'Literature texts review'),('SS 3','English','3rd Term',1,'Past questions practice'),
('SS 1','Physics','1st Term',1,'Measurement and units'),('SS 1','Physics','1st Term',2,'Motion: speed, velocity, acceleration'),('SS 1','Physics','2nd Term',1,'Work, energy and power'),('SS 1','Physics','2nd Term',2,'Heat and temperature'),('SS 1','Physics','3rd Term',1,'Density and pressure'),
('SS 2','Physics','1st Term',1,'Newton''s laws of motion'),('SS 2','Physics','1st Term',2,'Equations of motion'),('SS 2','Physics','2nd Term',1,'Waves and sound'),('SS 2','Physics','2nd Term',2,'Light: reflection and refraction'),('SS 2','Physics','3rd Term',1,'Gas laws'),
('SS 3','Physics','1st Term',1,'Electric fields and current'),('SS 3','Physics','1st Term',2,'Magnetism and induction'),('SS 3','Physics','2nd Term',1,'Atomic and nuclear physics'),('SS 3','Physics','2nd Term',2,'Electronics basics'),('SS 3','Physics','3rd Term',1,'Revision for WAEC/JAMB'),
('SS 1','Chemistry','1st Term',1,'Introduction to chemistry'),('SS 1','Chemistry','1st Term',2,'Separation techniques'),('SS 1','Chemistry','2nd Term',1,'Atomic structure'),('SS 1','Chemistry','2nd Term',2,'Chemical bonding'),('SS 1','Chemistry','3rd Term',1,'Periodic table'),
('SS 2','Chemistry','1st Term',1,'Mole concept and stoichiometry'),('SS 2','Chemistry','1st Term',2,'Gas laws'),('SS 2','Chemistry','2nd Term',1,'Acids, bases and salts'),('SS 2','Chemistry','2nd Term',2,'Oxidation and reduction'),('SS 2','Chemistry','3rd Term',1,'Electrolysis'),
('SS 3','Chemistry','1st Term',1,'Organic chemistry: hydrocarbons'),('SS 3','Chemistry','1st Term',2,'Alkanols and alkanoic acids'),('SS 3','Chemistry','2nd Term',1,'Rates of reaction and equilibrium'),('SS 3','Chemistry','2nd Term',2,'Metals and extraction'),('SS 3','Chemistry','3rd Term',1,'Revision for WAEC/JAMB'),
('SS 1','Biology','1st Term',1,'Living things and classification'),('SS 1','Biology','1st Term',2,'The cell'),('SS 1','Biology','2nd Term',1,'Nutrition in plants'),('SS 1','Biology','2nd Term',2,'Ecology basics'),('SS 1','Biology','3rd Term',1,'Microorganisms'),
('SS 2','Biology','1st Term',1,'Digestive system'),('SS 2','Biology','1st Term',2,'Transport in animals and plants'),('SS 2','Biology','2nd Term',1,'Respiration'),('SS 2','Biology','2nd Term',2,'Excretion'),('SS 2','Biology','3rd Term',1,'Nervous system'),
('SS 3','Biology','1st Term',1,'Reproduction'),('SS 3','Biology','1st Term',2,'Genetics and heredity'),('SS 3','Biology','2nd Term',1,'Evolution'),('SS 3','Biology','2nd Term',2,'Ecology: adaptation'),('SS 3','Biology','3rd Term',1,'Revision for WAEC/JAMB')
) v(c,s,t,o,x);