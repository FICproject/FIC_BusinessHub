export const INITIAL_CATEGORIES_DATA = [
  {
    id: 'cat-1',
    name: 'Business & Entrepreneurship',
    slug: 'business-entrepreneurship',
    description: 'Businesses, startups, retail, wholesale, distribution, franchises, and entrepreneurs.',
    iconName: 'Briefcase',
    subcategories: [
      'Business Owner',
      'Startup Founder',
      'Retailer',
      'Wholesaler',
      'Distributor',
      'Franchise Owner',
      'Business Idea Owner'
    ],
    fields: [
      { key: 'businessName', label: 'Registered Business / Entity Name', type: 'text', required: true, placeholder: 'e.g. Apex Enterprises' },
      { key: 'businessStage', label: 'Current Stage', type: 'select', required: true, options: ['Idea Stage', 'Early Stage (1-3 yrs)', 'Established (3+ yrs)', 'Expansion Stage'] },
      { key: 'annualTurnover', label: 'Annual Turnover Range', type: 'select', required: false, options: ['Below ₹10 Lakhs', '₹10L - ₹50L', '₹50L - ₹2 Cr', 'Above ₹2 Cr'] },
      { key: 'gstNumber', label: 'GSTIN (if applicable)', type: 'text', required: false, placeholder: '33AAAAA0000A1Z5' }
    ],
    kycDocuments: [
      { type: 'GOVT_ID', label: 'Proprietor Aadhaar or PAN Card', required: true },
      { type: 'BUSINESS_PROOF', label: 'Udyam / Business Registration Certificate', required: false }
    ]
  },
  {
    id: 'cat-2',
    name: 'Manufacturing & Industrial',
    slug: 'manufacturing-industrial',
    description: 'Textile, garments, machinery, food processing, industrial supply, and factories.',
    iconName: 'Factory',
    subcategories: [
      'Textile Manufacturer',
      'Garment Manufacturer',
      'Factory Owner',
      'Machinery Manufacturer',
      'Food Processor',
      'Industrial Supplier'
    ],
    fields: [
      { key: 'factoryName', label: 'Factory / Unit Name', type: 'text', required: true, placeholder: 'e.g. TexFab Mills' },
      { key: 'manufacturingType', label: 'Primary Products Manufactured', type: 'text', required: true, placeholder: 'e.g. Cotton Yarns, Knitted Garments' },
      { key: 'monthlyCapacity', label: 'Monthly Production Capacity', type: 'text', required: true, placeholder: 'e.g. 50,000 units / month' },
      { key: 'factoryLocation', label: 'Factory District & State', type: 'text', required: true, placeholder: 'e.g. Tiruppur, Tamil Nadu' }
    ],
    kycDocuments: [
      { type: 'FACTORY_LICENSE', label: 'Factory License / Udyam Certificate', required: true },
      { type: 'GST_CERTIFICATE', label: 'GST Registration Certificate', required: true }
    ]
  },
  {
    id: 'cat-3',
    name: 'Technology & Digital',
    slug: 'technology-digital',
    description: 'Software development, IT services, AI, cybersecurity, freelancers, and digital agencies.',
    iconName: 'Code',
    subcategories: [
      'Software Developer',
      'IT Professional',
      'Freelancer',
      'AI Professional',
      'Cybersecurity Specialist',
      'Technology Startup'
    ],
    fields: [
      { key: 'primarySkillset', label: 'Core Technical Skills', type: 'text', required: true, placeholder: 'e.g. React, Node.js, Cloud Architecture' },
      { key: 'portfolioUrl', label: 'Portfolio / GitHub / Website', type: 'text', required: false, placeholder: 'https://github.com/username' },
      { key: 'experienceYears', label: 'Years of Experience', type: 'select', required: true, options: ['0-1 year', '1-3 years', '3-7 years', '7+ years'] }
    ],
    kycDocuments: [
      { type: 'GOVT_ID', label: 'Government Photo ID (Aadhaar / PAN)', required: true }
    ]
  },
  {
    id: 'cat-4',
    name: 'Education & Knowledge',
    slug: 'education-knowledge',
    description: 'Students, professors, mentors, trainers, researchers, and educational consultants.',
    iconName: 'GraduationCap',
    subcategories: [
      'Student',
      'Teacher / Professor',
      'Mentor / Trainer',
      'Researcher',
      'Educational Consultant'
    ],
    fields: [
      { key: 'institutionName', label: 'Institution / College / University', type: 'text', required: true, placeholder: 'e.g. Anna University' },
      { key: 'educationLevel', label: 'Current Qualification / Role', type: 'select', required: true, options: ['Undergraduate Student', 'Postgraduate Student', 'Faculty Member', 'Professional Trainer'] },
      { key: 'careerGoals', label: 'Career or Research Focus', type: 'text', required: true, placeholder: 'e.g. Artificial Intelligence, Renewable Energy' }
    ],
    kycDocuments: [
      { type: 'STUDENT_OR_EMP_ID', label: 'College ID or Employment Certificate', required: true }
    ]
  },
  {
    id: 'cat-5',
    name: 'Professional & Personal Services',
    slug: 'professional-personal-services',
    description: 'Consultants, chartered accountants, legal advocates, architects, designers, and technicians.',
    iconName: 'Briefcase',
    subcategories: [
      'Chartered Accountant',
      'Legal Consultant / Advocate',
      'Architect & Civil Engineer',
      'Corporate Consultant',
      'Skilled Technician'
    ],
    fields: [
      { key: 'practiceCity', label: 'Primary City of Practice', type: 'text', required: true, placeholder: 'e.g. Chennai, Coimbatore' },
      { key: 'registrationNo', label: 'Bar Council / ICAI / Professional Reg No', type: 'text', required: false, placeholder: 'Registration Number' }
    ],
    kycDocuments: [
      { type: 'PROFESSIONAL_CREDENTIAL', label: 'Professional Body Certificate or Degree', required: true }
    ]
  },
  {
    id: 'cat-6',
    name: 'Agriculture & Natural Resources',
    slug: 'agriculture-natural-resources',
    description: 'Farmers, agri-enterprises, dairy, fisheries, organic producers, and allied agri-supply chain.',
    iconName: 'Sprout',
    subcategories: [
      'Farmer / Landowner',
      'Agri-Business Owner',
      'Dairy & Livestock',
      'Fisheries',
      'Agri-Consultant'
    ],
    fields: [
      { key: 'cropOrProduct', label: 'Primary Crop or Agri Product', type: 'text', required: true, placeholder: 'e.g. Organic Paddy, Coconut, Dairy' },
      { key: 'landArea', label: 'Operational Land Area (Acres) / Capacity', type: 'text', required: false, placeholder: 'e.g. 5 Acres' }
    ],
    kycDocuments: [
      { type: 'AGRI_ID', label: 'Kisan Passbook / Land Patta or Farmer Govt ID', required: true }
    ]
  },
  {
    id: 'cat-7',
    name: 'Investment & Finance',
    slug: 'investment-finance',
    description: 'Private investors, seed syndicates, financial consultants, and funding seekers.',
    iconName: 'TrendingUp',
    subcategories: [
      'Angel / Private Investor',
      'Funding Seeker',
      'Financial Consultant',
      'Wealth & Investment Advisory'
    ],
    fields: [
      { key: 'ticketSize', label: 'Investment Range / Funding Appetite', type: 'select', required: true, options: ['₹5 Lakhs - ₹25 Lakhs', '₹25 Lakhs - ₹1 Crore', '₹1 Crore - ₹5 Crores', 'Above ₹5 Crores'] },
      { key: 'preferredIndustries', label: 'Preferred Industries', type: 'text', required: true, placeholder: 'e.g. Manufacturing, Tech, Agri-tech' }
    ],
    kycDocuments: [
      { type: 'PAN_CARD', label: 'PAN Card (Mandatory for Investment/Funding)', required: true }
    ]
  },
  {
    id: 'cat-8',
    name: 'Healthcare & Wellness',
    slug: 'healthcare-wellness',
    description: 'Doctors, hospitals, wellness clinics, pharma distributors, and health practitioners.',
    iconName: 'HeartPulse',
    subcategories: [
      'Doctor / Medical Professional',
      'Clinic / Hospital Owner',
      'Wellness & Fitness Expert',
      'Pharmaceutical Distributor'
    ],
    fields: [
      { key: 'medicalSpeciality', label: 'Medical Speciality or Service Area', type: 'text', required: true, placeholder: 'e.g. General Medicine, Physiotherapy' },
      { key: 'councilRegistration', label: 'Medical Council / Pharmacy Reg No', type: 'text', required: false, placeholder: 'Reg Number' }
    ],
    kycDocuments: [
      { type: 'MEDICAL_LICENSE', label: 'Medical Council Registration or Drug License', required: true }
    ]
  },
  {
    id: 'cat-9',
    name: 'Creative, Media & Lifestyle',
    slug: 'creative-media-lifestyle',
    description: 'Content creators, media producers, fashion designers, photographers, and event managers.',
    iconName: 'Users',
    subcategories: [
      'Content Creator / Media Producer',
      'Fashion Designer',
      'Event Manager',
      'Photographer / Videographer'
    ],
    fields: [
      { key: 'creativeNiche', label: 'Creative Specialization', type: 'text', required: true, placeholder: 'e.g. Commercial Ad Production, Haute Couture' }
    ],
    kycDocuments: [
      { type: 'GOVT_ID', label: 'Government Photo ID', required: true }
    ]
  },
  {
    id: 'cat-10',
    name: 'Employment, Community & Social Development',
    slug: 'employment-community-social',
    description: 'Job seekers, skill development, NGOs, community leaders, and retired professionals.',
    iconName: 'Users',
    subcategories: [
      'Job Seeker / Fresher',
      'Experienced Professional',
      'NGO & Social Enterprise',
      'Retired Professional Advisor'
    ],
    fields: [
      { key: 'careerDomain', label: 'Target Career Domain or Social Initiative', type: 'text', required: true, placeholder: 'e.g. Accounts & Finance, Rural Education' }
    ],
    kycDocuments: [
      { type: 'GOVT_ID', label: 'Government Photo ID', required: true }
    ]
  }
];

