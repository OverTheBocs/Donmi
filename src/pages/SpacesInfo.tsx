import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, MapPin, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Space {
  id: string;
  name: string;
  description: string;
  maxPeople: number;
  floor: string;
  suggestedUses: string[];
  cost?: string;
}

const spaces: Space[] = [
  {
    id: '1',
    name: 'Spazio Open',
    description: 'Ampio spazio aperto ideale per eventi e presentazioni',
    maxPeople: 40,
    floor: 'Seminterrato',
    suggestedUses: ['Eventi', 'Conferenze', 'Workshop'],
    cost: 'Gratuito'
  },
  {
    id: '2',
    name: 'Spazio Presentazioni',
    description: 'Sala attrezzata per presentazioni e meeting',
    maxPeople: 24,
    floor: 'Seminterrato',
    suggestedUses: ['Presentazioni', 'Meeting', 'Formazione']
  },
  {
    id: '3',
    name: 'Stanza Colloqui',
    description: 'Spazio intimo per colloqui e riunioni private',
    maxPeople: 4,
    floor: 'Seminterrato',
    suggestedUses: ['Colloqui', 'Riunioni private']
  },
  {
    id: '4',
    name: 'Stanza Mezzaluna',
    description: 'Sala dalla forma particolare per attività creative',
    maxPeople: 16,
    floor: 'Primo Piano',
    suggestedUses: ['Attività creative', 'Laboratori', 'Gruppi di lavoro']
  },
  {
    id: '5',
    name: 'Stanza Laboratori',
    description: 'Spazio attrezzato per laboratori e attività pratiche',
    maxPeople: 20,
    floor: 'Primo Piano',
    suggestedUses: ['Laboratori', 'Attività pratiche', 'Corsi']
  },
  {
    id: '6',
    name: 'Foresteria',
    description: 'Alloggio con 3 stanze per ospiti',
    maxPeople: 8,
    floor: 'Secondo Piano',
    suggestedUses: ['Pernottamento', 'Ospitalità']
  },
  {
    id: '7',
    name: 'Giardino',
    description: 'Spazio esterno per attività all\'aperto',
    maxPeople: 50,
    floor: 'Esterno',
    suggestedUses: ['Eventi estivi', 'Attività ricreative', 'Feste']
  }
];

// Props per il componente SpacesInfo, ora include userRole e userId
interface SpacesInfoProps {
  onBack: () => void;
  userRole: string; // Ruolo dell'utente corrente
  userId: string | null; // ID dell'utente corrente
}

const SpacesInfo: React.FC<SpacesInfoProps> = ({ onBack, userRole, userId }) => {
  // Il ruolo dell'utente (userRole) e l'ID (userId) sono disponibili qui,
  // ma per questo componente non è necessaria una logica di rendering condizionale complessa
  // dato che tutti i ruoli possono visualizzare le informazioni sugli spazi.
  // Se in futuro si volessero aggiungere funzionalità di modifica/aggiunta/eliminazione
  // delle informazioni sugli spazi, si userebbero userRole e userId per gestire i permessi.

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Button variant="ghost" onClick={onBack} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Torna alla Home
          </Button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Spazi Disponibili</h1>
          <p className="text-gray-600">Scopri tutti gli spazi del Centro Domì</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {spaces.map((space) => (
            <Card key={space.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="aspect-video bg-gray-200 rounded-lg mb-4 flex items-center justify-center">
                  <MapPin className="h-12 w-12 text-gray-400" />
                </div>
                <CardTitle className="text-lg">{space.name}</CardTitle>
                <Badge variant="secondary">{space.floor}</Badge>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">{space.description}</p>
                
                <div className="flex items-center mb-3">
                  <Users className="h-4 w-4 mr-2 text-gray-500" />
                  <span className="text-sm text-gray-700">Max {space.maxPeople} persone</span>
                </div>
                
                <div className="mb-3">
                  <p className="text-sm font-medium text-gray-700 mb-2">Usi suggeriti:</p>
                  <div className="flex flex-wrap gap-1">
                    {space.suggestedUses.map((use, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {use}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                {space.cost && (
                  <div className="mt-4 pt-3 border-t">
                    <p className="text-sm font-medium text-green-600">{space.cost}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SpacesInfo;
