import MockAdapter from 'axios-mock-adapter';
import type { AxiosInstance } from 'axios';

export const setupMockAdapter = (axiosInstance: AxiosInstance) => {
  const mock = new MockAdapter(axiosInstance, { delayResponse: 500 });

  // ============================================================
  // 1. Quizzes List — Backend returns raw array (not { items: [] })
  // ============================================================
  const day = 86400000;
  const iso = (offsetMs: number) => new Date(Date.now() + offsetMs).toISOString();
  // One list serves both roles in demo mode: staff screens ignore the
  // student-only fields (state, attemptsUsed, bestScore…)
  mock.onGet('/quizzes').reply(200, [
    {
      quizId: 'quiz-1',
      title: 'ගිණුම්කරණ මූලධර්ම — Paper 1', // Accounting Principles Paper 1
      allowedGroups: ['2027-HATTON', '2027-GINIGATHHENA'],
      questionIds: ['ques_1', 'ques_2', 'ques_3'],
      openAt: iso(-day), closeAt: iso(day), durationMinutes: 30, maxAttempts: 3, archived: false,
      answersVisibility: 'immediate', questionCount: 3, state: 'open',
      attemptsUsed: 0, hasOpenAttempt: false, bestScore: null, bestMaxScore: null, lastAttemptId: null,
    },
    {
      quizId: 'quiz-2',
      title: 'උසස් ලෙජර් ඇතුළත් කිරීම් — Paper 2', // Advanced Ledger Entries
      allowedGroups: ['2027-HATTON'],
      questionIds: ['ques_1', 'ques_2'],
      openAt: iso(-2 * 3600000), closeAt: iso(10 * 3600000), durationMinutes: 45, maxAttempts: 2, archived: false,
      answersVisibility: 'afterClose', questionCount: 2, state: 'open',
      attemptsUsed: 1, hasOpenAttempt: true, bestScore: null, bestMaxScore: null, lastAttemptId: null,
    },
    {
      quizId: 'quiz-3',
      title: 'ක්ෂය කිරීම් — Revision Paper',
      allowedGroups: ['2027-HATTON'],
      questionIds: ['ques_1', 'ques_2', 'ques_3'],
      openAt: iso(3 * day), closeAt: iso(4 * day), durationMinutes: 60, maxAttempts: 1, archived: false,
      answersVisibility: 'immediate', questionCount: 3, state: 'upcoming',
      attemptsUsed: 0, hasOpenAttempt: false, bestScore: null, bestMaxScore: null, lastAttemptId: null,
    },
    {
      quizId: 'quiz-4',
      title: 'හවුල් ව්‍යාපාර — Paper 1',
      allowedGroups: ['2027-HATTON'],
      questionIds: ['ques_1', 'ques_2', 'ques_3'],
      openAt: iso(-10 * day), closeAt: iso(-8 * day), durationMinutes: 30, maxAttempts: 2, archived: false,
      answersVisibility: 'immediate', questionCount: 3, state: 'closed',
      attemptsUsed: 1, hasOpenAttempt: false, bestScore: 2, bestMaxScore: 3, lastAttemptId: 'att_123',
    },
  ]);

  // ============================================================
  // 2. Start Attempt — correct question shape with options as objects
  // ============================================================
  mock.onPost(/\/quizzes\/[^/]+\/attempts/).reply(200, {
    attemptId: 'att_123',
    quizId: 'quiz-1',
    durationMinutes: 30,
    questions: [
      {
        questionId: 'ques_1',
        questionText: 'මූලික ගිණුම්කරණ සමීකරණය කුමක්ද?', // What is the basic accounting equation?
        options: [
          { index: 0, text: 'වත්කම් = වගකීම් + හිමිකම්' },  // Assets = Liabilities + Equity
          { index: 1, text: 'ආදායම් = වියදම්' },              // Revenue = Expenses
          { index: 2, text: 'ලාභය = විකුණුම්' },              // Profit = Sales
        ],
      },
      {
        questionId: 'ques_2',
        questionText: 'පහත සඳහන් දෑ අතුරින් වත්කමක් වන්නේ කුමක්ද?', // Which is an asset?
        options: [
          { index: 0, text: 'ණයගැතියන්' },   // Debtors
          { index: 1, text: 'ණයහිමියන්' },   // Creditors
          { index: 2, text: 'බැංකු අයිරාව' }, // Bank Overdraft
        ],
      },
      {
        questionId: 'ques_3',
        questionText: 'අවලංගු ණය ගිණුම්කරණ ලේඛනයේ ශේෂ ගිණුම කුමක්ද?', // Bad debt treatment?
        options: [
          { index: 0, text: 'ලාභ-අලාභ ගිණුමට හර කරනු ලැබේ' },
          { index: 1, text: 'ශේෂ පත්‍රයේ වත්කම් ලෙස දැක්වේ' },
          { index: 2, text: 'ණය ගිණුමෙන් ප්‍රතිනෙළා ගනී' },
        ],
      },
    ],
  });

  // ============================================================
  // 3. Submit Attempt
  // ============================================================
  mock.onPut(/\/quizzes\/[^/]+\/attempts\/[^/]+/).reply(200, {
    status: 'submitted',
    score: 2,
    maxScore: 3,
  });

  // ============================================================
  // 4. Results — correct shape with results array and correctAnswerText
  // ============================================================
  mock.onGet(/\/quizzes\/[^/]+\/attempts\/[^/]+\/results/).reply(200, {
    attemptId: 'att_123',
    quizTitle: 'හවුල් ව්‍යාපාර — Paper 1',
    score: 2,
    maxScore: 3,
    percentage: 66.7,
    submittedAt: new Date(Date.now() - 9 * day).toISOString(),
    answersReleased: true,
    answersReleaseAt: null,
    results: [
      {
        questionId: 'ques_1',
        questionText: 'මූලික ගිණුම්කරණ සමීකරණය කුමක්ද?',
        options: [
          { index: 0, text: 'වත්කම් = වගකීම් + හිමිකම්' },
          { index: 1, text: 'ආදායම් = වියදම්' },
          { index: 2, text: 'ලාභය = විකුණුම්' },
        ],
        givenAnswerIndex: 0,
        correctAnswerIndex: 0,
        correctAnswerText: 'වත්කම් = වගකීම් + හිමිකම්',
        isCorrect: true,
        explanation: 'වත්කම් යනු වගකීම් සහ හිමිකම් වල එකතුවයි.',
      },
      {
        questionId: 'ques_2',
        questionText: 'පහත සඳහන් දෑ අතුරින් වත්කමක් වන්නේ කුමක්ද?',
        options: [
          { index: 0, text: 'ණයගැතියන්' },
          { index: 1, text: 'ණයහිමියන්' },
          { index: 2, text: 'බැංකු අයිරාව' },
        ],
        givenAnswerIndex: 0,
        correctAnswerIndex: 0,
        correctAnswerText: 'ණයගැතියන්',
        isCorrect: true,
        explanation: 'ණයගැතියන් යනු ව්‍යාපාරයට මුදල් ගෙවීමට ඇති පාර්ශවයන් වන බැවින් එය වත්කමකි.',
      },
      {
        questionId: 'ques_3',
        questionText: 'අවලංගු ණය ගිණුම්කරණ ලේඛනයේ ශේෂ ගිණුම කුමක්ද?',
        options: [
          { index: 0, text: 'ලාභ-අලාභ ගිණුමට හර කරනු ලැබේ' },
          { index: 1, text: 'ශේෂ පත්‍රයේ වත්කම් ලෙස දැක්වේ' },
          { index: 2, text: 'ණය ගිණුමෙන් ප්‍රතිනෙළා ගනී' },
        ],
        givenAnswerIndex: 1,
        correctAnswerIndex: 0,
        correctAnswerText: 'ලාභ-අලාභ ගිණුමට හර කරනු ලැබේ',
        isCorrect: false,
        explanation: 'අවලංගු ණය ලාභ-අලාභ ගිණුමේ හර පැත්තේ සටහන් කෙරේ.',
      },
    ],
  });

  // ============================================================
  // 5. Leaderboard
  // ============================================================
  mock.onGet(/\/analytics\/quizzes\/[^/]+\/leaderboard/).reply(200, {
    leaderboard: [
      { rank: 1, firstName: 'Akalanka', score: 100 },
      { rank: 2, firstName: 'Kasun', score: 95 },
      { rank: 3, firstName: 'Nimal', score: 80 },
    ]
  });

  // Quiz analytics (STATS totals + per-question accuracy)
  mock.onGet(/\/analytics\/quizzes\/[^/]+$/).reply(200, {
    quizId: 'quiz-1',
    quizTitle: 'ගිණුම්කරණ මූලධර්ම — Paper 1',
    totalAttempts: 42,
    studentsAttempted: 38,
    averagePercentage: 71.4,
    perQuestion: [
      { position: 1, questionId: 'ques_1', questionText: 'මූලික ගිණුම්කරණ සමීකරණය කුමක්ද?', correct: 38, incorrect: 4, accuracy: 90.5 },
      { position: 2, questionId: 'ques_2', questionText: 'පහත සඳහන් දෑ අතුරින් වත්කමක් වන්නේ කුමක්ද?', correct: 29, incorrect: 13, accuracy: 69.0 },
      { position: 3, questionId: 'ques_3', questionText: 'ක්‍ෂය ගිනුම්කරණයේ සරල රේඛීය ක්‍රමයේ සූත්‍රය කුමක්ද?', correct: 17, incorrect: 25, accuracy: 40.5 },
    ],
  });

  // ============================================================
  // 6. Trend — keyed by sub (UUID-style ID)
  // ============================================================
  mock.onGet(/\/analytics\/students\/[^/]+\/trend/).reply(200, {
    items: [
      { attemptId: 'att_101', quizId: 'quiz-4', quizTitle: 'ගිණුම්කරණ Paper 1', score: 12, maxScore: 20, percentage: 60, submittedAt: '2026-08-20T10:00:00Z' },
      { attemptId: 'att_102', quizId: 'quiz-4', quizTitle: 'ගිණුම්කරණ Paper 2', score: 13, maxScore: 20, percentage: 65, submittedAt: '2026-08-30T10:00:00Z' },
      { attemptId: 'att_103', quizId: 'quiz-4', quizTitle: 'ගිණුම්කරණ Paper 3', score: 14, maxScore: 20, percentage: 70, submittedAt: '2026-09-05T10:00:00Z' },
      { attemptId: 'att_104', quizId: 'quiz-4', quizTitle: 'ගිණුම්කරණ Paper 4', score: 17, maxScore: 20, percentage: 85, submittedAt: '2026-09-10T10:00:00Z' },
      { attemptId: 'att_105', quizId: 'quiz-4', quizTitle: 'ගිණුම්කරණ Paper 5', score: 16, maxScore: 20, percentage: 80, submittedAt: '2026-09-12T10:00:00Z' },
      { attemptId: 'att_123', quizId: 'quiz-4', quizTitle: 'හවුල් ව්‍යාපාර — Paper 1', score: 19, maxScore: 20, percentage: 95, submittedAt: '2026-09-14T10:00:00Z' },
    ]
  });

  // ============================================================
  // 7. Questions (Question Bank)
  // ============================================================
  mock.onGet('/questions').reply(200, {
    items: [
      {
        questionId: 'ques_1',
        questionText: 'මූලික ගිණුම්කරණ සමීකරණය කුමක්ද?',
        options: [
          { index: 0, text: 'වත්කම් = වගකීම් + හිමිකම්' },
          { index: 1, text: 'ආදායම් = වියදම්' },
          { index: 2, text: 'ලාභය = විකුණුම්' },
        ],
        correctOptionIndex: 0,
        explanation: 'වත්කම් යනු වගකීම් සහ හිමිකම් වල එකතුවයි.',
        tags: ['Basic', 'Accounting Equation'],
        archived: false,
        createdAt: '2026-09-01T08:00:00Z',
      },
      {
        questionId: 'ques_2',
        questionText: 'පහත සඳහන් දෑ අතුරින් වත්කමක් වන්නේ කුමක්ද?',
        options: [
          { index: 0, text: 'ණයගැතියන්' },
          { index: 1, text: 'ණයහිමියන්' },
          { index: 2, text: 'බැංකු අයිරාව' },
        ],
        correctOptionIndex: 0,
        explanation: 'ණයගැතියන් යනු ව්‍යාපාරයට මුදල් ගෙවීමට ඇති පාර්ශවයන්.',
        tags: ['Assets', 'Basic'],
        archived: false,
        createdAt: '2026-09-02T08:00:00Z',
      },
      {
        questionId: 'ques_3',
        questionText: 'ක්‍ෂය ගිනුම්කරණයේ සරල රේඛීය ක්‍රමයේ සූත්‍රය කුමක්ද?', // SLM depreciation formula
        options: [
          { index: 0, text: '(Cost - Scrap) / Life' },
          { index: 1, text: 'Cost × Rate / 100' },
          { index: 2, text: 'Cost - Accumulated Depreciation' },
        ],
        correctOptionIndex: 0,
        explanation: 'SLM = (ලබා ගත් මිල - ශේෂ අගය) / ප්‍රයෝජනවත් ජීවිතය.',
        tags: ['Depreciation', '2027 Batch'],
        archived: false,
        createdAt: '2026-09-03T08:00:00Z',
      },
    ],
  });
  mock.onPost('/questions').reply(201, { questionId: 'ques_new', success: true });
  mock.onPut(/\/questions\/[^/]+/).reply(200, { updated: true });
  mock.onDelete(/\/questions\/[^/]+/).reply(200, { archived: true });

  // GET presigned URL for question image upload
  mock.onGet(/\/questions\/image-upload-url/).reply(200, {
    uploadUrl: 'https://mock-s3-presigned-url.example.com/put',
    imageKey: 'https://cdn.example.com/question-images/mock-image.jpg',
  });

  // ============================================================
  // 8. Students (Admin)
  // ============================================================
  mock.onGet('/admin/students').reply(200, {
    items: [
      {
        userId: 'u1',
        firstName: 'Kasun', lastName: 'Perera',
        email: 'kasun@student.lk',
        phone: '+94771234567',
        school: 'Hatton National College',
        examYear: 2027,
        center: 'HATTON',
        address: 'Hatton',
        role: 'Student',
        status: 'active',
        verificationStatus: 'auto_approved',
        groups: ['2027-HATTON'],
      },
      {
        userId: 'u2',
        firstName: 'Nimal', lastName: 'Silva',
        email: 'nimal@student.lk',
        phone: '+94779876543',
        school: 'Nawalapitiya MMV',
        examYear: 2027,
        center: 'NAWALAPITIYA',
        address: 'Nawalapitiya',
        role: 'Student',
        status: 'active',
        verificationStatus: 'auto_approved',
        groups: ['2027-NAWALAPITIYA'],
      },
      {
        userId: 'u3',
        firstName: 'Sanduni', lastName: 'Fernando',
        email: 'sanduni@student.lk',
        phone: '+94765432109',
        school: 'Ginigathhena Central College',
        examYear: 2028,
        center: 'GINIGATHHENA',
        address: 'Ginigathhena',
        role: 'Student',
        status: 'pending',
        verificationStatus: 'pending_review',
        groups: [],
      },
    ],
  });
  mock.onGet(/\/admin\/students\/[^/]+/).reply(200, {
    userId: 'demo-student-sub',
    firstName: 'Akalanka', lastName: 'Dilshan',
    email: 'akalanka@student.lk',
    phone: '+94771234567',
    school: 'Hatton National College',
    examYear: 2027,
    center: 'HATTON',
    address: '123 Main St, Hatton',
    role: 'Student',
    status: 'active',
    verificationStatus: 'auto_approved',
    groups: ['2027-HATTON'],
  });
  mock.onPost('/admin/students').reply(201, { userId: 'u-new', success: true });
  mock.onPut(/\/admin\/students\/[^/]+/).reply(200, { updated: true });
  mock.onDelete(/\/admin\/students\/[^/]+/).reply(200, { suspended: true });
  mock.onPost(/\/admin\/students\/[^/]+\/approve/).reply(200, { approved: true });
  mock.onPost(/\/admin\/students\/[^/]+\/groups/).reply(200, { added: true });
  mock.onDelete(/\/admin\/students\/[^/]+\/groups\/[^/]+/).reply(200, { removed: true });
  mock.onPost('/admin/students/csv').reply(200, {
    total: 2, created: 1, failed: 1,
    results: [
      { row: 1, email: 'new.student@example.com', status: 'created' },
      { row: 2, email: 'bad@example.com', status: 'failed', reason: 'Invalid phone number: 12' },
    ],
  });

  // ============================================================
  // 9. Announcements
  // ============================================================
  mock.onGet('/announcements').reply(200, {
    items: [
      {
        announcementId: 'ann-1',
        title: '2027 Batch — October Paper Schedule',
        body: 'ඔක්තෝබර් මාසයේ ප්‍රශ්නාවලිය දිනය නිවේදනය කෙරේ. 2027 Batch Hatton group September 28 ට සූදානම් වන්න.',
        targetGroups: ['2027-HATTON', '2027-NAWALAPITIYA', '2027-GINIGATHHENA'],
        isPinned: true,
        status: 'published',
        createdAt: '2026-09-14T08:00:00Z',
      },
      {
        announcementId: 'ann-2',
        title: 'Platform Update — New Study Materials Added',
        body: 'නව අධ්‍යයන ද්‍රව්‍ය resource library හි ලබා ගත හැකිය.',
        targetGroups: ['ALL'],
        isPinned: false,
        status: 'published',
        createdAt: '2026-09-12T10:00:00Z',
      },
      {
        announcementId: 'ann-3',
        title: '2028 Batch — Partnership Accounts Chapter Complete',
        body: '2028 Batch students: Partnership accounts chapter is now complete. Please review your notes and attempt the practice quiz.',
        targetGroups: ['2028-HATTON', '2028-NAWALAPITIYA', '2028-GINIGATHHENA'],
        isPinned: false,
        status: 'published',
        createdAt: '2026-09-10T09:00:00Z',
      },
    ]
  });
  mock.onPost('/announcements').reply(201, { announcementId: 'ann-new', success: true });
  mock.onPut(/\/announcements\/[^/]+/).reply(200, { updated: true });
  mock.onDelete(/\/announcements\/[^/]+/).reply(200, { deleted: true });

  // ============================================================
  // 10. Payments
  // ============================================================
  mock.onGet('/payments').reply(200, {
    items: [
      {
        userId: 'u1', firstName: 'Kasun', lastName: 'Perera', groups: ['2027-HATTON'],
        currentMonth: { status: 'paid', paidAt: '2026-09-05T10:00:00Z', amount: 2500 },
        history: [
          { month: '2026-09', status: 'paid' },
          { month: '2026-08', status: 'paid' },
          { month: '2026-07', status: 'overdue' },
        ]
      },
      {
        userId: 'u2', firstName: 'Nimal', lastName: 'Silva', groups: ['2027-NAWALAPITIYA'],
        currentMonth: { status: 'pending', paidAt: null, amount: 2500 },
        history: [
          { month: '2026-09', status: 'pending' },
          { month: '2026-08', status: 'paid' },
          { month: '2026-07', status: 'paid' },
        ]
      },
      {
        userId: 'u3', firstName: 'Sanduni', lastName: 'Fernando', groups: ['2028-GINIGATHHENA'],
        currentMonth: { status: 'overdue', paidAt: null, amount: 2500 },
        history: [
          { month: '2026-09', status: 'overdue' },
          { month: '2026-08', status: 'overdue' },
          { month: '2026-07', status: 'paid' },
        ]
      },
    ]
  });
  mock.onGet(/\/payments\/[^/]+/).reply(200, {
    userId: 'u1',
    firstName: 'Kasun', lastName: 'Perera',
    history: [
      { month: '2026-09', status: 'paid', amount: 2500, paidAt: '2026-09-05T10:00:00Z', note: '' },
      { month: '2026-08', status: 'paid', amount: 2500, paidAt: '2026-08-04T10:00:00Z', note: '' },
      { month: '2026-07', status: 'overdue', amount: 2500, paidAt: null, note: 'Reminded twice' },
      { month: '2026-06', status: 'paid', amount: 2500, paidAt: '2026-06-06T10:00:00Z', note: '' },
    ]
  });
  mock.onPut(/\/payments\/[^/]+\/[^/]+/).reply(200, { updated: true });

  // ============================================================
  // 11. Materials (Study Resources)
  // ============================================================
  mock.onGet('/materials').reply(200, {
    items: [
      {
        materialId: 'm1',
        title: 'Chapter 5 — Partnership Accounts Notes',
        description: 'සම්පූර්ණ සටහන් (Comprehensive notes in Sinhala)',
        targetGroups: ['2027-HATTON', '2027-GINIGATHHENA'],
        fileKey: 'https://example.com/materials/partnership-notes.pdf',
        fileType: 'pdf', fileSizeBytes: 2048000, tags: ['Partnership', '2027 Batch'],
        createdAt: '2026-09-10T08:00:00Z',
      },
      {
        materialId: 'm2',
        title: '2025 A/L Model Paper — Accounting',
        description: 'Official model paper with marking scheme',
        targetGroups: ['ALL'],
        fileKey: 'https://example.com/materials/2025-model-paper.pdf',
        fileType: 'pdf', fileSizeBytes: 1536000, tags: ['Model Paper', 'Exam Prep'],
        createdAt: '2026-09-01T08:00:00Z',
      },
      {
        materialId: 'm3',
        title: 'Depreciation Formulas Quick Reference',
        description: 'ක්ෂය ගිණුම්කරණ සූත්‍ර — Quick reference card',
        targetGroups: ['2028-HATTON', '2028-NAWALAPITIYA', '2028-GINIGATHHENA'],
        fileKey: 'https://example.com/materials/depreciation-ref.pdf',
        fileType: 'pdf', fileSizeBytes: 512000, tags: ['Depreciation', '2028 Batch'],
        createdAt: '2026-09-08T08:00:00Z',
      },
    ]
  });
  mock.onGet(/\/materials\/[^/]+\/download/).reply(200, {
    url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    expiresIn: 300,
  });
  mock.onPost('/materials').reply(201, { materialId: 'm-new', success: true });
  mock.onGet('/materials/upload-url').reply(200, {
    uploadUrl: 'https://mock-s3-presigned-url.example.com/put',
    fileKey: 'https://cdn.example.com/materials/new-file.pdf',
  });
  mock.onDelete(/\/materials\/[^/]+/).reply(200, { archived: true });

  // ============================================================
  // 12. Attendance
  // ============================================================
  // The report route first — /\/attendance/ would otherwise swallow it
  mock.onGet('/attendance/report').reply(200, {
    groupId: '2027-HATTON',
    month: '2026-09',
    dates: ['2026-09-02', '2026-09-09', '2026-09-16', '2026-09-23'],
    students: [
      { userId: 'u1', firstName: 'Kasun', lastName: 'Perera', present: 4, absent: 0, percentage: 100,
        days: { '2026-09-02': 'present', '2026-09-09': 'present', '2026-09-16': 'present', '2026-09-23': 'present' } },
      { userId: 'u2', firstName: 'Nimal', lastName: 'Silva', present: 2, absent: 2, percentage: 50,
        days: { '2026-09-02': 'present', '2026-09-09': 'absent', '2026-09-16': 'present', '2026-09-23': 'absent' } },
    ],
  });
  mock.onGet('/attendance').reply(200, {
    date: '2026-09-16',
    groupId: '2027-HATTON',
    records: { 'u1': 'present', 'u2': 'absent', 'u3': 'present' }
  });
  mock.onPost('/attendance').reply(201, { saved: true });

  // ============================================================
  // 13. Messages / Inbox
  // ============================================================
  mock.onGet('/messages').reply(200, {
    items: [
      {
        messageId: 'msg-1',
        subject: 'October Mock Exam — Important Dates',
        body: 'Dear students, the October mock exam schedule has been finalized. Please check the announcements page for full details.',
        fromUserId: 'demo-teacher-sub',
        sentAt: '2026-09-15T09:00:00Z',
        targetGroups: ['ALL'],
      },
      {
        messageId: 'msg-2',
        subject: 'Revision Class — This Saturday',
        body: 'ශිෂ්‍යයන්ට දැනුම් දෙනු ලැබේ: ඉදිරි සෙනසුරාදා ප.ව. 2ට revision class පවත්වනු ලැබේ.',
        fromUserId: 'demo-teacher-sub',
        sentAt: '2026-09-13T14:00:00Z',
        targetGroups: ['2027-HATTON', '2027-NAWALAPITIYA'],
      },
    ]
  });
  mock.onPost('/messages').reply(201, { messageId: 'msg-new', success: true });

  // ============================================================
  // 14. Staff overview + teaching team
  // ============================================================
  const months = Array.from({ length: 12 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - 11 + i, 1);
    return d.toISOString().slice(0, 7);
  });
  mock.onGet('/analytics/overview').reply(200, {
    students: { total: 58, active: 52, pending: 3, suspended: 3 },
    quizzes: { total: 24, open: 2, upcoming: 1 },
    attempts: { total: 612, last30Days: 96, studentsActiveLast30Days: 44, averagePercentage: 68.4, averagePercentageLast30Days: 72.1 },
    monthly: months.map((month, i) => ({ month, attempts: [12, 18, 25, 31, 22, 40, 46, 52, 61, 70, 84, 96][i], averagePercentage: [58, 61, 60, 63, 65, 64, 67, 69, 70, 71, 70, 72][i] })),
    recentAttempts: [
      { attemptId: 'r1', quizId: 'quiz-1', quizTitle: 'ගිණුම්කරණ මූලධර්ම — Paper 1', userId: 'u1', studentName: 'Kasun Perera', score: 18, maxScore: 20, percentage: 90, submittedAt: iso(-20 * 60000) },
      { attemptId: 'r2', quizId: 'quiz-1', quizTitle: 'ගිණුම්කරණ මූලධර්ම — Paper 1', userId: 'u2', studentName: 'Nimal Silva', score: 11, maxScore: 20, percentage: 55, submittedAt: iso(-65 * 60000) },
      { attemptId: 'r3', quizId: 'quiz-2', quizTitle: 'උසස් ලෙජර් ඇතුළත් කිරීම් — Paper 2', userId: 'u3', studentName: 'Sanduni Fernando', score: 7, maxScore: 20, percentage: 35, submittedAt: iso(-3 * 3600000) },
    ],
  });
  mock.onGet('/admin/tas').reply(200, {
    items: [
      { userId: 'ta1', firstName: 'Tharindu', lastName: 'Jayasinghe', email: 'tharindu@paradiseofaccounting.lk', phone: '+94771112223', role: 'TA', status: 'active', createdAt: '2026-01-10T08:00:00Z' },
      { userId: 'ta2', firstName: 'Ishara', lastName: 'Wickramasinghe', email: 'ishara@paradiseofaccounting.lk', phone: '', role: 'TA', status: 'suspended', createdAt: '2026-03-02T08:00:00Z' },
    ],
  });
  mock.onPost('/admin/tas').reply(201, { userId: 'ta-new' });
  mock.onDelete(/\/admin\/tas\/[^/]+/).reply(200, { suspended: true });
  mock.onPost(/\/admin\/(tas|students)\/[^/]+\/reactivate/).reply(200, { reactivated: true, status: 'active' });

  // Allow unmocked requests to pass through
  mock.onAny().passThrough();
};
