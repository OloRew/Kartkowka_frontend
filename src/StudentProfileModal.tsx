import React, { useState, useEffect } from 'react';
import { X, Save, User, Book, Target, Heart } from 'lucide-react'; // Ikony z lucide-react

// Definicja typów dla propsów i danych profilu
interface StudentProfile {
  learningStyle: string[];
  preferredDetailLevel: 'Concise' | 'Standard' | 'Detailed';
  preferredDifficultyLevel: 'Beginner' | 'Intermediate' | 'Advanced';
  interests: string;
}

interface StudentProfileModalProps {
  isOpen: boolean;
  currentProfileData: StudentProfile;
  onSave: (profile: StudentProfile) => void;
  onClose: () => void;
  message?: string;
  isSaving?: boolean;
}

const StudentProfileModal: React.FC<StudentProfileModalProps> = ({
  isOpen,
  currentProfileData,
  onSave,
  onClose,
  message,
  isSaving,
}) => {
  // Stan formularza, inicjalizowany danymi z propsów
  const [profile, setProfile] = useState<StudentProfile>(currentProfileData);

  // Zaktualizuj stan formularza, gdy zmienią się dane z propsów (np. po pobraniu z API)
  useEffect(() => {
    if (isOpen) { // Tylko jeśli modal jest otwarty, aby uniknąć niepotrzebnych aktualizacji
      setProfile(currentProfileData);
    }
  }, [currentProfileData, isOpen]);

  // Obsługa zmian w polach tekstowych
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  // Obsługa zmian w checkboxach (learningStyle)
  const handleLearningStyleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = e.target;
    setProfile((prev) => {
      const newStyles = checked
        ? [...prev.learningStyle, value]
        : prev.learningStyle.filter((style) => style !== value);
      return { ...prev, learningStyle: newStyles };
    });
  };

  // Obsługa zmian w radio buttons (preferredDetailLevel, preferredDifficultyLevel)
  const handleRadioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  // Obsługa wysyłania formularza
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(profile);
  };

  if (!isOpen) return null; // Nie renderuj modala, jeśli nie jest otwarty

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center p-4 z-50 overflow-auto font-inter">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl p-8 m-4 relative animate-fade-in-up">
        {/* Przycisk zamknięcia modala */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition-colors duration-200 p-2 rounded-full hover:bg-gray-100"
          aria-label="Zamknij"
        >
          <X size={24} />
        </button>

        <h2 className="text-3xl font-bold text-gray-800 mb-6 flex items-center">
          <User className="mr-3 text-blue-600" size={28} />
          Mój Profil Ucznia
        </h2>

        {/* Komunikaty (np. sukces/błąd zapisu) */}
        {message && (
          <div className={`p-3 mb-4 rounded-lg text-sm ${message.includes('Sukces') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Sekcja: Styl Uczenia Się */}
          <div>
            <label className="block text-lg font-semibold text-gray-700 mb-3 flex items-center">
              <Book className="mr-2 text-purple-600" size={20} />
              Preferowany Styl Uczenia Się (możesz wybrać kilka):
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {['Visual', 'Auditory', 'Reading/Writing', 'Kinesthetic'].map((style) => (
                <label key={style} className="flex items-center p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors duration-200">
                  <input
                    type="checkbox"
                    name="learningStyle"
                    value={style}
                    checked={profile.learningStyle.includes(style)}
                    onChange={handleLearningStyleChange}
                    className="form-checkbox h-5 w-5 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="ml-3 text-gray-800 text-base">{style}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Sekcja: Poziom Szczegółowości */}
          <div>
            <label className="block text-lg font-semibold text-gray-700 mb-3 flex items-center">
              <Target className="mr-2 text-green-600" size={20} />
              Preferowany Poziom Szczegółowości:
            </label>
            <div className="flex flex-wrap gap-4">
              {['Concise', 'Standard', 'Detailed'].map((level) => (
                <label key={level} className="flex items-center p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors duration-200">
                  <input
                    type="radio"
                    name="preferredDetailLevel"
                    value={level}
                    checked={profile.preferredDetailLevel === level}
                    onChange={handleRadioChange}
                    className="form-radio h-5 w-5 text-green-600 focus:ring-green-500"
                  />
                  <span className="ml-3 text-gray-800 text-base">{level}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Sekcja: Poziom Trudności */}
          <div>
            <label className="block text-lg font-semibold text-gray-700 mb-3 flex items-center">
              <Target className="mr-2 text-yellow-600" size={20} />
              Preferowany Poziom Trudności:
            </label>
            <div className="flex flex-wrap gap-4">
              {['Beginner', 'Intermediate', 'Advanced'].map((level) => (
                <label key={level} className="flex items-center p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors duration-200">
                  <input
                    type="radio"
                    name="preferredDifficultyLevel"
                    value={level}
                    checked={profile.preferredDifficultyLevel === level}
                    onChange={handleRadioChange}
                    className="form-radio h-5 w-5 text-yellow-600 focus:ring-yellow-500"
                  />
                  <span className="ml-3 text-gray-800 text-base">{level}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Sekcja: Zainteresowania */}
          <div>
            <label htmlFor="interests" className="block text-lg font-semibold text-gray-700 mb-3 flex items-center">
              <Heart className="mr-2 text-red-600" size={20} />
              Zainteresowania (np. historia, kosmos, programowanie):
            </label>
            <textarea
              id="interests"
              name="interests"
              value={profile.interests}
              onChange={handleInputChange}
              rows={3}
              className="mt-1 block w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-base resize-y"
              placeholder="Wpisz swoje zainteresowania, oddzielając je przecinkami..."
            ></textarea>
          </div>

          {/* Przyciski akcji */}
          <div className="flex justify-end space-x-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 rounded-lg shadow-sm text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-200 text-base font-medium"
              disabled={isSaving}
            >
              Anuluj
            </button>
            <button
              type="submit"
              className="px-6 py-3 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition-colors duration-200 text-base font-medium flex items-center justify-center"
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Zapisywanie...
                </>
              ) : (
                <>
                  <Save className="mr-2" size={20} />
                  Zapisz Profil
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StudentProfileModal;

