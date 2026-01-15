import { useState, useEffect } from 'react';

// ============================================
// INTERFACES
// ============================================

export interface CurriculumConcept {
  conceptId: string;
  conceptName: string;
  definition: string;
}

export interface CurriculumTopic {
  topicId: string;
  topicName: string;
  order: number;
  curriculumObjectives: string[];
  concepts: CurriculumConcept[];
  conceptNames: string[];
  class?: string;
}

export interface CurriculumSubject {
  subject: string;
  topics: CurriculumTopic[];
}

export interface CurriculumData {
  id: string;                           // 🆕 DODANE
  subjects: CurriculumSubject[];
  class: string;
  totalSubjects: number;
  totalTopics: number;
}

// ============================================
// HOOK
// ============================================

export const useCurriculumData = (studentClass: string) => {
  const [curriculumData, setCurriculumData] = useState<CurriculumData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  
  const [subjects, setSubjects] = useState<string[]>([]);
  const [topicsBySubject, setTopicsBySubject] = useState<Record<string, string[]>>({});

  useEffect(() => {
    const fetchCurriculumData = async () => {
      if (!studentClass) {
        return;
      }

      setLoading(true);
      setError('');

      try {
        const functionKey = process.env.REACT_APP_FUNCTION_KEY || '';
        const apiEndpoint =
          process.env.NODE_ENV === 'development'
            ? `http://localhost:7071/api/getCurriculumData?class=${encodeURIComponent(studentClass)}`
            : `https://kartkowkafunc-etaeawfubqcefcah.westeurope-01.azurewebsites.net/api/getCurriculumData?class=${encodeURIComponent(studentClass)}`;

        const response = await fetch(apiEndpoint, {
          method: 'GET',
          headers: functionKey ? { 'x-functions-key': functionKey } : {},
        });

        if (!response.ok) {
          throw new Error(`Błąd HTTP: ${response.status}`);
        }

        const rawData = await response.json();        // 🆕 Zmienione z "data"
        
        // 🆕 DODANE: Przekształć dane z backendu
        const data: CurriculumData = {
          id: rawData.id || `${rawData.subject}_Klasa_${rawData.class}`,  // 🆕
          subjects: rawData.subjects || [rawData],    // 🆕 Obsłuż oba formaty
          class: rawData.class,
          totalSubjects: rawData.totalSubjects || 1,
          totalTopics: rawData.totalTopics || rawData.topics?.length || 0
        };
        
        setCurriculumData(data);

        const subjectsList = data.subjects.map(s => s.subject).sort();
        setSubjects(subjectsList);

        const topicsMap: Record<string, string[]> = {};
        data.subjects.forEach(subject => {
          topicsMap[subject.subject] = subject.topics
            .map(t => t.topicName)
            .sort();
        });
        setTopicsBySubject(topicsMap);

        console.log('✅ Curriculum data loaded:', {
          id: data.id,                                // 🆕 Loguj id
          subjects: subjectsList.length,
          topics: data.totalTopics
        });

      } catch (err: any) {
        console.error('❌ Error loading curriculum:', err);
        setError(err.message || 'Błąd podczas ładowania danych curriculum');
      } finally {
        setLoading(false);
      }
    };

    fetchCurriculumData();
  }, [studentClass]);

  const getTopicsForSubject = (subject: string): CurriculumTopic[] => {
    if (!curriculumData) return [];
    const subjectData = curriculumData.subjects.find(s => s.subject === subject);
    return subjectData?.topics || [];
  };

  const getTopicDetails = (subject: string, topicName: string): CurriculumTopic | null => {
    const topics = getTopicsForSubject(subject);
    return topics.find(t => t.topicName === topicName) || null;
  };

  return {
    curriculumData,
    loading,
    error,
    subjects,
    topicsBySubject,
    getTopicsForSubject,
    getTopicDetails
  };
};