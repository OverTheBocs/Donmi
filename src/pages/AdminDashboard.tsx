import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CheckCircle, XCircle, Users, Calendar, LogOut } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, updateDoc, query, orderBy } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useAppContext } from '@/contexts/AppContext';
import { useNavigate } from 'react-router-dom';
import AdminRequestsTab from '@/components/AdminRequestsTab';

interface User {
  id: string;
  nome: string;
  cognome: string;
  email: string;
  userType: string;
  approved: boolean;
  created_at: string;
}

interface SpaceRequest {
  id: string;
  user_id: string;
  activity_name: string;
  start_date: string;
  start_time: string;
  end_date: string;
  end_time: string;
  spaces: string[];
  event_link?: string;
  notes?: string;
  responsible_name: string;
  responsible_phone: string;
  status: string;
  created_at: string;
}

export default function AdminDashboard() {
  const [users, setUsers] = useState<User[]>([]);
  const [spaceRequests, setSpaceRequests] = useState<SpaceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { logout } = useAppContext();
  const navigate = useNavigate();

  useEffect(() => {
    fetchUsers();
    fetchSpaceRequests();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  const fetchUsers = async () => {
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, orderBy('created_at', 'desc'));
      const querySnapshot = await getDocs(q);
      const usersData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as User[];
      setUsers(usersData);
    } catch (error: any) {
      toast({ title: 'Errore', description: 'Impossibile caricare gli utenti', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const fetchSpaceRequests = async () => {
    try {
      const requestsRef = collection(db, 'space_requests');
      const q = query(requestsRef, orderBy('created_at', 'desc'));
      const querySnapshot = await getDocs(q);
      const requestsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as SpaceRequest[];
      setSpaceRequests(requestsData);
    } catch (error: any) {
      console.error('Error fetching space requests:', error);
    }
  };

  const handleApproval = async (userId: string, approve: boolean) => {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, { approved: approve });
      
      toast({ 
        title: approve ? 'Utente approvato' : 'Utente rifiutato', 
        description: `L'utente è stato ${approve ? 'approvato' : 'rifiutato'} con successo` 
      });
      
      fetchUsers();
    } catch (error: any) {
      toast({ title: 'Errore', description: 'Impossibile aggiornare lo stato utente', variant: 'destructive' });
    }
  };

  const handleSpaceRequestApproval = async (requestId: string, status: 'approved' | 'rejected') => {
    try {
      const requestRef = doc(db, 'space_requests', requestId);
      await updateDoc(requestRef, { status });
      
      toast({ 
        title: status === 'approved' ? 'Richiesta approvata' : 'Richiesta rifiutata', 
        description: `La richiesta è stata ${status === 'approved' ? 'approvata' : 'rifiutata'} con successo` 
      });
      
      fetchSpaceRequests();
    } catch (error: any) {
      toast({ title: 'Errore', description: 'Impossibile aggiornare la richiesta', variant: 'destructive' });
    }
  };

  const pendingUsers = users.filter(user => !user.approved);
  const approvedUsers = users.filter(user => user.approved);
  const pendingRequests = spaceRequests.filter(req => req.status === 'pending');

  if (loading) {
    return <div className="flex justify-center items-center h-64">Caricamento...</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Dashboard Amministratore</h1>
          <p className="text-gray-600">Gestisci utenti e richieste spazi</p>
        </div>
        <Button onClick={handleLogout} variant="outline" className="flex items-center gap-2">
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Utenti Totali</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Attesa</CardTitle>
            <XCircle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingUsers.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approvati</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{approvedUsers.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Richieste Spazi</CardTitle>
            <Calendar className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingRequests.length}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList>
          <TabsTrigger value="pending">Utenti in Attesa ({pendingUsers.length})</TabsTrigger>
          <TabsTrigger value="approved">Utenti Approvati ({approvedUsers.length})</TabsTrigger>
          <TabsTrigger value="requests">Richieste Spazi ({pendingRequests.length})</TabsTrigger>
        </TabsList>
        
        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle>Utenti in Attesa di Approvazione</CardTitle>
              <CardDescription>Approva o rifiuta le nuove registrazioni</CardDescription>
            </CardHeader>
            <CardContent>
              {pendingUsers.length === 0 ? (
                <p className="text-center text-gray-500 py-8">Nessun utente in attesa</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Azioni</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>{user.nome} {user.cognome}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge variant={user.userType === 'ente' ? 'secondary' : 'default'}>
                            {user.userType === 'ente' ? 'Ente' : 'Cittadino'}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button 
                              size="sm" 
                              onClick={() => handleApproval(user.id, true)}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Approva
                            </Button>
                            <Button 
                              size="sm" 
                              variant="destructive"
                              onClick={() => handleApproval(user.id, false)}
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              Rifiuta
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="approved">
          <Card>
            <CardHeader>
              <CardTitle>Utenti Approvati</CardTitle>
              <CardDescription>Lista degli utenti approvati</CardDescription>
            </CardHeader>
            <CardContent>
              {approvedUsers.length === 0 ? (
                <p className="text-center text-gray-500 py-8">Nessun utente approvato</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Data</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {approvedUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>{user.nome} {user.cognome}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge variant={user.userType === 'ente' ? 'secondary' : 'default'}>
                            {user.userType === 'ente' ? 'Ente' : 'Cittadino'}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="requests">
          <AdminRequestsTab 
            requests={spaceRequests} 
            onApproval={handleSpaceRequestApproval} 
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}