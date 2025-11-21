// Admin Dashboard JavaScript
const TIME_SLOTS = [
    '9:30–10:20',
    '10:20–11:10',
    '11:10–11:20',
    '11:20–12:10',
    '12:10–1:00',
    '1:00–2:00',
    '2:00–3:00',
    '3:00–4:00',
];
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

document.addEventListener('DOMContentLoaded', () => {
    initializeAdminDashboard();
});

async function initializeAdminDashboard() {
    setupTimetableForm();
    setupTeacherForm();
    setupStudentForm();
    setupNotificationForm();
    await Promise.all([loadSubjects(), loadExistingTimetable(), loadTeachers(), loadStudents()]);
}

// ============================================
// Subjects + Timetable Helpers
// ============================================

async function loadSubjects() {
    try {
        const subjects = await apiFetch('/subjects');
        window.subjectsCache = subjects;
    } catch (error) {
        console.error('Failed to load subjects:', error);
        showToast('Unable to load subjects', 'error');
    }
}

async function loadExistingTimetable() {
    try {
        const timetable = await apiFetch('/timetable');
        if (timetable && timetable.length) {
            renderTimetable(timetable);
        }
    } catch (error) {
        console.error('Failed to load timetable:', error);
    }
}

function formatTimetableMatrix(timetableDocs = []) {
    const matrix = {};
    timetableDocs.forEach((entry) => {
        matrix[entry.day] = entry.slots;
    });
    return matrix;
}

// Helper function to find time slot index from start and end times
function findTimeSlotIndex(startTime, endTime) {
    // Convert HH:MM format to minutes for comparison
    const timeToMinutes = (timeStr) => {
        const [hours, minutes] = timeStr.split(':').map(Number);
        return hours * 60 + minutes;
    };

    const startMinutes = timeToMinutes(startTime);
    const endMinutes = timeToMinutes(endTime);

    // Match against TIME_SLOTS
    for (let i = 0; i < TIME_SLOTS.length; i++) {
        const slot = TIME_SLOTS[i];
        const [slotStart, slotEnd] = slot.split('–').map(s => s.trim());
        
        // Parse slot times (handle formats like "9:30", "11:10", "1:00")
        const parseSlotTime = (timeStr) => {
            const [hours, minutes] = timeStr.split(':').map(Number);
            return hours * 60 + minutes;
        };

        try {
            const slotStartMinutes = parseSlotTime(slotStart);
            const slotEndMinutes = parseSlotTime(slotEnd);

            // Check if the provided time matches this slot (with some tolerance)
            if (Math.abs(startMinutes - slotStartMinutes) <= 5 && 
                Math.abs(endMinutes - slotEndMinutes) <= 5) {
                return i;
            }
        } catch (e) {
            continue;
        }
    }

    return -1;
}

