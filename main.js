const taskForm = document.getElementById('task-form');
const titleInput = document.getElementById('task-title');
const descInput = document.getElementById('task-desc');
const dueInput = document.getElementById('task-due');
const tasksList = document.getElementById('tasks-list');
const doneList = document.getElementById('done-list');

let tasks = [];

// تحميل المهام من LocalStorage عند بدء الصفحة
if (localStorage.getItem('tasks')) {
    try {
        tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    } catch { tasks = []; }
}

function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

function formatTimeDiff(diffMs) {
    if (diffMs < 0) diffMs = -diffMs;
    const mins = Math.floor(diffMs / 60000) % 60;
    const hours = Math.floor(diffMs / 3600000) % 24;
    const days = Math.floor(diffMs / 86400000);
    let str = '';
    if (days > 0) str += days + (days === 1 ? ' day ' : ' days ');
    if (hours > 0) str += hours + (hours === 1 ? ' hour ' : ' hours ');
    if (mins > 0 && days === 0) str += mins + (mins === 1 ? ' min' : ' mins');
    return str.trim();
}

function renderTasks() {
    tasksList.innerHTML = '';
    doneList.innerHTML = '';
    const now = new Date();
    tasks.forEach((task, i) => {
        const li = document.createElement('li');
        li.className = 'task-item';
        if (task.completed) li.classList.add('completed');
        const dueDate = new Date(task.due);
        const diff = dueDate - now;
        const isLate = !task.completed && diff < 0;
        const isWarning = !task.completed && diff > 0 && diff <= 3600000; // أقل من ساعة
        // main row
        const main = document.createElement('div');
        main.className = 'task-main';
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = task.completed;
        checkbox.onchange = () => {
            if (!task.completed) {
                flipAnimation(() => {
                    task.completed = true;
                    saveTasks();
                    renderTasks();
                });
            } else {
                task.completed = false;
                saveTasks();
                renderTasks();
            }
        };
        const title = document.createElement('span');
        title.className = 'task-title';
        title.textContent = task.title;
        main.appendChild(checkbox);
        main.appendChild(title);
        // delete btn
        const del = document.createElement('button');
        del.className = 'delete-btn';
        del.textContent = 'Delete';
        del.onclick = () => {
            li.classList.add('removing');
            setTimeout(() => {
                tasks.splice(i, 1);
                saveTasks();
                renderTasks();
            }, 480);
        };
        main.appendChild(del);
        li.appendChild(main);
        // description
        if (task.desc) {
            const desc = document.createElement('div');
            desc.className = 'task-desc';
            desc.textContent = task.desc;
            li.appendChild(desc);
        }
        // due date & time remaining
        const due = document.createElement('div');
        due.className = 'task-due';
        due.textContent = 'Due: ' + new Date(task.due).toLocaleString();
        li.appendChild(due);
        // time remaining
        if (!task.completed) {
            const timeDiv = document.createElement('div');
            timeDiv.className = 'time-remaining';
            if (isLate) {
                timeDiv.classList.add('time-late');
                timeDiv.textContent = 'Overdue by ' + formatTimeDiff(diff);
            } else if (isWarning) {
                timeDiv.classList.add('time-warning');
                timeDiv.textContent = 'Due in ' + formatTimeDiff(diff) + ' (less than 1 hour!)';
            } else {
                timeDiv.textContent = 'Due in ' + formatTimeDiff(diff);
            }
            li.appendChild(timeDiv);
        }
        if (task.completed) {
            doneList.appendChild(li);
        } else {
            tasksList.appendChild(li);
        }
    });
}

taskForm.onsubmit = e => {
    e.preventDefault();
    const title = titleInput.value.trim();
    const desc = descInput.value.trim();
    const due = dueInput.value;
    if (!title || !due) return;
    tasks.push({ title, desc, due, completed: false });
    titleInput.value = '';
    descInput.value = '';
    dueInput.value = '';
    saveTasks();
    renderTasks();
};

// تحديث الوقت المتبقي كل دقيقة تلقائياً
setInterval(renderTasks, 60000);

// ثيم داكن/فاتح
const themeToggle = document.getElementById('theme-toggle');
function setTheme(dark) {
    document.body.classList.toggle('dark', dark);
    themeToggle.textContent = dark ? '☀️' : '🌙';
    localStorage.setItem('theme', dark ? 'dark' : 'light');
}
// تحميل الثيم من LocalStorage
setTheme(localStorage.getItem('theme') === 'dark');
themeToggle.onclick = () => {
    setTheme(!document.body.classList.contains('dark'));
};

// تفعيل Flatpickr على حقل التاريخ
flatpickr("#task-due", {
    enableTime: true,
    dateFormat: "Y-m-d H:i",
    minDate: "today",
    time_24hr: true,
    theme: document.body.classList.contains('dark') ? 'dark' : 'light',
});
// تبديل ثيم Flatpickr مع تبديل الثيم العام
if (window.MutationObserver) {
    new MutationObserver(() => {
        const fp = document.querySelector('.flatpickr-calendar');
        if (fp) {
            if (document.body.classList.contains('dark')) {
                fp.classList.add('dark');
            } else {
                fp.classList.remove('dark');
            }
        }
    }).observe(document.body, { attributes: true, attributeFilter: ['class'] });
}

function flipAnimation(onChange) {
    // 1. احفظ مواقع العناصر قبل التغيير
    const items = Array.from(document.querySelectorAll('.task-item'));
    const firstRects = items.map(item => item.getBoundingClientRect());
    // 2. نفذ التغيير
    onChange();
    // 3. احفظ المواقع بعد التغيير
    const newItems = Array.from(document.querySelectorAll('.task-item'));
    const lastRects = newItems.map(item => item.getBoundingClientRect());
    // 4. احسب الفرق وطبق transform
    newItems.forEach((item, i) => {
        const first = firstRects[i];
        const last = lastRects[i];
        if (!first || !last) return;
        const dx = first.left - last.left;
        const dy = first.top - last.top;
        item.style.transition = 'none';
        item.style.transform = `translate(${dx}px, ${dy}px)`;
        requestAnimationFrame(() => {
            item.style.transition = 'transform 0.6s cubic-bezier(.68,-0.55,.27,1.55)';
            item.style.transform = '';
        });
    });
}

renderTasks(); 