import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';


@Component({
  selector: 'app-add-task',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './add-task.component.html',
  styleUrls: ['./add-task.component.scss']
})
export class AddTaskComponent {
  // Form fields
  title = '';
  description = '';
  dueDate = '';
  priority: 'urgent' | 'medium' | 'low' = 'medium';
  assignedTo: string[] = [];
  category = '';
  subtasks: string[] = ['Clear'];

  // Priority button logic
  setPriority(p: 'urgent' | 'medium' | 'low') {
    this.priority = p;
  }

  // Subtask logic (Platzhalter)
  removeSubtask(idx: number) {
    this.subtasks.splice(idx, 1);
  }

  // Submit
  onSubmit() {
    // Hier später: Validierung, Firestore, Navigation etc.
    alert('Task created! (Demo)');
  }
}