function renderTimetable(timetableDocs) {
    const tbody = document.getElementById('timetableBody');
    if (!tbody) return;

    tbody.innerHTML = '';
    const matrix = formatTimetableMatrix(timetableDocs);

    for (let slot = 0; slot < TIME_SLOTS.length; slot++) {
        const row = document.createElement('tr');

        const timeCell = document.createElement('td');
        timeCell.textContent = TIME_SLOTS[slot];
        timeCell.style.fontWeight = '600';
        row.appendChild(timeCell);

        DAYS.forEach((day) => {
            const cell = document.createElement('td');
            const slots = matrix[day] || [];
            const value = slots[slot] || 'FREE';

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
        });

        tbody.appendChild(row);
    }
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
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const courseName = document.getElementById('courseName').value.trim();
            const teacher = document.getElementById('teacher').value.trim();
            const studentGroup = document.getElementById('studentGroup').value.trim();
            const dayOfWeek = document.getElementById('dayOfWeek').value;
            const startTime = document.getElementById('startTime').value;
            const endTime = document.getElementById('endTime').value;
            const room = document.getElementById('room').value.trim();

            if (!courseName || !teacher || !studentGroup || !dayOfWeek || !startTime || !endTime || !room) {
                showToast('Please fill in all fields.', 'error');
                return;
            }

            // Validate day
            if (!DAYS.includes(dayOfWeek)) {
                showToast('Invalid day selected. Please select a weekday (Monday-Friday).', 'error');
                return;
            }

            try {
                // Find matching time slot index
                const slotIndex = findTimeSlotIndex(startTime, endTime);
                if (slotIndex === -1) {
                    showToast('Time slot does not match any predefined slot. Please check the time.', 'error');
                    return;
                }

                // Format the entry (combine course, teacher, group, room)
                const entryText = `${courseName} (${teacher}, ${studentGroup}, ${room})`;

                // Fetch current timetable
                let currentTimetable = await apiFetch('/timetable');
                
                // Initialize timetable structure if empty
                if (!currentTimetable || currentTimetable.length === 0) {
                    currentTimetable = DAYS.map(day => ({
                        day: day,
                        slots: Array(TIME_SLOTS.length).fill('FREE')
                    }));
                }

                // Convert to matrix format for easier manipulation
                const timetableMatrix = formatTimetableMatrix(currentTimetable);
                
                // Ensure all days exist
                DAYS.forEach(day => {
                    if (!timetableMatrix[day]) {
                        timetableMatrix[day] = Array(TIME_SLOTS.length).fill('FREE');
                    }
                });

                // Set break and lunch slots
                timetableMatrix['Monday'][2] = 'BREAK'; // 11:10–11:20
                timetableMatrix['Monday'][5] = 'LUNCH'; // 1:00–2:00
                DAYS.forEach(day => {
                    timetableMatrix[day][2] = 'BREAK';
                    timetableMatrix[day][5] = 'LUNCH';
                });

                // Update the specific slot
                timetableMatrix[dayOfWeek][slotIndex] = entryText;

                // Convert back to array format
                const timetableToSave = DAYS.map(day => ({
                    day: day,
                    slots: timetableMatrix[day]
                }));

                // Save to backend
                await apiFetch('/timetable/save', {
                    method: 'POST',
                    body: JSON.stringify({ timetable: timetableToSave })
                });

                showToast('Timetable entry saved successfully!', 'success');
                formContainer.classList.add('hidden');
                form.reset();
                document.getElementById('timetableEntryId').value = '';
                
                // Reload timetable display
                await loadExistingTimetable();
            } catch (error) {
                console.error('Error saving timetable entry:', error);
                showToast(error.message || 'Failed to save timetable entry.', 'error');
            }
        });
    }
}

// ============================================
// TEACHER FORM HANDLERS
// ============================================

let currentEditingTeacherId = null;

async function loadTeachers() {
    try {
        const teachers = await apiFetch('/users?role=teacher');
        window.teachersCache = teachers;
        renderTeachersTable(teachers);
        populateTeacherDropdown(teachers);
    } catch (error) {
        console.error('Failed to load teachers:', error);
        showToast('Unable to load teachers', 'error');
    }
}

