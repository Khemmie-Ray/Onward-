ALTER TABLE public.modules DROP CONSTRAINT modules_category_check;

ALTER TABLE public.modules ADD CONSTRAINT modules_category_check 
  CHECK (category = ANY (ARRAY[
    'Foundations'::text,
    'Identity'::text,
    'Economics'::text,
    'Safety'::text,
    'Utility'::text
  ]));