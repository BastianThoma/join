import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef, Injector, runInInjectionContext, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DragDropModule, CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import {
  Firestore,
  collection,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  CollectionReference,
  DocumentData,
} from '@angular/fire/firestore';

/**
 * Interface for Contact data structure
 */
interface Contact {
  /** Unique identifier for the contact */
  id?: string;
  /** Full name of the contact */
  name: string;
  /** Email address of the contact */
  email?: string;
  /** Phone number of the contact */
  phone?: string;
  /** Avatar color for the contact */
  color?: string;
}

/**
 * Interface for Task data structure
 */
interface Task {
  /** Unique identifier for the task */
  id?: string;
  /** Task title */
  title: string;
  /** Task description */
  description: string;
  /** Due date for the task */
  dueDate: string;
  /** Task priority level */
  priority: 'urgent' | 'medium' | 'low';
  /** Array of assigned contact IDs */
  assignedTo: string[];
  /** Task category */
  category: string;
  /** Array of subtask descriptions */
  subtasks: string[];
  /** Task status/column */
  status: 'todo' | 'inprogress' | 'awaitfeedback' | 'done';
  /** Creation timestamp */
  createdAt: string;
  /** Completed subtasks count */
  completedSubtasks?: string[];
  /** Soft delete flag */
  deleted?: boolean;
}

/**
 * BoardComponent
 *
 * Stellt das Aufgaben-Board mit Drag & Drop Funktionalität dar.
 * Zeigt Tasks in vier Spalten nach Status sortiert an.
 */