function renderTeachersTable(teachers) {
    const tbody = document.getElementById('teachersBody');
    if (!tbody) return;

    if (!teachers || teachers.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center">No teachers registered yet.</td></tr>';
        return;
    }

    tbody.innerHTML = '';
    teachers.forEach(teacher => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${teacher.name}</td>
            <td>${teacher.username}</td>
            <td>-</td>
            <td>
                <button class="btn-secondary" onclick="editTeacher('${teacher.id}')"><i class="fas fa-edit"></i> Edit</button>
                <button class="btn-danger" onclick="deleteTeacher('${teacher.id}')"><i class="fas fa-trash"></i> Delete</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function populateTeacherDropdown(teachers) {
    const select = document.getElementById('teacher');
    if (!select) return;

    select.innerHTML = '<option value="">Select a teacher</option>';
    teachers.forEach(teacher => {
        const option = document.createElement('option');
        option.value = teacher.name;
        option.textContent = teacher.name;
        select.appendChild(option);
    });
}

function setupTeacherForm() {
    const addBtn = document.getElementById('addTeacherBtn');
    const formContainer = document.getElementById('teacher-form-container');
    const form = document.getElementById('teacherForm');
    const cancelBtn = document.getElementById('cancelTeacherEditBtn');

    if (addBtn && formContainer) {
        addBtn.addEventListener('click', () => {
            formContainer.classList.remove('hidden');
            form.reset();
            currentEditingTeacherId = null;
            document.getElementById('teacherId').value = '';
        });
    }

    if (cancelBtn && formContainer) {
        cancelBtn.addEventListener('click', () => {
            formContainer.classList.add('hidden');
            form.reset();
            currentEditingTeacherId = null;
        });
    }

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const name = document.getElementById('teacherName').value.trim();
            const email = document.getElementById('teacherEmail').value.trim();
            const subject = document.getElementById('teacherSubject').value.trim();

            if (!name || !email) {
                showToast('Please fill in all required fields.', 'error');
                return;
            }

            try {
                if (currentEditingTeacherId) {
                    // Update existing teacher
                    await apiFetch(`/users/${currentEditingTeacherId}`, {
                        method: 'PUT',
                        body: JSON.stringify({ name, username: email })
                    });
                    showToast('Teacher updated successfully!', 'success');
                } else {
                    // Create new teacher
                    await apiFetch('/users', {
                        method: 'POST',
                        body: JSON.stringify({
                            name,
                            username: email,
                            password: 'teacher123', // Default password
                            role: 'teacher'
                        })
                    });
                    showToast('Teacher created successfully! Default password: teacher123', 'success');
                }

                formContainer.classList.add('hidden');
                form.reset();
                currentEditingTeacherId = null;
                await loadTeachers();
            } catch (error) {
                console.error('Error saving teacher:', error);
                showToast(error.message || 'Failed to save teacher.', 'error');
            }
        });
    }
}

window.editTeacher = async function(teacherId) {
    const formContainer = document.getElementById('teacher-form-container');
    const form = document.getElementById('teacherForm');
    
    try {
        const teachers = window.teachersCache || [];
        const teacher = teachers.find(t => t.id === teacherId);
        
        if (teacher) {
            currentEditingTeacherId = teacherId;
            document.getElementById('teacherId').value = teacherId;
            document.getElementById('teacherName').value = teacher.name;
            document.getElementById('teacherEmail').value = teacher.username;
            document.getElementById('teacherSubject').value = '';
            formContainer.classList.remove('hidden');
        }
    } catch (error) {
        console.error('Error loading teacher:', error);
        showToast('Failed to load teacher details.', 'error');
    }
};

window.deleteTeacher = async function(teacherId) {
    if (!confirm('Are you sure you want to delete this teacher?')) return;

    try {
        await apiFetch(`/users/${teacherId}`, { method: 'DELETE' });
        showToast('Teacher deleted successfully!', 'success');
        await loadTeachers();
    } catch (error) {
        console.error('Error deleting teacher:', error);
        showToast(error.message || 'Failed to delete teacher.', 'error');
    }
};

// ============================================
// STUDENT FORM HANDLERS
// ============================================

let currentEditingStudentId = null;

async function loadStudents() {
    try {
        const students = await apiFetch('/users?role=student');
        window.studentsCache = students;
        renderStudentsTable(students);
    } catch (error) {
        console.error('Failed to load students:', error);
        showToast('Unable to load students', 'error');
    }
}

