/**
 * Utility functions for calculating and managing cumulative performance
 * across multiple tests
 */

export interface ConceptPerformance {
  conceptId: string;
  conceptName: string;
  totalQuestions: number;
  correctAnswers: number;
  accuracy: number;
  suggestedDifficulty: 'basic' | 'intermediate' | 'advanced';
  lastTested: string;
  recentScores: number[];  // 🆕 Ostatnie 10 wyników (0 lub 1)
  trend: number;  // 🆕 Trend w % (dodatni = poprawa)
}

export interface CumulativePerformance {
  totalTests: number;
  totalQuestions: number;
  totalCorrectAnswers: number;
  overallAccuracy: number;
  conceptPerformance: Record<string, ConceptPerformance>;
  recentQuestions: Array<{
    text: string;
    conceptId: string;
    questionId: string;
  }>;
  recentTestScores: number[];  // 🆕 Ostatnie 10 testów (% accuracy)
  overallTrend: number;  // 🆕 Trend ogólny w %
}

export interface TestQuestion {
  questionId: string;
  question: string;
  conceptId: string;
  conceptName: string;
  correctAnswer: string;
  userAnswer?: string;
  isCorrect?: boolean;
  difficulty?: string;
}

/**
 * Determines suggested difficulty based on accuracy
 */
export function determineDifficulty(accuracy: number): 'basic' | 'intermediate' | 'advanced' {
  if (accuracy < 50) return 'basic';
  if (accuracy < 70) return 'intermediate';
  return 'advanced';
}

/**
 * 🆕 Calculates trend from recent scores (last 3 vs previous 3)
 */
function calculateTrend(scores: number[]): number {
  if (scores.length < 2) return 0;
  
  // Porównaj ostatnie 3 z poprzednimi 3
  const recent3 = scores.slice(-3);
  const previous3 = scores.slice(-6, -3);
  
  const recentAvg = recent3.reduce((a, b) => a + b, 0) / recent3.length;
  const previousAvg = previous3.reduce((a, b) => a + b, 0) / previous3.length;
  
  return recentAvg - previousAvg;
}

/**
 * Extracts concept performance from a list of questions
 */
export function extractConceptPerformance(questions: TestQuestion[]): Record<string, {
  conceptName: string;
  totalQuestions: number;
  correctAnswers: number;
  accuracy: number;
  questionResults: number[];  // 🆕 0 lub 1 dla każdego pytania
}> {
  const conceptMap: Record<string, {
    conceptName: string;
    totalQuestions: number;
    correctAnswers: number;
    accuracy: number;
    questionResults: number[];
  }> = {};

  // Count questions per concept
  for (const q of questions) {
    const cid = q.conceptId || 'unknown';
    const cname = q.conceptName || 'Unknown';

    if (!conceptMap[cid]) {
      conceptMap[cid] = {
        conceptName: cname,
        totalQuestions: 0,
        correctAnswers: 0,
        accuracy: 0,
        questionResults: []  // 🆕
      };
    }

    conceptMap[cid].totalQuestions += 1;
    conceptMap[cid].questionResults.push(q.isCorrect === true ? 1 : 0);  // 🆕

    if (q.isCorrect === true) {
      conceptMap[cid].correctAnswers += 1;
    }
  }

  // Calculate accuracy
  for (const cid in conceptMap) {
    const data = conceptMap[cid];
    data.accuracy = data.totalQuestions > 0 
      ? (data.correctAnswers / data.totalQuestions) * 100 
      : 0;
  }

  return conceptMap;
}

/**
 * Updates cumulative performance with results from a new test
 */
