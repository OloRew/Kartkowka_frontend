import React, { useState, useEffect } from 'react';
import { Save, X, Loader, AlertCircle } from 'lucide-react';

interface SaveSessionModalProps {
  isOpen: boolean;
  suggestedName: string;
  onSave: (customName: string) => void;
  onClose: () => void;
  isSaving: boolean;
  mode?: 'save' | 'confirm' | 'discovery';  // 🆕 DODANE 'discovery'
  currentTopic?: string;
  newTopic?: string;
  onSaveWithCurrentTopic?: () => void;
  discoveredTopicNames?: string[];  // 🆕 DODANE - lista topics z discovery
}

const SaveSessionModal: React.FC<SaveSessionModalProps> = ({
  isOpen,
  suggestedName,
  onSave,
  onClose,
  isSaving,
  mode = 'save',
  currentTopic = '',
  newTopic = '',
  onSaveWithCurrentTopic,
  discoveredTopicNames = []  // 🆕 DODANE
}) => {
  const [sessionName, setSessionName] = useState(suggestedName);

  useEffect(() => {
    setSessionName(suggestedName);
  }, [suggestedName]);

  const handleSave = () => {
    if (mode === 'confirm') {
      onSave(sessionName);
    } else {
      if (sessionName.trim()) {
        onSave(sessionName.trim());
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isSaving && sessionName.trim()) {
      handleSave();
    }
  };

  if (!isOpen) return null;

  // TRYB POTWIERDZENIA ZMIANY TEMATU
  if (mode === 'confirm') {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="text-yellow-500" size={24} />
              <h3 className="text-lg font-bold text-gray-800">Zmienić temat sesji?</h3>
            </div>
            <button
              onClick={onClose}
              disabled={isSaving}
              className="text-gray-400 hover:text-gray-600 transition disabled:opacity-50"
            >
              <X size={24} />
            </button>
          </div>

          <div className="mb-6 space-y-3">
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-xs text-gray-500 mb-1">Obecny temat:</p>
              <p className="text-sm font-semibold text-gray-800">{currentTopic}</p>
            </div>
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-xs text-blue-600 mb-1">Nowy temat z podstawy:</p>
              <p className="text-sm font-semibold text-blue-800">{newTopic}</p>
            </div>
            <p className="text-sm text-gray-600">
              Wybierz jak chcesz zapisać sesję:
            </p>
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded">
              <p className="text-xs text-yellow-800">
                ⚠️ <strong>Uwaga:</strong> Po zmianie tematu wygeneruj materiały ponownie, ponieważ został zmieniony zakres.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg shadow-md transition disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isSaving ? (
                <>
                  <Loader className="animate-spin mr-2" size={16} />
                  Zapisywanie...
                </>
              ) : (
                <>
                  <Save className="mr-2" size={16} />
                  Zapisz pod nowym tematem
                </>
              )}
            </button>
            <button
              onClick={onSaveWithCurrentTopic}
              disabled={isSaving}
              className="w-full px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg shadow-md transition disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center"
            >
              <Save className="mr-2" size={16} />
              Zapisz pod obecnym tematem
            </button>
            <button
              onClick={onClose}
              disabled={isSaving}
              className="w-full px-4 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Anuluj
            </button>
          </div>
        </div>
      </div>
    );
  }

  // TRYB ZAPISU SESJI (DOMYŚLNY)
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-gray-800">Zapisz sesję nauki</h3>
          <button
            onClick={onClose}
            disabled={isSaving}
            className="text-gray-400 hover:text-gray-600 transition disabled:opacity-50"
          >
            <X size={24} />
          </button>
        </div>

        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-3">
            Proponuję zapisać te materiały pod nazwą:
          </p>
          
          <label htmlFor="session-name" className="block text-sm font-medium text-gray-700 mb-2">
            Nazwa sesji:
          </label>
          <input
            id="session-name"
            type="text"
            value={sessionName}
            onChange={(e) => setSessionName(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isSaving}
            maxLength={50}
            className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
            placeholder="Wpisz nazwę sesji..."
            autoFocus
          />
          <p className="text-xs text-gray-500 mt-1">
            {sessionName.length}/50 znaków
          </p>
        </div>

        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            disabled={isSaving}
            className="px-4 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Anuluj
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || !sessionName.trim()}
            className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg shadow-md transition disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center"
          >
            {isSaving ? (
              <>
                <Loader className="animate-spin mr-2" size={16} />
                Zapisywanie...
              </>
            ) : (
              <>
                <Save className="mr-2" size={16} />
                Zapisz
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SaveSessionModal;