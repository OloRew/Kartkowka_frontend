import React from 'react';
import { BarChart3 } from 'lucide-react';

interface EmbeddingPlotModalProps {
  isOpen: boolean;
  onClose: () => void;
  embeddingPlot: string | null | undefined;
}

const EmbeddingPlotModal: React.FC<EmbeddingPlotModalProps> = ({ 
  isOpen, 
  onClose, 
  embeddingPlot 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">Wykres podobieństwa embeddingów</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>
        
        {embeddingPlot ? (
          <>
            <img 
              src={`data:image/png;base64,${embeddingPlot}`} 
              alt="Wykres porównania embeddingów"
              className="w-full h-auto border border-gray-300 rounded"
            />
            <div className="mt-4 text-sm text-gray-600">
              <p>Wykres przedstawia porównanie pierwszych 30 wymiarów embeddingów zapytania i znalezionych materiałów.</p>
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <BarChart3 size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">Brak danych wykresu do wyświetlenia.</p>
            <p className="text-sm text-gray-400 mt-2">Wykres może być niedostępny z powodu zbyt krótkich embeddingów lub błędu generowania.</p>
          </div>
        )}
        
        <div className="mt-6 flex justify-end">
          <button 
            onClick={onClose}
            className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
          >
            Zamknij
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmbeddingPlotModal;