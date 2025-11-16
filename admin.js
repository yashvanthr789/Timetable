// Admin Dashboard JavaScript
// Handles timetable management, teachers, students, and notifications

document.addEventListener('DOMContentLoaded', () => {
    initializeAdminDashboard();
});

function initializeAdminDashboard() {
    // Initialize timetable form handlers
    setupTimetableForm();
    
    // Initialize teacher form handlers
    setupTeacherForm();
    
    // Initialize student form handlers
    setupStudentForm();
    
    // Initialize notification form
    setupNotificationForm();
    
    // Initialize generate timetable button
    setupGenerateTimetable();
}

// ============================================
// TIMETABLE GENERATOR
// ============================================

// Time slots configuration
const TIME_SLOTS = [
    { time: "9:30–10:20", isBreak: false },
    { time: "10:20–11:10", isBreak: false },
    { time: "11:10–11:20", isBreak: true, label: "BREAK" },
    { time: "11:20–12:10", isBreak: false },
    { time: "12:10–1:00", isBreak: false },
    { time: "1:00–2:00", isBreak: true, label: "LUNCH" },
    { time: "2:00–3:00", isBreak: false },
    { time: "3:00–4:00", isBreak: false }
];

// Subject definitions
const SUBJECTS = [
    // 4 credit subjects (6 slots/week)
    { code: "BCS501", credits: 4, requiredSlots: 6 },
    { code: "BCS502", credits: 4, requiredSlots: 6 },
    { code: "BCS503", credits: 4, requiredSlots: 6 },
    // 3 credit subjects (4 slots/week)
    { code: "BCS504", credits: 3, requiredSlots: 4 },
    { code: "BCS515B", credits: 3, requiredSlots: 4 },
    { code: "BCS586", credits: 3, requiredSlots: 4 },
    // 2 credit subjects (2 slots/week)
    { code: "BRMK557", credits: 2, requiredSlots: 2 },
    { code: "BCS508", credits: 2, requiredSlots: 2 }
];

// Priority Queue (Max-Heap) implementation
class PriorityQueue {
    constructor() {
        this.heap = [];
    }

    // Get parent index
    parent(i) {
        return Math.floor((i - 1) / 2);
    }

    // Get left child index
    leftChild(i) {
        return 2 * i + 1;
    }

    // Get right child index
    rightChild(i) {
        return 2 * i + 2;
    }

    // Swap two elements
    swap(i, j) {
        [this.heap[i], this.heap[j]] = [this.heap[j], this.heap[i]];
    }

    // Insert subject into heap
    push(subject) {
        this.heap.push({ ...subject }); // Clone subject
        this.heapifyUp(this.heap.length - 1);
    }

    // Move element up to maintain heap property
    heapifyUp(i) {
        while (i > 0 && this.heap[this.parent(i)].requiredSlots < this.heap[i].requiredSlots) {
            this.swap(i, this.parent(i));
            i = this.parent(i);
        }
    }

    // Extract max (highest priority)
    pop() {
        if (this.heap.length === 0) return null;
        if (this.heap.length === 1) return this.heap.pop();

        const max = this.heap[0];
        this.heap[0] = this.heap.pop();
        this.heapifyDown(0);
        return max;
    }

    // Move element down to maintain heap property
    heapifyDown(i) {
        let largest = i;
        const left = this.leftChild(i);
        const right = this.rightChild(i);

        if (left < this.heap.length && this.heap[left].requiredSlots > this.heap[largest].requiredSlots) {
            largest = left;
        }

        if (right < this.heap.length && this.heap[right].requiredSlots > this.heap[largest].requiredSlots) {
            largest = right;
        }

        if (largest !== i) {
            this.swap(i, largest);
            this.heapifyDown(largest);
        }
    }

    // Check if queue is empty
    isEmpty() {
        return this.heap.length === 0;
    }

    // Get size
    size() {
        return this.heap.length;
    }

    // Peek at top element without removing
    peek() {
        return this.heap.length > 0 ? this.heap[0] : null;
    }
}

// Generate timetable using weighted priority queue
function generateTimetable() {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const timetable = Array(5).fill(null).map(() => Array(8).fill(null));
    
    // Initialize priority queue with all subjects
    const pq = new PriorityQueue();
    SUBJECTS.forEach(subject => {
        pq.push({ ...subject });
    });

    // Generate for each day
    for (let day = 0; day < 5; day++) {
        let previousSubject = null;
        
        // Process each slot
        for (let slot = 0; slot < 8; slot++) {
            // Check if slot is a break
            if (TIME_SLOTS[slot].isBreak) {
                timetable[day][slot] = TIME_SLOTS[slot].label;
                previousSubject = null; // Reset previous subject after break
                continue;
            }

            // Get subject from priority queue
            let subject = pq.pop();
            const alternatives = [];
            
            // If same as previous, try to get alternatives
            if (subject && subject.code === previousSubject) {
                alternatives.push(subject);
                
                // Try to find a different subject
                while (!pq.isEmpty() && alternatives.length < pq.size() + 1) {
                    const nextSubject = pq.pop();
                    if (nextSubject.code !== previousSubject) {
                        // Found different subject
                        alternatives.forEach(alt => pq.push(alt));
                        subject = nextSubject;
                        break;
                    } else {
                        alternatives.push(nextSubject);
                    }
                }
                
                // If still same, we have no choice (push all back)
                if (subject.code === previousSubject) {
                    alternatives.forEach(alt => pq.push(alt));
                }
            }

            // If no subject available, mark as FREE
            if (!subject) {
                timetable[day][slot] = "FREE";
                previousSubject = null;
                continue;
            }

            // Assign subject
            timetable[day][slot] = subject.code;
            previousSubject = subject.code;

            // Decrement required slots and push back if > 0
            subject.requiredSlots--;
            if (subject.requiredSlots > 0) {
                pq.push(subject);
            }
        }
    }

    return timetable;
}

