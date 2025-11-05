-- Create enquiries table
CREATE TABLE public.enquiries (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL,
  category text NOT NULL,
  min_price text,
  max_price text,
  deadline date,
  status text NOT NULL DEFAULT 'active',
  response_count integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.enquiries ENABLE ROW LEVEL SECURITY;

-- Create policies for enquiries
CREATE POLICY "Users can view all enquiries" 
ON public.enquiries 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create their own enquiries" 
ON public.enquiries 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own enquiries" 
ON public.enquiries 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own enquiries" 
ON public.enquiries 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_enquiries_updated_at
BEFORE UPDATE ON public.enquiries
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();