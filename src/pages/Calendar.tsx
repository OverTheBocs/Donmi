import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, ChevronLeft, ChevronRight, Filter, Star } from 'lucide-react'; // Aggiunto Star icon
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { db } from '@/lib/firebase';
// Aggiunti updateDoc e deleteDoc
import { collection, getDocs, query, orderBy, updateDoc, doc, addDoc, where } from 'firebase/firestore';

// Interfaccia per le richieste di spazio, estesa con creatorId e feedback
interface SpaceRequest {
  id: string;
  activity_name: string;
  start_date: string;
  start_time: string;
  end_date: string;
  end_time: string;
  spaces: string[];
  responsible_name: string;
  status: 'pending' | 'approved' | 'rejected'; // Status può essere uno di questi
  description?: string;
  creatorId: string; // ID dell'utente che ha creato la richiesta
  feedback?: { // Feedback opzionale
    rating: number; // Valutazione da 1 a 5
    notes: string;
    operatorId: string; // ID dell'operatore che ha lasciato il feedback
    createdAt: string; // Data del feedback
  };
}

// Opzioni di filtro, 'pending' sarà condizionale
const filterOptions = [
  { id: 'spazio-open', label: 'Spazio Open' },
  { id: 'spazio-presentazioni', label: 'Spazio Presentazioni' },
  { id: 'stanza-colloqui', label: 'Stanza Colloqui' },
  { id: 'stanza-mezzaluna', label: 'Stanza Mezzaluna' },
  { id: 'stanza-laboratori', label: 'Stanza Laboratori' },
  { id: 'foresteria', label: 'Foresteria' },
  { id: 'giardino', label: 'Giardino' },
  { id: 'pending', label: 'In Attesa' },
  { id: 'approved', label: 'Approvati' },
  { id: 'rejected', label: 'Rifiutati' } // Aggiunto filtro per richieste rifiutate
];

// Props per il componente Calendar, ora include userRole e userId
interface CalendarProps {
  onBack: () => void;
  userRole: string;
  userId: string | null;
}

