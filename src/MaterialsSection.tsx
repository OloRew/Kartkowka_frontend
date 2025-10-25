import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  ChevronDown, 
  ChevronUp, 
  ScrollText, 
  StickyNote, 
  GitGraph, 
  BarChart3,
  ThumbsUp
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import EmbeddingPlotModal from './EmbeddingPlotModal';

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
}

interface MaterialFeedback {
  materials: { materialId: string; partitionKey: string }[];
  isLiked: boolean;
  isRequired: boolean;
}

interface MaterialsSectionProps {
  generatedMaterials: GeneratedMaterials | null;
  likedMaterialIds: string[];
  materialFeedbacks: Record<string, MaterialFeedback>;
  onMaterialFeedback: (feedback: MaterialFeedback) => void;
  username: string;
  schoolName: string;
  quizTopic?: string;
}

// Komponent MaterialRating jako wewnętrzny komponent
const MaterialRating: React.FC<{
  materials: MaterialUsedInSession[];
  username: string;
  schoolName: string;
  quizTopic?: string;
  notes?: string;
  onFeedback?: (feedback: { 
    materials: { materialId: string; partitionKey: string }[]; 
    isLiked: boolean; 
    isRequired: boolean 
  }) => void;
  onMaterialsUpdate?: (updatedMaterials: MaterialUsedInSession[]) => void;
}> = ({
  materials,
  username,
  schoolName,
  notes,
  quizTopic,
  onFeedback,
  onMaterialsUpdate
}) => {
  const [loading, setLoading] = useState(false);

  const totalLikes = materials.length > 0 ? Math.max(...materials.map(m => m.total_likes || 0)) : 0;
  const schoolLikes = materials.length > 0 ? Math.max(...materials.map(m => m.school_likes || 0)) : 0;
  const schoolDedicated = materials.some(m => m.school_dedicated);
  const userLikeit = materials.length > 0 && materials.every(m => m.user_likeit);

  const materialsPayload = materials
    .filter(m => m.materialId && m.partition_key_m)
    .map(m => ({
      materialId: m.materialId,
      partitionKey: m.partition_key_m
    }));

  const handleLike = async () => {
    if (materialsPayload.length === 0) {
      console.warn('Brak materiałów do ocenienia!');
      return;
    }

    const newLikedState = !userLikeit;

    if (onFeedback) {
      onFeedback({ 
        materials: materialsPayload, 
        isLiked: newLikedState, 
        isRequired: false 
      });
    }

    setLoading(true);

    try {
      const apiEndpoint = process.env.NODE_ENV === 'development'
        ? 'http://localhost:7071/api/materialUserFeedback'
        : 'https://kartkowkafunc-etaeawfubqcefcah.westeurope-01.azurewebsites.net/api/materialUserFeedback';

      const isNewMaterial = materialsPayload.length === 0;
    
      const requestBody = {
        username,
        isLiked: newLikedState,
        isRequired: false,
        school: schoolName,
        new_material: isNewMaterial,
        topic: quizTopic, 
        content: notes,
        klasa: "6",
        materials: materialsPayload
      };

      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });      

      const data = await response.json();
      
      if (!response.ok) {
        console.error('Błąd zapisu feedbacku:', data);
      } else {
        console.log('Feedback zapisany:', data);
        
        if (data.updatedMaterials && onMaterialsUpdate) {
          onMaterialsUpdate(data.updatedMaterials);
        }
      }
    } catch (error) {
      console.error('Błąd komunikacji z backendem:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2 mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
      <p className="text-sm font-medium text-gray-700">
        {schoolDedicated && (
          <>Materiał edukacyjny jest dedykowany dla Twojej szkoły! </>
        )}
        Materiał polubiło <ThumbsUp size={14} className="inline mx-1 text-green-600" />
        <strong>{totalLikes}</strong> osób, w tym <strong>{schoolLikes}</strong> osób z twojej szkoły.
      </p>

      <div className="flex items-center gap-2 mt-1">
        <button
          onClick={handleLike}
          disabled={loading || materialsPayload.length === 0}
          className={`flex items-center justify-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            userLikeit
              ? 'bg-green-500 text-white hover:bg-green-600'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          } ${(loading || materialsPayload.length === 0) ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <ThumbsUp size={16} className="mr-1" />
          {userLikeit ? 'Lubisz' : 'Like'}
        </button>
      </div>

      {materialsPayload.length === 0 && (
        <p className="text-xs text-gray-500 italic mt-2">
          Brak materiałów do oceny ponieważ żaden nie został pobrany z bazy.
        </p>
      )}
    </div>
  );
};

// Główny komponent MaterialsSection
const MaterialsSection: React.FC<MaterialsSectionProps> = ({
  generatedMaterials,
  likedMaterialIds,
  materialFeedbacks,
  onMaterialFeedback,
  username,
  quizTopic,
  schoolName
}) => {
  // ✅ 1. NAJPIERW WSZYSTKIE HOOKI - ZAWSZE na początku
  const [isMaterialsVisible, setIsMaterialsVisible] = useState<boolean>(true);
  const [areNotesVisible, setAreNotesVisible] = useState<boolean>(false);
  const [areFlashcardsVisible, setAreFlashcardsVisible] = useState<boolean>(false);
  const [isMindMapVisible, setIsMindMapVisible] = useState<boolean>(false);
  const [isEmbeddingPlotModalOpen, setIsEmbeddingPlotModalOpen] = useState<boolean>(false);
  const [materialsWithCounts, setMaterialsWithCounts] = useState<MaterialUsedInSession[]>([]);

  // ✅ 2. Inicjalizuj materiały przy zmianie generatedMaterials
  useEffect(() => {
    if (generatedMaterials) {
      const initializedMaterials = generatedMaterials.materialsUsedInSession.map(material => ({
        ...material,
        total_likes: material.total_likes || 0,
        school_likes: material.school_likes || 0,
        school_dedicated: material.school_dedicated || false,
        user_likeit: material.user_likeit || false
      }));
      setMaterialsWithCounts(initializedMaterials);
    }
  }, [generatedMaterials]);

  const handleMaterialsUpdate = (updatedMaterials: MaterialUsedInSession[]) => {
    setMaterialsWithCounts(updatedMaterials);
  };

  // ✅ 3. DOPIERO TERAZ warunkowy return
  if (!generatedMaterials) return null;

  const renderFlashcards = (flashcardText: string) => {
    if (!flashcardText) return <p>Brak fiszek.</p>;

    const regex = /\[Pytanie\s*\d+\]\s*([\s\S]*?)\s*\[Odpowiedź\s*\d+\]\s*([\s\S]*?)(?=\[Pytanie\s*\d+\]|\Z)/g;
    const flashcardsArray: { term: string; definition: string }[] = [];
    let match;
    while ((match = regex.exec(flashcardText)) !== null) {
      flashcardsArray.push({ term: match[1].trim(), definition: match[2].trim() });
    }
    if (flashcardsArray.length === 0) return <p>Brak fiszek.</p>;

    return (
      <div className="flex flex-wrap gap-4 p-4">
        {flashcardsArray.map((card, index) => (
          <div
            key={index}
            className="relative bg-yellow-200 text-gray-800 p-4 rounded-md shadow-md transform transition-transform hover:scale-105 cursor-pointer w-64 h-40 flex flex-col justify-between overflow-hidden"
            onClick={() => alert(`Pytanie: ${card.term}\n\nOdpowiedź: ${card.definition}`)}
          >
            <div className="flex-1 overflow-hidden">
              <p className="font-bold text-sm mb-1 line-clamp-3">{card.term}</p>
              <p className="text-sm line-clamp-6">{card.definition}</p>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-lg w-full">
      <div
        className="p-3 cursor-pointer flex justify-between items-center border-b"
        onClick={() => setIsMaterialsVisible(!isMaterialsVisible)}
      >
        <h2 className="text-xl font-bold text-gray-800">Materiały do nauki</h2>
        {isMaterialsVisible ? <ChevronUp /> : <ChevronDown />}
      </div>

      {isMaterialsVisible && (
        <div className="p-3 space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => setIsEmbeddingPlotModalOpen(true)}
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg shadow-md transition duration-200 flex items-center justify-center text-sm"
            >
              <BarChart3 className="mr-1" size={16} />
              {generatedMaterials.embeddingPlot ? 'Pokaż wykres podobieństwa' : 'Informacje o wykresie'}
            </button>
          </div>

          {generatedMaterials.consistencyWarning && (
            <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-3 rounded-lg flex items-start space-x-2">
              <AlertTriangle size={20} className="flex-shrink-0 text-yellow-600 mt-1" />
              <div>
                <p className="font-bold text-base mb-1">Ostrzeżenie o Spójności:</p>
                <p className="text-xs whitespace-pre-wrap">{generatedMaterials.consistencyWarning}</p>
              </div>
            </div>
          )}

          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div
              className="p-3 bg-gray-50 flex justify-between items-center cursor-pointer"
              onClick={() => setAreNotesVisible(!areNotesVisible)}
            >
              <h4 className="flex items-center text-base font-semibold text-gray-700">
                <ScrollText size={16} className="mr-2 text-blue-500" /> Notatki
              </h4>
              {areNotesVisible ? <ChevronUp /> : <ChevronDown />}
            </div>
            {areNotesVisible && (
              <div className="p-4 bg-white text-gray-800">
                <div className="prose max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {generatedMaterials.notes}
                  </ReactMarkdown>
                </div>
              </div>
            )}
          </div>

          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div
              className="p-3 bg-gray-50 flex justify-between items-center cursor-pointer"
              onClick={() => setAreFlashcardsVisible(!areFlashcardsVisible)}
            >
              <h4 className="flex items-center text-base font-semibold text-gray-700">
                <StickyNote size={16} className="mr-2 text-yellow-500" /> Fiszki
              </h4>
              {areFlashcardsVisible ? <ChevronUp /> : <ChevronDown />}
            </div>
            {areFlashcardsVisible && (
              <div className="p-3 bg-gray-100">
                {renderFlashcards(generatedMaterials.flashcards)}
              </div>
            )}
          </div>

          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div
              className="p-3 bg-gray-50 flex justify-between items-center cursor-pointer"
              onClick={() => setIsMindMapVisible(!isMindMapVisible)}
            >
              <h4 className="flex items-center text-base font-semibold text-gray-700">
                <GitGraph size={16} className="mr-2 text-red-500" /> Mapa Myśli
              </h4>
              {isMindMapVisible ? <ChevronUp /> : <ChevronDown />}
            </div>
            {isMindMapVisible && (
              <div className="p-4 bg-white text-gray-800">
                <div className="prose max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {generatedMaterials.mindMapDescription}
                  </ReactMarkdown>
                </div>
              </div>
            )}
          </div>

          {materialsWithCounts.length > 0 && (
            <div className="mt-4">
              <MaterialRating
                materials={materialsWithCounts}
                onFeedback={onMaterialFeedback}
                username={username}
                schoolName={schoolName}
                notes={generatedMaterials.notes}
                quizTopic={quizTopic}
                onMaterialsUpdate={handleMaterialsUpdate}
              />
            </div>
          )}
        </div>
      )}

      <EmbeddingPlotModal
        isOpen={isEmbeddingPlotModalOpen}
        onClose={() => setIsEmbeddingPlotModalOpen(false)}
        embeddingPlot={generatedMaterials?.embeddingPlot || null}
      />
    </div>
  );
};

export default MaterialsSection;
//koniec