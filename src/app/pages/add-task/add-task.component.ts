
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Firestore, collection, addDoc, CollectionReference, DocumentData } from '@angular/fire/firestore';


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

  error = '';
  success = '';

  private tasksCol: CollectionReference<DocumentData>;

  constructor(private firestore: Firestore) {
    this.tasksCol = collection(this.firestore, 'tasks');
  }

  setPriority(p: 'urgent' | 'medium' | 'low') {
    this.priority = p;
  }

  removeSubtask(idx: number) {
    this.subtasks.splice(idx, 1);
  }

  async onSubmit() {
    this.error = '';
    this.success = '';
    // Validierung
    if (!this.title.trim()) {
      this.error = 'Title is required.';
      return;
    }
    if (!this.dueDate.trim()) {
      this.error = 'Due date is required.';
      return;
    }
    if (!this.category.trim()) {
      this.error = 'Category is required.';
      return;
    }
    try {
      await addDoc(this.tasksCol, {
        title: this.title.trim(),
        description: this.description.trim(),
        dueDate: this.dueDate.trim(),
        priority: this.priority,
        assignedTo: this.assignedTo,
        category: this.category.trim(),
        subtasks: this.subtasks,
        createdAt: new Date().toISOString(),
      });
      this.success = 'Task created!';
      this.title = '';
      this.description = '';
      this.dueDate = '';
      this.priority = 'medium';
      this.assignedTo = [];
      this.category = '';
      this.subtasks = [];
    } catch (e) {
      this.error = 'Error saving task.';
    }
  }
}
