import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';

export function QuizBuilder() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-primary">Quiz Builder</h1>
        <p className="text-muted-foreground mt-1">Create a new quiz and assign it to student groups.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quiz Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Quiz Title</Label>
            <Input placeholder="e.g., Chapter 1: Introduction to Accounting" />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Duration (Minutes)</Label>
              <Input type="number" placeholder="30" />
            </div>
            <div className="space-y-2">
              <Label>Max Attempts</Label>
              <Input type="number" placeholder="3" />
            </div>
          </div>

          <div className="space-y-2 pt-4">
            <Label>Schedule (Open/Close window)</Label>
            {/* Calendar component would go here */}
            <div className="p-4 border border-dashed rounded-md text-center text-muted-foreground text-sm">
              Calendar Picker Component
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <Button>Save Quiz</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