@Component({
  selector: 'app-board',
  standalone: true,
  imports: [CommonModule, FormsModule, DragDropModule],
  templateUrl: './board.component.html',
  styleUrls: ['./board.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BoardComponent implements OnInit, OnDestroy {
  // ===============================
  // Data Arrays
  // ===============================
  
  /** All tasks from Firestore */
  allTasks: Task[] = [];
  
  /** All contacts from Firestore */
  allContacts: Contact[] = [];
  
  /** Tasks in To Do column */
  todoTasks: Task[] = [];
  
  /** Tasks in In Progress column */
  inProgressTasks: Task[] = [];
  
  /** Tasks in Await Feedback column */
  awaitFeedbackTasks: Task[] = [];
  
  /** Tasks in Done column */
  doneTasks: Task[] = [];

  // ===============================
  // UI State
  // ===============================
  
  /** Loading state */
  isLoading = true;
  
  /** Error message */
  error = '';
  
  /** Currently dragged task */
  draggedTask: Task | null = null;
  
  /** Show mobile move menu for task ID */
  showMobileMenu: string | null = null;

  /** Disable change detection during drag operations for performance */
  isDragging = false;

  /** Selected task for detail view */
  selectedTask: Task | null = null;

  /** Show task detail modal */
  showTaskDetail = false;

  /** Edit mode for selected task */
  isEditMode = false;

  /** Edit form data - copy of selected task for editing */
  editTask: Task | null = null;

  /** Contact search and dropdown for edit mode */
  editContactSearch = '';
  showEditContactsDropdown = false;
  filteredEditContacts: Contact[] = [];

  // ===============================
  // Firestore Collections
  // ===============================
  
  /** Firestore instance */
  private firestore = inject(Firestore);
  
  /** Router for navigation */
  private router = inject(Router);
  
  /** Change detection reference */
  private cdr = inject(ChangeDetectorRef);
  
  /** Angular Injector for running Firebase calls in injection context */
  private injector = inject(Injector);
  
  /** Firestore collection reference for tasks */
  private tasksCol: CollectionReference<DocumentData>;
  
  /** Firestore collection reference for contacts */
  private contactsCol: CollectionReference<DocumentData>;

  /**
   * Initializes the component with Firestore collections
   */
  constructor() {
    this.tasksCol = collection(this.firestore, 'tasks');
    this.contactsCol = collection(this.firestore, 'contacts');
  }

  /**
   * Component initialization
   */
  async ngOnInit() {
    await this.loadData();
    this.setupClickOutsideListener();
  }

  /**
   * Sets up click outside listener for dropdowns
   */
  private setupClickOutsideListener(): void {
    document.addEventListener('click', (event: Event) => {
      const target = event.target as HTMLElement;
      // Only close if we're in edit mode and clicked outside the contact selector
      if (this.isEditMode && this.showEditContactsDropdown && 
          !target.closest('.board__contacts-selector-wrapper')) {
        this.closeEditContacts();
      }
    });
  }

  /**
   * Component cleanup
   */
  ngOnDestroy() {
    // Close any open dropdowns
    this.closeEditContacts();
  }

  // ===============================
  // Data Loading
  // ===============================

  /**
   * Loads all tasks and contacts from Firestore
   */
  async loadData(): Promise<void> {
    try {
      this.isLoading = true;
      this.error = '';
      this.cdr.detectChanges();
      
      // Load contacts and tasks in parallel
      await Promise.all([
        this.loadContacts(),
        this.loadTasks()
      ]);
      
      // Sort tasks into columns
      this.sortTasksIntoColumns();
      
    } catch (error) {
      console.error('Error loading data:', error);
      this.error = 'Fehler beim Laden der Daten';
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  /**
   * Loads all contacts from Firestore
   */
  async loadContacts(): Promise<void> {
    try {
      const snapshot = await runInInjectionContext(this.injector, async () => {
        return getDocs(this.contactsCol);
      });
      this.allContacts = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<Contact, 'id'>),
      })) as Contact[];
    } catch (error) {
      console.error('Error loading contacts:', error);
    }
  }

  /**
   * Loads all tasks from Firestore
   */
  async loadTasks(): Promise<void> {
    try {
      const snapshot = await runInInjectionContext(this.injector, async () => {
        return getDocs(this.tasksCol);
      });
      const allTasksFromFirestore = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<Task, 'id'>),
        status: (doc.data() as any).status || 'todo', // Default to todo if no status
      })) as Task[];
      
      // Filter out deleted tasks
      this.allTasks = allTasksFromFirestore.filter(task => !task.deleted);
    } catch (error) {
      console.error('Error loading tasks:', error);
    }
  }

  /**
   * Sorts tasks into their respective columns based on status
   */
  sortTasksIntoColumns(): void {
    this.todoTasks = this.allTasks.filter(task => task.status === 'todo');
    this.inProgressTasks = this.allTasks.filter(task => task.status === 'inprogress');
    this.awaitFeedbackTasks = this.allTasks.filter(task => task.status === 'awaitfeedback');
    this.doneTasks = this.allTasks.filter(task => task.status === 'done');
  }

  // ===============================
  // Drag & Drop Methods (Angular CDK) - Performance Optimized
  // ===============================

  /**
   * Called when drag starts - optimize performance
   */
  onDragStarted(): void {
    this.isDragging = true;
    this.cdr.detach(); // Stop change detection during drag
  }

  /**
   * Called when drag ends - restore performance
   */
  onDragEnded(): void {
    this.isDragging = false;
    this.cdr.reattach(); // Re-enable change detection
    this.cdr.detectChanges(); // Update view
  }

  /**
   * Handles drop event from Angular CDK
   * @param event - CDK Drop event
   */
  async onTaskDrop(event: CdkDragDrop<Task[]>): Promise<void> {
    // Disable change detection during drag operation
    this.cdr.detach();
    
    try {
      // If dropped in the same container, just reorder
      if (event.previousContainer === event.container) {
        moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
        this.cdr.reattach();
        this.cdr.detectChanges();
        return;
      }

      // Move task between containers (columns)
      const task = event.previousContainer.data[event.previousIndex];
      const newStatus = this.getStatusFromContainer(event.container);
      
      if (task.id && newStatus) {
        // Transfer item between arrays first (optimistic update)
        transferArrayItem(
          event.previousContainer.data,
          event.container.data,
          event.previousIndex,
          event.currentIndex
        );
        
        // Update local task object
        task.status = newStatus;
        
        // Re-enable change detection and update view
        this.cdr.reattach();
        this.cdr.detectChanges();
        
        // Update in Firestore (async, non-blocking)
        this.updateTaskStatus(task.id, newStatus).catch(error => {
          console.error('Error moving task:', error);
          this.error = 'Fehler beim Verschieben der Aufgabe';
          this.cdr.detectChanges();
        });
        
        console.log(`Task "${task.title}" moved to ${newStatus}`);
      } else {
        this.cdr.reattach();
        this.cdr.detectChanges();
      }
    } catch (error) {
      console.error('Error during drag operation:', error);
      this.cdr.reattach();
      this.cdr.detectChanges();
    }
  }

  /**
   * Gets the status from a CDK drop container
   * @param container - CDK drop container
   * @returns Task status
   */
  private getStatusFromContainer(container: any): Task['status'] | null {
    const containerId = container.id;
    switch (containerId) {
      case 'todo-list':
        return 'todo';
      case 'inprogress-list':
        return 'inprogress';
      case 'awaitfeedback-list':
        return 'awaitfeedback';
      case 'done-list':
        return 'done';
      default:
        return null;
    }
  }

  /**
   * Updates task status in Firestore
   * @param taskId - ID of the task to update
   * @param newStatus - New status for the task
   */
  async updateTaskStatus(taskId: string, newStatus: Task['status']): Promise<void> {
    try {
      await runInInjectionContext(this.injector, async () => {
        const taskDoc = doc(this.firestore, 'tasks', taskId);
        return updateDoc(taskDoc, { status: newStatus });
      });
    } catch (error) {
      console.error('Error updating task status in Firestore:', error);
      throw error;
    }
  }

  // ===============================
  // Task Actions
  // ===============================

  /**
   * Moves task to different status
   * @param task - Task to move
   * @param newStatus - Target status
   */
  async moveTaskToStatus(task: Task, newStatus: Task['status']): Promise<void> {
    if (task.status === newStatus || !task.id) return;
    
    try {
      await this.updateTaskStatus(task.id, newStatus);
      task.status = newStatus;
      this.sortTasksIntoColumns();
      this.cdr.detectChanges(); // Force change detection for OnPush strategy
    } catch (error) {
      console.error('Error moving task:', error);
      this.error = 'Fehler beim Verschieben der Aufgabe';
      this.cdr.detectChanges(); // Ensure error is displayed
    }
  }

  // ===============================
  // Mobile Task Movement
  // ===============================

  /**
   * Toggles mobile menu for a task
   * @param taskId - ID of the task
   */
  toggleMobileMenu(taskId: string | undefined): void {
    if (!taskId) return;
    this.showMobileMenu = this.showMobileMenu === taskId ? null : taskId;
    this.cdr.detectChanges(); // Force change detection for OnPush strategy
  }

  /**
   * Closes mobile menu
   */
  closeMobileMenu(): void {
    this.showMobileMenu = null;
    this.cdr.detectChanges(); // Force change detection for OnPush strategy
  }

  /**
   * Gets available status options for mobile menu
   * @param currentStatus - Current status of the task
   * @returns Array of available status options
   */
  getAvailableStatusOptions(currentStatus: Task['status']): Array<{status: Task['status'], label: string, icon: string}> {
    const allOptions = [
      { status: 'todo' as Task['status'], label: 'To do', icon: '/assets/img/arrow_left.png' },
      { status: 'inprogress' as Task['status'], label: 'In progress', icon: '/assets/img/arrow_left.png' },
      { status: 'awaitfeedback' as Task['status'], label: 'Await feedback', icon: '/assets/img/arrow_left.png' },
      { status: 'done' as Task['status'], label: 'Done', icon: '/assets/img/check_blue_icon.png' }
    ];
    
    return allOptions.filter(option => option.status !== currentStatus);
  }

  /**
   * Moves task to new status via mobile menu
   * @param task - Task to move
   * @param newStatus - Target status
   */
  async moveTaskViaMobile(task: Task, newStatus: Task['status']): Promise<void> {
    this.closeMobileMenu();
    await this.moveTaskToStatus(task, newStatus);
  }

  // ===============================
  // Helper Functions
  // ===============================

  /**
   * Gets contact name by ID
   * @param contactId - ID of the contact
   * @returns Contact name or empty string
   */
  getContactName(contactId: string): string {
    const contact = this.allContacts.find(c => c.id === contactId);
    return contact?.name || '';
  }

  /**
   * Gets contact initials by ID
   * @param contactId - ID of the contact
   * @returns Two-character initials
   */
  getContactInitials(contactId: string): string {
    const contact = this.allContacts.find(c => c.id === contactId);
    if (!contact?.name) return '??';
    
    return contact.name
      .split(' ')
      .map((word) => word[0] || '')
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }

  /**
   * Gets contact color by ID
   * @param contactId - ID of the contact
   * @returns Contact color or default color
   */
  getContactColor(contactId: string): string {
    const contact = this.allContacts.find(c => c.id === contactId);
    return contact?.color || '#4589FF';
  }

  /**
   * Gets priority icon path
   * @param priority - Task priority level
   * @returns Path to priority icon
   */
  getPriorityIcon(priority: Task['priority']): string {
    switch (priority) {
      case 'urgent':
        return '/assets/img/urgent_prio_icon_red.png';
      case 'medium':
        return '/assets/img/medium_prio_icon_orange.png';
      case 'low':
        return '/assets/img/low_prio_icon_green.png';
      default:
        return '/assets/img/medium_prio_icon_orange.png';
    }
  }

  /**
   * Gets category color based on category name
   * @param category - Task category
   * @returns CSS color for category
   */
  getCategoryColor(category: string): string {
    // Simple hash-based color generation for categories
    let hash = 0;
    for (let i = 0; i < category.length; i++) {
      hash = category.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    // Convert to RGB
    const hue = Math.abs(hash) % 360;
    return `hsl(${hue}, 65%, 55%)`;
  }

  /**
   * Gets completed subtasks count
   * @param task - Task object
   * @returns Number of completed subtasks
   */
  getCompletedSubtasksCount(task: Task): number {
    return task.completedSubtasks?.length || 0;
  }

  /**
   * Gets total subtasks count
   * @param task - Task object
   * @returns Total number of subtasks
   */
  getTotalSubtasksCount(task: Task): number {
    return task.subtasks?.length || 0;
  }

  /**
   * Formats date for display
   * @param dateString - ISO date string
   * @returns Formatted date string
   */
  formatDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('de-DE');
    } catch {
      return dateString;
    }
  }

  /**
   * Gets column title by status
   * @param status - Column status
   * @returns Localized column title
   */
  getColumnTitle(status: Task['status']): string {
    switch (status) {
      case 'todo':
        return 'To do';
      case 'inprogress':
        return 'In progress';
      case 'awaitfeedback':
        return 'Await feedback';
      case 'done':
        return 'Done';
      default:
        return '';
    }
  }

  // ===============================
  // TrackBy Functions for Performance
  // ===============================

  /**
   * TrackBy function for task lists
   * @param index - Array index
   * @param task - Task object
   * @returns Unique identifier for tracking
   */
  trackByTaskId(index: number, task: Task): string {
    return task.id || index.toString();
  }

  /**
   * TrackBy function for assigned contacts
   * @param index - Array index
   * @param contactId - Contact ID
   * @returns Unique identifier for tracking
   */
  trackByContactId(index: number, contactId: string): string {
    return contactId;
  }

  /**
   * TrackBy function for contact objects
   * @param index - Array index
   * @param contact - Contact object
   * @returns Unique identifier for tracking
   */
  trackByContact(index: number, contact: Contact): string {
    return contact.id || index.toString();
  }

  // ===============================
  // Task Detail Methods
  // ===============================

  /**
   * Opens task detail modal
   * @param task - Task to show details for
   */
  openTaskDetail(task: Task): void {
    this.selectedTask = { ...task }; // Create a copy to avoid direct mutation
    this.showTaskDetail = true;
    this.cdr.detectChanges();
  }

  /**
   * Closes task detail modal
   */
  closeTaskDetail(): void {
    this.selectedTask = null;
    this.showTaskDetail = false;
    this.isEditMode = false;
    this.editTask = null;
    this.closeEditContacts();
    this.cdr.detectChanges();
  }

  /**
   * Updates a task in all local arrays after modification
   */
  private updateTaskInArrays(updatedTask: Task): void {
    // Update in main array
    const taskIndex = this.allTasks.findIndex(t => t.id === updatedTask.id);
    if (taskIndex !== -1) {
      this.allTasks[taskIndex] = updatedTask;
    }
    
    // Re-sort tasks into columns to reflect changes
    this.sortTasksIntoColumns();
  }

  /**
   * Toggles subtask completion status
   * @param subtaskIndex - Index of the subtask
   */
  async toggleSubtask(subtaskIndex: number, event: any): Promise<void> {
    if (!this.selectedTask || !this.selectedTask.id) return;

    try {
      // Initialize completedSubtasks if it doesn't exist
      if (!this.selectedTask.completedSubtasks) {
        this.selectedTask.completedSubtasks = [];
      }

      const subtaskText = this.selectedTask.subtasks[subtaskIndex];
      const completedIndex = this.selectedTask.completedSubtasks.indexOf(subtaskText);

      if (completedIndex === -1) {
        // Mark as completed
        this.selectedTask.completedSubtasks.push(subtaskText);
      } else {
        // Mark as not completed
        this.selectedTask.completedSubtasks.splice(completedIndex, 1);
      }

      // Update in Firestore
      await runInInjectionContext(this.injector, async () => {
        const taskDoc = doc(this.firestore, 'tasks', this.selectedTask!.id!);
        return updateDoc(taskDoc, { 
          completedSubtasks: this.selectedTask!.completedSubtasks 
        });
      });

      // Update the task in the local arrays
      const originalTask = this.allTasks.find(t => t.id === this.selectedTask!.id);
      if (originalTask) {
        originalTask.completedSubtasks = this.selectedTask.completedSubtasks;
      }

      this.cdr.detectChanges();
      console.log('Subtask toggled successfully');
    } catch (error) {
      console.error('Error toggling subtask:', error);
      this.error = 'Fehler beim Aktualisieren der Subtask';
    }
  }

  /**
   * Deletes the current task
   */
  async deleteTask(task: Task): Promise<void> {
    if (!task || !task.id) return;

    const confirmed = confirm(`Möchten Sie die Aufgabe "${task.title}" wirklich löschen?`);
    if (!confirmed) return;

    try {
      // Delete from Firestore
      await runInInjectionContext(this.injector, async () => {
        const taskDoc = doc(this.firestore, 'tasks', task.id!);
        return updateDoc(taskDoc, { deleted: true }); // Soft delete
      });

      // Remove from local arrays
      this.allTasks = this.allTasks.filter(t => t.id !== task.id);
      this.sortTasksIntoColumns();

      // Close detail modal
      this.closeTaskDetail();

      console.log('Task deleted successfully');
    } catch (error) {
      console.error('Error deleting task:', error);
      this.error = 'Fehler beim Löschen der Aufgabe';
    }
  }

  /**
   * Starts editing mode for the current task
   */
  startEditMode(task: Task): void {
    if (task) {
      this.isEditMode = true;
      // Create a deep copy for editing
      this.editTask = JSON.parse(JSON.stringify(task));
      // Initialize contact management
      this.filteredEditContacts = [...this.allContacts];
      this.editContactSearch = '';
      this.showEditContactsDropdown = false;
      this.cdr.detectChanges();
    }
  }

  /**
   * Cancels edit mode and reverts to view mode
   */
  cancelEditMode(): void {
    this.isEditMode = false;
    this.editTask = null;
    this.closeEditContacts();
    this.cdr.detectChanges();
  }

  /**
   * Saves the edited task and exits edit mode
   */
  async saveEditedTask(): Promise<void> {
    if (!this.editTask || !this.editTask.id) return;

    try {
      // Update in Firestore
      await runInInjectionContext(this.injector, async () => {
        const taskDoc = doc(this.firestore, 'tasks', this.editTask!.id!);
        const updateData = {
          title: this.editTask!.title,
          description: this.editTask!.description,
          dueDate: this.editTask!.dueDate,
          priority: this.editTask!.priority,
          assignedTo: this.editTask!.assignedTo,
          category: this.editTask!.category,
          subtasks: this.editTask!.subtasks
        };
        return updateDoc(taskDoc, updateData);
      });

      // Update local arrays
      const taskIndex = this.allTasks.findIndex(t => t.id === this.editTask!.id);
      if (taskIndex !== -1) {
        this.allTasks[taskIndex] = { ...this.editTask! };
        this.sortTasksIntoColumns();
      }

      // Update selected task
      this.selectedTask = { ...this.editTask! };

      // Exit edit mode
      this.isEditMode = false;
      this.editTask = null;
      
      this.cdr.detectChanges();
      console.log('Task updated successfully');
      
    } catch (error) {
      console.error('Error updating task:', error);
      this.error = 'Fehler beim Speichern der Aufgabe';
      this.cdr.detectChanges();
    }
  }

  /**
   * Adds a new subtask to the edit form
   */
  addSubtaskToEdit(): void {
    if (this.editTask) {
      if (!this.editTask.subtasks) {
        this.editTask.subtasks = [];
      }
      this.editTask.subtasks.push('Neue Subtask');
      this.cdr.detectChanges();
    }
  }

  /**
   * Removes a subtask from the edit form
   */
  removeSubtaskFromEdit(index: number): void {
    if (this.editTask && this.editTask.subtasks) {
      this.editTask.subtasks.splice(index, 1);
      this.cdr.detectChanges();
    }
  }

  /**
   * Removes assigned contact from edit form
   */
  removeAssignedContactFromEdit(contactId: string): void {
    if (this.editTask && this.editTask.assignedTo) {
      const index = this.editTask.assignedTo.indexOf(contactId);
      if (index > -1) {
        this.editTask.assignedTo.splice(index, 1);
        this.cdr.detectChanges();
      }
    }
  }

  // ===============================
  // Edit Mode Contact Management
  // ===============================

  /**
   * Opens the contact dropdown for edit mode
   */
  openEditContacts(): void {
    this.showEditContactsDropdown = true;
    this.filterEditContacts();
  }

  /**
   * Toggles the contact dropdown for edit mode
   */
  toggleEditContacts(event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    if (this.showEditContactsDropdown) {
      this.showEditContactsDropdown = false;
    } else {
      this.openEditContacts();
    }
  }

  /**
   * Filters contacts based on search term for edit mode
   */
  filterEditContacts(): void {
    const searchTerm = this.editContactSearch.trim().toLowerCase();
    
    if (!searchTerm) {
      this.filteredEditContacts = [...this.allContacts];
      return;
    }

    this.filteredEditContacts = this.allContacts.filter((contact) =>
      contact.name.toLowerCase().includes(searchTerm) ||
      (contact.email && contact.email.toLowerCase().includes(searchTerm))
    );
  }

  /**
   * Toggles contact assignment in edit mode
   */
  toggleEditContactSelection(contact: Contact): void {
    if (!contact?.id || !this.editTask) return;

    if (!this.editTask.assignedTo) {
      this.editTask.assignedTo = [];
    }

    const index = this.editTask.assignedTo.indexOf(contact.id);
    if (index === -1) {
      this.editTask.assignedTo.push(contact.id);
    } else {
      this.editTask.assignedTo.splice(index, 1);
    }
    this.cdr.detectChanges();
  }

  /**
   * Checks if a contact is assigned in edit mode
   */
  isEditContactAssigned(contactId?: string): boolean {
    return !!contactId && !!this.editTask?.assignedTo?.includes(contactId);
  }

  /**
   * Gets contact by ID
   */
  getEditContactById(contactId: string): Contact | undefined {
    return this.allContacts.find((contact) => contact.id === contactId);
  }

  /**
   * Closes edit contacts dropdown
   */
  closeEditContacts(): void {
    this.showEditContactsDropdown = false;
    this.editContactSearch = '';
    this.filteredEditContacts = [...this.allContacts];
    this.cdr.detectChanges();
  }

  /**
   * Handles clicks within the modal to close contacts dropdown when appropriate
   */
  handleModalClick(event: Event): void {
    const target = event.target as HTMLElement;
    // Close contacts dropdown if click is outside the contacts selector wrapper
    if (!target.closest('.board__contacts-selector-wrapper')) {
      this.closeEditContacts();
    }
    // Stop propagation to prevent modal from closing
    event.stopPropagation();
  }

  /**
   * Handles escape key - closes dropdown first, then modal if no dropdown open
   */
  handleEscapeKey(): void {
    if (this.showEditContactsDropdown) {
      this.closeEditContacts();
    } else {
      this.closeTaskDetail();
    }
  }

  /**
   * Navigates to add task page (legacy method for external navigation)
   */
  navigateToEditTask(task: Task): void {
    if (task && task.id) {
      this.router.navigate(['/add-task'], { 
        queryParams: { edit: task.id } 
      });
    }
  }

  /**
   * Checks if a subtask is completed
   * @param subtaskText - The subtask text
   * @returns Whether the subtask is completed
   */
  isSubtaskCompleted(subtaskText: string): boolean {
    return this.selectedTask?.completedSubtasks?.includes(subtaskText) || false;
  }

  // ===============================
  // Navigation Methods
  // ===============================

  /**
   * Navigates to the Add Task page
   */
  navigateToAddTask(): void {
    this.router.navigate(['/add-task']);
  }
}
