let statusChartInstance = null;
const projects = [
  {
    id: 1,
    name: "NFT Marketplace Upgrade",
    description: "Thêm search + drag drop + analytics",
    tasks: [
      { taskId: 1, title: "Design UI html", description: "Tạo layout UX/UI bằng html và css, tạo render cho 3 status và vào renderBoard()",status: "todo", priority: "high", assignee: "HTML", dueDate: "2026-02-20" },
      { taskId: 2, title: "Implement Drag Drop", description: "Thêm Kéo task giữa 3 cột, cập nhật status, Render lại board, Không thao tác DOM trực tiếp để đổi cột ",status: "in-progress", priority: "medium", assignee: "Javascript", dueDate: "2026-02-25" },
      { taskId: 3, title: "Deploy to production", description: "Deploy project to host and creat domain",status: "done", priority: "high", assignee: "PHP", dueDate: "2026-02-28" },
      { taskId: 4, title: "CRUD", description: "CRUD stands for Create, Read, Update, and Delete",status: "done", priority: "low", assignee: "Javascript", dueDate: "2026-02-28" },
      { taskId: 5, title: "Statistics Panel", description: "Render Total tasks - Done % - Overdue count and Create Chart Canvas",status: "todo", priority: "low", assignee: "BE", dueDate: "2026-02-12" }
    ]
  }
];

// function TaskItem({ taskId, title, description, status, priority, assignee, dueDate }) {
//     this.taskId = taskId;
//     this.title = title;
//     this.description = description || "";
//     this.status = status;
//     this.priority = priority;
//     this.assignee = assignee;
//     this.dueDate = dueDate;
// }

function TaskItem(obj) { // Nhận 1 object thay vì tách rời
    this.taskId = obj.taskId || obj.id; // Chấp nhận cả taskId hoặc id từ form add
    this.title = obj.title;
    this.description = obj.description || "";
    this.status = obj.status;
    this.priority = obj.priority;
    this.assignee = obj.assignee;
    this.dueDate = obj.dueDate;
}

// 3. Dựng Constructor cho Project
function Project({ id, name, description, tasks }) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.tasks = tasks.map(t => new TaskItem(t));
}

const projectInstances = projects.map(p => new Project(p));
const allTasks = projectInstances.flatMap(p => p.tasks);
/* --------------------1 Constructor & Prototype--------------------------- */
TaskItem.prototype.isTodo = function() {
    return this.status==="todo";
};
TaskItem.prototype.isInProgress = function() {
    return this.status==="in-progress";
};
TaskItem.prototype.isDone = function() {
    return this.status==="done";
};

TaskItem.prototype.getDisplayCard = function() {
    const priorityClass = `prio-${this.priority.toLowerCase()}`;
    return `
        <div class="task-card ${this.isOverdue() ? "overdue" : ""}" 
             draggable="true" 
             data-id="${this.taskId}">
            
            <div class="card-header">
                <span class="due-date-label">${this.dueDate}</span>
                <span class="priority-badge ${priorityClass}">${this.priority}</span>
            </div>

            <div class="card-body">
                <h4 class="task-title">${this.title}</h4>
                <p class="task-desc">${this.description}</p>
            </div>

            <div class="card-footer">
                <div class="assignee-circle ${this.assignee}"><i class="fa fa-user-o"></i>&nbsp;${this.assignee}</div>
                <div class="task-tool">
                    <button class="delete-btn" title="Delete Task"><i class="fa fa-trash-o"></i></button>
                    <button class="edit-btn" title="Edit Task"><i class="fa fa-pencil-square-o"></i></button>
                </div>
            </div>
        </div>
    `;
};
TaskItem.prototype.isOverdue = function() {
    const today = new Date();
    const due = new Date(this.dueDate);
    return due < today && this.status !== "done";
};
/* --------------------2 Render Board--------------------------- */
const todoContainer = document.getElementById('todoList');
const inProgressContainer = document.getElementById('inProgressList');
const doneContainer = document.getElementById('doneList')
function renderTodo(dataToRender = allTasks){
    const filtered = dataToRender.filter(p => p.isTodo());
    todoContainer.innerHTML = filtered.map(p => p.getDisplayCard()).join('');
}
function renderInProgress(dataToRender = allTasks){
    const filtered = dataToRender.filter(p => p.isInProgress());
    inProgressContainer.innerHTML = filtered.map(p => p.getDisplayCard()).join('');
}
function renderDone(dataToRender = allTasks){
    const filtered = dataToRender.filter(p => p.isDone());
    doneContainer.innerHTML = filtered.map(p => p.getDisplayCard()).join('');
}
function renderBoard(dataToRender = allTasks) {
    renderTodo(dataToRender);
    renderInProgress(dataToRender);
    renderDone(dataToRender);

    renderStatsLive();
    renderChart();
    updateStatistics();
}
renderBoard();
/* --------------------3 Add Task--------------------------- */
const title = document.getElementById('title');
const description = document.getElementById('description');
const priority = document.getElementById('priority'); 
const assignee = document.getElementById('assignee'); 
const dueDate = document.getElementById('dueDate'); 
const btnAdd = document.getElementById('btnAdd');

