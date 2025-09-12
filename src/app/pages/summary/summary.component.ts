import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { UserService } from '../../shared/user.service';
import { 
  Firestore, 
  collection, 
  getDocs, 
  CollectionReference, 
  DocumentData 
} from '@angular/fire/firestore';
import { inject } from '@angular/core';

/**
 * Interface for Task data structure
 */
interface Task {
  id?: string;
  title: string;
  description: string;
  dueDate: string;
  priority: 'urgent' | 'medium' | 'low';
  assignedTo: string[];
  category: string;
  subtasks: string[];
  status: 'todo' | 'inprogress' | 'awaitfeedback' | 'done';
  createdAt: string;
  completedSubtasks?: string[];
}

/**
 * Interface for Contact data structure
 */
interface Contact {
  id?: string;
  name: string;
  email?: string;
  phone?: string;
  color?: string;
}

/**
 * Interface for Dashboard Statistics
 */
interface DashboardStats {
  totalTasks: number;
  todoTasks: number;
  inProgressTasks: number;
  awaitFeedbackTasks: number;
  doneTasks: number;
  urgentTasks: number;
  totalContacts: number;
  nextDeadline: string | null;
}

@Component({
  selector: 'app-summary',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './summary.component.html',
  styleUrls: ['./summary.component.scss'],
})
export class SummaryComponent implements OnInit, OnDestroy {
  private firestore = inject(Firestore);
  private tasksCol: CollectionReference<DocumentData>;
  private contactsCol: CollectionReference<DocumentData>;

  showGreeting = true;
  greeting = '';
  name = '';
  isLoading = true;
  
  // Dashboard data
  tasks: Task[] = [];
  contacts: Contact[] = [];
  stats: DashboardStats = {
    totalTasks: 0,
    todoTasks: 0,
    inProgressTasks: 0,
    awaitFeedbackTasks: 0,
    doneTasks: 0,
    urgentTasks: 0,
    totalContacts: 0,
    nextDeadline: null
  };

  constructor(public userService: UserService) {
    this.tasksCol = collection(this.firestore, 'tasks');
    this.contactsCol = collection(this.firestore, 'contacts');
  }

  async ngOnInit() {
    if (localStorage.getItem('join_greeting_show') === '1') {
      const user = this.userService.user();
      this.name = user?.displayName || user?.email?.split('@')[0] || '';
      this.greeting = this.getGreeting();
      
      // Load data in background while showing greeting
      this.loadDashboardData();
      
      setTimeout(() => {
        this.showGreeting = false;
        localStorage.removeItem('join_greeting_show');
      }, 2500);
    } else {
      this.showGreeting = false;
      await this.loadDashboardData();
    }
  }

  ngOnDestroy() {
    // Cleanup if needed
  }

  /**
   * Loads all dashboard data from Firestore
   */
  async loadDashboardData(): Promise<void> {
    try {
      this.isLoading = true;
      
      // Load tasks and contacts in parallel
      const [tasksSnapshot, contactsSnapshot] = await Promise.all([
        getDocs(this.tasksCol),
        getDocs(this.contactsCol)
      ]);

      // Process tasks
      this.tasks = tasksSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Task));

      // Process contacts
      this.contacts = contactsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Contact));

      // Calculate statistics
      this.calculateStats();
      
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Calculates dashboard statistics from loaded data
   */
  private calculateStats(): void {
    this.stats = {
      totalTasks: this.tasks.length,
      todoTasks: this.tasks.filter(t => t.status === 'todo').length,
      inProgressTasks: this.tasks.filter(t => t.status === 'inprogress').length,
      awaitFeedbackTasks: this.tasks.filter(t => t.status === 'awaitfeedback').length,
      doneTasks: this.tasks.filter(t => t.status === 'done').length,
      urgentTasks: this.tasks.filter(t => t.priority === 'urgent').length,
      totalContacts: this.contacts.length,
      nextDeadline: this.getNextDeadline()
    };
  }

  /**
   * Gets the next upcoming deadline
   */
  private getNextDeadline(): string | null {
    const upcomingTasks = this.tasks
      .filter(task => task.status !== 'done' && task.dueDate)
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
    
    if (upcomingTasks.length > 0) {
      const nextTask = upcomingTasks[0];
      const dueDate = new Date(nextTask.dueDate);
      return dueDate.toLocaleDateString('de-DE', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      });
    }
    
    return null;
  }

  /**
   * Gets appropriate greeting based on time of day
   */
  getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 5) return 'Gute Nacht';
    if (hour < 11) return 'Guten Morgen';
    if (hour < 17) return 'Guten Tag';
    if (hour < 22) return 'Guten Abend';
    return 'Gute Nacht';
  }

  /**
   * Gets completion percentage for progress indication
   */
  getCompletionPercentage(): number {
    if (this.stats.totalTasks === 0) return 0;
    return Math.round((this.stats.doneTasks / this.stats.totalTasks) * 100);
  }

  /**
   * Gets formatted current date for display
   */
  getCurrentDate(): string {
    return new Date().toLocaleDateString('de-DE', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
}
