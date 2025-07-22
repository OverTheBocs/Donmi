import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CheckCircle, XCircle } from 'lucide-react';

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

interface AdminRequestsTabProps {
  requests: SpaceRequest[];
  onApproval: (requestId: string, status: 'approved' | 'rejected') => void;
}

export default function AdminRequestsTab({ requests, onApproval }: AdminRequestsTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Richieste Spazi in Attesa</CardTitle>
        <CardDescription>Approva o rifiuta le richieste di prenotazione spazi</CardDescription>
      </CardHeader>
      <CardContent>
        {requests.length === 0 ? (
          <p className="text-center text-gray-500 py-8">Nessuna richiesta in attesa</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Attività</TableHead>
                <TableHead>Responsabile</TableHead>
                <TableHead>Data Inizio</TableHead>
                <TableHead>Data Fine</TableHead>
                <TableHead>Spazi</TableHead>
                <TableHead>Link/Note</TableHead>
                <TableHead>Stato</TableHead>
                <TableHead>Azioni</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell className="font-medium">{request.activity_name}</TableCell>
                  <TableCell>
                    <div>
                      <div>{request.responsible_name}</div>
                      <div className="text-sm text-gray-500">{request.responsible_phone}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div>{new Date(request.start_date).toLocaleDateString()}</div>
                      <div className="text-sm text-gray-500">{request.start_time}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div>{new Date(request.end_date).toLocaleDateString()}</div>
                      <div className="text-sm text-gray-500">{request.end_time}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {request.spaces.map((space, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {space}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {request.event_link && (
                        <div><a href={request.event_link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Link</a></div>
                      )}
                      {request.notes && (
                        <div className="text-gray-500 truncate max-w-24">{request.notes}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={request.status === 'pending' ? 'secondary' : 
                               request.status === 'approved' ? 'default' : 'destructive'}
                    >
                      {request.status === 'pending' ? 'In Attesa' : 
                       request.status === 'approved' ? 'Approvata' : 'Rifiutata'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {request.status === 'pending' && (
                      <div className="flex space-x-2">
                        <Button 
                          size="sm" 
                          onClick={() => onApproval(request.id, 'approved')}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Approva
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={() => onApproval(request.id, 'rejected')}
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Rifiuta
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}