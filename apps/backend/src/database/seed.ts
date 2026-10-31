import mongoose from 'mongoose';
import { config } from '../config';
import { CategoryModel, SubcategoryModel } from '../modules/categories/categories.model';
import { CategoryConfigurationModel } from '../modules/category-configurations/category-configurations.model';
import { ServiceListingModel } from '../modules/services/services.model';
import { UserModel } from '../modules/users/users.model';
import { UserRole, AccountStatus, ConfigStatus, ServiceListingStatus } from '@fic/shared-types';
import bcrypt from 'bcryptjs';

const INITIAL_CATEGORIES = [
  {
    name: 'Business & Entrepreneurship',
    slug: 'business-entrepreneurship',
    description: 'Businesses, startups, retail, wholesale, distribution, franchises, and entrepreneurs.',
    iconName: 'Briefcase',
    displayOrder: 1,
    subcategories: [
      'Business Owner',
      'Startup Founder',
      'Retailer',
      'Wholesaler',
      'Distributor',
      'Franchise Owner',
      'Business Idea Owner'
    ],
    registrationFields: [
      { fieldKey: 'businessName', label: 'Registered Entity / Trade Name', type: 'text', required: true, placeholder: 'e.g. Apex Enterprises' },
      { fieldKey: 'businessStage', label: 'Current Stage', type: 'select', required: true, options: ['Idea Stage', 'Early Stage (1-3 yrs)', 'Established (3+ yrs)', 'Expansion Stage'] },
      { fieldKey: 'annualTurnover', label: 'Approximate Annual Turnover', type: 'select', required: false, options: ['Below ₹10 Lakhs', '₹10L - ₹50L', '₹50L - ₹2 Cr', 'Above ₹2 Cr'] },
      { fieldKey: 'gstNumber', label: 'GSTIN (if applicable)', type: 'text', required: false, placeholder: '33AAAAA0000A1Z5' }
    ],
    kycRequiredDocuments: [
      { documentType: 'GOVT_ID', label: 'Proprietor / Director Aadhaar or PAN', description: 'Clear photo or PDF of government issued ID', required: true },
      { documentType: 'BUSINESS_PROOF', label: 'Business Registration / GST / Udyam Certificate', description: 'Document showing business registration', required: false }
    ]
  },
  {
    name: 'Manufacturing & Industrial',
    slug: 'manufacturing-industrial',
    description: 'Textile, garments, machinery, food processing, industrial supply, and factories.',
    iconName: 'Factory',
    displayOrder: 2,
    subcategories: [
      'Textile Manufacturer',
      'Garment Manufacturer',
      'Factory Owner',
      'Machinery Manufacturer',
      'Food Processor',
      'Industrial Supplier'
    ],
    registrationFields: [
      { fieldKey: 'factoryName', label: 'Factory / Unit Name', type: 'text', required: true, placeholder: 'e.g. TexFab Mills' },
      { fieldKey: 'manufacturingType', label: 'Primary Products Manufactured', type: 'text', required: true, placeholder: 'e.g. Cotton Yarns, Knitted Garments' },
      { fieldKey: 'monthlyCapacity', label: 'Monthly Production Capacity', type: 'text', required: true, placeholder: 'e.g. 50,000 units / month' },
      { fieldKey: 'factoryLocation', label: 'Factory District & State', type: 'text', required: true, placeholder: 'e.g. Tiruppur, Tamil Nadu' }
    ],
    kycRequiredDocuments: [
      { documentType: 'FACTORY_LICENSE', label: 'Factory License / Udyam Registration', description: 'Valid industrial registration proof', required: true },
      { documentType: 'GST_CERTIFICATE', label: 'GST Registration Certificate', description: 'Mandatory for industrial manufacturers', required: true }
    ]
  },
  {
    name: 'Technology & Digital',
    slug: 'technology-digital',
    description: 'Software development, IT services, AI, cybersecurity, freelancers, and digital agencies.',
    iconName: 'Code',
    displayOrder: 3,
    subcategories: [
      'Software Developer',
      'IT Professional',
      'Freelancer',
      'AI Professional',
      'Cybersecurity Specialist',
      'Technology Startup'
    ],
    registrationFields: [
      { fieldKey: 'primarySkillset', label: 'Core Technical Skills', type: 'text', required: true, placeholder: 'e.g. React, Node.js, Cloud Architecture' },
      { fieldKey: 'portfolioUrl', label: 'Portfolio / GitHub / Website', type: 'text', required: false, placeholder: 'https://github.com/username' },
      { fieldKey: 'yearsOfExperience', label: 'Years in Industry', type: 'select', required: true, options: ['0-1 year', '1-3 years', '3-7 years', '7+ years'] }
    ],
    kycRequiredDocuments: [
      { documentType: 'GOVT_ID', label: 'Government ID (Aadhaar / PAN)', description: 'ID proof of the professional', required: true }
    ]
  },
  {
    name: 'Education & Knowledge',
    slug: 'education-knowledge',
    description: 'Students, professors, mentors, trainers, researchers, and educational consultants.',
    iconName: 'GraduationCap',
    displayOrder: 4,
    subcategories: [
      'Student',
      'Teacher / Professor',
      'Mentor / Trainer',
      'Researcher',
      'Educational Consultant'
    ],
    registrationFields: [
      { fieldKey: 'institutionName', label: 'Institution / College / University', type: 'text', required: true, placeholder: 'e.g. Anna University' },
      { fieldKey: 'educationLevel', label: 'Current Qualification / Role', type: 'select', required: true, options: ['Undergraduate Student', 'Postgraduate Student', 'Faculty Member', 'Professional Trainer'] },
      { fieldKey: 'areasOfInterest', label: 'Career or Research Interests', type: 'text', required: true, placeholder: 'e.g. AI Entrepreneurship, Renewable Energy' }
    ],
    kycRequiredDocuments: [
      { documentType: 'STUDENT_OR_EMP_ID', label: 'College ID or Employment Certificate', description: 'Valid educational institution proof', required: true }
    ]
  },
  {
    name: 'Professional & Personal Services',
    slug: 'professional-personal-services',
    description: 'Consultants, chartered accountants, legal advocates, architects, designers, and technicians.',
    iconName: 'FileCheck',
    displayOrder: 5,
    subcategories: [
      'Chartered Accountant',
      'Legal Consultant / Advocate',
      'Architect & Civil Engineer',
      'Corporate Consultant',
      'Skilled Technician'
    ],
    registrationFields: [
      { fieldKey: 'professionalLicense', label: 'Bar Council / ICAI / Council of Architecture Reg No', type: 'text', required: false, placeholder: 'Membership / Reg number' },
      { fieldKey: 'practiceCity', label: 'Primary City of Practice', type: 'text', required: true, placeholder: 'e.g. Chennai, Coimbatore' }
    ],
    kycRequiredDocuments: [
      { documentType: 'PROFESSIONAL_CREDENTIAL', label: 'Professional Body Certificate or Degree', description: 'License to practice or degree certificate', required: true }
    ]
  },
  {
    name: 'Agriculture & Natural Resources',
    slug: 'agriculture-natural-resources',
    description: 'Farmers, agri-enterprises, dairy, fisheries, organic producers, and allied agri-supply chain.',
    iconName: 'Sprout',
    displayOrder: 6,
    subcategories: [
      'Farmer / Landowner',
      'Agri-Business Owner',
      'Dairy & Livestock',
      'Fisheries',
      'Agri-Consultant'
    ],
    registrationFields: [
      { fieldKey: 'cropOrProduct', label: 'Primary Crop or Agri Product', type: 'text', required: true, placeholder: 'e.g. Organic Paddy, Coconut, Dairy' },
      { fieldKey: 'landArea', label: 'Operational Land Area (Acres) / Facility Size', type: 'text', required: false, placeholder: 'e.g. 5 Acres' }
    ],
    kycRequiredDocuments: [
      { documentType: 'AGRI_ID', label: 'Kisan Passbook / Land Patta or Farmer Govt ID', description: 'Agricultural verification proof', required: true }
    ]
  },
  {
    name: 'Investment & Finance',
    slug: 'investment-finance',
    description: 'Private investors, seed syndicates, financial consultants, and funding seekers.',
    iconName: 'TrendingUp',
    displayOrder: 7,
    subcategories: [
      'Angel / Private Investor',
      'Funding Seeker',
      'Financial Consultant',
      'Wealth & Investment Advisory'
    ],
    registrationFields: [
      { fieldKey: 'ticketSize', label: 'Investment Range / Funding Appetite', type: 'select', required: true, options: ['₹5 Lakhs - ₹25 Lakhs', '₹25 Lakhs - ₹1 Crore', '₹1 Crore - ₹5 Crores', 'Above ₹5 Crores'] },
      { fieldKey: 'preferredIndustries', label: 'Preferred Industries', type: 'text', required: true, placeholder: 'e.g. Tech, Manufacturing, Agri-tech' }
    ],
    kycRequiredDocuments: [
      { documentType: 'PAN_CARD', label: 'PAN Card (Mandatory for Investment/Funding)', description: 'Government PAN card', required: true }
    ]
  },
  {
    name: 'Healthcare & Wellness',
    slug: 'healthcare-wellness',
    description: 'Doctors, hospitals, wellness clinics, pharma distributors, and health practitioners.',
    iconName: 'HeartPulse',
    displayOrder: 8,
    subcategories: [
      'Doctor / Medical Professional',
      'Clinic / Hospital Owner',
      'Wellness & Fitness Expert',
      'Pharmaceutical Distributor'
    ],
    registrationFields: [
      { fieldKey: 'medicalSpeciality', label: 'Medical Speciality or Service Area', type: 'text', required: true, placeholder: 'e.g. General Medicine, Physiotherapy' },
      { fieldKey: 'councilRegistration', label: 'State Medical Council / Pharmacy Reg No', type: 'text', required: false, placeholder: 'Reg Number' }
    ],
    kycRequiredDocuments: [
      { documentType: 'MEDICAL_LICENSE', label: 'Medical Council Registration or Drug License', description: 'Valid healthcare verification', required: true }
    ]
  },
  {
    name: 'Creative, Media & Lifestyle',
    slug: 'creative-media-lifestyle',
    description: 'Content creators, media producers, fashion designers, photographers, and event managers.',
    iconName: 'Camera',
    displayOrder: 9,
    subcategories: [
      'Content Creator / Media Producer',
      'Fashion Designer',
      'Event Manager',
      'Photographer / Videographer'
    ],
    registrationFields: [
      { fieldKey: 'creativeNiche', label: 'Creative Specialization', type: 'text', required: true, placeholder: 'e.g. Commercial Ad Production, Haute Couture' }
    ],
    kycRequiredDocuments: [
      { documentType: 'GOVT_ID', label: 'Government Photo ID', description: 'Aadhaar / Voter ID / Passport', required: true }
    ]
  },
  {
    name: 'Employment, Community & Social Development',
    slug: 'employment-community-social',
    description: 'Job seekers, skill development, NGOs, community leaders, and retired professionals.',
    iconName: 'Users',
    displayOrder: 10,
    subcategories: [
      'Job Seeker / Fresher',
      'Experienced Professional',
      'NGO & Social Enterprise',
      'Retired Professional Advisor'
    ],
    registrationFields: [
      { fieldKey: 'careerDomain', label: 'Target Career Domain or Social Initiative', type: 'text', required: true, placeholder: 'e.g. Accounts & Finance, Rural Education' }
    ],
    kycRequiredDocuments: [
      { documentType: 'GOVT_ID', label: 'Government Photo ID', description: 'Aadhaar / Driving License', required: true }
    ]
  }
];

