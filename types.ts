export interface Lead {
  "Generated Date": string;
  "Search City": string;
  "Search Country": string;
  "Lead Number": number;
  "Company Name": string;
  "Category": string;
  "Description": string;
  "Address": string;
  "City": string;
  "Country": string;
  "Coordinates": string;
  "Phone": string;
  "Email": string;
  "Website": string;
  "LinkedIn": string;
  "Facebook": string;
  "Instagram": string;
  "Rating": number;
  "Review Count": number;
  "Business Hours": string;
  "Quality Score": number;
  "Quality Reasoning": string;
  "Status": string;
  "Contacted": string;
  "Notes": string;
}

export interface SearchParams {
  query: string;
  city: string;
  country: string;
}

export enum ScrapingStatus {
  IDLE = 'IDLE',
  SEARCHING_MAPS = 'SEARCHING_MAPS',
  EXTRACTING_DATA = 'EXTRACTING_DATA',
  COMPLETE = 'COMPLETE',
  ERROR = 'ERROR'
}