// Render generated timetable to table
function renderGeneratedTimetable(timetable) {
    const tbody = document.getElementById('generatedTimetableBody');
    if (!tbody) return;

    tbody.innerHTML = '';

    // Create rows for each time slot
    for (let slot = 0; slot < 8; slot++) {
        const row = document.createElement('tr');
        
        // Time slot column
        const timeCell = document.createElement('td');
        timeCell.textContent = TIME_SLOTS[slot].time;
        timeCell.style.fontWeight = '600';
        row.appendChild(timeCell);

        // Day columns
        for (let day = 0; day < 5; day++) {
            const cell = document.createElement('td');
            const value = timetable[day][slot];
            
            if (value === 'BREAK' || value === 'LUNCH') {
                cell.textContent = value;
                cell.style.fontWeight = '600';
                cell.style.color = '#f44336';
                cell.style.backgroundColor = 'rgba(244, 67, 54, 0.1)';
            } else if (value === 'FREE') {
                cell.textContent = value;
                cell.style.color = '#999';
                cell.style.fontStyle = 'italic';
            } else {
                cell.textContent = value;
                cell.style.fontWeight = '500';
                cell.style.color = '#667eea';
            }
            
            row.appendChild(cell);
        }

        tbody.appendChild(row);
    }
}

// Setup generate timetable button
function setupGenerateTimetable() {
    const generateBtn = document.getElementById('generateTimetableBtn');
    if (!generateBtn) return;

    generateBtn.addEventListener('click', () => {
        // Show loading state
        generateBtn.disabled = true;
        generateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...';

        // Generate timetable
        setTimeout(() => {
            const timetable = generateTimetable();
            renderGeneratedTimetable(timetable);
            
            // Reset button
            generateBtn.disabled = false;
            generateBtn.innerHTML = '<i class="fas fa-magic"></i> Generate Timetable Automatically';
            
            // Show success message
            if (typeof showToast === 'function') {
                showToast('Timetable generated successfully!', 'success');
            }
        }, 500);
    });
}

// ============================================
// TIMETABLE FORM HANDLERS
// ============================================

function setupTimetableForm() {
    const addBtn = document.getElementById('addTimetableEntryBtn');
    const formContainer = document.getElementById('timetable-form-container');
    const form = document.getElementById('timetableForm');
    const cancelBtn = document.getElementById('cancelTimetableEditBtn');

    if (addBtn && formContainer) {
        addBtn.addEventListener('click', () => {
            formContainer.classList.remove('hidden');
            form.reset();
            document.getElementById('timetableEntryId').value = '';
        });
    }

    if (cancelBtn && formContainer) {
        cancelBtn.addEventListener('click', () => {
            formContainer.classList.add('hidden');
            form.reset();
        });
    }

    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            // Handle form submission
            console.log('Timetable form submitted');
            // Add your save logic here
        });
    }
}

// ============================================
// TEACHER FORM HANDLERS
// ============================================

function setupTeacherForm() {
    const addBtn = document.getElementById('addTeacherBtn');
    const formContainer = document.getElementById('teacher-form-container');
    const form = document.getElementById('teacherForm');
    const cancelBtn = document.getElementById('cancelTeacherEditBtn');

    if (addBtn && formContainer) {
        addBtn.addEventListener('click', () => {
            formContainer.classList.remove('hidden');
            form.reset();
            document.getElementById('teacherId').value = '';
        });
    }

    if (cancelBtn && formContainer) {
        cancelBtn.addEventListener('click', () => {
            formContainer.classList.add('hidden');
            form.reset();
        });
    }

    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            // Handle form submission
            console.log('Teacher form submitted');
            // Add your save logic here
        });
    }
}

// ============================================
// STUDENT FORM HANDLERS
// ============================================

function setupStudentForm() {
    const addBtn = document.getElementById('addStudentBtn');
    const formContainer = document.getElementById('student-form-container');
    const form = document.getElementById('studentForm');
    const cancelBtn = document.getElementById('cancelStudentEditBtn');

    if (addBtn && formContainer) {
        addBtn.addEventListener('click', () => {
            formContainer.classList.remove('hidden');
            form.reset();
            document.getElementById('studentId').value = '';
        });
    }

    if (cancelBtn && formContainer) {
        cancelBtn.addEventListener('click', () => {
            formContainer.classList.add('hidden');
            form.reset();
        });
    }

    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            // Handle form submission
            console.log('Student form submitted');
            // Add your save logic here
        });
    }
}

// ============================================
// NOTIFICATION FORM HANDLERS
// ============================================

function setupNotificationForm() {
    const form = document.getElementById('notificationForm');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            // Handle notification submission
            console.log('Notification form submitted');
            // Add your notification logic here
        });
    }
}