const Calendar: React.FC<CalendarProps> = ({ onBack, userRole, userId }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [spaceRequests, setSpaceRequests] = useState<SpaceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFeedbackModal, setShowFeedbackModal] = useState<string | null>(null); // State per il modale feedback
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackNotes, setFeedbackNotes] = useState('');
  const [feedbackError, setFeedbackError] = useState('');

  // Effetto per il recupero delle richieste di spazio
  useEffect(() => {
    const fetchRequests = async () => {
      setLoading(true);
      try {
        const requestsRef = collection(db, 'calendarEvents');
        // Non usiamo orderBy nella query per evitare problemi di indice con where clause.
        // Ordiniamo i dati in memoria.
        const q = query(requestsRef); // Rimosso orderBy dalla query Firestore

        const unsubscribe = onSnapshot(q, (snapshot) => {
          let requestsData: SpaceRequest[] = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data() as Omit<SpaceRequest, 'id'> // Cast per TypeScript
          }));

          // Filtra le richieste 'pending' per gli ospiti (ruolo 'generic') in memoria
          if (userRole === 'generic') {
            requestsData = requestsData.filter(request => request.status !== 'pending');
          }

          // Ordina i dati in memoria dopo il recupero
          requestsData.sort((a, b) => {
            const dateA = new Date(`${a.start_date}T${a.start_time}`);
            const dateB = new Date(`${b.start_date}T${b.start_time}`);
            return dateA.getTime() - dateB.getTime();
          });

          setSpaceRequests(requestsData);
          setLoading(false);
        }, (error) => {
          console.error('Error fetching calendar events:', error);
          setLoading(false);
        });

        return () => unsubscribe(); // Cleanup del listener
      } catch (error) {
        console.error('Error setting up calendar events listener:', error);
        setLoading(false);
      }
    };

    fetchRequests();
  }, [userRole]); // Dipende da userRole per rifiltraggio se il ruolo cambia

  // Funzione per navigare tra i mesi
  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  // Funzione per ottenere gli eventi per un dato giorno
  const getEventsForDay = (day: number) => {
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    const dateStr = `${year}-${month}-${dayStr}`;

    return spaceRequests.filter(request => {
      const startDate = request.start_date;
      const endDate = request.end_date;
      // Un evento è attivo in un giorno se il giorno è compreso tra start_date e end_date
      return startDate <= dateStr && dateStr <= endDate;
    });
  };

  // Funzione per ottenere i giorni del mese corrente
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay(); // 0 per Domenica, 1 per Lunedì...

    const days = [];

    // Aggiungi spazi vuoti per i giorni prima dell'inizio del mese
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Aggiungi i giorni del mese
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }

    return days;
  };

  // Funzione per gestire i filtri
  const toggleFilter = (filterId: string) => {
    setSelectedFilters(prev =>
      prev.includes(filterId)
        ? prev.filter(id => id !== filterId)
        : [...prev, filterId]
    );
  };

  // Filtra gli eventi in base ai filtri selezionati
  const filteredEvents = spaceRequests.filter(request => {
    if (selectedFilters.length === 0) return true; // Se nessun filtro selezionato, mostra tutto

    return selectedFilters.some(filter => {
      // Filtri per stato
      if (filter === 'pending') return request.status === 'pending';
      if (filter === 'approved') return request.status === 'approved';
      if (filter === 'rejected') return request.status === 'rejected';

      // Mappa per i nomi degli spazi (dal filtro all'effettivo nome)
      const spaceMap: { [key: string]: string } = {
        'spazio-open': 'Spazio Open',
        'spazio-presentazioni': 'Spazio Presentazioni',
        'stanza-colloqui': 'Stanza Colloqui',
        'stanza-mezzaluna': 'Stanza Mezzaluna',
        'stanza-laboratori': 'Stanza Laboratori',
        'foresteria': 'Foresteria',
        'giardino': 'Giardino'
      };

      // Filtra per spazio
      return request.spaces.includes(spaceMap[filter] || filter);
    });
  });

  // Funzioni di gestione per Admin/Superuser
  const handleApproveRequest = async (requestId: string) => {
    try {
      const requestRef = doc(db, 'calendarEvents', requestId);
      await updateDoc(requestRef, { status: 'approved' });
      // Aggiorna lo stato localmente per riflettere il cambiamento
      setSpaceRequests(prev => prev.map(req => req.id === requestId ? { ...req, status: 'approved' } : req));
      console.log(`Richiesta ${requestId} approvata.`);
    } catch (error) {
      console.error('Errore nell\'approvazione della richiesta:', error);
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      const requestRef = doc(db, 'calendarEvents', requestId);
      await updateDoc(requestRef, { status: 'rejected' });
      // Aggiorna lo stato localmente per riflettere il cambiamento
      setSpaceRequests(prev => prev.map(req => req.id === requestId ? { ...req, status: 'rejected' } : req));
      console.log(`Richiesta ${requestId} rifiutata.`);
    } catch (error) {
      console.error('Errore nel rifiuto della richiesta:', error);
    }
  };

  const handleDeleteRequest = async (requestId: string) => {
    if (window.confirm('Sei sicuro di voler eliminare questa richiesta?')) {
      try {
        const requestRef = doc(db, 'calendarEvents', requestId);
        await deleteDoc(requestRef);
        // Rimuovi la richiesta dallo stato localmente
        setSpaceRequests(prev => prev.filter(req => req.id !== requestId));
        console.log(`Richiesta ${requestId} eliminata.`);
      } catch (error) {
        console.error('Errore nell\'eliminazione della richiesta:', error);
      }
    }
  };

  // Funzione per aprire il modale di feedback
  const openFeedbackModal = (requestId: string) => {
    setShowFeedbackModal(requestId);
    setFeedbackRating(0);
    setFeedbackNotes('');
    setFeedbackError('');
  };

  // Funzione per inviare il feedback
  const submitFeedback = async () => {
    if (!showFeedbackModal || feedbackRating === 0 || !feedbackNotes.trim()) {
      setFeedbackError('Per favore, seleziona una valutazione e inserisci le note.');
      return;
    }
    if (!userId) {
      setFeedbackError('Errore: ID utente non disponibile per il feedback.');
      return;
    }

    try {
      const requestRef = doc(db, 'calendarEvents', showFeedbackModal);
      await updateDoc(requestRef, {
        feedback: {
          rating: feedbackRating,
          notes: feedbackNotes.trim(),
          operatorId: userId,
          createdAt: new Date().toISOString(), // Salva la data in formato ISO stringa
        },
      });
      console.log(`Feedback inviato per la richiesta ${showFeedbackModal}.`);
      setShowFeedbackModal(null); // Chiudi il modale
      // Non è necessario ri-fetchare, onSnapshot aggiornerà automaticamente
    } catch (error) {
      console.error('Errore nell\'invio del feedback:', error);
      setFeedbackError(`Errore nell'invio del feedback: ${error.message}`);
    }
  };

  // Nomi dei mesi e dei giorni
  const monthNames = [
    'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
    'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
  ];

  const dayNames = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];

  // Determina le opzioni di filtro visibili in base al ruolo
  const getVisibleFilterOptions = () => {
    if (userRole === 'generic') {
      return filterOptions.filter(option => option.id !== 'pending' && option.id !== 'rejected');
    }
    return filterOptions;
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Caricamento...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Button variant="ghost" onClick={onBack} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Torna alla Home
          </Button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Calendario Eventi</h1>
          <p className="text-gray-600">Visualizza le richieste spazi per mese</p>
        </div>

        <div className="mb-6 flex flex-wrap gap-4 items-center">
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={() => navigateMonth('prev')}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-xl font-semibold min-w-[200px] text-center">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            <Button variant="outline" size="sm" onClick={() => navigateMonth('next')}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}>
            <Filter className="h-4 w-4 mr-2" />
            Filtri
          </Button>
        </div>

        {showFilters && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Filtri</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {getVisibleFilterOptions().map((option) => (
                  <div key={option.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={option.id}
                      checked={selectedFilters.includes(option.id)}
                      onCheckedChange={() => toggleFilter(option.id)}
                    />
                    <Label htmlFor={option.id} className="text-sm">{option.label}</Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-7 gap-2 mb-4">
              {dayNames.map((day) => (
                <div key={day} className="text-center font-semibold text-gray-600 py-2">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-2">
              {getDaysInMonth(currentDate).map((day, index) => {
                const dayEvents = day ? getEventsForDay(day) : [];
                const hasEvents = dayEvents.length > 0;

                return (
                  <div key={index} className="min-h-[80px] border border-gray-200 rounded p-1">
                    {day && (
                      <>
                        <div className="text-sm font-medium text-gray-900 mb-1">{day}</div>
                        {hasEvents && (
                          <div className="space-y-1">
                            {dayEvents.slice(0, 2).map((event) => (
                              <div
                                key={event.id}
                                className={`text-xs px-1 py-0.5 rounded truncate ${
                                  event.status === 'pending' ? 'bg-orange-100 text-orange-800' :
                                  event.status === 'approved' ? 'bg-green-100 text-green-800' :
                                  'bg-red-100 text-red-800'
                                }`}
                              >
                                {event.activity_name}
                              </div>
                            ))}
                            {dayEvents.length > 2 && (
                              <div className="text-xs text-gray-500">+{dayEvents.length - 2} altri</div>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {filteredEvents.length > 0 && (
          <div className="mt-8">
            <h3 className="text-xl font-semibold mb-4">Richieste del Mese</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredEvents.map((request) => {
                const isPastEvent = new Date(request.end_date) < new Date();
                const canOperate = ['operatore', 'admin', 'superuser'].includes(userRole);
                const canAdminister = ['admin', 'superuser'].includes(userRole);
                const canViewPending = ['utente', 'operatore', 'admin', 'superuser'].includes(userRole);

                // Non mostrare richieste pending/rejected agli ospiti
                if (userRole === 'generic' && (request.status === 'pending' || request.status === 'rejected')) {
                  return null;
                }

                return (
                  <Card key={request.id}>
                    <CardHeader>
                      <CardTitle className="text-lg">{request.activity_name}</CardTitle>
                      <div className="flex flex-wrap gap-1">
                        {request.spaces.map((space, index) => (
                          <Badge key={index} variant="outline">{space}</Badge>
                        ))}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600 mb-2">{request.description}</p>
                      <div className="text-sm space-y-1">
                        <p><strong>Responsabile:</strong> {request.responsible_name}</p>
                        <p><strong>Inizio:</strong> {new Date(request.start_date).toLocaleDateString('it-IT')} - {request.start_time}</p>
                        <p><strong>Fine:</strong> {new Date(request.end_date).toLocaleDateString('it-IT')} - {request.end_time}</p>
                        <Badge
                          variant={request.status === 'pending' ? 'secondary' :
                                   request.status === 'approved' ? 'default' : 'destructive'}
                        >
                          {request.status === 'pending' ? 'In Attesa' :
                           request.status === 'approved' ? 'Approvata' : 'Rifiutata'}
                        </Badge>
                      </div>

                      {/* Sezione Feedback (visibile a Operatore, Admin, Superuser) */}
                      {canOperate && isPastEvent && !request.feedback && (
                        <div className="mt-4 pt-3 border-t border-gray-200">
                          <Button size="sm" onClick={() => openFeedbackModal(request.id)} className="w-full">
                            Lascia Feedback
                          </Button>
                        </div>
                      )}

                      {/* Visualizzazione Feedback (visibile a Operatore, Admin, Superuser) */}
                      {canOperate && request.feedback && (
                        <div className="mt-4 pt-3 border-t border-gray-200">
                          <h4 className="text-sm font-semibold mb-2">Feedback:</h4>
                          <div className="flex items-center mb-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-4 w-4 ${i < request.feedback!.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                              />
                            ))}
                            <span className="ml-2 text-sm text-gray-700">{request.feedback.rating} / 5</span>
                          </div>
                          <p className="text-xs text-gray-600">Note: {request.feedback.notes}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            Da: {request.feedback.operatorId.substring(0, 8)}... il {new Date(request.feedback.createdAt).toLocaleDateString('it-IT')}
                          </p>
                        </div>
                      )}

                      {/* Azioni Admin/Superuser (Accetta, Rifiuta, Elimina) */}
                      {canAdminister && request.status === 'pending' && (
                        <div className="mt-4 pt-3 border-t border-gray-200 flex flex-wrap gap-2">
                          <Button size="sm" variant="default" onClick={() => handleApproveRequest(request.id)}>
                            Accetta
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => handleRejectRequest(request.id)}>
                            Rifiuta
                          </Button>
                        </div>
                      )}
                      {canAdminister && request.status !== 'pending' && ( // Permetti eliminazione anche per approvati/rifiutati
                        <div className="mt-4 pt-3 border-t border-gray-200 flex flex-wrap gap-2">
                          <Button size="sm" variant="destructive" onClick={() => handleDeleteRequest(request.id)}>
                            Elimina
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Modale Feedback */}
      {showFeedbackModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Lascia un Feedback</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Valutazione:</label>
              <div className="flex space-x-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-8 w-8 cursor-pointer ${i < feedbackRating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                    onClick={() => setFeedbackRating(i + 1)}
                  />
                ))}
              </div>
            </div>
            <div className="mb-4">
              <label htmlFor="feedbackNotes" className="block text-sm font-medium text-gray-700 mb-2">Note:</label>
              <textarea
                id="feedbackNotes"
                className="w-full p-2 border border-gray-300 rounded-md"
                rows={4}
                value={feedbackNotes}
                onChange={(e) => setFeedbackNotes(e.target.value)}
                placeholder="Inserisci le tue note..."
              ></textarea>
            </div>
            {feedbackError && <p className="text-red-500 text-sm mb-4">{feedbackError}</p>}
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowFeedbackModal(null)}>Annulla</Button>
              <Button onClick={submitFeedback}>Invia Feedback</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Calendar;
