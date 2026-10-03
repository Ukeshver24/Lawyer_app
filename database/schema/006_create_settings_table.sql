-- Table: settings (Platform Branding, Chambers Info & About Page Content)
CREATE TABLE IF NOT EXISTS settings (
    key VARCHAR(50) PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Seed default platform settings
INSERT INTO settings (key, value)
VALUES ('platform_settings', '{
  "profile": {
    "name": "Main Admin",
    "email": "kavinselvaraj12@gmail.com",
    "mobile": "+91 98765 43210"
  },
  "office": {
    "lawChambersName": "DIGI LAW REPORTER CHAMBERS & LEGAL RESEARCH CENTRE",
    "officeAddress": "Chamber No. 402, High Court Lawyers Block, Supreme Court Enclave, New Delhi - 110001",
    "primaryPhone": "+91 98765 43210",
    "secondaryPhone": "+91 11 2345 6789",
    "primaryEmail": "contact@digilawreporter.in",
    "secondaryEmail": "support@digilawreporter.in",
    "workingHours": "Monday to Saturday: 9:00 AM - 7:00 PM"
  },
  "aboutPage": {
    "pageHeading": "Pioneering Digital Legal Intelligence & Supreme Court Precedents",
    "pageSubheading": "Empowering Advocates, Judiciary Members & Legal Researchers with Authentic Case Law Insights",
    "aboutParagraph1": "Digi Law Reporter is India’s premier digital legal reporting platform dedicated to publishing authentic, verified Supreme Court and High Court precedents with full citation authority.",
    "aboutParagraph2": "Engineered by Advocate on Record practitioners, our mission is to make comprehensive legal search instantaneous, reliable, and accessible across the country.",
    "founder1Name": "Adv. Rajesh Sharma",
    "founder1Title": "Founder & Senior Advocate",
    "founder1Court": "Supreme Court of India",
    "founder1Experience": "24+ Years Experience",
    "founder1BarNo": "D/1482/2000",
    "founder1Bio": "Senior Advocate specializing in Constitutional Law, Civil Appeals & Special Leave Petitions.",
    "founder1Image": "",
    "founder2Name": "Adv. Priya Venkatesh",
    "founder2Title": "Co-Founder & Advocate on Record",
    "founder2Court": "Supreme Court of India",
    "founder2Experience": "18+ Years Experience",
    "founder2BarNo": "D/892/2006",
    "founder2Bio": "Advocate on Record with extensive practice in Commercial Arbitration and Corporate Precedents.",
    "founder2Image": ""
  }
}'::jsonb)
ON CONFLICT (key) DO NOTHING;