export function updateCumulativePerformance(
  previousCumulative: CumulativePerformance | null,
  currentTestQuestions: TestQuestion[]
): CumulativePerformance {
  // Extract performance from current test
  const currentConceptPerf = extractConceptPerformance(currentTestQuestions);

  // 🆕 Oblicz wynik tego testu
  const currentCorrect = currentTestQuestions.filter(q => q.isCorrect === true).length;
  const currentTotal = currentTestQuestions.length;
  const currentTestAccuracy = currentTotal > 0 ? (currentCorrect / currentTotal) * 100 : 0;

  // Initialize if first test
  if (!previousCumulative || !previousCumulative.conceptPerformance) {
    const conceptPerformance: Record<string, ConceptPerformance> = {};

    for (const cid in currentConceptPerf) {
      const data = currentConceptPerf[cid];
      conceptPerformance[cid] = {
        conceptId: cid,
        conceptName: data.conceptName,
        totalQuestions: data.totalQuestions,
        correctAnswers: data.correctAnswers,
        accuracy: data.accuracy,
        suggestedDifficulty: determineDifficulty(data.accuracy),
        lastTested: new Date().toISOString(),
        recentScores: data.questionResults.slice(-10),  // 🆕 Ostatnie 10
        trend: 0  // 🆕 Brak trendu przy pierwszym teście
      };
    }

    // Extract recent questions
    const recentQuestions = currentTestQuestions
      .filter(q => q.question && q.questionId)
      .map(q => ({
        text: q.question,
        conceptId: q.conceptId || 'unknown',
        questionId: q.questionId
      }))
      .slice(-10);

    return {
      totalTests: 1,
      totalQuestions: currentTotal,
      totalCorrectAnswers: currentCorrect,
      overallAccuracy: currentTestAccuracy,
      conceptPerformance,
      recentQuestions,
      recentTestScores: [currentTestAccuracy],  // 🆕
      overallTrend: 0  // 🆕 Brak trendu przy pierwszym teście
    };
  }

  // Update existing cumulative
  const updatedConceptPerformance: Record<string, ConceptPerformance> = {
    ...previousCumulative.conceptPerformance
  };

  for (const cid in currentConceptPerf) {
    const currentData = currentConceptPerf[cid];

    if (updatedConceptPerformance[cid]) {
      // Update existing concept
      const prev = updatedConceptPerformance[cid];
      const newTotalQuestions = prev.totalQuestions + currentData.totalQuestions;
      const newCorrectAnswers = prev.correctAnswers + currentData.correctAnswers;
      const newAccuracy = newTotalQuestions > 0 
        ? (newCorrectAnswers / newTotalQuestions) * 100 
        : 0;

      // 🆕 Aktualizuj recentScores (ostatnie 10)
      const updatedRecentScores = [...(prev.recentScores || []), ...currentData.questionResults].slice(-10);

      // 🆕 Oblicz trend (konwersja 0/1 na 0%/100% dla calculateTrend)
      const scoresAsPercentages = updatedRecentScores.map(s => s * 100);
      const newTrend = calculateTrend(scoresAsPercentages);

      updatedConceptPerformance[cid] = {
        conceptId: cid,
        conceptName: currentData.conceptName,
        totalQuestions: newTotalQuestions,
        correctAnswers: newCorrectAnswers,
        accuracy: newAccuracy,
        suggestedDifficulty: determineDifficulty(newAccuracy),
        lastTested: new Date().toISOString(),
        recentScores: updatedRecentScores,  // 🆕
        trend: newTrend  // 🆕
      };
    } else {
      // New concept
      updatedConceptPerformance[cid] = {
        conceptId: cid,
        conceptName: currentData.conceptName,
        totalQuestions: currentData.totalQuestions,
        correctAnswers: currentData.correctAnswers,
        accuracy: currentData.accuracy,
        suggestedDifficulty: determineDifficulty(currentData.accuracy),
        lastTested: new Date().toISOString(),
        recentScores: currentData.questionResults.slice(-10),  // 🆕
        trend: 0  // 🆕 Brak trendu dla nowego konceptu
      };
    }
  }

  // Update recent questions
  const existingRecent = previousCumulative.recentQuestions || [];
  const newRecent = currentTestQuestions
    .filter(q => q.question && q.questionId)
    .map(q => ({
      text: q.question,
      conceptId: q.conceptId || 'unknown',
      questionId: q.questionId
    }));

  const combinedRecent = [...existingRecent, ...newRecent].slice(-10);

  // 🆕 Aktualizuj recentTestScores (ostatnie 10 testów)
  const updatedRecentTestScores = [
    ...(previousCumulative.recentTestScores || []),
    currentTestAccuracy
  ].slice(-10);

  // 🆕 Oblicz trend ogólny
  const updatedOverallTrend = calculateTrend(updatedRecentTestScores);

  // Calculate totals
  const newTotalTests = previousCumulative.totalTests + 1;
  const newTotalQuestions = previousCumulative.totalQuestions + currentTotal;
  const newTotalCorrectAnswers = previousCumulative.totalCorrectAnswers + currentCorrect;
  const newOverallAccuracy = newTotalQuestions > 0 
    ? (newTotalCorrectAnswers / newTotalQuestions) * 100 
    : 0;

  return {
    totalTests: newTotalTests,
    totalQuestions: newTotalQuestions,
    totalCorrectAnswers: newTotalCorrectAnswers,
    overallAccuracy: newOverallAccuracy,
    conceptPerformance: updatedConceptPerformance,
    recentQuestions: combinedRecent,
    recentTestScores: updatedRecentTestScores,  // 🆕
    overallTrend: updatedOverallTrend  // 🆕
  };
}

/**
 * Creates an empty cumulative performance object
 */
export function createEmptyCumulativePerformance(): CumulativePerformance {
  return {
    totalTests: 0,
    totalQuestions: 0,
    totalCorrectAnswers: 0,
    overallAccuracy: 0,
    conceptPerformance: {},
    recentQuestions: [],
    recentTestScores: [],  // 🆕
    overallTrend: 0  // 🆕
  };
}