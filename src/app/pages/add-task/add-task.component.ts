import {
  Component,
  ElementRef,
  HostListener,
  ViewChild,
  Injector,
  runInInjectionContext,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  Firestore,
  collection,
  addDoc,
  getDocs,
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
 * Component for creating new tasks with comprehensive functionality including:
 * - Task details (title, description, due date)
 * - Priority selection (urgent, medium, low)
 * - Contact assignment with avatar display
 * - Category selection
 * - Subtask management with inline editing
 * - Form validation and Firestore integration
 *
 * Implements WCAG accessibility standards with proper ARIA attributes,
 * semantic HTML structure, and keyboard navigation support.
 */
@Component({
  selector: 'app-add-task',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './add-task.component.html',
  styleUrls: ['./add-task.component.scss'],
})
export class AddTaskComponent {
  // ===============================
  // ViewChild References
  // ===============================

  /** Reference to category picker wrapper for outside-click detection */
  @ViewChild('categoryPickerWrapper', { static: false })
  categoryPickerWrapper!: ElementRef;

  /** Reference to contacts selector wrapper for outside-click detection */
  @ViewChild('contactsSelectorWrapper', { static: false })
  contactsSelectorWrapper!: ElementRef;

  // ===============================
  // Form Fields
  // ===============================

  /** Task title - required field */
  title = '';

  /** Task description - optional field */
  description = '';

  /** Due date for the task - required field */
  dueDate = '';

  /** Task priority level with default medium priority */
  priority: 'urgent' | 'medium' | 'low' = 'medium';

  /** Currently hovered priority for UI feedback */
  hoverPriority: 'urgent' | 'medium' | 'low' | null = null;

  /** Array of assigned contact IDs */
  assignedTo: string[] = [];

  /** Task category - required field */
  category = '';

  /** Array of subtask descriptions */
  subtasks: string[] = [];

  // ===============================
  // Contact Management
  // ===============================

  /** Complete list of available contacts */
  contacts: Contact[] = [];

  /** Filtered contacts based on search input */
  filteredContacts: Contact[] = [];

  /** Current search term for contact filtering */
  contactSearch = '';

  /** Controls visibility of contacts dropdown */
  showContactsDropdown = false;

  // ===============================
  // UI State Management
  // ===============================

  /** Controls visibility of category dropdown */
  showCategoryDropdown = false;

  /** Input value for new subtask creation */
  newSubtask = '';

  /** Tracks focus state of subtask input for UI changes */
  subtaskInputFocused = false;

  /** Index of currently edited subtask, null if none */
  editSubtaskIndex: number | null = null;

  /** Temporary value for subtask during editing */
  editSubtaskValue = '';

  // ===============================
  // Feedback Messages
  // ===============================

  /** Error message display */
  error = '';

  /** Success message display */
  success = '';

  // ===============================
  // Firestore Collections
  // ===============================

  /** Firestore instance */
  private firestore = inject(Firestore);

  /** Element reference */
  private el = inject(ElementRef);

  /** Angular Injector for running Firebase calls in injection context */
  private injector = inject(Injector);

  /** Router service for navigation */
  private router = inject(Router);

  /** Firestore collection reference for tasks */
  private tasksCol: CollectionReference<DocumentData>;

  /** Firestore collection reference for contacts */
  private contactsCol: CollectionReference<DocumentData>;

  /**
   * Initializes the component with Firestore collections and loads contacts
   */
  constructor() {
    this.tasksCol = collection(this.firestore, 'tasks');
    this.contactsCol = collection(this.firestore, 'contacts');
    this.loadContacts();
  }

  // ===============================
  // Event Handlers
  // ===============================

  /**
   * Handles outside clicks to close dropdowns when clicking outside their containers
   * @param event - DOM click event
   */
  @HostListener('document:click', ['$event'])
  handleOutsideClick(event: Event) {
    const target = event.target as Node;

    // Close contacts dropdown if clicked outside
    if (this.showContactsDropdown && this.contactsSelectorWrapper) {
      if (!this.contactsSelectorWrapper.nativeElement.contains(target)) {
        this.showContactsDropdown = false;
      }
    }

    // Close category dropdown if clicked outside
    if (this.showCategoryDropdown && this.categoryPickerWrapper) {
      if (!this.categoryPickerWrapper.nativeElement.contains(target)) {
        this.showCategoryDropdown = false;
      }
    }
  }

  /**
   * Handles escape key press to close all open dropdowns
   * @param event - Keyboard event
   */
  @HostListener('document:keydown.escape', ['$event'])
  handleEscape(event: KeyboardEvent) {
    this.showContactsDropdown = false;
    this.showCategoryDropdown = false;
  }

  // ===============================
  // Priority Management
  // ===============================

  /**
   * Sets the task priority level
   * @param priority - Priority level to set
   */
  setPriority(priority: 'urgent' | 'medium' | 'low'): void {
    this.priority = priority;
  }

  /**
   * Sets hover state for priority buttons (UI feedback)
   * @param priority - Priority level being hovered or null
   */
  setHover(priority: 'urgent' | 'medium' | 'low' | null): void {
    this.hoverPriority = priority;
  }

  // ===============================
  // Contact Management
  // ===============================

  /**
   * Loads all available contacts from Firestore
   * Populates both contacts and filteredContacts arrays
   */
  async loadContacts(): Promise<void> {
    try {
      const snapshot = await runInInjectionContext(this.injector, async () => {
        return getDocs(this.contactsCol);
      });
      this.contacts = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<Contact, 'id'>),
      })) as Contact[];
      this.filteredContacts = [...this.contacts];
    } catch (error) {
      console.error('Error loading contacts:', error);
    }
  }

  /**
   * Generates initials from a contact name
   * @param name - Full name of the contact
   * @returns Two-character initials in uppercase
   */
  getInitials(name?: string): string {
    if (!name) return '??';
    return name
      .split(' ')
      .map((word) => word[0] || '')
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }

  /**
   * Opens the contacts dropdown and initializes contact filtering
   */
  openContacts(): void {
    this.showContactsDropdown = true;
    this.filterContacts();
  }

  /**
   * Toggles the contacts dropdown visibility
   * @param event - Optional click event to prevent propagation
   */
  toggleContacts(event?: Event): void {
    if (event) {
      event.stopPropagation();
    }

    if (this.showContactsDropdown) {
      this.showContactsDropdown = false;
    } else {
      this.openContacts();
    }
  }

  /**
   * Filters contacts based on search input
   * Shows all contacts if search term is less than 2 characters
   */
  filterContacts(): void {
    const searchTerm = this.contactSearch.trim().toLowerCase();

    if (searchTerm.length < 2) {
      this.filteredContacts = [...this.contacts];
      return;
    }

    this.filteredContacts = this.contacts.filter((contact) =>
      contact.name.toLowerCase().includes(searchTerm)
    );
  }

  /**
   * Toggles contact assignment (add/remove from assigned contacts)
   * @param contact - Contact to toggle assignment for
   */
  toggleContactSelection(contact: Contact): void {
    if (!contact?.id) return;

    const index = this.assignedTo.indexOf(contact.id);
    if (index === -1) {
      this.assignedTo.push(contact.id);
    } else {
      this.assignedTo.splice(index, 1);
    }
  }

  /**
   * Checks if a contact is currently assigned to the task
   * @param contactId - ID of the contact to check
   * @returns True if contact is assigned
   */
  isAssigned(contactId?: string): boolean {
    return !!contactId && this.assignedTo.includes(contactId);
  }

  /**
   * Retrieves a contact by ID
   * @param contactId - ID of the contact to retrieve
   * @returns Contact object or undefined if not found
   */
  getContactById(contactId: string): Contact | undefined {
    return this.contacts.find((contact) => contact.id === contactId);
  }

  // ===============================
  // Category Management
  // ===============================

  /**
   * Selects a category and closes the category dropdown
   * @param categoryName - Name of the category to select
   */
  selectCategory(categoryName: string): void {
    this.category = categoryName;
    this.showCategoryDropdown = false;
  }

  // ===============================
  // Subtask Management
  // ===============================

  /**
   * Focuses the subtask input field to enable direct typing
   * @param inputElement - HTML input element to focus
   */
  focusSubtaskInput(inputElement: HTMLInputElement): void {
    if (inputElement) {
      inputElement.focus();
      this.subtaskInputFocused = true;
    }
  }

  /**
   * Adds a new subtask from the current input value
   */
  addSubtask(): void {
    const value = this.newSubtask.trim();
    if (value) {
      this.subtasks.push(value);
      this.newSubtask = '';
      this.subtaskInputFocused = true;
    }
  }

  /**
   * Handles Enter key in subtask input - prevents form submission
   * @param event - Keyboard event
   */
  addSubtaskOnEnter(event: Event): void {
    const keyboardEvent = event as KeyboardEvent;
    keyboardEvent.preventDefault(); // Verhindert Form-Submit
    keyboardEvent.stopPropagation(); // Verhindert Event-Bubbling
    this.addSubtask();
  }

  /**
   * Adds a subtask directly from an input element
   * @param inputElement - HTML input element containing subtask text
   */
  addSubtaskFromInput(inputElement: HTMLInputElement): void {
    const value = inputElement.value.trim();
    if (value) {
      this.subtasks.push(value);
      inputElement.value = '';
      this.newSubtask = '';
      this.subtaskInputFocused = true;
    }
  }

  /**
   * Clears the subtask input field
   * @param inputElement - HTML input element to clear
   */
  clearSubtaskInput(inputElement: HTMLInputElement): void {
    inputElement.value = '';
    this.newSubtask = '';
    this.subtaskInputFocused = true;
  }

  /**
   * Initiates edit mode for a specific subtask
   * @param index - Index of the subtask to edit
   */
  startEditSubtask(index: number): void {
    this.editSubtaskIndex = index;
    this.editSubtaskValue = this.subtasks[index];
  }

  /**
   * Confirms and saves subtask edit changes
   */
  confirmEditSubtask(): void {
    if (this.editSubtaskIndex !== null) {
      const value = this.editSubtaskValue.trim();
      if (value) {
        this.subtasks[this.editSubtaskIndex] = value;
      }
      this.editSubtaskIndex = null;
      this.editSubtaskValue = '';
    }
  }

  /**
   * Handles Enter key in subtask edit input - prevents form submission
   * @param event - Keyboard event
   */
  confirmEditSubtaskOnEnter(event: Event): void {
    const keyboardEvent = event as KeyboardEvent;
    keyboardEvent.preventDefault(); // Verhindert Form-Submit
    keyboardEvent.stopPropagation(); // Verhindert Event-Bubbling
    this.confirmEditSubtask();
  }

  /**
   * Cancels subtask editing without saving changes
   */
  cancelEditSubtask(): void {
    this.editSubtaskIndex = null;
    this.editSubtaskValue = '';
  }

  /**
   * Removes a subtask from the list
   * @param index - Index of the subtask to remove
   */
  removeSubtask(index: number): void {
    this.subtasks.splice(index, 1);

    // Reset edit state if the deleted item was being edited
    if (this.editSubtaskIndex === index) {
      this.editSubtaskIndex = null;
      this.editSubtaskValue = '';
    }
    // Adjust edit index if an item before the edited one was deleted
    else if (this.editSubtaskIndex !== null && this.editSubtaskIndex > index) {
      this.editSubtaskIndex--;
    }
  }

  // ===============================
  // Utility Functions
  // ===============================

  /**
   * Opens the native date picker for a given input element
   * Uses modern showPicker() method with fallback to focus+click
   * @param inputElement - Date input element to open picker for
   */
  openDatepicker(inputElement: HTMLInputElement): void {
    if (!inputElement) return;

    // Try modern showPicker method first
    const anyInput = inputElement as any;
    if (typeof anyInput.showPicker === 'function') {
      try {
        anyInput.showPicker();
        return;
      } catch (error) {
        console.warn('showPicker not supported, falling back to focus/click');
      }
    }

    // Fallback for older browsers
    try {
      inputElement.focus();
      inputElement.click();
    } catch (error) {
      console.error('Unable to open date picker:', error);
    }
  }

  /**
   * Resets the entire form to its initial state
   */
  clearForm(): void {
    this.title = '';
    this.description = '';
    this.dueDate = '';
    this.priority = 'medium';
    this.assignedTo = [];
    this.category = '';
    this.subtasks = [];
    this.newSubtask = '';
    this.contactSearch = '';
    this.filteredContacts = [...this.contacts];
    this.error = '';
    this.success = '';
    this.editSubtaskIndex = null;
    this.editSubtaskValue = '';
    this.subtaskInputFocused = false;
  }

  // ===============================
  // Form Submission
  // ===============================

  /**
   * Validates form data and submits new task to Firestore
   * Performs client-side validation before submission
   */
  async onSubmit(): Promise<void> {
    this.error = '';
    this.success = '';

    // Validate required fields
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
      // Create task document
      await runInInjectionContext(this.injector, async () => {
        return addDoc(this.tasksCol, {
          title: this.title.trim(),
          description: this.description.trim(),
          dueDate: this.dueDate.trim(),
          priority: this.priority,
          assignedTo: this.assignedTo,
          category: this.category.trim(),
          subtasks: this.subtasks,
          status: 'todo', // Default status for new tasks
          createdAt: new Date().toISOString(),
          completedSubtasks: [], // Initialize empty completed subtasks array
        });
      });

      this.success = 'Task created successfully!';

      // Reset form after successful submission
      this.title = '';
      this.description = '';
      this.dueDate = '';
      this.priority = 'medium';
      this.assignedTo = [];
      this.category = '';
      this.subtasks = [];

      // Automatische Weiterleitung zum Board nach 2 Sekunden
      setTimeout(() => {
        this.success = ''; // Erfolgsmeldung ausblenden
        this.router.navigate(['/board']); // Navigation zum Board
      }, 2000);
    } catch (error) {
      console.error('Error saving task:', error);
      this.error = 'Error saving task. Please try again.';
    }
  }

  // ===============================
  // TrackBy Functions for Performance
  // ===============================

  /**
   * TrackBy function for contact list optimization
   * @param index - Array index
   * @param contact - Contact object
   * @returns Unique identifier for tracking
   */
  trackByContactId(index: number, contact: Contact): string {
    return contact.id || index.toString();
  }

  /**
   * TrackBy function for subtask list optimization
   * @param index - Array index
   * @param subtask - Subtask string
   * @returns Unique identifier for tracking
   */
  trackBySubtaskIndex(index: number, subtask: string): string {
    return `${index}-${subtask}`;
  }

  /**
   * TrackBy function for category list optimization
   * @param index - Array index
   * @param category - Category string
   * @returns Unique identifier for tracking
   */
  trackByCategory(index: number, category: string): string {
    return category;
  }
}
