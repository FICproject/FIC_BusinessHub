export interface StateLocationData {
  state: string;
  districts: string[];
}

export const INDIAN_STATES_DISTRICTS: StateLocationData[] = [
  {
    state: 'Tamil Nadu',
    districts: [
      'Chennai',
      'Coimbatore',
      'Madurai',
      'Tiruchirappalli',
      'Salem',
      'Tiruppur',
      'Erode',
      'Vellore',
      'Tirunelveli',
      'Thanjavur',
      'Dindigul',
      'Kanchipuram',
      'Chengalpattu',
      'Cuddalore',
      'Dharmapuri',
      'Karur',
      'Krishnagiri',
      'Nagapattinam',
      'Namakkal',
      'Nilgiris',
      'Perambalur',
      'Pudukkottai',
      'Ramanathapuram',
      'Ranipet',
      'Sivaganga',
      'Tenkasi',
      'Theni',
      'Thoothukudi',
      'Tirupathur',
      'Tiruvallur',
      'Tiruvannamalai',
      'Tiruvarur',
      'Viluppuram',
      'Virudhunagar',
      'Kallakurichi',
      'Mayiladuthurai',
      'Ariyalur',
      'Kanyakumari'
    ]
  },
  {
    state: 'Karnataka',
    districts: [
      'Bengaluru Urban',
      'Bengaluru Rural',
      'Mysuru',
      'Hubballi-Dharwad',
      'Mangaluru (Dakshina Kannada)',
      'Belagavi',
      'Ballari',
      'Davanagere',
      'Kalaburagi',
      'Shivamogga',
      'Tumakuru',
      'Udupi',
      'Chikkamagaluru',
      'Hassan',
      'Mandya'
    ]
  },
  {
    state: 'Kerala',
    districts: [
      'Thiruvananthapuram',
      'Ernakulam (Kochi)',
      'Kozhikode',
      'Thrissur',
      'Kollam',
      'Palakkad',
      'Malappuram',
      'Kannur',
      'Kottayam',
      'Alappuzha',
      'Idukki',
      'Kasaragod',
      'Pathanamthitta',
      'Wayanad'
    ]
  },
  {
    state: 'Andhra Pradesh',
    districts: [
      'Visakhapatnam',
      'Vijayawada (NTR)',
      'Guntur',
      'Nellore (SPSR)',
      'Kurnool',
      'Tirupati',
      'Kakinada',
      'Rajamahendravaram',
      'Ananthapuramu',
      'Chittoor',
      'Kadapa (YSR)'
    ]
  },
  {
    state: 'Telangana',
    districts: [
      'Hyderabad',
      'Medchal-Malkajgiri',
      'Rangareddy',
      'Warangal',
      'Nizamabad',
      'Karimnagar',
      'Khammam',
      'Sangareddy',
      'Nalgonda'
    ]
  },
  {
    state: 'Puducherry',
    districts: ['Puducherry', 'Karaikal', 'Mahe', 'Yanam']
  },
  {
    state: 'Maharashtra',
    districts: [
      'Mumbai City',
      'Mumbai Suburban',
      'Pune',
      'Nagpur',
      'Thane',
      'Nashik',
      'Aurangabad (Chhatrapati Sambhajinagar)',
      'Solapur',
      'Kolhapur',
      'Navi Mumbai'
    ]
  },
  {
    state: 'Delhi (NCT)',
    districts: [
      'Central Delhi',
      'East Delhi',
      'New Delhi',
      'North Delhi',
      'North East Delhi',
      'North West Delhi',
      'Shahdara',
      'South Delhi',
      'South East Delhi',
      'South West Delhi',
      'West Delhi'
    ]
  },
  {
    state: 'Gujarat',
    districts: [
      'Ahmedabad',
      'Surat',
      'Vadodara',
      'Rajkot',
      'Bhavnagar',
      'Jamnagar',
      'Gandhinagar',
      'Junagadh'
    ]
  },
  {
    state: 'Rajasthan',
    districts: ['Jaipur', 'Jodhpur', 'Udaipur', 'Kota', 'Bikaner', 'Ajmer', 'Alwar']
  },
  {
    state: 'Uttar Pradesh',
    districts: ['Lucknow', 'Noida (Gautam Buddha Nagar)', 'Ghaziabad', 'Kanpur', 'Varanasi', 'Agra', 'Prayagraj']
  },
  {
    state: 'West Bengal',
    districts: ['Kolkata', 'North 24 Parganas', 'South 24 Parganas', 'Howrah', 'Hooghly', 'Darjeeling']
  },
  {
    state: 'Madhya Pradesh',
    districts: ['Bhopal', 'Indore', 'Gwalior', 'Jabalpur', 'Ujjain']
  },
  {
    state: 'Odisha',
    districts: ['Khordha', 'Bhubaneswar', 'Cuttack', 'Puri', 'Sambalpur', 'Sundargarh']
  },
  {
    state: 'Bihar',
    districts: ['Patna', 'Gaya', 'Muzaffarpur', 'Bhagalpur', 'Darbhanga']
  },
  {
    state: 'Punjab',
    districts: ['Ludhiana', 'Amritsar', 'Jalandhar', 'Patiala', 'Mohali (SAS Nagar)']
  },
  {
    state: 'Haryana',
    districts: ['Gurugram', 'Faridabad', 'Panipat', 'Ambala', 'Karnal']
  },
  {
    state: 'Assam',
    districts: ['Kamrup Metropolitan', 'Kamrup', 'Dibrugarh', 'Silchar (Cachar)', 'Jorhat']
  },
  {
    state: 'Jharkhand',
    districts: ['Ranchi', 'East Singhbhum (Jamshedpur)', 'Dhanbad', 'Bokaro']
  },
  {
    state: 'Chhattisgarh',
    districts: ['Raipur', 'Bilaspur', 'Durg', 'Korba']
  },
  {
    state: 'Uttarakhand',
    districts: ['Dehradun', 'Haridwar', 'Nainital', 'Udham Singh Nagar']
  },
  {
    state: 'Himachal Pradesh',
    districts: ['Shimla', 'Kangra', 'Solan', 'Mandi']
  },
  {
    state: 'Goa',
    districts: ['North Goa', 'South Goa']
  },
  {
    state: 'Jammu & Kashmir',
    districts: ['Srinagar', 'Jammu', 'Anantnag']
  },
  {
    state: 'Chandigarh',
    districts: ['Chandigarh']
  }
];

