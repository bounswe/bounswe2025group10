// src/types.d.ts
export type AuthContextType = {
    user: User | null;
    login: (email: string, password: string) => void;
    signup: (email: string, password: string) => void;
    logout: () => void;
  };
  
  export type User = {
    email: string;
  };
  