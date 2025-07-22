import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

interface User {
  id: string;
  email: string;
  nome: string;
  cognome: string;
  role: 'user' | 'admin';
  approved: boolean;
}

interface AppContextType {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

const defaultAppContext: AppContextType = {
  sidebarOpen: false,
  toggleSidebar: () => {},
  user: null,
  login: async () => false,
  logout: () => {},
  isAuthenticated: false,
  isAdmin: false,
};

const AppContext = createContext<AppContextType>(defaultAppContext);

export const useAppContext = () => useContext(AppContext);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  const toggleSidebar = () => {
    setSidebarOpen(prev => !prev);
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      console.log('Attempting login with:', { email });
      
      // Check admins collection first
      const adminsRef = collection(db, 'admins');
      const adminQuery = query(adminsRef, where('email', '==', email));
      const adminSnapshot = await getDocs(adminQuery);
      
      if (!adminSnapshot.empty) {
        const adminData = adminSnapshot.docs[0].data();
        
        if (adminData.password_hash === password) {
          const adminObj = {
            id: adminSnapshot.docs[0].id,
            email: adminData.email,
            nome: adminData.nome || 'Admin',
            cognome: adminData.cognome || '',
            role: 'admin' as const,
            approved: true
          };
          
          setUser(adminObj);
          localStorage.setItem('user', JSON.stringify(adminObj));
          toast({ title: 'Accesso effettuato', description: 'Benvenuto Admin!' });
          return true;
        }
      }
      
      // Check regular users collection
      const usersRef = collection(db, 'users');
      const userQuery = query(usersRef, where('email', '==', email));
      const userSnapshot = await getDocs(userQuery);

      if (userSnapshot.empty) {
        toast({ 
          title: 'Errore di accesso', 
          description: 'Credenziali non valide', 
          variant: 'destructive' 
        });
        return false;
      }

      const userData = userSnapshot.docs[0].data();
      
      if (userData.password_hash !== password) {
        toast({ 
          title: 'Errore di accesso', 
          description: 'Password non corretta', 
          variant: 'destructive' 
        });
        return false;
      }

      const userObj = {
        id: userSnapshot.docs[0].id,
        email: userData.email,
        nome: userData.nome,
        cognome: userData.cognome,
        role: 'user' as const,
        approved: userData.approved
      };
      
      setUser(userObj);
      localStorage.setItem('user', JSON.stringify(userObj));
      toast({ title: 'Accesso effettuato', description: 'Benvenuto!' });
      return true;
      
    } catch (error: any) {
      console.error('Login exception:', error);
      toast({ 
        title: 'Errore di accesso', 
        description: 'Si è verificato un errore di connessione', 
        variant: 'destructive' 
      });
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    toast({ title: 'Disconnesso', description: 'Sei stato disconnesso con successo' });
  };

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        console.error('Error parsing saved user:', error);
        localStorage.removeItem('user');
      }
    }
  }, []);

  return (
    <AppContext.Provider
      value={{
        sidebarOpen,
        toggleSidebar,
        user,
        login,
        logout,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin',
      }}
    >
      {children}
    </AppContext.Provider>
  );
};