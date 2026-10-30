# 📜 Digi Law Reporter — Privacy Policy Landing Site & Legal Compliance Package

**Version:** 2.4.0  
**Effective Date:** September 28, 2026  
**Applicability:** Web Portal (`https://digilawreporter.in`) & Mobile Applications (Android & iOS)

---

## 🏛️ Statutory Compliance Overview

This Privacy Policy package is engineered specifically for **Digi Law Reporter** to satisfy:
1. **Digital Personal Data Protection Act, 2023 (DPDP Act, India)**:
   - Data Fiduciary & Data Principal definitions.
   - Clear legal basis for processing (Consent, Contractual, Legitimate Uses).
   - Chapter 3 Data Principal rights (Access, Correction, Erasure, Grievance Redressal).
   - Designated Statutory Grievance Redressal Officer and 48-hour response timeline.
2. **Information Technology Act, 2000 & IT (Intermediary Guidelines) Rules, 2021**:
   - Mandatory Grievance Officer details and redressal mechanism.
   - Encryption standards (256-bit SSL/TLS, Bcrypt hashing for MPINs and passwords).
3. **Google Play Store Developer Policies**:
   - Runtime permission declarations (`INTERNET`, `POST_NOTIFICATIONS`, `READ_MEDIA`).
   - In-app account deletion instructions and direct deletion URL.
   - Zero-Storage in-memory processing guarantee for user-submitted documents.
4. **Apple App Store Review Guidelines (Section 5.1 - Privacy)**:
   - Clear disclosure of data collection, storage, and retention.
   - Prominent link to Privacy Policy in app metadata.

---

## 📁 File Structure

```text
privacy policy/
├── index.html                  # Complete, responsive Privacy Policy landing page with live TOC & search
├── README.md                   # Compliance & deployment documentation
└── assets/
    ├── logo/
    │   └── digital_law_reporter.png
    ├── css/
    └── js/
```

---

## 🚀 Deployment & Live URL Options

### 1. Standalone Hosting (GitHub Pages / Vercel / Netlify)
You can directly link this folder to **GitHub Pages**, **Vercel**, or **Netlify** to obtain an official Privacy Policy URL such as:
- `https://digilawreporter.in/privacy-policy`
- `https://privacy.digilawreporter.in`

### 2. Integration with Google Play Console & Apple App Store
Copy the live hosted URL of `index.html` and paste it into:
- **Google Play Console** -> App Content -> Privacy Policy URL.
- **Apple App Store Connect** -> App Information -> Privacy Policy URL.
