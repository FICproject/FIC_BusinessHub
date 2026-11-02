export interface DynamicFormField {
  key: string;
  label: string;
  type: 'text' | 'select' | 'textarea' | 'number';
  required: boolean;
  placeholder?: string;
  options?: string[];
  helperText?: string;
}

export interface KycDocRequirement {
  type: string;
  label: string;
  required: boolean;
  description?: string;
}

export interface SubcategoryFormConfig {
  roleBadge: string;
  roleTitle: string;
  fields: DynamicFormField[];
  kycDocuments: KycDocRequirement[];
}

export const SUBCATEGORY_CONFIGS: Record<string, SubcategoryFormConfig> = {
  // ==========================================
  // EDUCATION & KNOWLEDGE
  // ==========================================
  'Student': {
    roleBadge: 'STUDENT',
    roleTitle: 'Student / Academic Scholar',
    fields: [
      {
        key: 'institutionName',
        label: 'College / University / School Name',
        type: 'text',
        required: true,
        placeholder: 'e.g. Anna University, IIT Madras, PSG Tech'
      },
      {
        key: 'degreeCourse',
        label: 'Degree & Field of Study',
        type: 'text',
        required: true,
        placeholder: 'e.g. B.Tech Computer Science, B.Com, MBA'
      },
      {
        key: 'academicYear',
        label: 'Current Academic Year',
        type: 'select',
        required: true,
        options: ['1st Year Undergraduate', '2nd Year Undergraduate', '3rd Year Undergraduate', 'Final Year Undergraduate', 'Postgraduate (Masters)', 'Ph.D / Research Scholar']
      },
      {
        key: 'learningInterests',
        label: 'Primary Learning Interests & Skills',
        type: 'text',
        required: true,
        placeholder: 'e.g. Full-Stack Web, AI/ML, Cloud Computing, Financial Modeling'
      },
      {
        key: 'careerGoals',
        label: 'Career Ambition / Objective',
        type: 'select',
        required: true,
        options: ['Campus Placement & Tech Jobs', 'Startup Founder & Entrepreneurship', 'Higher Studies & Research', 'Freelancing & Independent Consulting']
      }
    ],
    kycDocuments: [
      {
        type: 'STUDENT_ID',
        label: 'College ID Card or Bonafide Certificate',
        required: true,
        description: 'Clear photo or PDF of current college identity card or enrollment proof'
      },
      {
        type: 'GOVT_ID',
        label: 'Aadhaar Card / Government Photo ID',
        required: true,
        description: 'Mandatory 18+ adult age & identity verification'
      }
    ]
  },

  'Teacher / Professor': {
    roleBadge: 'TEACHER / PROFESSOR',
    roleTitle: 'Academic Faculty & Educator',
    fields: [
      {
        key: 'institutionName',
        label: 'Educational Institution / University Name',
        type: 'text',
        required: true,
        placeholder: 'e.g. Loyola College, SRM Institute, National College'
      },
      {
        key: 'department',
        label: 'Academic Department / Specialization',
        type: 'text',
        required: true,
        placeholder: 'e.g. Department of Computer Science & Engineering'
      },
      {
        key: 'designation',
        label: 'Academic Designation',
        type: 'select',
        required: true,
        options: ['Assistant Professor', 'Associate Professor', 'Professor / HOD', 'Senior Lecturer', 'Research Guide']
      },
      {
        key: 'teachingExperience',
        label: 'Years of Academic Experience',
        type: 'select',
        required: true,
        options: ['1-3 years', '3-7 years', '7-15 years', '15+ years']
      },
      {
        key: 'collaborationInterests',
        label: 'Industry Collaboration Interests',
        type: 'text',
        required: false,
        placeholder: 'e.g. Student Internships, Industry Research Projects, Guest Lectures'
      }
    ],
    kycDocuments: [
      {
        type: 'FACULTY_ID',
        label: 'Institution Faculty ID Card / Appointment Letter',
        required: true,
        description: 'Proof of current academic affiliation'
      },
      {
        type: 'GOVT_ID',
        label: 'Aadhaar Card or PAN Card',
        required: true,
        description: 'Government photo identification proof'
      }
    ]
  },

  'Mentor / Trainer': {
    roleBadge: 'MENTOR / TRAINER',
    roleTitle: 'Industry Mentor & Professional Coach',
    fields: [
      {
        key: 'mentorDomain',
        label: 'Primary Mentorship Domain',
        type: 'select',
        required: true,
        options: ['Startup Incubation & Business Strategy', 'Technology & Cloud Architecture', 'Sales, Marketing & Brand Growth', 'Finance, Pitching & Fundraising', 'Executive Leadership & Soft Skills']
      },
      {
        key: 'totalExperience',
        label: 'Years of Professional / Industry Experience',
        type: 'select',
        required: true,
        options: ['3-5 years', '5-10 years', '10-20 years', '20+ years']
      },
      {
        key: 'currentOrganization',
        label: 'Current Organization / Enterprise & Title',
        type: 'text',
        required: true,
        placeholder: 'e.g. Senior Director at TechCorp / Principal Consultant'
      },
      {
        key: 'mentorshipMode',
        label: 'Preferred Mentorship Format',
        type: 'select',
        required: true,
        options: ['1-on-1 Strategy Calls', 'Group Masterclasses & Workshops', 'Startup Advisory Board Member', 'Flexible Online Consultations']
      }
    ],
    kycDocuments: [
      {
        type: 'PROFESSIONAL_PROOF',
        label: 'Professional Profile / Company ID / LinkedIn Proof',
        required: true,
        description: 'Verification of professional standing & experience'
      },
      {
        type: 'GOVT_ID',
        label: 'Aadhaar Card or PAN Card',
        required: true,
        description: 'Identity verification for FIC verified badge'
      }
    ]
  },

  // ==========================================
  // BUSINESS & ENTREPRENEURSHIP
  // ==========================================
  'Business Owner': {
    roleBadge: 'BUSINESS OWNER',
    roleTitle: 'Enterprise & Business Owner',
    fields: [
      {
        key: 'businessName',
        label: 'Registered Business / Entity Name',
        type: 'text',
        required: true,
        placeholder: 'e.g. Supreme Enterprises Pvt Ltd'
      },
      {
        key: 'industrySector',
        label: 'Primary Line of Business / Industry',
        type: 'text',
        required: true,
        placeholder: 'e.g. FMCG Distribution, Building Materials, Electrical Supplies'
      },
      {
        key: 'businessStage',
        label: 'Operating Stage',
        type: 'select',
        required: true,
        options: ['Early Stage (1-3 yrs)', 'Established (3-7 yrs)', 'Expansion Stage (7+ yrs)']
      },
      {
        key: 'annualTurnover',
        label: 'Annual Turnover Range',
        type: 'select',
        required: true,
        options: ['Below ₹20 Lakhs', '₹20L - ₹50L', '₹50L - ₹2 Crores', 'Above ₹2 Crores']
      },
      {
        key: 'gstNumber',
        label: 'GSTIN (if registered)',
        type: 'text',
        required: false,
        placeholder: '33AAAAA0000A1Z5'
      }
    ],
    kycDocuments: [
      {
        type: 'BUSINESS_PROOF',
        label: 'GST Registration Certificate or Udyam MSME Certificate',
        required: true,
        description: 'Official enterprise registration proof'
      },
      {
        type: 'GOVT_ID',
        label: 'Proprietor / Director Aadhaar or PAN Card',
        required: true,
        description: 'Identity verification of authorized signatory'
      }
    ]
  },

  'Startup Founder': {
    roleBadge: 'STARTUP FOUNDER',
    roleTitle: 'Startup Founder & Innovator',
    fields: [
      {
        key: 'startupName',
        label: 'Startup / Venture Name',
        type: 'text',
        required: true,
        placeholder: 'e.g. NextGen BioTech, HyperLogistics'
      },
      {
        key: 'startupStage',
        label: 'Venture Stage',
        type: 'select',
        required: true,
        options: ['Idea & Concept Stage', 'Prototype / MVP Built', 'Early Traction & Paying Customers', 'Scaling & Growth Stage']
      },
      {
        key: 'problemSolving',
        label: 'Core Problem Statement & Innovation',
        type: 'text',
        required: true,
        placeholder: 'Briefly explain what problem your startup solves'
      },
      {
        key: 'targetMarket',
        label: 'Target Market & Customer Segment',
        type: 'text',
        required: true,
        placeholder: 'e.g. B2B Tier-2 Manufacturers, D2C Gen-Z, Hospitals'
      },
      {
        key: 'fundingRequirement',
        label: 'Immediate Ecosystem Need',
        type: 'select',
        required: true,
        options: ['Seeking Seed / Angel Funding', 'Seeking B2B Pilots & Customers', 'Looking for Tech / Business Mentorship', 'Looking for Co-founder / Team']
      }
    ],
    kycDocuments: [
      {
        type: 'INCORPORATION_PROOF',
        label: 'Certificate of Incorporation / DPIIT Recognition (or Pitch Deck)',
        required: true,
        description: 'Proof of company registration or executive venture summary'
      },
      {
        type: 'GOVT_ID',
        label: 'Founder Aadhaar or PAN Card',
        required: true,
        description: 'Founder KYC identity verification'
      }
    ]
  },

  'Retailer': {
    roleBadge: 'RETAILER',
    roleTitle: 'Retail Store Owner & Merchant',
    fields: [
      {
        key: 'storeName',
        label: 'Store / Retail Shop Name',
        type: 'text',
        required: true,
        placeholder: 'e.g. Annam Supermarket, Style Trendz Retail'
      },
      {
        key: 'retailCategory',
        label: 'Retail Category',
        type: 'select',
        required: true,
        options: ['Groceries & Supermarket', 'Apparel & Footwear', 'Electronics & Mobiles', 'Hardware & Home Goods', 'Pharma & Health Store', 'General Merchant']
      },
      {
        key: 'storeCity',
        label: 'City & District',
        type: 'text',
        required: true,
        placeholder: 'e.g. Madurai, Coimbatore, Salem'
      },
      {
        key: 'annualTurnover',
        label: 'Annual Turnover Range',
        type: 'select',
        required: true,
        options: ['Below ₹15 Lakhs', '₹15L - ₹50L', '₹50L - ₹1 Crore', 'Above ₹1 Crore']
      }
    ],
    kycDocuments: [
      {
        type: 'SHOP_LICENSE',
        label: 'Shop & Establishment License or Trade License / Udyam',
        required: true,
        description: 'Municipal trade license or Udyam registration'
      },
      {
        type: 'GOVT_ID',
        label: 'Proprietor Aadhaar or PAN Card',
        required: true,
        description: 'Identity verification'
      }
    ]
  },

  'Wholesaler': {
    roleBadge: 'WHOLESALER',
    roleTitle: 'Wholesale Merchant & B2B Trader',
    fields: [
      {
        key: 'wholesaleBusinessName',
        label: 'Wholesale Entity Name',
        type: 'text',
        required: true,
        placeholder: 'e.g. Balaji Wholesale Traders'
      },
      {
        key: 'goodsCategory',
        label: 'Primary Wholesale Goods Handled',
        type: 'text',
        required: true,
        placeholder: 'e.g. Grains & Spices, Plastic Goods, Fasteners, Fabrics'
      },
      {
        key: 'tradingTerritory',
        label: 'Supply Region / Trade Territory',
        type: 'select',
        required: true,
        options: ['District Level', 'Regional (Multiple Districts)', 'State-wide', 'South India / Multi-state']
      },
      {
        key: 'gstNumber',
        label: 'GSTIN (Mandatory for Wholesale Trade)',
        type: 'text',
        required: true,
        placeholder: '33AAAAA0000A1Z5'
      }
    ],
    kycDocuments: [
      {
        type: 'GST_CERTIFICATE',
        label: 'GST Registration Certificate',
        required: true,
        description: 'Mandatory GST registration document'
      },
      {
        type: 'GOVT_ID',
        label: 'Proprietor / Partner PAN Card',
        required: true,
        description: 'Tax identity verification'
      }
    ]
  },

  // ==========================================
  // TECHNOLOGY & DIGITAL
  // ==========================================
  'Freelancer': {
    roleBadge: 'FREELANCER',
    roleTitle: 'Independent Freelance Specialist',
    fields: [
      {
        key: 'primarySkills',
        label: 'Core Technical / Freelance Skills',
        type: 'text',
        required: true,
        placeholder: 'e.g. React, Next.js, Node.js, UI/UX Design, DevOps'
      },
      {
        key: 'portfolioUrl',
        label: 'Portfolio / GitHub / Behance / LinkedIn URL',
        type: 'text',
        required: true,
        placeholder: 'https://github.com/yourhandle or portfolio link'
      },
      {
        key: 'experienceLevel',
        label: 'Years of Freelancing / Industry Experience',
        type: 'select',
        required: true,
        options: ['0-1 year (Entry Level)', '1-3 years (Junior Specialist)', '3-6 years (Mid-Senior)', '6+ years (Lead / Architect)']
      },
      {
        key: 'projectPreferences',
        label: 'Preferred Project Engagements',
        type: 'select',
        required: true,
        options: ['Fixed Scope Milestone Projects', 'Monthly Retainer Contracts', 'Full-time Remote Freelancing', 'Technical Consulting / Advisory']
      }
    ],
    kycDocuments: [
      {
        type: 'GOVT_ID',
        label: 'Government Photo ID (Aadhaar or PAN Card)',
        required: true,
        description: 'Personal KYC verification for verified badge'
      },
      {
        type: 'PORTFOLIO_PROOF',
        label: 'Work Sample / Client Credential / Degree Certificate',
        required: false,
        description: 'Supporting technical credential'
      }
    ]
  },

  'Software Developer': {
    roleBadge: 'SOFTWARE DEVELOPER',
    roleTitle: 'Software Engineer & Developer',
    fields: [
      {
        key: 'techStack',
        label: 'Primary Programming Stack & Tools',
        type: 'text',
        required: true,
        placeholder: 'e.g. TypeScript, React, Python, PostgreSQL, Docker'
      },
      {
        key: 'currentRole',
        label: 'Current Employment Status',
        type: 'select',
        required: true,
        options: ['Full-Time Employed Software Engineer', 'Independent Software Consultant', 'Freelance Developer', 'Seeking Enterprise Opportunities']
      },
      {
        key: 'experienceYears',
        label: 'Years in Software Development',
        type: 'select',
        required: true,
        options: ['0-1 year', '1-3 years', '3-7 years', '7+ years']
      },
      {
        key: 'githubOrPortfolio',
        label: 'GitHub or Portfolio Link',
        type: 'text',
        required: false,
        placeholder: 'https://github.com/username'
      }
    ],
    kycDocuments: [
      {
        type: 'GOVT_ID',
        label: 'Government Photo ID (Aadhaar / PAN)',
        required: true,
        description: 'Personal identity verification'
      }
    ]
  },

  // ==========================================
  // MANUFACTURING & INDUSTRIAL
  // ==========================================
  'Textile Manufacturer': {
    roleBadge: 'TEXTILE MANUFACTURER',
    roleTitle: 'Textile & Weaving Manufacturer',
    fields: [
      {
        key: 'factoryName',
        label: 'Textile Mill / Factory Name',
        type: 'text',
        required: true,
        placeholder: 'e.g. TexFab Spinners & Weavers'
      },
      {
        key: 'textileProducts',
        label: 'Primary Fabric / Yarn Manufactured',
        type: 'text',
        required: true,
        placeholder: 'e.g. 100% Combed Cotton Yarn, Knitted Greige Fabric'
      },
      {
        key: 'monthlyCapacity',
        label: 'Monthly Production Capacity',
        type: 'text',
        required: true,
        placeholder: 'e.g. 100 MT Yarn / 500,000 meters fabric'
      },
      {
        key: 'factoryLocation',
        label: 'Factory Location (City, District)',
        type: 'text',
        required: true,
        placeholder: 'e.g. Tiruppur, Erode, Coimbatore'
      }
    ],
    kycDocuments: [
      {
        type: 'FACTORY_LICENSE',
        label: 'Factory License / Udyam MSME Certificate',
        required: true,
        description: 'Official manufacturing enterprise registration'
      },
      {
        type: 'GST_CERTIFICATE',
        label: 'GST Registration Certificate',
        required: true,
        description: 'Mandatory GST registration document'
      }
    ]
  },

  'Garment Manufacturer': {
    roleBadge: 'GARMENT MANUFACTURER',
    roleTitle: 'Garment & Apparel Manufacturer',
    fields: [
      {
        key: 'factoryName',
        label: 'Garment Unit / Factory Name',
        type: 'text',
        required: true,
        placeholder: 'e.g. Apex Apparel Exporters'
      },
      {
        key: 'garmentTypes',
        label: 'Garment Categories Produced',
        type: 'text',
        required: true,
        placeholder: 'e.g. Knitted T-Shirts, Uniforms, Kidswear, Woven Shirts'
      },
      {
        key: 'monthlyCapacity',
        label: 'Monthly Production Capacity (Pieces)',
        type: 'text',
        required: true,
        placeholder: 'e.g. 75,000 pieces per month'
      },
      {
        key: 'oemCapability',
        label: 'Private Label / OEM Capability',
        type: 'select',
        required: true,
        options: ['Full OEM / Private Label Services Available', 'Domestic Bulk Supply Only', 'Export Order Specialist', 'Both Domestic & Export']
      }
    ],
    kycDocuments: [
      {
        type: 'FACTORY_LICENSE',
        label: 'Factory License / Udyam Certificate',
        required: true,
        description: 'Official apparel manufacturing license'
      },
      {
        type: 'GST_CERTIFICATE',
        label: 'GST Registration Certificate',
        required: true,
        description: 'Valid GSTIN certificate'
      }
    ]
  },

  // ==========================================
  // INVESTMENT & FINANCE
  // ==========================================
  'Angel / Private Investor': {
    roleBadge: 'INVESTOR',
    roleTitle: 'Angel & Private Investor',
    fields: [
      {
        key: 'investorType',
        label: 'Investor Profile',
        type: 'select',
        required: true,
        options: ['Individual Angel Investor', 'Syndicate Lead', 'Family Office Representative', 'Corporate / VC Partner']
      },
      {
        key: 'ticketSize',
        label: 'Typical Ticket Size per Deal',
        type: 'select',
        required: true,
        options: ['₹5 Lakhs - ₹25 Lakhs', '₹25 Lakhs - ₹1 Crore', '₹1 Crore - ₹5 Crores', 'Above ₹5 Crores']
      },
      {
        key: 'targetSectors',
        label: 'Preferred Investment Sectors',
        type: 'text',
        required: true,
        placeholder: 'e.g. B2B SaaS, Manufacturing, AgriTech, CleanTech'
      },
      {
        key: 'portfolioExperience',
        label: 'Prior Angel / Startup Investments',
        type: 'select',
        required: true,
        options: ['First-time Angel Investor', '1 - 5 Portfolio Companies', '5 - 15 Portfolio Companies', '15+ Portfolio Companies']
      }
    ],
    kycDocuments: [
      {
        type: 'PAN_CARD',
        label: 'Permanent Account Number (PAN Card)',
        required: true,
        description: 'Mandatory financial and tax identity for investment transactions'
      },
      {
        type: 'GOVT_ID',
        label: 'Aadhaar Card or Passport',
        required: true,
        description: 'Government photo identification proof'
      }
    ]
  },

  'Funding Seeker': {
    roleBadge: 'FUNDING SEEKER',
    roleTitle: 'Growth Venture Seeking Capital',
    fields: [
      {
        key: 'ventureName',
        label: 'Company / Venture Name',
        type: 'text',
        required: true,
        placeholder: 'e.g. Zenvo Renewable Systems'
      },
      {
        key: 'capitalRequirement',
        label: 'Capital Requirement',
        type: 'select',
        required: true,
        options: ['₹10 Lakhs - ₹25 Lakhs', '₹25 Lakhs - ₹50 Lakhs', '₹50 Lakhs - ₹2 Crores', 'Above ₹2 Crores']
      },
      {
        key: 'useOfFunds',
        label: 'Primary Utilization of Funds',
        type: 'text',
        required: true,
        placeholder: 'e.g. Machinery purchase, working capital, market expansion'
      },
      {
        key: 'revenueStage',
        label: 'Current Annual Revenue Run Rate',
        type: 'select',
        required: true,
        options: ['Pre-Revenue / Prototype', '₹10L - ₹50L Annual Revenue', '₹50L - ₹2 Cr Annual Revenue', 'Above ₹2 Cr Annual Revenue']
      }
    ],
    kycDocuments: [
      {
        type: 'PITCH_DECK',
        label: 'Pitch Deck / Business Proposal Summary (PDF)',
        required: true,
        description: 'Executive business overview and financial projections'
      },
      {
        type: 'BUSINESS_PROOF',
        label: 'Company Registration / Founder PAN',
        required: true,
        description: 'Business entity or founder identity proof'
      }
    ]
  }
};