const STATE_ALIASES: Record<string, string> = {
  delhi: 'Delhi (NCT)',
  'nct of delhi': 'Delhi (NCT)',
  orissa: 'Odisha',
  pondicherry: 'Puducherry',
  'jammu and kashmir': 'Jammu & Kashmir'
};

export const matchIndianStateName = (rawState: string): string => {
  const clean = (rawState || '').trim();
  if (!clean) return '';
  const aliased = STATE_ALIASES[clean.toLowerCase()] || clean;
  const exact = INDIAN_STATES_DISTRICTS.find(
    (s) => s.state.toLowerCase() === aliased.toLowerCase()
  );
  return exact ? exact.state : clean;
};

export const getIndianStates = (): string[] => {
  return INDIAN_STATES_DISTRICTS.map((s) => s.state);
};

export const getDistrictsForState = (stateName: string): string[] => {
  const match = INDIAN_STATES_DISTRICTS.find(
    (s) => s.state.toLowerCase() === (stateName || '').toLowerCase()
  );
  return match ? match.districts : [];
};

export const validateIndianPinCode = (pinCode: string): boolean => {
  if (!pinCode) return false;
  const clean = pinCode.trim();
  // Indian civilian residential PIN codes are strictly 6 numeric digits starting with 1-9
  return /^[1-9][0-9]{5}$/.test(clean);
};