function renderStudentsTable(students) {
    const tbody = document.getElementById('studentsBody');
    if (!tbody) return;

    if (!students || students.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center">No students registered yet.</td></tr>';
        return;
    }

    tbody.innerHTML = '';
    students.forEach(student => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${student.name}</td>
            <td>${student.username}</td>
            <td>-</td>
            <td>
                <button class="btn-secondary" onclick="editStudent('${student.id}')"><i class="fas fa-edit"></i> Edit</button>
                <button class="btn-danger" onclick="deleteStudent('${student.id}')"><i class="fas fa-trash"></i> Delete</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function setupStudentForm() {
    const addBtn = document.getElementById('addStudentBtn');
    const formContainer = document.getElementById('student-form-container');
    const form = document.getElementById('studentForm');
    const cancelBtn = document.getElementById('cancelStudentEditBtn');

    if (addBtn && formContainer) {
        addBtn.addEventListener('click', () => {
            formContainer.classList.remove('hidden');
            form.reset();
            currentEditingStudentId = null;
            document.getElementById('studentId').value = '';
        });
    }

    if (cancelBtn && formContainer) {
        cancelBtn.addEventListener('click', () => {
            formContainer.classList.add('hidden');
            form.reset();
            currentEditingStudentId = null;
        });
    }

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const name = document.getElementById('studentName').value.trim();
            const email = document.getElementById('studentEmail').value.trim();
            const group = document.getElementById('studentGroupInput').value.trim();

            if (!name || !email) {
                showToast('Please fill in all required fields.', 'error');
                return;
            }

            try {
                if (currentEditingStudentId) {
                    // Update existing student
                    await apiFetch(`/users/${currentEditingStudentId}`, {
                        method: 'PUT',
                        body: JSON.stringify({ name, username: email })
                    });
                    showToast('Student updated successfully!', 'success');
                } else {
                    // Create new student
                    await apiFetch('/users', {
                        method: 'POST',
                        body: JSON.stringify({
                            name,
                            username: email,
                            password: 'student123', // Default password
                            role: 'student'
                        })
                    });
                    showToast('Student created successfully! Default password: student123', 'success');
                }

                formContainer.classList.add('hidden');
                form.reset();
                currentEditingStudentId = null;
                await loadStudents();
            } catch (error) {
                console.error('Error saving student:', error);
                showToast(error.message || 'Failed to save student.', 'error');
            }
        });
    }
}

window.editStudent = async function(studentId) {
    const formContainer = document.getElementById('student-form-container');
    const form = document.getElementById('studentForm');
    
    try {
        const students = window.studentsCache || [];
        const student = students.find(s => s.id === studentId);
        
        if (student) {
            currentEditingStudentId = studentId;
            document.getElementById('studentId').value = studentId;
            document.getElementById('studentName').value = student.name;
            document.getElementById('studentEmail').value = student.username;
            document.getElementById('studentGroupInput').value = '';
            formContainer.classList.remove('hidden');
        }
    } catch (error) {
        console.error('Error loading student:', error);
        showToast('Failed to load student details.', 'error');
    }
};

window.deleteStudent = async function(studentId) {
    if (!confirm('Are you sure you want to delete this student?')) return;

    try {
        await apiFetch(`/users/${studentId}`, { method: 'DELETE' });
        showToast('Student deleted successfully!', 'success');
        await loadStudents();
    } catch (error) {
        console.error('Error deleting student:', error);
        showToast(error.message || 'Failed to delete student.', 'error');
    }
};

// ============================================
// NOTIFICATION FORM HANDLERS
// ============================================

function setupNotificationForm() {
    const form = document.getElementById('notificationForm');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const recipient = document.getElementById('notificationRecipient').value;
            const message = document.getElementById('notificationMessage').value.trim();

            if (!message) {
                showToast('Please enter a notification message.', 'error');
                return;
            }

            try {
                // Store notification locally
                const notification = {
                    recipient,
                    message,
                    timestamp: new Date().toISOString(),
                    sender: 'Admin'
                };

                // Save to localStorage
                const notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
                notifications.unshift(notification);
                localStorage.setItem('notifications', JSON.stringify(notifications.slice(0, 50)));

                // Display in list
                const list = document.getElementById('sentNotificationsList');
                if (list) {
                    const li = document.createElement('li');
                    const date = new Date(notification.timestamp).toLocaleString();
                    li.innerHTML = `<small>[${date}]</small> <strong>${notification.sender}:</strong> ${notification.message} (To: ${recipient})`;
                    list.insertBefore(li, list.firstChild);
                }

                showToast('Notification sent successfully!', 'success');
                form.reset();

                // If socket.io is available, emit event
                if (window.socket && window.socket.connected) {
                    window.socket.emit('notification', notification);
                }
            } catch (error) {
                console.error('Error sending notification:', error);
                showToast('Failed to send notification.', 'error');
            }
        });
    }
}

