import React from 'react';
import { AlertTriangle, Key } from 'lucide-react';

interface UsageLimitWarningProps {
  usedToday: number;
  dailyLimit: number;
  onOpenApiKeyModal: () => void;
}

const UsageLimitWarning: React.FC<UsageLimitWarningProps> = ({
  usedToday,
  dailyLimit,
  onOpenApiKeyModal
}) => {
  // Oblicz procent wykorzystania
  const percentUsed = (usedToday / dailyLimit) * 100;
  
  // Określ kolor na podstawie wykorzystania
  const getColor = () => {
    if (percentUsed >= 100) return 'red';
    if (percentUsed >= 80) return 'orange';
    if (percentUsed >= 60) return 'yellow';
    return 'blue';
  };

  const color = getColor();
  
  // Jeśli limit przekroczony - pokaż error
  if (usedToday >= dailyLimit) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg mb-4">
        <div className="flex items-start">
          <AlertTriangle size={24} className="text-red-600 mt-0.5 mr-3 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="text-red-800 font-bold text-lg mb-2">
              ⛔ Limit dzienny wyczerpany
            </h3>
            <p className="text-red-700 mb-3">
              Wykorzystałeś wszystkie <strong>{dailyLimit} darmowych zapytań</strong> na dzisiaj.
              Aby kontynuować, dodaj własny klucz API (nieograniczone zapytania).
            </p>
            <button
              onClick={onOpenApiKeyModal}
              className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition flex items-center"
            >
              <Key size={18} className="mr-2" />
              Dodaj własny klucz API
            </button>
            <p className="text-xs text-red-600 mt-3">
              💡 Limit resetuje się o północy. Możesz również poczekać do jutra.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Jeśli zbliża się do limitu (80%+) - ostrzeżenie
  if (percentUsed >= 80) {
    return (
      <div className={`bg-${color}-50 border-l-4 border-${color}-500 p-4 rounded-lg mb-4`}>
        <div className="flex items-start justify-between">
          <div className="flex items-start flex-1">
            <AlertTriangle size={20} className={`text-${color}-600 mt-0.5 mr-2 flex-shrink-0`} />
            <div>
              <p className={`text-${color}-800 font-medium text-sm`}>
                ⚠️ Zbliżasz się do limitu: <strong>{usedToday}/{dailyLimit}</strong> zapytań dzisiaj
              </p>
              <p className={`text-${color}-700 text-xs mt-1`}>
                Dodaj własny klucz API aby uzyskać nieograniczony dostęp
              </p>
            </div>
          </div>
          <button
            onClick={onOpenApiKeyModal}
            className="ml-3 bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold py-1 px-3 rounded transition flex items-center whitespace-nowrap"
          >
            <Key size={14} className="mr-1" />
            Dodaj klucz
          </button>
        </div>
      </div>
    );
  }

  // Zwykły status (< 80%)
  return (
    <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg mb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className={`w-2 h-2 rounded-full bg-${color}-500 mr-2`}></div>
          <p className="text-blue-800 text-sm">
            Wykorzystano: <strong>{usedToday}/{dailyLimit}</strong> zapytań dzisiaj
          </p>
        </div>
        <button
          onClick={onOpenApiKeyModal}
          className="text-blue-600 hover:text-blue-800 text-xs font-medium underline flex items-center"
        >
          <Key size={12} className="mr-1" />
          Nieograniczony dostęp
        </button>
      </div>
      
      {/* Progress bar */}
      <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5">
        <div
          className={`bg-${color}-500 h-1.5 rounded-full transition-all duration-300`}
          style={{ width: `${percentUsed}%` }}
        ></div>
      </div>
    </div>
  );
};

export default UsageLimitWarning;