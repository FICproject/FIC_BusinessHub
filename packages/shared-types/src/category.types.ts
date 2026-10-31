export enum ConfigStatus {
  DRAFT = 'DRAFT',
  IN_REVIEW = 'IN_REVIEW',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED'
}

export interface IFormFieldDefinition {
  fieldKey: string;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'select' | 'multiselect' | 'file' | 'date';
  required: boolean;
  options?: string[];
  placeholder?: string;
  helpText?: string;
}

export interface ICategoryConfiguration {
  _id: string;
  categoryId: string;
  version: number;
  status: ConfigStatus;
  registrationFields: IFormFieldDefinition[];
  kycRequiredDocuments: {
    documentType: string;
    label: string;
    description?: string;
    required: boolean;
  }[];
  dashboardWidgets: string[];
  featuresEnabled: string[];
}
