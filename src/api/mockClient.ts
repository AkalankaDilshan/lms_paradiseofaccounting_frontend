import MockAdapter from 'axios-mock-adapter';
import type { AxiosInstance } from 'axios';

export const setupMockAdapter = (axiosInstance: AxiosInstance) => {
  const mock = new MockAdapter(axiosInstance, { delayResponse: 500 });

  // 1. Quizzes List
  mock.onGet('/quizzes').reply(200, {
    items: [
      {
        id: 'q1',
        title: 'Accounting Principles Quiz 1',
        openAt: new Date().toISOString(),
        closeAt: new Date(Date.now() + 86400000).toISOString(),
        duration: 30,
        maxAttempts: 3,
        attemptsUsed: 0,
      },
      {
        id: 'q2',
        title: 'Advanced Ledger Entries',
        openAt: new Date().toISOString(),
        closeAt: new Date(Date.now() + 86400000 * 2).toISOString(),
        duration: 45,
        maxAttempts: 1,
        attemptsUsed: 1,
      },
    ],
  });

  // 2. Start Attempt
  mock.onPost(/\/quizzes\/[^/]+\/attempts/).reply(200, {
    attemptId: 'att_123',
    quizId: 'q1',
    status: 'in_progress',
    questions: [
      {
        id: 'ques_1',
        text: 'මූලික ගිණුම්කරණ සමීකරණය කුමක්ද?', // What is the basic accounting equation?
        options: ['වත්කම් = වගකීම් + හිමිකම්', 'ආදායම් = වියදම්', 'ලාභය = විකුණුම්'], // Assets = Liabilities + Equity
      },
      {
        id: 'ques_2',
        text: 'පහත සඳහන් දෑ අතුරින් වත්කමක් වන්නේ කුමක්ද?', // Which of the following is an asset?
        options: ['ණයගැතියන්', 'ණයහිමියන්', 'බැංකු අයිරාව'], // Debtors, Creditors, Bank Overdraft
      }
    ],
  });

  // 3. Submit Attempt
  mock.onPut(/\/quizzes\/[^/]+\/attempts\/[^/]+/).reply(200, {
    status: 'submitted',
    score: 100,
    maxScore: 100,
  });

  // 4. Results Breakdown
  mock.onGet(/\/quizzes\/[^/]+\/attempts\/[^/]+\/results/).reply(200, {
    score: 100,
    maxScore: 100,
    breakdown: [
      {
        questionId: 'ques_1',
        text: 'මූලික ගිණුම්කරණ සමීකරණය කුමක්ද?',
        studentAnswer: 'වත්කම් = වගකීම් + හිමිකම්',
        correctAnswer: 'වත්කම් = වගකීම් + හිමිකම්',
        isCorrect: true,
        explanation: 'වත්කම් යනු වගකීම් සහ හිමිකම් වල එකතුවයි.', // Assets are the sum of liabilities and equity.
      },
      {
        questionId: 'ques_2',
        text: 'පහත සඳහන් දෑ අතුරින් වත්කමක් වන්නේ කුමක්ද?',
        studentAnswer: 'ණයගැතියන්',
        correctAnswer: 'ණයගැතියන්',
        isCorrect: true,
        explanation: 'ණයගැතියන් යනු ව්‍යාපාරයට මුදල් ගෙවීමට ඇති පාර්ශවයන් වන බැවින් එය වත්කමකි.',
      }
    ]
  });

  // 5. Leaderboard
  mock.onGet(/\/analytics\/quizzes\/[^/]+\/leaderboard/).reply(200, {
    leaderboard: [
      { rank: 1, firstName: 'Akalanka', score: 100 },
      { rank: 2, firstName: 'Kasun', score: 95 },
      { rank: 3, firstName: 'Nimal', score: 80 },
    ]
  });

  // 6. Trend
  mock.onGet(/\/analytics\/students\/[^/]+\/trend/).reply(200, {
    items: [
      { quizId: 'q1', quizTitle: 'Quiz 1', score: 60, maxScore: 100, submittedAt: '2026-09-10T10:00:00Z' },
      { quizId: 'q2', quizTitle: 'Quiz 2', score: 85, maxScore: 100, submittedAt: '2026-09-12T10:00:00Z' },
      { quizId: 'q3', quizTitle: 'Quiz 3', score: 100, maxScore: 100, submittedAt: '2026-09-14T10:00:00Z' },
    ]
  });

  // Allow unmocked requests to pass through
  mock.onAny().passThrough();
};