btnAdd.addEventListener('click', function(e){ 
    e.preventDefault(); 
    const maxId = allTasks.length > 0 ? Math.max(...allTasks.map(p => p.taskId)) : 0;
    const nextId = maxId + 1;
    const titleValue = title.value; 
    const descValue = description.value; 
    const priorityValue = priority.value; 
    const assigneeValue = assignee.value; 
    const dateValue = dueDate.value;

    if (titleValue.trim() !== "" && descValue.trim() !== "" && assigneeValue.trim() !== "" && dateValue !== "") { 
        const newTaskData = { 
            id: nextId, 
            title: titleValue, 
            description: descValue, 
            priority: priorityValue, 
            assignee: assigneeValue,
            dueDate: dateValue,
            status: "todo"
        };
        const newTask = new TaskItem(newTaskData);

        allTasks.push(newTask);
        
        renderBoard(); 
        renderAssignee();
        // Reset form
        title.value = "";
        description.value = ""; 
        assignee.value = "";
        dueDate.value = "";
    }else {
        alert("Vui lòng điền đầy đủ thông tin: Tiêu đề, mô tả, người thực hiện và ngày hạn!");
    }
});
/* --------------------4 Drag & Drop--------------------------- */
function handleDragStart(e) {
    const taskCard = e.target.closest('.task-card');
    if (taskCard) {
        e.dataTransfer.setData("text/plain", taskCard.dataset.id);
        taskCard.style.opacity = "0.5";
    }
}

// 2. Hàm dùng chung để reset độ mờ khi buông chuột
function handleDragEnd(e) {
    const taskCard = e.target.closest('.task-card');
    if (taskCard) taskCard.style.opacity = "1";
}

// 3. Đăng ký sự kiện thả 3 chỗ
[todoContainer, inProgressContainer, doneContainer].forEach(zone => {
    zone.addEventListener('dragstart', handleDragStart);
    zone.addEventListener('dragend', handleDragEnd);
    zone.addEventListener('dragover', (e) => e.preventDefault()); // Cho phép thả vào
});

inProgressContainer.addEventListener('drop', (e) => {
    e.preventDefault();
    const taskID = Number(e.dataTransfer.getData("text/plain"));
    const task = allTasks.find(p => p.taskId === taskID);
    if (task && task.status !== "in-progress" ) {
        task.status = "in-progress";
        renderBoard();
    }
});
doneContainer.addEventListener('drop', (e) => {
    e.preventDefault();
    const taskID = Number(e.dataTransfer.getData("text/plain"));
    const task = allTasks.find(p => p.taskId === taskID);
    if (task && task.status !== "done" ) {
        task.status = "done";
        renderBoard();
    }
});

todoContainer.addEventListener('drop', (e) => {
    e.preventDefault();
    const taskID = Number(e.dataTransfer.getData("text/plain"));
    const task = allTasks.find(p => p.taskId === taskID);
    if (task && task.status !== "todo") {
        task.status = "todo";
        renderBoard();
    }
});
/* --------------------5 Delete--------------------------- */
[todoList, inProgressList, doneList].forEach(container => {
    container.addEventListener('click', function(e) {
        const deleteBtn = e.target.closest('.delete-btn'); 
        if (deleteBtn) {
            const taskCard = deleteBtn.closest('.task-card');
            const idToRemove = Number(taskCard.dataset.id);
            const index = allTasks.findIndex(t => t.taskId === idToRemove);
            if (index !== -1) {
                allTasks.splice(index, 1); //splice để xóa thẳng data không cần remove xóa thẻ div
            }
            renderBoard();
        }
    });
});
/* ----------------------------6 Filter by Assignee----------------------- */
const selectContainer = document.getElementById('assigneeFilter')
function renderAssignee() {
    // Nếu 1 người làm nhiều task thì cũng chỉ hiện 1 tên
    const uniqueAssignees = [...new Set(allTasks.map(p => p.assignee))];

    // Tạo HTML: Dòng "All" đầu tiên + danh sách người dùng
    const optionsHTML = `
        <option value="all">All</option>
        ${uniqueAssignees.map(name => `<option value="${name}">${name}</option>`).join('')}
    `;

    selectContainer.innerHTML = optionsHTML;
}
renderAssignee();

