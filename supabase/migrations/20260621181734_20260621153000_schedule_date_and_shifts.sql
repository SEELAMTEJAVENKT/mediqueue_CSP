-- Add schedule_date and shift fields to schedules table
-- Replace day_of_week with specific date, add two shifts

-- Add new columns
ALTER TABLE schedules ADD COLUMN IF NOT EXISTS schedule_date date;
ALTER TABLE schedules ADD COLUMN IF NOT EXISTS shift1_start text;
ALTER TABLE schedules ADD COLUMN IF NOT EXISTS shift1_end text;
ALTER TABLE schedules ADD COLUMN IF NOT EXISTS shift2_start text;
ALTER TABLE schedules ADD COLUMN IF NOT EXISTS shift2_end text;

-- Drop old columns that are no longer needed
ALTER TABLE schedules DROP COLUMN IF EXISTS day_of_week;
ALTER TABLE schedules DROP COLUMN IF EXISTS start_time;
ALTER TABLE schedules DROP COLUMN IF EXISTS end_time;

-- Make schedule_date required after migration
ALTER TABLE schedules ALTER COLUMN schedule_date SET NOT NULL;

-- Update existing rows to have default shift values if any exist
UPDATE schedules SET shift1_start = '09:00', shift1_end = '12:00', shift2_start = '14:00', shift2_end = '17:00' WHERE shift1_start IS NULL;
