
interface StudentReportPrintProps {
  student: {
    firstName: string;
    lastName: string;
    school: string;
    examYear: number;
    group: string;
  };
  stats: {
    averageScore: number;
    classRank: number;
    totalStudents: number;
  };
  quizResults: {
    quizTitle: string;
    date: string;
    score: number;
    maxScore: number;
    percentage: number;
  }[];
}

export function StudentReportPrint({ student, stats, quizResults }: StudentReportPrintProps) {
  return (
    <div className="hidden print:block fixed inset-0 bg-white text-black p-10 z-[9999] print:bg-white overflow-auto font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center border-b-2 border-black pb-6">
          <h1 className="text-4xl font-bold uppercase tracking-wider mb-2">Accounting with Asela</h1>
          <p className="text-xl text-gray-600">Student Progress Report</p>
        </div>

        {/* Student Info */}
        <div className="grid grid-cols-2 gap-6 p-6 bg-gray-50 border border-gray-200 rounded-lg">
          <div>
            <p className="text-sm text-gray-500 uppercase tracking-wider mb-1">Student Name</p>
            <p className="text-xl font-bold">{student.firstName} {student.lastName}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 uppercase tracking-wider mb-1">Group / Grade</p>
            <p className="text-xl font-bold">{student.group} (A/L {student.examYear})</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 uppercase tracking-wider mb-1">School</p>
            <p className="text-lg font-medium">{student.school}</p>
          </div>
          <div className="flex space-x-12">
            <div>
              <p className="text-sm text-gray-500 uppercase tracking-wider mb-1">Average Score</p>
              <p className="text-2xl font-bold text-green-700">{stats.averageScore.toFixed(1)}%</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 uppercase tracking-wider mb-1">Class Rank</p>
              <p className="text-2xl font-bold text-blue-700">#{stats.classRank} <span className="text-lg text-gray-500 font-medium">/ {stats.totalStudents}</span></p>
            </div>
          </div>
        </div>

        {/* Quiz Results Table */}
        <div>
          <h3 className="text-2xl font-bold mb-4">Quiz Performance</h3>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-2 border-black">
                <th className="py-3 px-4 font-bold uppercase text-sm tracking-wider w-1/2">Quiz Title</th>
                <th className="py-3 px-4 font-bold uppercase text-sm tracking-wider">Date</th>
                <th className="py-3 px-4 font-bold uppercase text-sm tracking-wider text-right">Score</th>
                <th className="py-3 px-4 font-bold uppercase text-sm tracking-wider text-right">Percentage</th>
              </tr>
            </thead>
            <tbody>
              {quizResults.map((result, idx) => (
                <tr key={idx} className="border-b border-gray-200">
                  <td className="py-4 px-4 font-medium">{result.quizTitle}</td>
                  <td className="py-4 px-4 text-gray-600">{new Date(result.date).toLocaleDateString()}</td>
                  <td className="py-4 px-4 text-right">{result.score} / {result.maxScore}</td>
                  <td className="py-4 px-4 text-right font-bold">{result.percentage.toFixed(1)}%</td>
                </tr>
              ))}
              {quizResults.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-gray-500">No quiz attempts recorded yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer & Signature */}
        <div className="mt-16 pt-16 flex justify-between items-end">
          <div>
            <p className="text-sm font-bold text-gray-600 uppercase tracking-wider">Prepared By</p>
            <p className="text-lg font-medium mt-1">Asela Samanpriya</p>
            <p className="text-gray-500">Paradise of Accounting</p>
            <p className="text-gray-400 text-sm mt-1">Date: {new Date().toLocaleDateString()}</p>
          </div>
          <div className="w-64">
            <div className="border-b border-black mb-2 h-16"></div>
            <p className="text-center text-gray-500 text-sm uppercase tracking-wider">Teacher Signature</p>
          </div>
        </div>
      </div>
    </div>
  );
}