TaskItem.prototype.taskAssign = function(selectedAssign) {
    // all thì ra tất cả
    if (selectedAssign === "all") return true;
    return this.assignee === selectedAssign; 
};
selectContainer.addEventListener('change', function() {
    // Lấy giá trị của option vừa chọn
    const selectedValue = this.value; 
    console.log(selectedValue)
    const otpValue = allTasks.filter(p => p.taskAssign(selectedValue));
    renderBoard(otpValue); 
});

/* -------------------------------7 Search-------------------------------- */
const searchInput= document.getElementById('searchInput');
searchInput.addEventListener("input", function(){
    const keyword = this.value.toLowerCase();
    if (keyword === "") {
        renderBoard();
        return;
    }
    const filtered = allTasks.filter(p =>
    p.title.toLowerCase().includes(keyword)
    );// starsWith(ThamSoSearch) để xem tham số mình nhâp vào có phải là chữ đầu của cụm nào đó k
    // Render lại chợ theo cái hằng filter đã lọc
    renderBoard(filtered);
})
/* ------------------------------- Statistics Panel ------------------------------- */
Project.prototype.getStats = function() {
    const total = this.tasks.length;

    const doneCount = this.tasks.filter(t => t.status === "done").length;

    const overdueCount = this.tasks.filter(t => t.isOverdue()).length;

    const donePercent = total === 0 ? 0 : Math.round((doneCount / total) * 100);

    return {
        total,
        donePercent,
        overdueCount
    };
};
function renderStatsLive() {
    const total = allTasks.length;

    const doneCount = allTasks.filter(t => t.status === "done").length;

    const overdueCount = allTasks.filter(t => t.isOverdue()).length;

    const donePercent = total === 0 
        ? 0 
        : Math.round((doneCount / total) * 100);

    document.getElementById("totalTasks").textContent = total;
    document.getElementById("donePercent").textContent = donePercent + "%";
    document.getElementById("overdueCount").textContent = overdueCount;
}
function renderChart() {
    const canvas = document.getElementById("statusChart");
    const ctx = canvas.getContext("2d");

    // Đếm số lượng theo status
    const todo = allTasks.filter(t => t.status === "todo").length;
    const inProgress = allTasks.filter(t => t.status === "in-progress").length;
    const done = allTasks.filter(t => t.status === "done").length;

    // Nếu chart đã tồn tại → hủy nó trước khi vẽ mới
    if (statusChartInstance) {
        statusChartInstance.destroy();
    }

    statusChartInstance = new Chart(ctx, {
        type: "doughnut",
        data: {
            labels: ["Todo", "In Progress", "Done"],
            datasets: [{
                data: [todo, inProgress, done],
                backgroundColor: [
                    "#0ea4e970",
                    "#f59f0b7e",
                    "#22c55e7f"
                ]
            }]
        },
        options: {
            responsive: false,
            plugins: {
                legend: {
                    position: "bottom"
                }
            }
        }
    });
}

function updateStatistics() {
    const total = allTasks.length;
    const doneCount = allTasks.filter(t => t.isDone()).length;
    const overdueCount = allTasks.filter(t => t.isOverdue()).length;

    const donePercent = total > 0 ? Math.round((doneCount / total) * 100) : 0;
    const overduePercent = total > 0 ? Math.round((overdueCount / total) * 100) : 0;

    document.getElementById('totalTasks').innerText = total;
    document.getElementById('donePercent').innerText = donePercent + "%";
    document.getElementById('overdueCount').innerText = overdueCount;

    document.getElementById('barDone').style.width = donePercent + "%";
    document.getElementById('barOverdue').style.width = overduePercent + "%";
    document.getElementById('barTotal').style.width = total > 0 ? "100%" : "0%";
}