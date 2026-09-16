import MockAdapter from 'axios-mock-adapter';
import type { AxiosInstance } from 'axios';

export const setupMockAdapter = (axiosInstance: AxiosInstance) => {
  const mock = new MockAdapter(axiosInstance, { delayResponse: 500 });

  // ============================================================
  // 1. Quizzes List — Backend returns raw array (not { items: [] })
  // ============================================================
  mock.onGet('/quizzes').reply(200, [
    {
      quizId: 'quiz-1',
      title: 'ගිණුම්කරණ මූලධර්ම — Paper 1', // Accounting Principles Paper 1
      allowedGroups: ['G13-HATTON', 'G13-GINIGATHHENA'],
      openAt: new Date().toISOString(),
      closeAt: new Date(Date.now() + 86400000).toISOString(),
      durationMinutes: 30,
      maxAttempts: 3,
      archived: false,
    },
    {
      quizId: 'quiz-2',
      title: 'උසස් ලෙජර් ඇතුළත් කිරීම් — Paper 2', // Advanced Ledger Entries
      allowedGroups: ['G12-HATTON'],
      openAt: new Date().toISOString(),
      closeAt: new Date(Date.now() + 86400000 * 2).toISOString(),
      durationMinutes: 45,
      maxAttempts: 1,
      archived: false,
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
    score: 2,
    maxScore: 3,
    percentage: 67,
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

  // ============================================================
  // 6. Trend — keyed by sub (UUID-style ID)
  // ============================================================
  mock.onGet(/\/analytics\/students\/[^/]+\/trend/).reply(200, {
    items: [
      { quizId: 'quiz-1', quizTitle: 'ගිණුම්කරණ Paper 1', score: 60, maxScore: 100, submittedAt: '2026-09-10T10:00:00Z' },
      { quizId: 'quiz-2', quizTitle: 'ගිණුම්කරණ Paper 2', score: 85, maxScore: 100, submittedAt: '2026-09-12T10:00:00Z' },
      { quizId: 'quiz-3', quizTitle: 'ගිණුම්කරණ Paper 3', score: 100, maxScore: 100, submittedAt: '2026-09-14T10:00:00Z' },
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
        correctAnswerIndex: 0,
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
        correctAnswerIndex: 0,
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
        correctAnswerIndex: 0,
        explanation: 'SLM = (ලබා ගත් මිල - ශේෂ අගය) / ප්‍රයෝජනවත් ජීවිතය.',
        tags: ['Depreciation', 'Grade 13'],
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
        examYear: 2026,
        address: 'Hatton',
        role: 'Student',
        status: 'active',
        verificationStatus: 'auto_approved',
        groups: ['G13-HATTON'],
      },
      {
        userId: 'u2',
        firstName: 'Nimal', lastName: 'Silva',
        email: 'nimal@student.lk',
        phone: '+94779876543',
        school: 'Nawalapitiya MMV',
        examYear: 2026,
        address: 'Nawalapitiya',
        role: 'Student',
        status: 'active',
        verificationStatus: 'auto_approved',
        groups: ['G13-NAWALAPITIYA'],
      },
      {
        userId: 'u3',
        firstName: 'Sanduni', lastName: 'Fernando',
        email: 'sanduni@student.lk',
        phone: '+94765432109',
        school: 'Ginigathhena Central College',
        examYear: 2027,
        address: 'Ginigathhena',
        role: 'Student',
        status: 'active',
        verificationStatus: 'pending_review',
        groups: ['G12-GINIGATHHENA'],
      },
    ],
  });
  mock.onGet(/\/admin\/students\/[^/]+/).reply(200, {
    userId: 'demo-student-sub',
    firstName: 'Akalanka', lastName: 'Dilshan',
    email: 'akalanka@student.lk',
    phone: '+94771234567',
    school: 'Hatton National College',
    examYear: 2026,
    address: '123 Main St, Hatton',
    role: 'Student',
    status: 'active',
    verificationStatus: 'auto_approved',
    groups: ['G13-HATTON'],
  });
  mock.onPost('/admin/students').reply(201, { userId: 'u-new', success: true });
  mock.onPut(/\/admin\/students\/[^/]+/).reply(200, { updated: true });
  mock.onDelete(/\/admin\/students\/[^/]+/).reply(200, { suspended: true });
  mock.onPost(/\/admin\/students\/[^/]+\/groups/).reply(200, { added: true });
  mock.onDelete(/\/admin\/students\/[^/]+\/groups\/[^/]+/).reply(200, { removed: true });
  mock.onPost('/admin/students/csv').reply(200, {
    total: 5, imported: 4, failed: 1,
    errors: [{ row: 3, error: 'Invalid email format' }],
  });

  // ============================================================
  // 9. Announcements
  // ============================================================
  mock.onGet('/announcements').reply(200, {
    items: [
      {
        announcementId: 'ann-1',
        title: 'Grade 13 — October Paper Schedule',
        body: 'ඔක්තෝබර් මාසයේ ප්‍රශ්නාවලිය දිනය නිවේදනය කෙරේ. Grade 13 Hatton group September 28 ට සූදානම් වන්න.',
        targetGroups: ['G13-HATTON', 'G13-NAWALAPITIYA', 'G13-GINIGATHHENA'],
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
        title: 'Grade 12 — Partnership Accounts Chapter Complete',
        body: 'Grade 12 students: Partnership accounts chapter is now complete. Please review your notes and attempt the practice quiz.',
        targetGroups: ['G12-HATTON', 'G12-NAWALAPITIYA', 'G12-GINIGATHHENA'],
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
        userId: 'u1', firstName: 'Kasun', lastName: 'Perera', group: 'G13-HATTON',
        currentMonth: { status: 'paid', paidAt: '2026-09-05T10:00:00Z', amount: 2500 },
        history: [
          { month: '2026-09', status: 'paid' },
          { month: '2026-08', status: 'paid' },
          { month: '2026-07', status: 'overdue' },
        ]
      },
      {
        userId: 'u2', firstName: 'Nimal', lastName: 'Silva', group: 'G13-NAWALAPITIYA',
        currentMonth: { status: 'pending', paidAt: null, amount: 2500 },
        history: [
          { month: '2026-09', status: 'pending' },
          { month: '2026-08', status: 'paid' },
          { month: '2026-07', status: 'paid' },
        ]
      },
      {
        userId: 'u3', firstName: 'Sanduni', lastName: 'Fernando', group: 'G12-GINIGATHHENA',
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
        targetGroups: ['G13-HATTON', 'G13-GINIGATHHENA'],
        fileKey: 'https://example.com/materials/partnership-notes.pdf',
        fileType: 'pdf', fileSizeBytes: 2048000, tags: ['Partnership', 'Grade 13'],
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
        targetGroups: ['G12-HATTON', 'G12-NAWALAPITIYA', 'G12-GINIGATHHENA'],
        fileKey: 'https://example.com/materials/depreciation-ref.pdf',
        fileType: 'pdf', fileSizeBytes: 512000, tags: ['Depreciation', 'Grade 12'],
        createdAt: '2026-09-08T08:00:00Z',
      },
    ]
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
  mock.onGet(/\/attendance/).reply(200, {
    date: '2026-09-16',
    groupId: 'G13-HATTON',
    records: { 'u1': 'present', 'u2': 'absent', 'u3': 'present' }
  });
  mock.onPost('/attendance').reply(201, { saved: true });
  mock.onGet(/\/attendance\/reports/).reply(200, {
    items: [
      { userId: 'u1', firstName: 'Kasun', lastName: 'Perera', attendancePercentage: 92 },
      { userId: 'u2', firstName: 'Nimal', lastName: 'Silva', attendancePercentage: 78 },
    ]
  });

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
        targetGroups: ['G13-HATTON', 'G13-NAWALAPITIYA'],
      },
    ]
  });
  mock.onPost('/messages').reply(201, { messageId: 'msg-new', success: true });

  // Allow unmocked requests to pass through
  mock.onAny().passThrough();
};
