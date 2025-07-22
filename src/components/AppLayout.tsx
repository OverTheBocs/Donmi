import React, { useState } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar, MapPin, Info, User, Shield, LogOut } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import SpacesInfo from '@/pages/SpacesInfo';
import CalendarPage from '@/pages/Calendar';
import BookSpace from '@/pages/BookSpace';

type Page = 'home' | 'spaces' | 'calendar' | 'book';

const AppLayout: React.FC = () => {
  const { user, logout, isAuthenticated, isAdmin } = useAppContext();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [adminDialogOpen, setAdminDialogOpen] = useState(false);
  const [adminCredentials, setAdminCredentials] = useState({ email: '', password: '' });

  const navigateToPage = (page: Page) => {
    setCurrentPage(page);
  };

  const navigateHome = () => {
    setCurrentPage('home');
  };

  const handleLogout = () => {
    logout();
    setCurrentPage('home');
  };

  const handleAdminLogin = () => {
    if (adminCredentials.email === 'antonio.tozzi@bocs.club' && 
        adminCredentials.password === 'Y/OWWD(/NT(&&625wtbahsdgmç§é°ç!') {
      toast({ title: 'Accesso Admin', description: 'Benvenuto Amministratore!' });
      setAdminDialogOpen(false);
      setAdminCredentials({ email: '', password: '' });
      navigate('/admin');
    } else {
      toast({ title: 'Errore', description: 'Credenziali admin non valide', variant: 'destructive' });
    }
  };

  if (currentPage === 'spaces') {
    return <SpacesInfo onBack={navigateHome} />;
  }

  if (currentPage === 'calendar') {
    return <CalendarPage onBack={navigateHome} />;
  }

  if (currentPage === 'book') {
    return <BookSpace onBack={navigateHome} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-indigo-600">Domì</h1>
              {isAuthenticated && user && (
                <span className="text-sm font-medium text-gray-700">
                  Ciao, {user.username || user.email}
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2">
              {isAuthenticated ? (
                <Button variant="outline" size="sm" onClick={handleLogout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              ) : (
                <Link to="/auth">
                  <Button variant="outline" size="sm">
                    <User className="h-4 w-4 mr-2" />
                    Accedi / Registrati
                  </Button>
                </Link>
              )}
              
              <Dialog open={adminDialogOpen} onOpenChange={setAdminDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Shield className="h-4 w-4 mr-2" />
                    Admin
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Accesso Amministratore</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="admin-email">Email Admin</Label>
                      <Input 
                        id="admin-email" 
                        type="email"
                        value={adminCredentials.email} 
                        onChange={(e) => setAdminCredentials({...adminCredentials, email: e.target.value})} 
                        placeholder="Inserisci email admin"
                      />
                    </div>
                    <div>
                      <Label htmlFor="admin-password">Password Admin</Label>
                      <Input 
                        id="admin-password" 
                        type="password" 
                        value={adminCredentials.password} 
                        onChange={(e) => setAdminCredentials({...adminCredentials, password: e.target.value})} 
                        placeholder="Inserisci password admin"
                      />
                    </div>
                    <Button onClick={handleAdminLogin} className="w-full">
                      Accedi come Admin
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <div className="mb-8">
            <img 
              src="/placeholder.svg" 
              alt="Centro Domì" 
              className="mx-auto h-64 w-full max-w-md object-cover rounded-lg shadow-lg"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-2xl mx-auto">
            <Card 
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => navigateToPage('calendar')}
            >
              <CardContent className="p-6 text-center">
                <Calendar className="h-12 w-12 mx-auto mb-4 text-indigo-600" />
                <h3 className="text-lg font-semibold mb-2">Calendario</h3>
                <p className="text-gray-600 text-sm">Visualizza gli eventi in programma</p>
              </CardContent>
            </Card>
            
            <Card 
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => navigateToPage('book')}
            >
              <CardContent className="p-6 text-center">
                <MapPin className="h-12 w-12 mx-auto mb-4 text-indigo-600" />
                <h3 className="text-lg font-semibold mb-2">Richiedi uno Spazio</h3>
                <p className="text-gray-600 text-sm">Prenota uno spazio per il tuo evento</p>
              </CardContent>
            </Card>
            
            <Card 
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => navigateToPage('spaces')}
            >
              <CardContent className="p-6 text-center">
                <Info className="h-12 w-12 mx-auto mb-4 text-indigo-600" />
                <h3 className="text-lg font-semibold mb-2">Info Spazi</h3>
                <p className="text-gray-600 text-sm">Scopri i nostri spazi disponibili</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AppLayout;