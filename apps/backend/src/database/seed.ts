import mongoose from 'mongoose';
import { config } from '../config';
import { CategoryModel, SubcategoryModel } from '../modules/categories/categories.model';
import { CategoryConfigurationModel } from '../modules/category-configurations/category-configurations.model';
import { ServiceListingModel } from '../modules/services/services.model';
import { UserModel } from '../modules/users/users.model';
import { TeachingServiceModel } from '../modules/mentoring/teaching-service.model';
import { LearningVideoModel } from '../modules/mentoring/learning-video.model';
import { MentorshipRequestModel } from '../modules/mentoring/mentorship.model';
import { FundingRequestModel, InvestorProfileModel } from '../modules/investment/investment.model';
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
      { documentType: 'COLLEGE_ID', label: 'College ID Card', description: 'Upload a clear image or PDF of your current college identity card.', required: true }
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

    // Demo provider creation removed

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

      // Seed/Sync into Admin CategoryModel so admin console has full subcategories & KYC requirements
      try {
        const { CategoryModel: AdminCategoryModel } = await import('../modules/admin/models/Category');
        const formattedSubcategories = catData.subcategories.map((subName: string) => ({
          name: subName,
          slug: subName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          isActive: true
        }));

        const formattedKyc = (catData.kycRequiredDocuments || []).map((doc: any) => ({
          docKey: doc.documentType ? doc.documentType.toLowerCase() : 'id_proof',
          title: doc.label || 'Document Proof',
          description: doc.description || '',
          required: doc.required ?? true,
          allowedExtensions: ['pdf', 'jpg', 'png'],
          maxSizeMB: 5
        }));

        await AdminCategoryModel.findOneAndUpdate(
          { slug: catData.slug },
          {
            $set: {
              name: catData.name,
              slug: catData.slug,
              description: catData.description,
              icon: catData.iconName,
              isActive: true,
              allowMultipleSubcategories: true,
              subcategories: formattedSubcategories,
              kycRequirements: formattedKyc
            }
          },
          { upsert: true, new: true }
        );
      } catch (adminCatErr) {
        console.warn('Admin category sync warning:', adminCatErr);
      }
    }

    // 3. Clear any legacy mock marketplace listings
    try {
      await ServiceListingModel.deleteMany({
        title: {
          $in: [
            'Bulk Cotton Garment & Uniform Manufacturing',
            'Enterprise Web & Mobile Cloud Application Development',
            'Statutory GST, Company Incorporation & Annual Tax Audit',
            'Cold Storage & Bulk Organic Produce Aggregation',
            'Franchise Expansion Strategy & Distributor Network Setup'
          ]
        }
      });
      console.log('✅ Cleaned mock marketplace listings from database.');
    } catch (cleanupErr) {
      console.warn('Marketplace mock cleanup warning:', cleanupErr);
    }

    // Destructive wipes removed

    // 4.5 Seed initial Super Admin account if not present (supports default 'admin123' password)
    try {
      const { AdminUserModel } = await import('../modules/admin/models/AdminUser');
      const adminEmail = (process.env.SEED_SUPER_ADMIN_EMAIL || 'superadmin@ficapp.in').toLowerCase();
      const adminPass = process.env.SEED_SUPER_ADMIN_PASSWORD || 'admin123';
      const existingAdmin = await AdminUserModel.findOne({ email: adminEmail });

      if (!existingAdmin) {
        const superAdminPassword = await bcrypt.hash(adminPass, 10);
        await AdminUserModel.create({
          name: 'FIC Super Administrator',
          email: adminEmail,
          passwordHash: superAdminPassword,
          role: 'SUPER_ADMIN',
          department: 'MANAGEMENT',
          regionScope: 'All Regions',
          requirePasswordReset: false,
          isActive: true,
          permissions: ['*']
        });
        console.log(`✅ Seeded Super Administrator account: ${adminEmail} (password: ${adminPass})`);
      } else {
        // Ensure superadmin password matches configured password
        const matches = await bcrypt.compare(adminPass, existingAdmin.passwordHash);
        if (!matches) {
          existingAdmin.passwordHash = await bcrypt.hash(adminPass, 10);
          await existingAdmin.save();
          console.log(`✅ Updated Super Administrator password to: ${adminPass}`);
        }
      }

      const { ReferralConfigModel } = await import('../modules/admin/models/Referral');
      const refConfig = await ReferralConfigModel.findOne({ key: 'DEFAULT_CONFIG' });
      if (!refConfig) {
        await ReferralConfigModel.create({
          key: 'DEFAULT_CONFIG',
          bonusPerReferral: 500,
          currency: 'INR',
          minimumPayoutAmount: 1000,
          isActive: true,
          updatedBy: 'System'
        });
      }

      } catch (adminSeedErr) {
      console.warn('Super Admin seeding warning:', adminSeedErr);
    }

    console.log('🎉 FIC Business Hub database seed completed successfully!');
  } catch (error) {
    console.error('❌ Database seed error:', error);
  }
};