/**
 * Fallback generator for any subcategory not explicitly detailed above
 */
export const getSubcategoryFormConfig = (
  categoryName: string,
  subcategoryName: string
): SubcategoryFormConfig => {
  if (SUBCATEGORY_CONFIGS[subcategoryName]) {
    return SUBCATEGORY_CONFIGS[subcategoryName];
  }

  // Sensible default tailored from subcategory name
  const cleanTitle = subcategoryName || 'Verified Member';
  const roleBadge = cleanTitle.toUpperCase();

  return {
    roleBadge,
    roleTitle: `${cleanTitle} Specialist`,
    fields: [
      {
        key: 'entityOrPracticeName',
        label: `Organization / Practice / Professional Title for ${cleanTitle}`,
        type: 'text',
        required: true,
        placeholder: `e.g. Professional practice or organization name`
      },
      {
        key: 'coreSpecialization',
        label: 'Core Specialization & Services',
        type: 'text',
        required: true,
        placeholder: 'Describe your primary services, skills, or goods'
      },
      {
        key: 'experienceYears',
        label: 'Years of Experience / Operations',
        type: 'select',
        required: true,
        options: ['0-1 year', '1-3 years', '3-7 years', '7+ years']
      },
      {
        key: 'operationalArea',
        label: 'Primary City / Region of Operation',
        type: 'text',
        required: true,
        placeholder: 'e.g. Chennai, Coimbatore, Tamil Nadu'
      }
    ],
    kycDocuments: [
      {
        type: 'GOVT_ID',
        label: 'Government Photo ID (Aadhaar / PAN Card)',
        required: true,
        description: 'Mandatory identity verification'
      },
      {
        type: 'PROFESSIONAL_PROOF',
        label: 'Registration Certificate / License / Trade Document',
        required: false,
        description: 'Supporting sector registration proof (if applicable)'
      }
    ]
  };
};
