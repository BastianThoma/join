import { Component, OnInit, OnDestroy, Injector, runInInjectionContext, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
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
 * Interface for Task data structure from Firestore
 * 
 * @interface Task
 */
interface Task {
  /** Unique identifier for the task */
  id?: string;
  /** Task title/name */
  title: string;
  /** Detailed description of the task */
  description: string;
  /** Due date in ISO string format */
  dueDate: string;
  /** Priority level of the task */
  priority: 'urgent' | 'medium' | 'low';
  /** Array of user IDs assigned to this task */
  assignedTo: string[];
  /** Category/type of the task */
  category: string;
  /** Array of subtask descriptions */
  subtasks: string[];
  /** Current status of the task */
  status: 'todo' | 'inprogress' | 'awaitfeedback' | 'done';
  /** Creation timestamp in ISO string format */
  createdAt: string;
  /** Array of completed subtask descriptions */
  completedSubtasks?: string[];
  /** Soft delete flag */
  deleted?: boolean;
}

/**
 * Interface for Contact data structure from Firestore
 * 
 * @interface Contact
 */
interface Contact {
  /** Unique identifier for the contact */
  id?: string;
  /** Full name of the contact */
  name: string;
  /** Email address (optional) */
  email?: string;
  /** Phone number (optional) */
  phone?: string;
  /** Assigned color for visual identification */
  color?: string;
}

/**
 * Interface for Dashboard Statistics
 * Aggregated data for dashboard display
 * 
 * @interface DashboardStats
 */
interface DashboardStats {
  /** Total number of tasks across all statuses */
  totalTasks: number;
  /** Number of tasks with 'todo' status */
  todoTasks: number;
  /** Number of tasks with 'inprogress' status */
  inProgressTasks: number;
  /** Number of tasks with 'awaitfeedback' status */
  awaitFeedbackTasks: number;
  /** Number of tasks with 'done' status */
  doneTasks: number;
  /** Number of tasks with 'urgent' priority */
  urgentTasks: number;
  /** Total number of contacts */
  totalContacts: number;
  /** Next upcoming deadline formatted as string, null if none */
  nextDeadline: string | null;
}

/**
 * SummaryComponent - Dashboard overview component
 * 
 * This component provides a comprehensive dashboard view showing:
 * - Task statistics and counts by status/priority
 * - Next upcoming deadline
 * - Personalized greeting animation
 * - Navigation to detailed views
 * 
 * Features:
 * - WCAG 2.1 AA compliant accessibility
 * - Real-time data loading from Firestore
 * - Responsive design with mobile-first approach
 * - Keyboard navigation support
 * - Screen reader optimization
 * - Performance optimized data loading
 * 
 * @class SummaryComponent
 * @implements {OnInit}
 * @implements {OnDestroy}
 * 
 * @author Join Development Team
 * @version 1.0.0
 * @since 2024
 */

@Component({
  selector: 'app-summary',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './summary.component.html',
  styleUrls: ['./summary.component.scss'],
})
export class SummaryComponent implements OnInit, OnDestroy {
  
  // === Private Service Injections ===
  
  /** Firestore database instance */
  private firestore = inject(Firestore);
  
  /** Angular Router for navigation */
  private router = inject(Router);

  /** Angular Injector for running Firebase calls in injection context */
  private injector = inject(Injector);
  
  /** Firestore collection reference for tasks */
  private tasksCol: CollectionReference<DocumentData>;
  
  /** Firestore collection reference for contacts */
  private contactsCol: CollectionReference<DocumentData>;

  // === Public Component Properties ===
  
  /** Controls greeting animation visibility */
  showGreeting = true;
  
  /** Personalized greeting text based on time of day */
  greeting = '';
  
  /** User's display name for greeting */
  name = '';
  
  /** Loading state indicator for UI feedback */
  isLoading = true;
  
  // === Dashboard Data Properties ===
  
  /** Array of all tasks loaded from Firestore */
  tasks: Task[] = [];
  
  /** Array of all contacts loaded from Firestore */
  contacts: Contact[] = [];
  
  /** Aggregated statistics for dashboard display */
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

  /**
   * Constructor - Initializes component dependencies
   * 
   * @param {UserService} userService - Service for user management and authentication
   */
  constructor(public userService: UserService) {
    this.tasksCol = collection(this.firestore, 'tasks');
    this.contactsCol = collection(this.firestore, 'contacts');
    
    // Reactive effect that updates user data when authentication state changes
    effect(() => {
      const user = this.userService.user();
      if (user) {
        this.name = user.displayName || user.email?.split('@')[0] || '';
        this.greeting = this.getGreeting();
      }
    });
  }

  /**
   * Component initialization lifecycle hook
   * Handles greeting animation and data loading based on user state
   * 
   * @async
   * @returns {Promise<void>}
   */
  async ngOnInit(): Promise<void> {
    // Load user data (effect in constructor will update when auth state changes)
    this.loadUserData();
    
    if (localStorage.getItem('join_greeting_show') === '1') {
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

  /**
   * Component cleanup lifecycle hook
   * Performs necessary cleanup operations
   * 
   * @returns {void}
   */
  ngOnDestroy(): void {
    // Cleanup if needed in future implementations
  }

  // === Data Loading Methods ===

  /**
   * Loads user data for greeting display
   * Uses reactive effect from constructor to automatically update when auth state changes
   * 
   * @private
   * @returns {void}
   */
  private loadUserData(): void {
    const user = this.userService.user();
    if (user) {
      this.name = user.displayName || user.email?.split('@')[0] || '';
    }
    // Don't set fallback name here - let the effect handle it
    this.greeting = this.getGreeting();
  }

  /**
   * Loads all dashboard data from Firestore
   * Fetches tasks and contacts in parallel for optimal performance
   * 
   * @async
   * @returns {Promise<void>}
   * @throws {Error} When Firestore operations fail
   */
  async loadDashboardData(): Promise<void> {
    try {
      this.isLoading = true;
      
      // Load tasks and contacts in parallel for better performance
      // Use runInInjectionContext to ensure Firebase APIs are called within the proper injection context
      const [tasksSnapshot, contactsSnapshot] = await runInInjectionContext(this.injector, async () => {
        return Promise.all([
          getDocs(this.tasksCol),
          getDocs(this.contactsCol)
        ]);
      });

      // Process and transform task documents
      this.tasks = tasksSnapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Task))
        .filter(task => !task.deleted); // Filter out deleted tasks

      // Process and transform contact documents
      this.contacts = contactsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Contact));

      // Calculate aggregated statistics
      this.calculateStats();
      
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      this.isLoading = false;
    }
  }

  // === Statistics Calculation Methods ===

  /**
   * Calculates dashboard statistics from loaded data
   * Aggregates task counts by status and priority, plus contact count
   * 
   * @private
   * @returns {void}
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
   * Determines the next upcoming deadline from active tasks
   * Filters out completed tasks and sorts by due date
   * 
   * @private
   * @returns {string | null} Formatted deadline date or null if no deadlines
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

  // === UI Helper Methods ===

  /**
   * Gets the user's display name with fallbacks
   * Provides reliable user name display regardless of authentication timing
   * 
   * @returns {string} User display name or fallback
   */
  getUserDisplayName(): string {
    if (this.name) {
      return this.name;
    }
    
    const user = this.userService.user();
    if (user) {
      return user.displayName || user.email?.split('@')[0] || 'User';
    }
    
    return 'User';
  }

  /**
   * Generates appropriate greeting based on current time
   * Provides personalized experience based on time of day
   * 
   * @returns {string} Localized greeting message
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
   * Calculates task completion percentage for progress indication
   * Useful for progress bars or completion metrics
   * 
   * @returns {number} Completion percentage (0-100)
   */
  getCompletionPercentage(): number {
    if (this.stats.totalTasks === 0) return 0;
    return Math.round((this.stats.doneTasks / this.stats.totalTasks) * 100);
  }

  /**
   * Formats current date for display purposes
   * Returns localized date string in German format
   * 
   * @returns {string} Formatted current date
   */
  getCurrentDate(): string {
    return new Date().toLocaleDateString('de-DE', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  // === Navigation Methods ===

  /**
   * Navigates to the board page
   * Accessible navigation method for keyboard and click events
   * Provides consistent navigation experience across all dashboard cards
   * 
   * @returns {Promise<boolean>} Navigation result promise
   */
  async navigateToBoard(): Promise<boolean> {
    try {
      return await this.router.navigate(['/board']);
    } catch (error) {
      console.error('Navigation to board failed:', error);
      return false;
    }
  }
}
