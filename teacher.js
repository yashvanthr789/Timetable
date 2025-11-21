const TEACHER_TIME_SLOTS = [
    '9:30–10:20',
    '10:20–11:10',
    '11:10–11:20',
    '11:20–12:10',
    '12:10–1:00',
    '1:00–2:00',
    '2:00–3:00',
    '3:00–4:00',
];
const TEACHER_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

document.addEventListener('DOMContentLoaded', () => {
    loadTeacherDashboard();
});

async function loadTeacherDashboard() {
    await loadTeacherTimetable();
}

function mapTimetable(timetableDocs = []) {
    const map = {};
    timetableDocs.forEach((entry) => {
        map[entry.day] = entry.slots;
    });
    return map;
}

async function loadTeacherTimetable() {
    const tbody = document.getElementById('teacherTimetableBody');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="5" class="text-center">Loading...</td></tr>';

    try {
        const timetable = await apiFetch('/timetable');
        renderTeacherTimetable(timetable);
    } catch (error) {
        console.error('Failed to load timetable:', error);
        tbody.innerHTML = '<tr><td colspan="5" class="text-center">Unable to load timetable.</td></tr>';
    }
}

function renderTeacherTimetable(timetableDocs = []) {
    const tbody = document.getElementById('teacherTimetableBody');
    if (!tbody) return;

    tbody.innerHTML = '';
    const matrix = mapTimetable(timetableDocs);
    let hasData = false;

    TEACHER_DAYS.forEach((day) => {
        const slots = matrix[day] || [];
        slots.forEach((subjectCode, slotIndex) => {
            if (!subjectCode || subjectCode === 'BREAK' || subjectCode === 'LUNCH') {
                return;
            }
            hasData = true;
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${subjectCode}</td>
                <td>-</td>
                <td>${day}</td>
                <td>${TEACHER_TIME_SLOTS[slotIndex]}</td>
                <td>-</td>
            `;
            tbody.appendChild(row);
        });
    });

    if (!hasData) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center">No scheduled classes yet.</td></tr>';
    }
}

