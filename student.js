const STUDENT_TIME_SLOTS = [
    '9:30–10:20',
    '10:20–11:10',
    '11:10–11:20',
    '11:20–12:10',
    '12:10–1:00',
    '1:00–2:00',
    '2:00–3:00',
    '3:00–4:00',
];
const STUDENT_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

document.addEventListener('DOMContentLoaded', () => {
    initializeStudentDashboard();
});

async function initializeStudentDashboard() {
    await loadStudentTimetable();
    updateAttendanceSummary([]);
}

function mapStudentTimetable(timetableDocs = []) {
    const map = {};
    timetableDocs.forEach((entry) => {
        map[entry.day] = entry.slots;
    });
    return map;
}

async function loadStudentTimetable() {
    const tbody = document.getElementById('studentTimetableBody');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="5" class="text-center">Loading your timetable...</td></tr>';

    try {
        const timetable = await apiFetch('/timetable');
        renderStudentTimetable(timetable);
        updateAttendanceSummary(timetable);
    } catch (error) {
        console.error('Failed to load student timetable:', error);
        tbody.innerHTML = '<tr><td colspan="5" class="text-center">Unable to load timetable.</td></tr>';
    }
}

function renderStudentTimetable(timetableDocs = []) {
    const tbody = document.getElementById('studentTimetableBody');
    if (!tbody) return;

    tbody.innerHTML = '';
    const matrix = mapStudentTimetable(timetableDocs);
    let hasData = false;

    STUDENT_DAYS.forEach((day) => {
        const slots = matrix[day] || [];
        slots.forEach((subjectCode, slotIndex) => {
            if (!subjectCode || subjectCode === 'BREAK' || subjectCode === 'LUNCH') {
                return;
            }
            hasData = true;
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${subjectCode}</td>
                <td>–</td>
                <td>${day}</td>
                <td>${STUDENT_TIME_SLOTS[slotIndex]}</td>
                <td>–</td>
            `;
            tbody.appendChild(row);
        });
    });

    if (!hasData) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center">No timetable available yet.</td></tr>';
    }
}

function updateAttendanceSummary(timetableDocs = []) {
    const attendanceBody = document.getElementById('studentAttendanceBody');
    if (!attendanceBody) return;

    const subjectCounts = {};
    timetableDocs.forEach((entry) => {
        entry.slots.forEach((slot) => {
            if (slot && slot !== 'BREAK' && slot !== 'LUNCH' && slot !== 'FREE') {
                subjectCounts[slot] = (subjectCounts[slot] || 0) + 1;
            }
        });
    });

    const subjects = Object.keys(subjectCounts);
    if (!subjects.length) {
        attendanceBody.innerHTML = '<tr><td colspan="4" class="text-center">Attendance data will appear once timetable is available.</td></tr>';
        const overall = document.getElementById('overallAttendancePercentage');
        if (overall) overall.textContent = '--%';
        return;
    }

    attendanceBody.innerHTML = '';
    subjects.forEach((code) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${code}</td>
            <td>${subjectCounts[code]}</td>
            <td>--</td>
            <td>--%</td>
        `;
        attendanceBody.appendChild(row);
    });

    const overall = document.getElementById('overallAttendancePercentage');
    if (overall) overall.textContent = '--%';
}