export const INITIAL_SERVICES_DATA = [
  {
    id: 'srv-1',
    title: 'Bulk Cotton Garment & Uniform Manufacturing',
    categoryName: 'Manufacturing & Industrial',
    categorySlug: 'manufacturing-industrial',
    description: 'ISO-certified textile facility offering end-to-end weaving, dyeing, cutting, stitching and private-label packaging for domestic and export orders.',
    pricingType: 'STARTING_FROM',
    price: 150,
    deliveryTimeline: '15 - 30 Days',
    tags: ['Textiles', 'Export Quality', 'OEM Garments', 'Bulk Orders']
  },
  {
    id: 'srv-2',
    title: 'Enterprise Web & Mobile Cloud Application Development',
    categoryName: 'Technology & Digital',
    categorySlug: 'technology-digital',
    description: 'Full-stack software engineering team specializing in React, Node.js, microservices, AWS cloud migration, and secure payment gateway integrations.',
    pricingType: 'CUSTOM_QUOTE',
    deliveryTimeline: '3 - 8 Weeks',
    tags: ['Web Apps', 'Mobile Apps', 'Cloud Architecture', 'API Development']
  },
  {
    id: 'srv-3',
    title: 'Statutory GST, Company Incorporation & Annual Tax Audit',
    categoryName: 'Professional & Personal Services',
    categorySlug: 'professional-personal-services',
    description: 'Comprehensive financial advisory, secretarial compliance, monthly GST filing, TDS reconciliation, and startup valuation support.',
    pricingType: 'FIXED',
    price: 4999,
    deliveryTimeline: '3 - 7 Working Days',
    tags: ['GST Filing', 'Audit', 'Company Setup', 'Legal Compliance']
  },
  {
    id: 'srv-4',
    title: 'Cold Storage & Bulk Organic Produce Aggregation',
    categoryName: 'Agriculture & Natural Resources',
    categorySlug: 'agriculture-natural-resources',
    description: 'Farm-gate temperature-controlled aggregation and supply logistics for fruits, vegetables, and grain commodities direct to distributors.',
    pricingType: 'CUSTOM_QUOTE',
    deliveryTimeline: 'Ongoing Daily Supply',
    tags: ['Cold Storage', 'Organic Produce', 'B2B Agri Supply', 'Farm Gate']
  },
  {
    id: 'srv-5',
    title: 'Franchise Expansion Strategy & Distributor Network Setup',
    categoryName: 'Business & Entrepreneurship',
    categorySlug: 'business-entrepreneurship',
    description: 'Strategic market development for brands looking to expand distributor footprints across South India tier-2 and tier-3 towns.',
    pricingType: 'CUSTOM_QUOTE',
    deliveryTimeline: '4 - 12 Weeks',
    tags: ['Franchise', 'Distribution Network', 'Business Expansion']
  },
  {
    id: 'srv-6',
    title: 'Commercial Video Production & Corporate Ad Filmmaking',
    categoryName: 'Creative, Media & Lifestyle',
    categorySlug: 'creative-media-lifestyle',
    description: 'Full production house handling scriptwriting, high-end 4K cinematography, post-production VFX, and social media advertising campaigns.',
    pricingType: 'STARTING_FROM',
    price: 25000,
    deliveryTimeline: '10 - 20 Days',
    tags: ['Video Production', 'Ad Film', 'Brand Story', 'Media']
  }
];

