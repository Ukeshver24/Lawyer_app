// Centralized Legal Data for Digi Law Reporter Legal Case Management Portal

export const MOCK_STATS = {
  totalCases: 0,
  totalCasesGrowth: "0 this month",
  totalCasesSub: "All case records",
  
  publishedCases: 0,
  publishedCasesSub: "Available to users",
  
  draftCases: 0,
  draftCasesSub: "Awaiting publication",
  
  totalUsers: 0,
  totalUsersSub: "Registered users"
};

export const MOCK_CASES = [];

export const MOCK_RECENT_ACTIVITY = [];

export const MOCK_UPCOMING_HEARINGS = [];

export const MOCK_USERS = [];

export const MOCK_LAWYER_SETTINGS = {
  profile: {
    adminName: "",
    mobileNumber: "",
    email: "",
    role: "Administrator"
  },
  office: {
    lawyerName: "",
    officeName: "",
    officeAddress: "Supreme Court Bar Chambers Block, New Delhi, Delhi 110001",
    contactNumber: "+91 98765 43210",
    contactNumber2: "+91 98765 43211",
    officeEmail: "support@digilawreporter.in",
    officeEmail2: "editorial@digilawreporter.in",
    workingHours: "Mon - Sat: 9:00 AM - 7:00 PM IST"
  },
  aboutPage: {
    founder1Name: "Senior Advocate & Founder Name",
    founder1Title: "Senior Advocate & Managing Founder",
    founder1Court: "Supreme Court of India",
    founder1Experience: "25+ Years Bar Practice",
    founder1BarNo: "Bar Registration No.",
    founder1Bio: "Founder profile details, legal background, bar accomplishments, and leadership overview will be added here.",
    founder1Image: "",

    founder2Name: "Co-Founder & Advocate Name",
    founder2Title: "Advocate-on-Record (AoR) & Co-Founder",
    founder2Court: "Supreme Court of India",
    founder2Experience: "18+ Years Litigation",
    founder2BarNo: "SCBA Registration No.",
    founder2Bio: "Co-founder profile details, editorial board role, practice specialization, and background information will be added here.",
    founder2Image: "",

    teamMembers: [
      {
        id: "team-1",
        name: "Senior Legal Editor Name",
        role: "Senior Legal Editor — Supreme Court Division",
        qual: "LL.M | Senior Bar Practice",
        focus: "Ratio Decidendi Extraction & Precedent Headnotes Verification"
      },
      {
        id: "team-2",
        name: "High Court Digest Editor Name",
        role: "Head of High Court Digest & Citation Verification",
        qual: "LL.B | High Court Litigation",
        focus: "Cross-Jurisdictional High Court Case Digest Indexing"
      },
      {
        id: "team-3",
        name: "Legal Research Specialist Name",
        role: "Lead Legal Research Associate",
        qual: "LL.M | Research Fellow",
        focus: "Legal Citation Indexing & Benchmark Headnote Verification"
      },
      {
        id: "team-4",
        name: "Criminal Code Specialist Name",
        role: "Specialist Editor — Criminal Jurisprudence",
        qual: "LL.B | Criminal Bar Advocate",
        focus: "Criminal Appeals, Bail Jurisprudence & Statutory Provisions"
      }
    ]
  }
};
