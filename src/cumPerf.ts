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
 * Extracts concept performance from a list of questions
 */
export function extractConceptPerformance(questions: TestQuestion[]): Record<string, {
  conceptName: string;
  totalQuestions: number;
  correctAnswers: number;
  accuracy: number;
}> {
  const conceptMap: Record<string, {
    conceptName: string;
    totalQuestions: number;
    correctAnswers: number;
    accuracy: number;
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
        accuracy: 0
      };
    }

    conceptMap[cid].totalQuestions += 1;

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
        lastTested: new Date().toISOString()
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
      .slice(-10); // Last 10

    const totalCorrect = currentTestQuestions.filter(q => q.isCorrect === true).length;
    const totalQuestions = currentTestQuestions.length;

    return {
      totalTests: 1,
      totalQuestions: totalQuestions,
      totalCorrectAnswers: totalCorrect,
      overallAccuracy: totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0,
      conceptPerformance,
      recentQuestions
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

      updatedConceptPerformance[cid] = {
        conceptId: cid,
        conceptName: currentData.conceptName,
        totalQuestions: newTotalQuestions,
        correctAnswers: newCorrectAnswers,
        accuracy: newAccuracy,
        suggestedDifficulty: determineDifficulty(newAccuracy),
        lastTested: new Date().toISOString()
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
        lastTested: new Date().toISOString()
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

  const combinedRecent = [...existingRecent, ...newRecent].slice(-10); // Keep last 10

  // Calculate totals
  const newTotalTests = previousCumulative.totalTests + 1;
  const currentCorrect = currentTestQuestions.filter(q => q.isCorrect === true).length;
  const currentTotal = currentTestQuestions.length;
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
    recentQuestions: combinedRecent
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
    recentQuestions: []
  };
}