import React, { useState, useEffect } from 'react';
import { X, ChevronDown, ChevronRight, CheckSquare, Square } from 'lucide-react';
import { useCurriculumData, CurriculumTopic } from './hooks/useCurriculumData';

// ============================================
// INTERFACES
// ============================================

export interface CurriculumSelection {
  curriculumId: string;
  curriculumTopicIds: string[];     // ← ZMIANA: array zamiast single
  topicNames: string[];             // ← ZMIANA: array zamiast single
  conceptIds: string[];
  conceptNames: string[];
  displayText: string;
}

interface CurriculumPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (selection: CurriculumSelection) => void;
  studentClass: string;
  selectedSubject: string;
  initialCurriculumTopicIds?: string[];    // ← ZMIANA: array
  initialConceptIds?: string[];
}

// ============================================
// COMPONENT
// ============================================

const CurriculumPickerModal: React.FC<CurriculumPickerModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  studentClass,
  selectedSubject,
  initialCurriculumTopicIds = [],          // ← ZMIANA: array
  initialConceptIds = []
}) => {
  const { curriculumData, loading, error } = useCurriculumData(studentClass);
  
  // State - ZMIANA: Set<string> zamiast single string
  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set());
  const [selectedTopicIds, setSelectedTopicIds] = useState<Set<string>>(new Set());  // ← ZMIANA
  const [selectedConceptIds, setSelectedConceptIds] = useState<Set<string>>(new Set());

  // useEffect do pre-select - AKTUALIZACJA dla array
  useEffect(() => {
    if (isOpen && initialCurriculumTopicIds.length > 0) {
      setSelectedTopicIds(new Set(initialCurriculumTopicIds));
      setExpandedTopics(new Set(initialCurriculumTopicIds));
      
      if (initialConceptIds.length > 0) {
        setSelectedConceptIds(new Set(initialConceptIds));
      }
    }
  }, [isOpen, initialCurriculumTopicIds, initialConceptIds]);

  // Reset tylko przy zamknięciu przez X
  const handleClose = () => {
    setSelectedTopicIds(new Set());
    setSelectedConceptIds(new Set());
    setExpandedTopics(new Set());
    onClose();
  };

  if (!isOpen) return null;

  // Filtruj przedmiot
  const subjectData = curriculumData?.subjects.find(s => s.subject === selectedSubject);

  // Toggle rozwinięcia tematu
  const toggleTopic = (topicId: string) => {
    const newExpanded = new Set(expandedTopics);
    if (newExpanded.has(topicId)) {
      newExpanded.delete(topicId);
    } else {
      newExpanded.add(topicId);
    }
    setExpandedTopics(newExpanded);
  };

  // Wybór całego tematu - MULTI-SELECT
  const handleTopicSelect = (topic: CurriculumTopic) => {
    const newTopicIds = new Set(selectedTopicIds);
    const newConceptIds = new Set(selectedConceptIds);
    
    if (newTopicIds.has(topic.topicId)) {
      // Odznacz topic
      newTopicIds.delete(topic.topicId);
      // Odznacz wszystkie concepts z tego topicu
      topic.concepts.forEach(c => newConceptIds.delete(c.conceptId));
    } else {
      // Zaznacz topic
      newTopicIds.add(topic.topicId);
      // Zaznacz wszystkie concepts z tego topicu
      topic.concepts.forEach(c => newConceptIds.add(c.conceptId));
    }
    
    setSelectedTopicIds(newTopicIds);
    setSelectedConceptIds(newConceptIds);
  };

  // Toggle pojedynczego conceptu
  const handleConceptToggle = (topicId: string, conceptId: string) => {
    const newSelected = new Set(selectedConceptIds);
    
    if (newSelected.has(conceptId)) {
      newSelected.delete(conceptId);
    } else {
      newSelected.add(conceptId);
      // Automatycznie dodaj topicId jeśli jeszcze nie dodany
      const newTopicIds = new Set(selectedTopicIds);
      if (!newTopicIds.has(topicId)) {
        newTopicIds.add(topicId);
        setSelectedTopicIds(newTopicIds);
      }
    }
    
    setSelectedConceptIds(newSelected);
  };

  // Potwierdź wybór - AKTUALIZACJA dla multi-topic
  const handleConfirm = () => {
    if (selectedTopicIds.size === 0 || selectedConceptIds.size === 0) {
      alert('Wybierz przynajmniej jeden temat i concept');
      return;
    }

    // Zbierz wszystkie wybrane topics
    const selectedTopics = subjectData?.topics.filter(t => 
      selectedTopicIds.has(t.topicId)
    ) || [];

    if (selectedTopics.length === 0) return;

    // Zbierz concept names dla wybranych concepts
    const selectedConceptNames: string[] = [];
    selectedTopics.forEach(topic => {
      topic.concepts.forEach(concept => {
        if (selectedConceptIds.has(concept.conceptId)) {
          selectedConceptNames.push(concept.conceptName);
        }
      });
    });

    const selection: CurriculumSelection = {
      curriculumId: curriculumData?.id || '',
      curriculumTopicIds: Array.from(selectedTopicIds),
      topicNames: selectedTopics.map(t => t.topicName),
      conceptIds: Array.from(selectedConceptIds),
      conceptNames: selectedConceptNames,
      displayText: selectedTopics.map(t => t.topicName).join(', ')
    };
    
    onSelect(selection);
    onClose();  // NIE resetuj - tylko zamknij
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-bold text-gray-800">
            Wybierz z Podstawy Programowej
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        {/* Info */}
        <div className="px-4 py-2 bg-blue-50 border-b border-blue-100">
          <p className="text-sm text-blue-800">
            <strong>Przedmiot:</strong> {selectedSubject} | <strong>Klasa:</strong> {studentClass}
          </p>
          <p className="text-xs text-blue-600 mt-1">
            Możesz wybrać wiele tematów. Kliknij temat aby zaznaczyć wszystkie pojęcia, lub rozwiń i wybierz konkretne
          </p>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading && (
            <div className="text-center text-gray-500 py-8">
              Ładowanie danych curriculum...
            </div>
          )}

          {error && (
            <div className="text-center text-red-500 py-8">
              Błąd: {error}
            </div>
          )}

          {!loading && !error && !subjectData && (
            <div className="text-center text-gray-500 py-8">
              Najpierw wybierz przedmiot w formularzu
            </div>
          )}

          {!loading && !error && subjectData && (
            <div className="space-y-2">
              {subjectData.topics.map((topic) => {
                const isExpanded = expandedTopics.has(topic.topicId);
                const isTopicSelected = selectedTopicIds.has(topic.topicId);
                const selectedCount = topic.concepts.filter(c => 
                  selectedConceptIds.has(c.conceptId)
                ).length;

                return (
                  <div
                    key={topic.topicId}
                    className={`border rounded-lg ${
                      isTopicSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                    }`}
                  >
                    {/* Topic Header */}
                    <div className="flex items-center p-3">
                      {/* Expand/Collapse Button */}
                      <button
                        onClick={() => toggleTopic(topic.topicId)}
                        className="mr-2 text-gray-600 hover:text-gray-800"
                      >
                        {isExpanded ? (
                          <ChevronDown size={20} />
                        ) : (
                          <ChevronRight size={20} />
                        )}
                      </button>

                      {/* Topic Checkbox */}
                      <button
                        onClick={() => handleTopicSelect(topic)}
                        className="mr-3 text-blue-600"
                      >
                        {isTopicSelected && selectedCount === topic.concepts.length ? (
                          <CheckSquare size={20} />
                        ) : selectedCount > 0 ? (
                          <CheckSquare size={20} className="text-blue-400" />
                        ) : (
                          <Square size={20} />
                        )}
                      </button>

                      {/* Topic Name */}
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-800">
                          {topic.topicName}
                        </h3>
                        <p className="text-xs text-gray-500">
                          {topic.concepts.length} pojęć
                          {selectedCount > 0 && (
                            <span className="text-blue-600 ml-2">
                              (wybrano: {selectedCount})
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Concepts List (when expanded) */}
                    {isExpanded && (
                      <div className="border-t border-gray-200 bg-white">
                        <div className="p-3 space-y-2">
                          {topic.concepts.map((concept) => {
                            const isSelected = selectedConceptIds.has(concept.conceptId);

                            return (
                              <button
                                key={concept.conceptId}
                                onClick={() => handleConceptToggle(topic.topicId, concept.conceptId)}
                                className={`w-full text-left p-2 rounded-lg flex items-start hover:bg-gray-50 transition ${
                                  isSelected ? 'bg-blue-50 border border-blue-200' : 'border border-transparent'
                                }`}
                              >
                                <div className="mr-2 mt-0.5">
                                  {isSelected ? (
                                    <CheckSquare size={16} className="text-blue-600" />
                                  ) : (
                                    <Square size={16} className="text-gray-400" />
                                  )}
                                </div>
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-gray-800">
                                    {concept.conceptName}
                                  </p>
                                  <p className="text-xs text-gray-600 mt-1">
                                    {concept.definition}
                                  </p>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t p-4 flex justify-between items-center">
          <div className="text-sm text-gray-600">
            {selectedTopicIds.size > 0 && (
              <span>
                Wybrano: <strong>{selectedTopicIds.size}</strong> tematów, <strong>{selectedConceptIds.size}</strong> pojęć
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Anuluj
            </button>
            <button
              onClick={handleConfirm}
              disabled={selectedConceptIds.size === 0}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Potwierdź
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CurriculumPickerModal;