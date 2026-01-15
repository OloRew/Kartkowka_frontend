import React, { useState } from 'react';
import { Loader, Send, Save, Menu, ChevronDown, ChevronUp } from 'lucide-react';
import SaveSessionModal from './SaveSessionModal';
import MaterialsSection from './MaterialsSection';
import TestsSection from './TestsSection';
import CurriculumPickerModal, { CurriculumSelection } from './CurriculumPickerModal';
import { CurriculumData } from './hooks/useCurriculumData';
// 🆕 IMPORT CUMULATIVE PERFORMANCE
import {
  CumulativePerformance,
  updateCumulativePerformance,
  TestQuestion
} from './cumPerf';

// ============================================
// INTERFACES
// ============================================

interface MaterialUsedInSession {
  materialId: string;
  partition_key_m: string;
  contentType: string;
  topic: string;
  klasa?: string | number;
  similarityScore?: number;
  total_likes?: number;
  school_likes?: number;
  school_dedicated?: boolean;
  conceptName?: string;
  conceptId?: string;
  curriculumId?: string;
  curriculumTopicId?: string;
  difficulty?: string;
  tags?: string[];
  subject?: string;
  user_likeit?: boolean;
}

interface GeneratedMaterials {
  notes: string;
  flashcards: string;
  mindMapDescription: string;
  quizSessionId: string;
  materialsUsedInSession: MaterialUsedInSession[];
  consistencyWarning?: string;
  embeddingPlot?: string;
  discoveredConceptIds?: string[];
  discoveredCurriculumTopicId?: string;
  discoveredCurriculumId?: string;
}

interface GeneratedTests {
  kartkowkaId: string;
  quizSessionId: string;
  questions: any[];
  materialsUsed?: string[];
  studentClass?: string;
  discoveredConceptIds?: string[];
  discoveredCurriculumTopicId?: string;
  discoveredCurriculumId?: string;
}

interface MaterialFeedback {
  materials: { materialId: string; partitionKey: string }[];
  isLiked: boolean;
  isRequired: boolean;
}

// 🆕 ROZSZERZONY SaveSessionPayload
interface SaveSessionPayload {
  username: string;
  subject: string;
  topic: string;
  customSessionName?: string;
  loadedSessionId?: string;
  curriculumId?: string | null;
  curriculumTopicIds?: string[];
  topicNames?: string[];
  conceptIds?: string[];
  materials?: {
    notes: string;
    flashcards: string;
    mindMapDescription: string;
    materialsUsedInSession: MaterialUsedInSession[];
    consistencyWarning?: string;
    embeddingPlot?: string;
  };
  tests?: {
    questions: any[];
  };
  cumulativePerformance?: CumulativePerformance;  // 🆕 DODANE
}

interface QuizPageProps {
  username: string;
  schoolName: string;
  className: string;
  likedMaterialIds: string[];
  materialFeedbacks: Record<string, MaterialFeedback>;
  onMaterialFeedback: (feedback: MaterialFeedback) => void;
  onMessage: (message: string) => void;
  loadedSessionId: string;
  initialSubject?: string;
  initialTopic?: string;
  initialMaterials?: GeneratedMaterials | null;
  initialTests?: GeneratedTests | null;
  loadedCurriculumId?: string;
  loadedCurriculumTopicIds?: string[];
  loadedTopicNames?: string[];
  loadedPrimaryConcepts?: string[];
  curriculumData: CurriculumData | null;
  onSessionLoad?: (subject: string, topic: string, materials: GeneratedMaterials | null, tests: GeneratedTests | null, sessionName: string, sessionId: string) => void;
  initialCumulativePerformance?: CumulativePerformance | null;  // 🆕 DODANE
}

const SUBJECTS = ['Biologia', 'Chemia', 'Fizyka', 'Historia', 'Matematyka'];

// ============================================
// QUIZ PAGE COMPONENT
// ============================================

