import React, { useState, useEffect } from 'react';

interface EditStudentDataModalProps {
  currentSchoolName: string;
  currentClassName: string;
  currentDisplayName: string;
  onSave: (school: string, className: string, displayName: string) => Promise<void>;
  onClose: () => void;
  message: string;
  isSaving: boolean;
}

const EditStudentDataModal: React.FC<EditStudentDataModalProps> = ({
  currentSchoolName,
  currentClassName,
  currentDisplayName,
  onSave,
  onClose,
  message,
  isSaving,
}) => {
  const [schoolName, setSchoolName] = useState(currentSchoolName);
  const [className, setClassName] = useState(currentClassName);
  const [displayName, setDisplayName] = useState(currentDisplayName);

  useEffect(() => {
    setSchoolName(currentSchoolName);
    setClassName(currentClassName);
    setDisplayName(currentDisplayName);
  }, [currentSchoolName, currentClassName, currentDisplayName]);

  const handleSave = async () => {
    await onSave(schoolName, className, displayName);
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 text-2xl font-bold"
          aria-label="Zamknij"
          disabled={isSaving}
        >
          &times;
        </button>

        <h3 className="text-xl font-semibold mb-4 text-center text-gray-800">Edytuj dane ucznia</h3>

        {/* Nowe pole - Imię i nazwisko */}
        <div className="mb-4">
          <label htmlFor="modalDisplayName" className="block text-gray-700 text-sm font-bold mb-2">
            Imię i nazwisko:
          </label>
          <input
            type="text"
            id="modalDisplayName"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isSaving}
          />
        </div>

        {/* Pole Nazwa Szkoły */}
        <div className="mb-4">
          <label htmlFor="modalSchoolName" className="block text-gray-700 text-sm font-bold mb-2">
            Nazwa Szkoły:
          </label>
          <input
            type="text"
            id="modalSchoolName"
            value={schoolName}
            onChange={(e) => setSchoolName(e.target.value)}
            className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isSaving}
          />
        </div>

        {/* Pole Klasa */}
        <div className="mb-6">
          <label htmlFor="modalClassName" className="block text-gray-700 text-sm font-bold mb-2">
            Klasa:
          </label>
          <input
            type="text"
            id="modalClassName"
            value={className}
            onChange={(e) => setClassName(e.target.value)}
            className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isSaving}
          />
        </div>

        {/* Komunikat zwrotny */}
        {message && (
          <p className={`text-center text-sm mb-4 ${message.includes('Błąd') ? 'text-red-500' : 'text-green-500'}`}>
            {message}
          </p>
        )}

        {/* Przyciski akcji */}
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50 transition duration-150 ease-in-out"
            disabled={isSaving}
          >
            Anuluj
          </button>
          <button
            onClick={handleSave}
            className={`bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition duration-150 ease-in-out ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={isSaving}
          >
            {isSaving ? 'Zapisywanie...' : 'Zapisz'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditStudentDataModal;