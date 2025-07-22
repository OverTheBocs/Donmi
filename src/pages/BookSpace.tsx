import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Upload, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
// Non usiamo useNavigate e useAppContext direttamente qui, le props userRole e userId vengono da App.js
// import { useNavigate } from 'react-router-dom';
// import { useAppContext } from '@/contexts/AppContext';
import { db } from '@/lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
// import { toast } from '@/hooks/use-toast'; // Rimosso l'import di toast se non usato o gestito altrove

const spaces = [
  'Spazio Open',
  'Spazio Presentazioni',
  'Stanza Colloqui',
  'Stanza Mezzaluna',
  'Stanza Laboratori',
  'Foresteria',
  'Giardino'
];

// Props per il componente BookSpace, ora include userRole e userId
interface BookSpaceProps {
  onBack: () => void;
  userRole: string; // Ruolo dell'utente corrente (es. 'generic', 'utente', 'operatore', 'admin', 'superuser')
  userId: string | null; // ID dell'utente corrente
}

const BookSpace: React.FC<BookSpaceProps> = ({ onBack, userRole, userId }) => {
  // Non usiamo isAuthenticated o user da useAppContext, ma userRole e userId dalle props
  // const { isAuthenticated, user } = useAppContext();
  // const navigate = useNavigate(); // Non usiamo navigate direttamente qui, la navigazione è gestita in App.js

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    activityName: '',
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
    selectedSpaces: [] as string[],
    eventLink: '',
    notes: '',
    responsibleName: '',
    responsiblePhone: '',
    acceptGuidelines: false
  });
  const [formMessage, setFormMessage] = useState({ type: '', text: '' }); // Per messaggi di successo/errore del form

  const handleSpaceChange = (space: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      selectedSpaces: checked
        ? [...prev.selectedSpaces, space]
        : prev.selectedSpaces.filter(s => s !== space)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormMessage({ type: '', text: '' }); // Azzera i messaggi precedenti

    if (!formData.acceptGuidelines) {
      setFormMessage({ type: 'error', text: 'Devi accettare le linee guida per procedere.' });
      return;
    }

    if (formData.selectedSpaces.length === 0) {
      setFormMessage({ type: 'error', text: 'Seleziona almeno uno spazio.' });
      return;
    }

    if (!userId) { // Assicurati che l'ID utente sia disponibile
      setFormMessage({ type: 'error', text: 'Errore: ID utente non disponibile. Riprova ad accedere.' });
      return;
    }

    setIsSubmitting(true);

    try {
      const requestsRef = collection(db, 'calendarEvents'); // Salva le richieste in 'calendarEvents' per coerenza con Calendar.tsx
      await addDoc(requestsRef, {
        creatorId: userId, // Usa userId dalle props
        activity_name: formData.activityName,
        start_date: formData.startDate,
        start_time: formData.startTime,
        end_date: formData.endDate,
        end_time: formData.endTime,
        spaces: formData.selectedSpaces,
        event_link: formData.eventLink,
        notes: formData.notes,
        responsible_name: formData.responsibleName,
        responsible_phone: formData.responsiblePhone,
        status: 'pending', // Tutte le nuove richieste sono 'pending'
        created_at: new Date().toISOString()
      });

      setFormMessage({ type: 'success', text: 'La tua richiesta è stata inviata con successo e ora è in attesa di approvazione.' });

      setFormData({
        activityName: '',
        startDate: '',
        startTime: '',
        endDate: '',
        endTime: '',
        selectedSpaces: [],
        eventLink: '',
        notes: '',
        responsibleName: '',
        responsiblePhone: '',
        acceptGuidelines: false
      });
    } catch (error) {
      console.error('Submit error:', error);
      setFormMessage({ type: 'error', text: `Errore durante l'invio della richiesta: ${error.message}` });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Determina se l'utente ha il permesso di accedere a questa pagina
  const canAccess = ['utente', 'operatore', 'admin', 'superuser'].includes(userRole);

  if (!canAccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Button variant="ghost" onClick={onBack} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Torna alla Home
          </Button>

          <Card>
            <CardHeader>
              <CardTitle>Accesso Richiesto</CardTitle>
            </CardHeader>
            <CardContent>
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Per richiedere uno spazio è necessario essere registrati e avere un ruolo appropriato.
                </AlertDescription>
              </Alert>

              <div className="mt-6 space-y-4">
                <Button className="w-full" onClick={onBack}>
                  Torna alla Home
                </Button>
                {/* Non reindirizzare a /auth direttamente da qui, App.js gestisce la vista */}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Button variant="ghost" onClick={onBack} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Torna alla Home
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>Richiedi uno Spazio</CardTitle>
          </CardHeader>
          <CardContent>
            {formMessage.text && (
              <div className={`p-3 rounded-md mb-4 ${formMessage.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {formMessage.text}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Dati Pubblici dell'Evento</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="activityName">Nome Attività *</Label>
                    <Input
                      id="activityName"
                      value={formData.activityName}
                      onChange={(e) => setFormData(prev => ({ ...prev, activityName: e.target.value }))}
                      required
                    />
                  </div>

                  <div>
                    <Label>Carica Locandina (4:5)</Label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                      <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                      <p className="text-sm text-gray-600">Clicca per caricare</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <Label htmlFor="startDate">Data Inizio *</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="startTime">Ora Inizio *</Label>
                    <Input
                      id="startTime"
                      type="time"
                      value={formData.startTime}
                      onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <Label htmlFor="endDate">Data Fine *</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="endTime">Ora Fine *</Label>
                    <Input
                      id="endTime"
                      type="time"
                      value={formData.endTime}
                      onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <Label>Spazi Richiesti *</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                    {spaces.map((space) => (
                      <div key={space} className="flex items-center space-x-2">
                        <Checkbox
                          id={space}
                          checked={formData.selectedSpaces.includes(space)}
                          onCheckedChange={(checked) => handleSpaceChange(space, checked as boolean)}
                        />
                        <Label htmlFor={space} className="text-sm">{space}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-4">
                  <Label htmlFor="eventLink">Link all'evento</Label>
                  <Input
                    id="eventLink"
                    type="url"
                    value={formData.eventLink}
                    onChange={(e) => setFormData(prev => ({ ...prev, eventLink: e.target.value }))}
                    placeholder="https://..."
                  />
                </div>

                <div className="mt-4">
                  <Label htmlFor="notes">Note</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Informazioni aggiuntive..."
                    rows={3}
                  />
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">Dati del Responsabile</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="responsibleName">Nome e Cognome *</Label>
                    <Input
                      id="responsibleName"
                      value={formData.responsibleName}
                      onChange={(e) => setFormData(prev => ({ ...prev, responsibleName: e.target.value }))}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="responsiblePhone">Numero di Cellulare *</Label>
                    <Input
                      id="responsiblePhone"
                      type="tel"
                      value={formData.responsiblePhone}
                      onChange={(e) => setFormData(prev => ({ ...prev, responsiblePhone: e.target.value }))}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="guidelines"
                  checked={formData.acceptGuidelines}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, acceptGuidelines: checked as boolean }))}
                  required
                />
                <Label htmlFor="guidelines" className="text-sm">
                  Acconsento alle <a href="#" className="text-blue-600 hover:underline">linee guida</a> per l'uso degli spazi *
                </Label>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Contributo Stimato:</strong> €25,00
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  Il contributo finale sarà comunicato dopo l'approvazione della richiesta.
                </p>
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? 'Invio in corso...' : 'Invia Richiesta'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BookSpace;
