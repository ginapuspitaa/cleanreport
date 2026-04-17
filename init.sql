-- CleanReport Database Initialization
-- Run this script when setting up the database for the first time

-- Create database (run this manually if needed)
-- CREATE DATABASE cleanreport_prod;

-- Use the database
-- \c cleanreport_prod;

-- Create reports table
CREATE TABLE IF NOT EXISTS reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    location VARCHAR(255) NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    image_url VARCHAR(500),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'diproses', 'selesai')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_location ON reports(location);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_reports_updated_at
    BEFORE UPDATE ON reports
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data (optional - remove in production)
-- INSERT INTO reports (title, description, location, latitude, longitude, status)
-- VALUES
--     ('Sampah di Taman Kota', 'Tumpukan sampah di area taman kota membutuhkan pembersihan segera', 'Taman Kota', -6.2088, 106.8456, 'pending'),
--     ('Limbah Industri', 'Limbah dari pabrik tekstil terlihat mencemari sungai', 'Jl. Industri No. 123', -6.2090, 106.8460, 'diproses');

-- Create user for application (optional - adjust as needed)
-- CREATE USER cleanreport_app WITH PASSWORD 'your_secure_password';
-- GRANT SELECT, INSERT, UPDATE, DELETE ON reports TO cleanreport_app;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO cleanreport_app;

-- Show created table
SELECT 'Database initialized successfully!' as status;
SELECT COUNT(*) as total_reports FROM reports;