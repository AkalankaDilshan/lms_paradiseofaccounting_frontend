export function TeacherDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-primary">Teacher Dashboard</h1>
        <p className="text-muted-foreground mt-1">Overview of your classes and recent activity.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Placeholder stats */}
        <div className="p-6 bg-card border rounded-lg">
          <h3 className="font-semibold text-lg text-muted-foreground mb-2">Total Students</h3>
          <p className="text-3xl font-bold">142</p>
        </div>
        <div className="p-6 bg-card border rounded-lg">
          <h3 className="font-semibold text-lg text-muted-foreground mb-2">Active Quizzes</h3>
          <p className="text-3xl font-bold">3</p>
        </div>
        <div className="p-6 bg-card border rounded-lg">
          <h3 className="font-semibold text-lg text-muted-foreground mb-2">Questions Bank</h3>
          <p className="text-3xl font-bold">450</p>
        </div>
      </div>
    </div>
  );
}
