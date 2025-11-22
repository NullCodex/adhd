'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';

const questions = [
  "How often do you have trouble wrapping up the final details of a project, once the challenging parts have been done?",
  "How often do you have difficulty getting things in order when you have to do a task that requires organization?",
  "How often do you have problems remembering appointments or obligations?",
  "When you have a task that requires a lot of thought, how often do you avoid or delay getting started?",
  "How often do you fidget or squirm with your hands or feet when you have to sit down for a long time?",
  "How often do you feel overly active and compelled to do things, like you were driven by a motor?",
  "How often do you make careless mistakes when you have to work on a boring or difficult project?",
  "How often do you have difficulty keeping your attention when you are doing boring or repetitive work?",
  "How often do you have difficulty concentrating on what people say to you, even when they are speaking to you directly?",
  "How often do you misplace or have difficulty finding things at home or at work?",
  "How often are you distracted by activity or noise around you?",
  "How often do you leave your seat in meetings or other situations in which you are expected to remain seated?",
  "How often do you feel restless or fidgety?",
  "How often do you have difficulty unwinding and relaxing when you have time to yourself?",
  "How often do you find yourself talking too much when you are in social situations?",
  "When you're in a conversation, how often do you find yourself finishing the sentences of the people you are talking to, before they can finish them themselves?",
  "How often do you have difficulty waiting your turn in situations when turn taking is required?",
  "How often do you interrupt others when they are busy?",
];

const options = [
  { value: 'never', label: 'Never' },
  { value: 'rarely', label: 'Rarely' },
  { value: 'sometimes', label: 'Sometimes' },
  { value: 'often', label: 'Often' },
  { value: 'very_often', label: 'Very Often' },
];

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
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);

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
            ADHD Assessment Results
          </h1>
          
          {/* Part A Results */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-gray-200">
              Part A Results (Questions 1-6)
            </h2>
            <div className="mb-4">
              <p className="text-lg text-gray-700 dark:text-gray-300 mb-2">
                Dark shaded responses: <span className="font-bold text-blue-600 dark:text-blue-400">{scores.partADarkShadedCount} out of 6</span>
              </p>
              {scores.indicatesADHD ? (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 p-4 rounded">
                  <p className="text-lg font-semibold text-yellow-800 dark:text-yellow-200">
                    ⚠️ Symptoms Highly Consistent with ADHD
                  </p>
                  <p className="text-yellow-700 dark:text-yellow-300 mt-2">
                    Four or more marks appear in the darkly shaded boxes within Part A. This indicates symptoms highly consistent with ADHD in adults and further investigation is warranted.
                  </p>
                </div>
              ) : (
                <div className="bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 p-4 rounded">
                  <p className="text-lg font-semibold text-green-800 dark:text-green-200">
                    ✓ Fewer than 4 dark shaded responses in Part A
                  </p>
                  <p className="text-green-700 dark:text-green-300 mt-2">
                    The screening results do not indicate a high likelihood of ADHD symptoms based on Part A responses.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Part B Results */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-gray-200">
              Part B Results (Questions 7-18)
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-2">
              Dark shaded responses: <span className="font-bold text-blue-600 dark:text-blue-400">{scores.partBDarkShadedCount} out of 12</span>
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 italic">
              The frequency scores on Part B provide additional cues and can serve as further probes into the patient's symptoms. Pay particular attention to marks appearing in the dark shaded boxes. No total score or diagnostic likelihood is utilized for the twelve questions.
            </p>
          </div>

          {/* Detailed Results */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-gray-200">
              Detailed Responses
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
                          Q{index + 1} {isPartA ? '(Part A)' : '(Part B)'}:
                        </span>
                        <span className="text-gray-800 dark:text-gray-200">{question}</span>
                      </div>
                      {isDark && (
                        <span className="ml-4 px-2 py-1 bg-yellow-500 text-yellow-900 text-xs font-bold rounded">
                          DARK SHADED
                        </span>
                      )}
                    </div>
                    <div className="mt-2">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Your response: <span className={`font-semibold ${isDark ? 'text-yellow-800 dark:text-yellow-200' : 'text-gray-800 dark:text-gray-200'}`}>
                          {answer ? options.find(opt => opt.value === answer)?.label : 'Not answered'}
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
              onClick={() => router.push('/')}
              className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Back to Home
            </button>
            <button
              onClick={() => {
                setAnswers({});
                setIsSubmitted(false);
              }}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Retake Assessment
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
            ADHD Assessment
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Please answer all 18 questions based on how often you experience each situation.
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
                    Question {index + 1}:
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
                onClick={() => router.push('/')}
                className="px-6 py-3 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 transition-colors shadow-md hover:shadow-lg"
              >
                Back to Home
              </button>
              <p className="text-sm text-gray-600 dark:text-gray-400 flex-1 text-center">
                {Object.keys(answers).length} of {questions.length} questions answered
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
                Submit Assessment
              </button>
            </div>
          </div>
        </form>
      </div>
    </main>
  );
}

