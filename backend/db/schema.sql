CREATE TABLE IF NOT EXISTS trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  title TEXT NOT NULL,
  destination TEXT NOT NULL,
  origin TEXT,
  start_date DATE,
  end_date DATE,
  num_travelers INT DEFAULT 1,
  total_budget NUMERIC DEFAULT 0,
  currency TEXT DEFAULT 'INR',
  preferences JSONB DEFAULT '{}',
  itinerary JSONB DEFAULT '{}',
  budget_breakdown JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS trip_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
  change_reason TEXT,
  original_days JSONB,
  updated_days JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
  category TEXT,
  amount NUMERIC,
  description TEXT,
  expense_date DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);
