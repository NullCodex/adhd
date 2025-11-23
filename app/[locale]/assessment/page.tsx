'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';

// Determine if an answer is "dark shaded" based on question index
const isDarkShaded = (questionIndex: number, answer: string): boolean => {
  if (!answer) return false;
  
  // Questions 1-3 (index 0-2): dark shaded = sometimes to very_often
  if (questionIndex >= 0 && questionIndex <= 2) {
    return ['sometimes', 'often', 'very_often'].includes(answer);
  }
  
  // Questions 4-6 (index 3-5): dark shaded = often to very_often
  if (questionIndex >= 3 && questionIndex <= 5) {
    return ['often', 'very_often'].includes(answer);
  }
  
  // Questions 7-8 (index 6-7): dark shaded = often to very_often
  if (questionIndex >= 6 && questionIndex <= 7) {
    return ['often', 'very_often'].includes(answer);
  }
  
  // Questions 9, 12, 16, 18 (index 8, 11, 15, 17): dark shaded = sometimes to very_often
  if ([8, 11, 15, 17].includes(questionIndex)) {
    return ['sometimes', 'often', 'very_often'].includes(answer);
  }
  
  // Rest of questions: dark shaded = often to very_often
  return ['often', 'very_often'].includes(answer);
};

export default function AssessmentPage() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('assessment');
  const tCommon = useTranslations('common');
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Get questions and options from translations
  const questions = t.raw('questions') as string[];
  const options = [
    { value: 'never', label: t('options.never') },
    { value: 'rarely', label: t('options.rarely') },
    { value: 'sometimes', label: t('options.sometimes') },
    { value: 'often', label: t('options.often') },
    { value: 'very_often', label: t('options.very_often') },
  ];

  const handleAnswerChange = (questionIndex: number, value: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionIndex]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
    // In production, send to analytics or backend instead of console.log
    if (process.env.NODE_ENV === 'development') {
      console.log('Assessment answers:', answers);
    }
  };

  const allQuestionsAnswered = questions.every((_, index) => answers[index] !== undefined);

  // Calculate scores
  const scores = useMemo(() => {
    // Part A: Questions 1-6 (index 0-5)
    const partAQuestions = [0, 1, 2, 3, 4, 5];
    const partADarkShadedCount = partAQuestions.filter(
      index => answers[index] && isDarkShaded(index, answers[index])
    ).length;
    
    // Part B: Questions 7-18 (index 6-17)
    const partBQuestions = [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17];
    const partBDarkShadedCount = partBQuestions.filter(
      index => answers[index] && isDarkShaded(index, answers[index])
    ).length;
    
    // Check if Part A indicates ADHD symptoms
    const indicatesADHD = partADarkShadedCount >= 4;
    
    return {
      partADarkShadedCount,
      partBDarkShadedCount,
      indicatesADHD,
    };
  }, [answers]);

  if (isSubmitted) {
    return (
      <main className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-6 text-center text-gray-900 dark:text-gray-100">
            {t('results.title')}
          </h1>
          
          {/* Part A Results */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-gray-200">
              {t('results.partA.title')}
            </h2>
            <div className="mb-4">
              <p className="text-lg text-gray-700 dark:text-gray-300 mb-2">
                {t('results.partA.darkShaded', { count: scores.partADarkShadedCount })}
              </p>
              {scores.indicatesADHD ? (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 p-4 rounded">
                  <p className="text-lg font-semibold text-yellow-800 dark:text-yellow-200">
                    {t('results.partA.consistent.title')}
                  </p>
                  <p className="text-yellow-700 dark:text-yellow-300 mt-2">
                    {t('results.partA.consistent.description')}
                  </p>
                </div>
              ) : (
                <div className="bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 p-4 rounded">
                  <p className="text-lg font-semibold text-green-800 dark:text-green-200">
                    {t('results.partA.notConsistent.title')}
                  </p>
                  <p className="text-green-700 dark:text-green-300 mt-2">
                    {t('results.partA.notConsistent.description')}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Part B Results */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-gray-200">
              {t('results.partB.title')}
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-2">
              {t('results.partB.darkShaded', { count: scores.partBDarkShadedCount })}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 italic">
              {t('results.partB.description')}
            </p>
          </div>

          {/* Detailed Results */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-gray-200">
              {t('results.detailed.title')}
            </h2>
            <div className="space-y-4">
              {questions.map((question, index) => {
                const answer = answers[index];
                const isDark = answer && isDarkShaded(index, answer);
                const isPartA = index < 6;
                
                return (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border-2 ${
                      isDark
                        ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-500 dark:border-yellow-600'
                        : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <span className="text-sm font-semibold text-blue-600 dark:text-blue-400 mr-2">
                          {t('question', { number: index + 1 })} {isPartA ? t('results.detailed.partA') : t('results.detailed.partB')}
                        </span>
                        <span className="text-gray-800 dark:text-gray-200">{question}</span>
                      </div>
                      {isDark && (
                        <span className="ml-4 px-2 py-1 bg-yellow-500 text-yellow-900 text-xs font-bold rounded">
                          {t('results.detailed.darkShaded')}
                        </span>
                      )}
                    </div>
                    <div className="mt-2">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {t('results.detailed.yourResponse')} <span className={`font-semibold ${isDark ? 'text-yellow-800 dark:text-yellow-200' : 'text-gray-800 dark:text-gray-200'}`}>
                          {answer ? options.find(opt => opt.value === answer)?.label : tCommon('notAnswered')}
                        </span>
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => router.push(`/${locale}`)}
              className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              {tCommon('backToHome')}
            </button>
            <button
              onClick={() => {
                setAnswers({});
                setIsSubmitted(false);
              }}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {tCommon('retakeAssessment')}
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 md:p-8 mb-6">
          <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-gray-100">
            {t('title')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {t('description')}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {questions.map((question, index) => (
            <div
              key={index}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6"
            >
              <div className="mb-4">
                <label className="block text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  <span className="text-blue-600 dark:text-blue-400 mr-2">
                    {t('question', { number: index + 1 })}
                  </span>
                  {question}
                </label>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
                {options.map((option) => (
                  <label
                    key={option.value}
                    className={`
                      flex items-center justify-center p-3 rounded-lg border-2 cursor-pointer transition-all
                      ${
                        answers[index] === option.value
                          ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                          : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 text-gray-700 dark:text-gray-300'
                      }
                    `}
                  >
                    <input
                      type="radio"
                      name={`question-${index}`}
                      value={option.value}
                      checked={answers[index] === option.value}
                      onChange={(e) => handleAnswerChange(index, e.target.value)}
                      className="sr-only"
                    />
                    <span className="text-sm font-medium">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 sticky bottom-4">
            <div className="flex items-center justify-between gap-4">
              <button
                onClick={() => router.push(`/${locale}`)}
                className="px-6 py-3 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 transition-colors shadow-md hover:shadow-lg"
              >
                {tCommon('backToHome')}
              </button>
              <p className="text-sm text-gray-600 dark:text-gray-400 flex-1 text-center">
                {tCommon('questionsAnswered', { count: Object.keys(answers).length, total: questions.length })}
              </p>
              <button
                type="submit"
                disabled={!allQuestionsAnswered}
                className={`
                  px-8 py-3 rounded-lg font-semibold transition-all
                  ${
                    allQuestionsAnswered
                      ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg hover:shadow-xl'
                      : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                  }
                `}
              >
                {tCommon('submitAssessment')}
              </button>
            </div>
          </div>
        </form>
      </div>
    </main>
  );
}

