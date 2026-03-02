export interface JobDescription {
  jurisdiction: string;
  code: string;
  title: string;
  description: string;
}

export interface SalaryRecord {
  jurisdiction: string;
  "job code": string;
  [key: string]: string;
}


export interface ChatMessage {
  role: "user" | "assistant"; // to distinguish between user instructions and AI assistant's statements
  content: string;
}