export const seedDatabase = async (): Promise<void> => {
  try {
    console.log('🌱 Starting FIC Business Hub database seed...');

    // 1. Create a platform demo provider account for seed marketplace listings
    const salt = await bcrypt.genSalt(10);
    const demoPasswordHash = await bcrypt.hash('FicPartner@2026', salt);

    let providerUser = await UserModel.findOne({ email: 'verified-provider@ficapp.in' });
    if (!providerUser) {
      providerUser = await UserModel.create({
        fullName: 'FIC Verified Partner Provider',
        email: 'verified-provider@ficapp.in',
        phoneNumber: '9876543210',
        passwordHash: demoPasswordHash,
        role: UserRole.MEMBER,
        status: AccountStatus.ACTIVE,
        isEmailVerified: true,
        isPhoneVerified: true,
        isKycApproved: true,
        isMembershipActive: true
      });
      console.log('✅ Created Demo Provider account.');
    }

    // 2. Seed Categories, Subcategories, and Dynamic Configurations
    for (const catData of INITIAL_CATEGORIES) {
      let category = await CategoryModel.findOne({ slug: catData.slug });
      if (!category) {
        category = await CategoryModel.create({
          name: catData.name,
          slug: catData.slug,
          description: catData.description,
          iconName: catData.iconName,
          displayOrder: catData.displayOrder,
          isActive: true
        });
        console.log(`✅ Seeded Category: ${catData.name}`);
      }

      // Seed Subcategories
      for (let i = 0; i < catData.subcategories.length; i++) {
        const subName = catData.subcategories[i];
        const subSlug = subName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        await SubcategoryModel.findOneAndUpdate(
          { categoryId: category._id, slug: subSlug },
          {
            categoryId: category._id,
            name: subName,
            slug: subSlug,
            displayOrder: i + 1,
            isActive: true
          },
          { upsert: true, new: true }
        );
      }

      // Seed CategoryConfiguration
      await CategoryConfigurationModel.findOneAndUpdate(
        { categoryId: category._id },
        {
          categoryId: category._id,
          version: 1,
          status: ConfigStatus.PUBLISHED,
          registrationFields: catData.registrationFields,
          kycRequiredDocuments: catData.kycRequiredDocuments,
          dashboardWidgets: ['overview-stats', 'active-requests', 'category-insights', 'opportunity-bulletin'],
          featuresEnabled: ['services-discovery', 'business-ideas', 'investment-readiness', 'partnerships']
        },
        { upsert: true }
      );
    }

    // 3. Seed Privacy-Safe Universal Marketplace Listings
    const sampleListings = [
      {
        categorySlug: 'manufacturing-industrial',
        title: 'Bulk Cotton Garment & Uniform Manufacturing',
        description: 'ISO-certified textile facility offering end-to-end weaving, dyeing, cutting, stitching and private-label packaging for domestic and export orders.',
        pricingType: 'STARTING_FROM',
        price: 150,
        deliveryTimeline: '15 - 30 Days',
        tags: ['Textiles', 'Export Quality', 'OEM Garments', 'Bulk Orders']
      },
      {
        categorySlug: 'technology-digital',
        title: 'Enterprise Web & Mobile Cloud Application Development',
        description: 'Full-stack software engineering team specializing in React, Node.js, microservices, AWS cloud migration, and secure payment gateway integrations.',
        pricingType: 'CUSTOM_QUOTE',
        deliveryTimeline: '3 - 8 Weeks',
        tags: ['Web Apps', 'Mobile Apps', 'Cloud Architecture', 'API Development']
      },
      {
        categorySlug: 'professional-personal-services',
        title: 'Statutory GST, Company Incorporation & Annual Tax Audit',
        description: 'Comprehensive financial advisory, secretarial compliance, monthly GST filing, TDS reconciliation, and startup valuation support.',
        pricingType: 'FIXED',
        price: 4999,
        deliveryTimeline: '3 - 7 Working Days',
        tags: ['GST Filing', 'Audit', 'Company Setup', 'Legal Compliance']
      },
      {
        categorySlug: 'agriculture-natural-resources',
        title: 'Cold Storage & Bulk Organic Produce Aggregation',
        description: 'Farm-gate temperature-controlled aggregation and supply logistics for fruits, vegetables, and grain commodities direct to distributors.',
        pricingType: 'CUSTOM_QUOTE',
        deliveryTimeline: 'Ongoing Daily Supply',
        tags: ['Cold Storage', 'Organic Produce', 'B2B Agri Supply', 'Farm Gate']
      },
      {
        categorySlug: 'business-entrepreneurship',
        title: 'Franchise Expansion Strategy & Distributor Network Setup',
        description: 'Strategic market development for brands looking to expand distributor footprints across South India tier-2 and tier-3 towns.',
        pricingType: 'CUSTOM_QUOTE',
        deliveryTimeline: '4 - 12 Weeks',
        tags: ['Franchise', 'Distribution Network', 'Business Expansion']
      }
    ];

    for (const item of sampleListings) {
      const cat = await CategoryModel.findOne({ slug: item.categorySlug });
      if (cat) {
        await ServiceListingModel.findOneAndUpdate(
          { title: item.title },
          {
            providerId: providerUser._id,
            categoryId: cat._id,
            title: item.title,
            description: item.description,
            pricingType: item.pricingType,
            price: item.price,
            deliveryTimeline: item.deliveryTimeline,
            tags: item.tags,
            status: ServiceListingStatus.APPROVED,
            isActive: true
          },
          { upsert: true }
        );
      }
    }
    console.log('✅ Seeded Sample Privacy-Safe Universal Marketplace Listings.');

    console.log('🎉 FIC Business Hub database seed completed successfully!');
  } catch (error) {
    console.error('❌ Database seed error:', error);
  }
};
