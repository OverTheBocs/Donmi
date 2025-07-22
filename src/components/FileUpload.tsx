import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Upload, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

interface FileUploadProps {
  onFileSelect: (file: File | null) => void;
  onFileUploaded?: (url: string, fileName: string) => void;
  selectedFile: File | null;
  accept?: string;
  maxSize?: number;
  label: string;
  required?: boolean;
  userId?: string;
}

export function FileUpload({ 
  onFileSelect, 
  onFileUploaded,
  selectedFile, 
  accept = "image/*,.pdf", 
  maxSize = 5 * 1024 * 1024,
  label,
  required = false,
  userId
}: FileUploadProps) {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > maxSize) {
        toast({ 
          title: 'Errore', 
          description: `File troppo grande (max ${Math.round(maxSize / (1024 * 1024))}MB)`, 
          variant: 'destructive' 
        });
        return;
      }
      onFileSelect(file);
    }
  };

  const uploadFile = async () => {
    if (!selectedFile || !userId) return;
    
    setUploading(true);
    try {
      const fileName = `${Date.now()}_${selectedFile.name}`;
      const storageRef = ref(storage, `documenti/${userId}/${fileName}`);
      
      await uploadBytes(storageRef, selectedFile);
      const downloadURL = await getDownloadURL(storageRef);
      
      if (onFileUploaded) {
        onFileUploaded(downloadURL, fileName);
      }
      
      toast({ 
        title: 'Successo', 
        description: 'File caricato con successo' 
      });
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({ 
        title: 'Errore', 
        description: 'Errore durante il caricamento del file', 
        variant: 'destructive' 
      });
    } finally {
      setUploading(false);
    }
  };

  const removeFile = () => {
    onFileSelect(null);
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="file-upload">{label} {required && '*'}</Label>
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 transition-colors">
        {selectedFile ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between bg-gray-50 p-2 rounded">
              <span className="text-sm text-gray-700 truncate">{selectedFile.name}</span>
              <Button 
                type="button" 
                variant="ghost" 
                size="sm" 
                onClick={removeFile}
                className="text-red-500 hover:text-red-700"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            {userId && onFileUploaded && (
              <Button 
                type="button" 
                onClick={uploadFile} 
                disabled={uploading}
                size="sm"
              >
                {uploading ? 'Caricamento...' : 'Carica File'}
              </Button>
            )}
          </div>
        ) : (
          <div>
            <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            <Input 
              id="file-upload"
              type="file" 
              accept={accept}
              onChange={handleFileChange}
              className="cursor-pointer"
              required={required}
            />
            <p className="text-xs text-gray-500 mt-1">
              Formati supportati: {accept.replace(/,/g, ', ')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default FileUpload;