function QuizPage({
  username,
  schoolName,
  className,
  likedMaterialIds,
  materialFeedbacks,
  onMaterialFeedback,
  onMessage,
  loadedSessionId: initialLoadedSessionId,
  initialSubject = '',
  initialTopic = '',
  initialMaterials = null,
  initialTests = null,
  loadedCurriculumId = '',
  loadedCurriculumTopicIds = [],
  loadedTopicNames = [],
  loadedPrimaryConcepts = [],
  curriculumData,
  onSessionLoad,
  initialCumulativePerformance = null  // 🆕 DODANE
}: QuizPageProps) {
  // ============================================
  // STATE
  // ============================================
  const [quizSubject, setQuizSubject] = useState<string>(initialSubject);
  const [quizTopic, setQuizTopic] = useState<string>(initialTopic);
  const [generatedMaterials, setGeneratedMaterials] = useState<GeneratedMaterials | null>(initialMaterials);
  const [generatedTests, setGeneratedTests] = useState<GeneratedTests | null>(initialTests);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isGeneratingTests, setIsGeneratingTests] = useState<boolean>(false);
  const [isCheckingTests, setIsCheckingTests] = useState<boolean>(false);
  const [generateError, setGenerateError] = useState<string>('');
  const [isSavingSession, setIsSavingSession] = useState<boolean>(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState<boolean>(false);
  const [suggestedSessionName, setSuggestedSessionName] = useState<string>('');
  const [loadedSessionId, setLoadedSessionId] = useState<string>(initialLoadedSessionId);

  const [isCurriculumPickerOpen, setIsCurriculumPickerOpen] = useState<boolean>(false);
  const [curriculumSelection, setCurriculumSelection] = useState<CurriculumSelection | null>(null);
  
  const [pendingSelection, setPendingSelection] = useState<CurriculumSelection | null>(null);
  const [isTopicChangeConfirmOpen, setIsTopicChangeConfirmOpen] = useState<boolean>(false);
  const [originalTopicBeforeHamburger, setOriginalTopicBeforeHamburger] = useState<string>('');

  // 🆕 CUMULATIVE PERFORMANCE STATE
  const [cumulativePerformance, setCumulativePerformance] = useState<CumulativePerformance | null>(
    initialCumulativePerformance
  );

  // 🆕 STATE dla zwijania statystyk - DOMYŚLNIE ZWINIĘTE
  const [isStatsVisible, setIsStatsVisible] = useState<boolean>(false);

  // ============================================
  // EFFECTS
  // ============================================
  
  React.useEffect(() => {
    if (initialSubject) setQuizSubject(initialSubject);
    if (initialTopic) setQuizTopic(initialTopic);
    if (initialMaterials) setGeneratedMaterials(initialMaterials);
    if (initialTests) setGeneratedTests(initialTests);
    if (initialLoadedSessionId) setLoadedSessionId(initialLoadedSessionId);
    
    // 🆕 Wczytaj cumulative performance
    if (initialCumulativePerformance) {
      setCumulativePerformance(initialCumulativePerformance);
      console.log('📊 Wczytano cumulative performance:', {
        totalTests: initialCumulativePerformance.totalTests,
        overallAccuracy: initialCumulativePerformance.overallAccuracy.toFixed(1) + '%',
        concepts: Object.keys(initialCumulativePerformance.conceptPerformance).length
      });
    }
    
    if (loadedCurriculumTopicIds.length > 0 && loadedPrimaryConcepts.length > 0) {
      setCurriculumSelection({
        curriculumId: loadedCurriculumId,
        curriculumTopicIds: loadedCurriculumTopicIds,
        topicNames: loadedTopicNames,
        conceptIds: loadedPrimaryConcepts,
        conceptNames: [],
        displayText: loadedTopicNames.join(', ')
      });
    }
  }, [initialSubject, initialTopic, initialMaterials, initialTests, initialLoadedSessionId, loadedCurriculumId, loadedCurriculumTopicIds, loadedTopicNames, loadedPrimaryConcepts, initialCumulativePerformance]);

  // ============================================
  // HANDLERS
  // ============================================

  const handleClearSession = () => {
    setQuizSubject('');
    setQuizTopic('');
    setGeneratedMaterials(null);
    setGeneratedTests(null);
    setGenerateError('');
    setLoadedSessionId('');
    setCurriculumSelection(null);
    setCumulativePerformance(null);  // 🆕 Wyczyść cumulative
    onMessage('Formularz wyczyszczony');
    setTimeout(() => onMessage(''), 3000);
    
    if (onSessionLoad) {
      onSessionLoad('', '', null, null, '', '');
    }
  };

  const handleCurriculumSelect = async (selection: CurriculumSelection) => {
    if (loadedSessionId && !originalTopicBeforeHamburger) {
      setOriginalTopicBeforeHamburger(quizTopic);
    }
    
    setQuizTopic(selection.displayText);
    setCurriculumSelection(selection);
    
    onMessage(`✓ Wybrano temat "${selection.displayText}" z podstawy programowej`);
    setTimeout(() => onMessage(''), 3000);
  };

  const confirmCurriculumSelect = async (selection: CurriculumSelection) => {
    setQuizTopic(selection.displayText);
    setCurriculumSelection(selection);
    setIsTopicChangeConfirmOpen(false);
    setPendingSelection(null);
    setOriginalTopicBeforeHamburger('');
    
    onMessage('💾 Zapisywanie tematu z podstawy programowej...');
    
    try {
      const apiEndpoint = process.env.NODE_ENV === 'development'
        ? 'http://localhost:7071/api/saveLearningSession'
        : 'https://kartkowkafunc-etaeawfubqcefcah.westeurope-01.azurewebsites.net/api/saveLearningSession';

      const payload: SaveSessionPayload = {
        username,
        subject: quizSubject,
        topic: selection.displayText,
        curriculumId: selection.curriculumId,
        loadedSessionId: loadedSessionId || undefined,
        curriculumTopicIds: selection.curriculumTopicIds,
        topicNames: selection.topicNames,
        conceptIds: selection.conceptIds,
      };

      if (cumulativePerformance) {
        payload.cumulativePerformance = cumulativePerformance;
      }

      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-functions-key': process.env.REACT_APP_FUNCTION_KEY as string,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const result = await response.json();
        
        setLoadedSessionId(result.sessionId);
        
        if (onSessionLoad) {
          onSessionLoad(quizSubject, selection.displayText, null, null, selection.displayText, result.sessionId);
        }
        
        onMessage(`✓ Temat "${selection.displayText}" zapisany`);
        setTimeout(() => onMessage(''), 3000);
      } else {
        onMessage('⚠️ Nie udało się automatycznie zapisać tematu');
        setTimeout(() => onMessage(''), 3000);
      }
    } catch (error) {
      onMessage('⚠️ Błąd podczas automatycznego zapisu');
      setTimeout(() => onMessage(''), 3000);
    }
  };

  const handleCancelTopicChange = () => {
    setIsTopicChangeConfirmOpen(false);
    setPendingSelection(null);
    
    if (originalTopicBeforeHamburger) {
      setQuizTopic(originalTopicBeforeHamburger);
      setOriginalTopicBeforeHamburger('');
    }
  };

  const handleSaveWithCurrentTopic = async () => {
    if (!pendingSelection) return;
    
    setCurriculumSelection(pendingSelection);
    setIsTopicChangeConfirmOpen(false);
    setPendingSelection(null);
    setOriginalTopicBeforeHamburger('');
    
    onMessage('💾 Zapisywanie z obecnym tematem...');
    
    try {
      const apiEndpoint = process.env.NODE_ENV === 'development'
        ? 'http://localhost:7071/api/saveLearningSession'
        : 'https://kartkowkafunc-etaeawfubqcefcah.westeurope-01.azurewebsites.net/api/saveLearningSession';

      const payload: SaveSessionPayload = {
        username,
        subject: quizSubject,
        topic: quizTopic,
        curriculumId: pendingSelection.curriculumId,
        loadedSessionId: loadedSessionId || undefined,
        curriculumTopicIds: pendingSelection.curriculumTopicIds,
        topicNames: pendingSelection.topicNames,
        conceptIds: pendingSelection.conceptIds,
      };

      if (cumulativePerformance) {
        payload.cumulativePerformance = cumulativePerformance;
      }

      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-functions-key': process.env.REACT_APP_FUNCTION_KEY as string,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const result = await response.json();
        setLoadedSessionId(result.sessionId);
        
        if (onSessionLoad) {
          onSessionLoad(quizSubject, quizTopic, null, null, quizTopic, result.sessionId);
        }
        
        onMessage(`✓ Zapisano z obecnym tematem`);
        setTimeout(() => onMessage(''), 3000);
      }
    } catch (error) {
      onMessage('⚠️ Błąd podczas zapisu');
    }
  };

  const handleGenerateLearningMaterials = async () => {
    if (!quizSubject || !quizTopic.trim()) {
      setGenerateError('Proszę wybrać przedmiot i podać temat kartkówki.');
      return;
    }

    setIsGenerating(true);
    setGeneratedMaterials(null);
    setGenerateError('');

    try {
      const apiEndpoint = process.env.NODE_ENV === 'development'
        ? `http://localhost:7071/api/generateLearningMaterials`
        : `https://kartkowkafunc-etaeawfubqcefcah.westeurope-01.azurewebsites.net/api/generateLearningMaterials`;

      const requestBody = {
        subject: quizSubject,
        topic: quizTopic,
        username,
        curriculumTopicIds: curriculumSelection?.curriculumTopicIds || [],
        conceptIds: curriculumSelection?.conceptIds || [],
      };

      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-functions-key': process.env.REACT_APP_FUNCTION_KEY as string,
        },
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        const data: GeneratedMaterials = await response.json();
        setGeneratedMaterials(data);
        
        if (data.discoveredConceptIds && data.discoveredConceptIds.length > 0) {
          let discoveredTopicName = quizTopic;
          
          if (data.discoveredCurriculumTopicId && curriculumData) {
            const subjectData = curriculumData.subjects.find(s => s.subject === quizSubject);
            if (subjectData) {
              const foundTopic = subjectData.topics.find(t => t.topicId === data.discoveredCurriculumTopicId);
              if (foundTopic) {
                discoveredTopicName = foundTopic.topicName;
              }
            }
          }
          
          setCurriculumSelection({
            curriculumId: data.discoveredCurriculumId || '',
            curriculumTopicIds: data.discoveredCurriculumTopicId ? [data.discoveredCurriculumTopicId] : [],
            topicNames: [discoveredTopicName],
            conceptIds: data.discoveredConceptIds,
            conceptNames: [],
            displayText: discoveredTopicName
          });
          
          onMessage('✓ Materiały wygenerowane. Znaleziono powiązania z podstawą programową');
          setTimeout(() => onMessage(''), 3000);
        } else {
          onMessage('Materiały wygenerowane pomyślnie!');
          setTimeout(() => onMessage(''), 3000);
        }
        
        setGenerateError('');
      } else {
        const errorText = await response.text();
        setGenerateError(`Błąd podczas generowania materiałów: ${errorText}`);
        onMessage(`Błąd podczas generowania materiałów: ${errorText}`);
      }
    } catch (error) {
      setGenerateError(`Wystąpił błąd sieci podczas generowania materiałów: ${error}`);
      onMessage(`Wystąpił błąd sieci podczas generowania materiałów: ${error}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateTests = async () => {
    if (!quizSubject || !quizTopic.trim()) {
      setGenerateError('Proszę wybrać przedmiot i podać temat testów.');
      return;
    }

    setIsGeneratingTests(true);
    setGeneratedTests(null);
    setGenerateError('');

    try {
      const apiEndpoint = process.env.NODE_ENV === 'development'
        ? `http://localhost:7071/api/generateTests`
        : `https://kartkowkafunc-etaeawfubqcefcah.westeurope-01.azurewebsites.net/api/generateTests`;

      const requestBody = {
        subject: quizSubject,
        topic: quizTopic,
        username,
        kartkowkaId: generatedTests?.kartkowkaId || loadedSessionId,
        curriculumTopicIds: curriculumSelection?.curriculumTopicIds || [],
        conceptIds: curriculumSelection?.conceptIds || [],
      };

      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-functions-key': process.env.REACT_APP_FUNCTION_KEY as string,
        },
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        const data: GeneratedTests = await response.json();
        setGeneratedTests(data);
        
        if (data.discoveredConceptIds && data.discoveredConceptIds.length > 0) {
          let discoveredTopicName = quizTopic;
          
          if (data.discoveredCurriculumTopicId && curriculumData) {
            const subjectData = curriculumData.subjects.find(s => s.subject === quizSubject);
            if (subjectData) {
              const foundTopic = subjectData.topics.find(t => t.topicId === data.discoveredCurriculumTopicId);
              if (foundTopic) {
                discoveredTopicName = foundTopic.topicName;
              }
            }
          }
          
          setCurriculumSelection({
            curriculumId: data.discoveredCurriculumId || '',
            curriculumTopicIds: data.discoveredCurriculumTopicId ? [data.discoveredCurriculumTopicId] : [],
            topicNames: [discoveredTopicName],
            conceptIds: data.discoveredConceptIds,
            conceptNames: [],
            displayText: discoveredTopicName
          });
          
          onMessage('✓ Testy wygenerowane. Znaleziono powiązania z podstawą programową');
          setTimeout(() => onMessage(''), 3000);
        } else {
          onMessage('Testy wygenerowane pomyślnie!');
          setTimeout(() => onMessage(''), 3000);
        }
        
        setGenerateError('');
      } else {
        const errorText = await response.text();
        setGenerateError(`Błąd podczas generowania testów: ${errorText}`);
      }
    } catch (error) {
      setGenerateError(`Wystąpił błąd sieci podczas generowania testów: ${error}`);
    } finally {
      setIsGeneratingTests(false);
    }
  };

  // 🆕 ZMIENIONY handleCheckTests - AKTUALIZUJE CUMULATIVE
  const handleCheckTests = async (answers: Record<number, string>) => {
    if (!generatedTests) return;
    setIsCheckingTests(true);

    try {
      const apiEndpoint = process.env.NODE_ENV === 'development'
        ? `http://localhost:7071/api/checkTestAnswers`
        : `https://kartkowkafunc-etaeawfubqcefcah.westeurope-01.azurewebsites.net/api/checkTestAnswers`;

      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-functions-key': process.env.REACT_APP_FUNCTION_KEY as string,
        },
        body: JSON.stringify({
          username,
          kartkowkaId: generatedTests.kartkowkaId,
          questions: generatedTests.questions,
          answers,
        }),
      });

      if (response.ok) {
        const results = await response.json();

        const updatedQuestions = generatedTests.questions.map((q: any, i: number) => ({
          ...q,
          userAnswer: answers[i],
          isCorrect: results.results[i]?.isCorrect,
        }));

        setGeneratedTests((prev) =>
          prev ? { ...prev, questions: updatedQuestions } : prev
        );

        // 🆕 AKTUALIZUJ CUMULATIVE PERFORMANCE
        const updated = updateCumulativePerformance(
          cumulativePerformance,
          updatedQuestions as TestQuestion[]
        );
        
        setCumulativePerformance(updated);
        
        console.log('📊 Zaktualizowano cumulative:', {
          totalTests: updated.totalTests,
          overallAccuracy: updated.overallAccuracy.toFixed(1) + '%',
          concepts: Object.keys(updated.conceptPerformance).length
        });

        onMessage('Testy sprawdzone pomyślnie!');
        setTimeout(() => onMessage(''), 3000);
      } else {
        const errorText = await response.text();
        setGenerateError(`Błąd podczas sprawdzania testów: ${errorText}`);
      }
    } catch (error) {
      setGenerateError(`Wystąpił błąd sieci podczas sprawdzania testów: ${error}`);
    } finally {
      setIsCheckingTests(false);
    }
  };

  const handleOpenSaveModal = async () => {
    if (!quizSubject || !quizTopic.trim()) {
      onMessage('Brak przedmiotu lub tematu do zapisania.');
      return;
    }

    if (!generatedMaterials && !generatedTests) {
      onMessage('Brak materiałów ani testów do zapisania.');
      return;
    }

    if (loadedSessionId && originalTopicBeforeHamburger) {
      const normalizedOriginal = originalTopicBeforeHamburger.trim().toLowerCase();
      const normalizedCurrent = quizTopic.trim().toLowerCase();
      
      if (normalizedOriginal !== normalizedCurrent && curriculumSelection) {
        setPendingSelection(curriculumSelection);
        setIsTopicChangeConfirmOpen(true);
        return;
      }
    }

    if (loadedSessionId) {
      await handleSaveSession(quizTopic);
      return;
    }

    if (!curriculumSelection) {
      await handleSaveSession(quizTopic);
      return;
    }

    const normalizedQuizTopic = quizTopic.trim().toLowerCase();
    const normalizedDisplayText = curriculumSelection.displayText.trim().toLowerCase();
    
    if (normalizedQuizTopic !== normalizedDisplayText) {
      const suggested = curriculumSelection.topicNames.join(', ');
      setSuggestedSessionName(suggested);
      setIsSaveModalOpen(true);
      return;
    }

    await handleSaveSession(curriculumSelection.displayText);
  };

  // 🆕 ZMIENIONY handleSaveSession - WYSYŁA CUMULATIVE
  const handleSaveSession = async (customSessionName: string) => {
    setIsSavingSession(true);
    onMessage('Zapisywanie sesji...');

    try {
      const apiEndpoint = process.env.NODE_ENV === 'development'
        ? 'http://localhost:7071/api/saveLearningSession'
        : 'https://kartkowkafunc-etaeawfubqcefcah.westeurope-01.azurewebsites.net/api/saveLearningSession';

      const payload: SaveSessionPayload = {
        username,
        subject: quizSubject,
        topic: quizTopic,
        customSessionName: customSessionName,
        loadedSessionId: loadedSessionId || undefined,
        curriculumId: curriculumSelection?.curriculumId || null, 
        curriculumTopicIds: curriculumSelection?.curriculumTopicIds || [],
        topicNames: curriculumSelection?.topicNames || [],
        conceptIds: curriculumSelection?.conceptIds || [],
      };

      if (generatedMaterials) {
        payload.materials = {
          notes: generatedMaterials.notes,
          flashcards: generatedMaterials.flashcards,
          mindMapDescription: generatedMaterials.mindMapDescription,
          materialsUsedInSession: generatedMaterials.materialsUsedInSession,
          consistencyWarning: generatedMaterials.consistencyWarning,
          embeddingPlot: generatedMaterials.embeddingPlot,
        };
      }

      if (generatedTests) {
        payload.tests = {
          questions: generatedTests.questions,
        };
      }

      if (cumulativePerformance) {
        payload.cumulativePerformance = cumulativePerformance;
        console.log('💾 Zapisuję cumulative:', {
          totalTests: cumulativePerformance.totalTests,
          totalQuestions: cumulativePerformance.totalQuestions,
          overallAccuracy: cumulativePerformance.overallAccuracy.toFixed(1) + '%'
        });
      }

      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-functions-key': process.env.REACT_APP_FUNCTION_KEY as string,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const result = await response.json();
        
        setLoadedSessionId(result.sessionId);
        
        if (customSessionName && customSessionName.trim()) {
          setQuizTopic(customSessionName.trim());
        }
        
        if (onSessionLoad) {
          const finalTopic = customSessionName && customSessionName.trim() ? customSessionName.trim() : quizTopic;
          onSessionLoad(quizSubject, finalTopic, generatedMaterials, generatedTests, finalTopic, result.sessionId);
        }
        
        onMessage(`Sesja "${customSessionName || quizTopic}" została zapisana pomyślnie!`);
        setIsSaveModalOpen(false);
        setTimeout(() => onMessage(''), 5000);
      } else {
        const errorText = await response.text();
        onMessage(`Błąd podczas zapisywania sesji: ${errorText}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      onMessage(`Wystąpił błąd sieci podczas zapisywania: ${errorMessage}`);
    } finally {
      setIsSavingSession(false);
    }
  };

  const isFormValid = quizSubject && quizTopic.trim();
  const isSaveSessionEnabled = (generatedMaterials || generatedTests) && !isSavingSession;

  return (
    <>
      <div className="bg-white rounded-xl shadow-lg p-4 w-full mb-4">
        <div className="flex justify-between items-center mb-2 border-b pb-1">
          <h2 className="text-xl font-bold text-gray-800">Kartkówka na temat:</h2>
          <div className="flex gap-2">
            <button
              onClick={handleClearSession}
              disabled={isGenerating || isGeneratingTests}
              className="bg-gray-400 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg shadow-md transition duration-200 flex items-center justify-center text-sm disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Wyczyść
            </button>
            <button
              onClick={handleOpenSaveModal}
              disabled={!isSaveSessionEnabled}
              className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg shadow-md transition duration-200 flex items-center justify-center text-sm disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {isSavingSession ? (
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

        <div className="mb-3">
          <label htmlFor="subject-select" className="block text-sm font-medium text-gray-700 mb-1">
            Przedmiot:
          </label>
          <select
            id="subject-select"
            value={quizSubject}
            onChange={(e) => setQuizSubject(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
            disabled={isGenerating || isGeneratingTests}
          >
            <option value="">Wybierz przedmiot</option>
            {SUBJECTS.map((subject) => (
              <option key={subject} value={subject}>
                {subject}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Temat:
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Wprowadź temat lub wybierz z podstawy programowej →"
              value={quizTopic}
              onChange={(e) => setQuizTopic(e.target.value)}
              className="flex-1 p-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
              disabled={isGenerating || isGeneratingTests}
            />
            <button
              type="button"
              onClick={() => setIsCurriculumPickerOpen(true)}
              disabled={!quizSubject || isGenerating || isGeneratingTests}
              className="p-2 border-2 border-blue-500 rounded-lg hover:bg-blue-50 disabled:bg-gray-100 disabled:border-gray-300 disabled:cursor-not-allowed transition"
              title="Wybierz z podstawy programowej"
            >
              <Menu 
                size={20} 
                className={quizSubject ? 'text-blue-600' : 'text-gray-400'} 
              />
            </button>
          </div>
          {curriculumSelection && (
            <p className="text-xs text-green-600 mt-1">
              ✓ Wybrano z podstawy: {curriculumSelection.topicNames.join(', ')} ({curriculumSelection.conceptIds.length} pojęć)
            </p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={handleGenerateLearningMaterials}
            className="bg-blue-400 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded-lg shadow-md transition duration-200 flex items-center justify-center sm:w-auto w-full text-sm disabled:bg-gray-300 disabled:cursor-not-allowed"
            disabled={isGenerating || isGeneratingTests || !isFormValid}
          >
            {isGenerating ? (
              <>
                <Loader className="animate-spin mr-1" size={16} /> Generowanie...
              </>
            ) : (
              <>
                <Send className="mr-1" size={16} /> Generuj Materiały
              </>
            )}
          </button>
          <button
            onClick={handleGenerateTests}
            className="bg-blue-400 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded-lg shadow-md transition duration-200 flex items-center justify-center sm:w-auto w-full text-sm disabled:bg-gray-300 disabled:cursor-not-allowed"
            disabled={isGenerating || isGeneratingTests || !isFormValid}
          >
            {isGeneratingTests ? (
              <>
                <Loader className="animate-spin mr-1" size={16} /> Generowanie...
              </>
            ) : (
              <>
                <Send className="mr-1" size={16} /> Generuj Testy
              </>
            )}
          </button>
        </div>
        {generateError && (
          <div className="bg-red-100 text-red-700 p-2 rounded-lg text-xs mt-2">{generateError}</div>
        )}
      </div>

      {/* 🆕 STATYSTYKI CUMULATIVE - ZWIJALNE, POD BLOKIEM GŁÓWNYM */}
      {cumulativePerformance && cumulativePerformance.totalTests > 0 && (
        <div className="bg-white rounded-xl shadow-lg w-full mb-4">
          {/* Header - klikalne */}
          <div
            className="p-2 cursor-pointer flex justify-between items-center border-b"
            onClick={() => setIsStatsVisible(!isStatsVisible)}
          >
            <h3 className="text-sm sm:text-base font-bold text-gray-800">📊 Twoje statystyki</h3>
            {isStatsVisible ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </div>

          {/* Content - zwijany */}
          {isStatsVisible && (
            <div className="p-2 sm:p-3">
              {/* Główne statystyki - 2 kolumny na mobile, 4 na desktop */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 sm:gap-2 mb-2">
                <div className="bg-gray-50 rounded p-1.5 sm:p-2">
                  <p className="text-xs text-gray-600">Testy</p>
                  <p className="text-lg sm:text-xl font-bold text-blue-600">{cumulativePerformance.totalTests}</p>
                </div>
                <div className="bg-gray-50 rounded p-1.5 sm:p-2">
                  <p className="text-xs text-gray-600">Pytania</p>
                  <p className="text-lg sm:text-xl font-bold text-blue-600">{cumulativePerformance.totalQuestions}</p>
                </div>
                <div className="bg-gray-50 rounded p-1.5 sm:p-2">
                  <p className="text-xs text-gray-600">Poprawne</p>
                  <p className="text-lg sm:text-xl font-bold text-green-600">
                    {cumulativePerformance.totalCorrectAnswers}
                  </p>
                </div>
                <div className="bg-gray-50 rounded p-1.5 sm:p-2">
                  <p className="text-xs text-gray-600">Accuracy</p>
                  <div className="flex items-center gap-1">
                    <p className="text-lg sm:text-xl font-bold text-purple-600">
                      {cumulativePerformance.overallAccuracy.toFixed(0)}%
                    </p>
                    {/* 🆕 TYLKO STRZAŁKA - TREND OGÓLNY */}
                    {cumulativePerformance.overallTrend !== 0 && (
                      <span className={`text-base sm:text-lg font-bold ${
                        cumulativePerformance.overallTrend > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {cumulativePerformance.overallTrend > 0 ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Per-concept breakdown */}
              <div className="mt-2">
                <p className="text-xs font-medium text-gray-700 mb-1">Per koncept:</p>
                <div className="grid grid-cols-1 gap-1">
                  {Object.values(cumulativePerformance.conceptPerformance)
                    .sort((a, b) => a.accuracy - b.accuracy)
                    .slice(0, 6)
                    .map(concept => (
                      <div key={concept.conceptId} className="bg-gray-50 rounded p-1.5 flex justify-between items-center gap-2">
                        <span className="text-xs font-medium truncate flex-1">{concept.conceptName}</span>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <span className={`text-sm font-bold ${
                            concept.accuracy >= 70 ? 'text-green-600' :
                            concept.accuracy >= 50 ? 'text-yellow-600' :
                            'text-red-600'
                          }`}>
                            {concept.accuracy.toFixed(0)}%
                          </span>
                          
                          {/* 🆕 TYLKO STRZAŁKA - TREND PER-CONCEPT */}
                          {concept.trend !== 0 && (
                            <span className={`text-sm font-bold ${
                              concept.trend > 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {concept.trend > 0 ? '↑' : '↓'}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <MaterialsSection
        generatedMaterials={generatedMaterials}
        likedMaterialIds={likedMaterialIds}
        materialFeedbacks={materialFeedbacks}
        onMaterialFeedback={onMaterialFeedback}
        username={username}
        schoolName={schoolName}
        quizTopic={quizTopic}
      />

      <TestsSection
        generatedTests={generatedTests}
        onCheckTests={handleCheckTests}
        isChecking={isCheckingTests}
      />

      {isSaveModalOpen && (
        <SaveSessionModal
          isOpen={isSaveModalOpen}
          suggestedName={suggestedSessionName}
          onSave={handleSaveSession}
          onClose={() => setIsSaveModalOpen(false)}
          isSaving={isSavingSession}
        />
      )}

      {isTopicChangeConfirmOpen && pendingSelection && (
        <SaveSessionModal
          isOpen={isTopicChangeConfirmOpen}
          suggestedName={pendingSelection.displayText}
          onSave={() => confirmCurriculumSelect(pendingSelection)}
          onSaveWithCurrentTopic={handleSaveWithCurrentTopic}
          onClose={handleCancelTopicChange}
          isSaving={false}
          mode="confirm"
          currentTopic={quizTopic}
          newTopic={pendingSelection.displayText}
        />
      )}

      <CurriculumPickerModal
        isOpen={isCurriculumPickerOpen}
        onClose={() => setIsCurriculumPickerOpen(false)}
        onSelect={handleCurriculumSelect}
        studentClass={className || '5'}
        selectedSubject={quizSubject}
        initialCurriculumTopicIds={curriculumSelection?.curriculumTopicIds}
        initialConceptIds={curriculumSelection?.conceptIds || []}
      />
    </>
  );
}

export default QuizPage;