// ---------------- Imports ----------------
import { database } from './firebase-config.js';
import { ref, push, onValue, update, onChildAdded, remove } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-database.js";

// ---------------- NAVIGATION ----------------
const homeBtn = document.getElementById("home-btn");
const chatBtn = document.getElementById("chat-btn");
const tasksBtn = document.getElementById("tasks-btn");

const home = document.getElementById("home-container");
const chat = document.getElementById("chat-container");
const tasks = document.getElementById("tasks-container");

function show(page, btn) {
    home.classList.add("hidden");
    chat.classList.add("hidden");
    tasks.classList.add("hidden");

    homeBtn.classList.remove("active");
    chatBtn.classList.remove("active");
    tasksBtn.classList.remove("active");

    page.classList.remove("hidden");
    btn.classList.add("active");
}

homeBtn.onclick = () => show(home, homeBtn);
chatBtn.onclick = () => show(chat, chatBtn);
tasksBtn.onclick = () => show(tasks, tasksBtn);

// ---------------- CHAT ----------------
const chatBox = document.getElementById("chat-box");
const input = document.getElementById("message-input");
const sendBtn = document.getElementById("send-btn");
const clearBtn = document.getElementById("clear-btn");
const fileInput = document.getElementById("file-input");
const aiBtn = document.getElementById("ai-btn");

let aiMode = false;
const currentUserId = "user_" + Math.floor(Math.random() * 1000000);

// Toggle AI
aiBtn.onclick = () => {
    aiMode = !aiMode;
    aiBtn.textContent = aiMode ? "Disable AI" : "Ask AI";
};

async function uploadFileToCloudinary(file) {
    const url = `https://api.cloudinary.com/v1_1/dkhrkcl5j/upload`;
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "student_upload");

    try {
        const response = await fetch(url, {
            method: "POST",
            body: formData
        });
        const data = await response.json();
        return data.secure_url; // URL of uploaded file
    } catch (err) {
        console.error("Cloudinary upload failed:", err);
        return null;
    }
}

// Send message
sendBtn.onclick = async () => {
    const text = input.value.trim();
    const file = fileInput.files[0];
    if (!text && !file) return;

    let messageData = {
        text: text || "",
        timestamp: Date.now(),
        user: currentUserId
    };

    if (file) {
        try {
            const fileUrl = await uploadFileToCloudinary(file); // Your upload function
            if (fileUrl) {
                messageData.fileUrl = fileUrl;
                messageData.fileName = file.name;
                messageData.fileType = file.type;
            }
        } catch (err) {
            console.error("Upload failed:", err);
            return; // stop sending if upload failed
        }
    }

    // Push message to Firebase
    push(ref(database, "messages"), messageData);

    // Clear inputs
    input.value = "";
    fileInput.value = "";

    // AI response if enabled
    if (aiMode) sendToAI(messageData);
};

// Listen for messages
onChildAdded(ref(database, "messages"), snapshot => {
    const msg = snapshot.val();
    const div = document.createElement("div");
    div.classList.add("message", msg.user === currentUserId ? "you" : "other");

    if (msg.text) {
        const p = document.createElement("p");
        p.textContent = msg.text;
        div.appendChild(p);
    }

    if (msg.fileUrl && msg.fileType.startsWith("image")) {
    	const img = document.createElement("img");
    	img.src = msg.fileUrl;
    	img.style.maxWidth = "200px";
    	img.style.borderRadius = "10px";
    	div.appendChild(img);
    }

    chatBox.appendChild(div);
    chatBox.scrollTop = chatBox.scrollHeight;
});

// Clear all messages
clearBtn.onclick = () => {
    remove(ref(database, "messages"));
    chatBox.innerHTML = "";
};

// ---------------- AI ----------------
async function sendToAI(messageData) {
    const aiDiv = document.createElement("div");
    aiDiv.classList.add("message", "other");
    aiDiv.innerHTML = "<p>AI is typing...</p>";
    chatBox.appendChild(aiDiv);
    chatBox.scrollTop = chatBox.scrollHeight;

    try {
        const response = await fetch("http://localhost:3000/api/ask", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: messageData.text })
        });

        const data = await response.json();
        aiDiv.innerHTML = `<p>${data.reply}</p>`;
        chatBox.scrollTop = chatBox.scrollHeight;

    } catch (err) {
        console.error(err);
        aiDiv.innerHTML = "<p>AI request failed.</p>";
    }
}

// ---------------- TASKS ----------------
const taskInput = document.getElementById("task-input");
const addTaskBtn = document.getElementById("add-task-btn");
const tasksList = document.getElementById("tasks-list");

// -------- ANALYTICS BARS --------
const productivityBar = document.getElementById("productivity-bar");
const remainingBar = document.getElementById("remaining-bar");
const totalBar = document.getElementById("total-bar");

// -------- ADD TASK --------
addTaskBtn.onclick = () => {
    const text = taskInput.value.trim();
    if (!text) return;

    const taskData = {
        text: text,
        done: false,
        timestamp: Date.now()
    };

    // Push to Firebase
    push(ref(database, "tasks"), taskData);

    taskInput.value = "";
};

// Listen for tasks in Firebase and render
onValue(ref(database, "tasks"), (snapshot) => {

    tasksList.innerHTML = "";

    let totalTasks = 0;
    let doneTasks = 0;

    snapshot.forEach(child => {
        const task = child.val();
        const taskId = child.key;

        totalTasks++;
        if (task.done) doneTasks++;

        // Create task container
        const taskDiv = document.createElement("div");
        taskDiv.className = "task-item";

        // Task text
        const span = document.createElement("span");
        span.className = "task-text";
        span.textContent = task.text;
        if (task.done) span.style.textDecoration = "line-through";

        // Done/Undo button
        const doneBtn = document.createElement("button");
        doneBtn.className = "task-btn done-btn";
        doneBtn.textContent = task.done ? "Undo" : "Done";
        doneBtn.onclick = () => {
            update(ref(database, "tasks/" + taskId), { done: !task.done });
        };

        // Delete button
        const deleteBtn = document.createElement("button");
        deleteBtn.className = "task-btn delete-task";
        deleteBtn.textContent = "Delete";
        deleteBtn.onclick = () => {
            remove(ref(database, "tasks/" + taskId));
        };

        // Append elements
        taskDiv.appendChild(span);
        taskDiv.appendChild(doneBtn);
        taskDiv.appendChild(deleteBtn);
        tasksList.appendChild(taskDiv);
    });

    // -------- UPDATE ANALYTICS --------
    const remainingTasks = totalTasks - doneTasks;

    if (totalTasks === 0) {
        productivityBar.style.width = "0%";
        remainingBar.style.width = "0%";
        totalBar.style.width = "0%";
        return;
    }

    const productivityPercent = (doneTasks / totalTasks) * 100;
    const remainingPercent = (remainingTasks / totalTasks) * 100;

    productivityBar.style.width = productivityPercent + "%";
    remainingBar.style.width = remainingPercent + "%";
    totalBar.style.width = "100%";
});

// ---------------- VIDEO BAR ----------------
document.addEventListener("DOMContentLoaded", () => {

    const khanVideos = [
	"https://www.youtube.com/embed/3tisOnOkwzo", // CrashCourse: Scientific Method
	"https://www.youtube.com/embed/5iTOphGnCtg", // CrashCourse: Ecosystems
	"https://www.youtube.com/embed/ZAqIoDhornk", // CrashCourse: Cells
	"https://www.youtube.com/embed/NybHckSEQBI", // CrashCourse: Atoms & Elements
	"https://www.youtube.com/embed/aircAruvnKk", // CrashCourse: Periodic Table
	"https://www.youtube.com/embed/kKiz8Wzcfc8", // CrashCourse: Forces & Motion
	"https://www.youtube.com/embed/CMiPYHNNg28", // CrashCourse: Energy
	"https://www.youtube.com/embed/Yrf3Z_TQu_k", // MinutePhysics: Black holes
	"https://www.youtube.com/embed/hNNvIsQLSV8", // MinutePhysics: Quantum Physics Intro
	"https://www.youtube.com/embed/_5OvgQW6FG4", // MinutePhysics: Relativity
	"https://www.youtube.com/embed/hePb00CqvP0", // ASAP Science: Brain Facts
	"https://www.youtube.com/embed/DrZJKdXlZ3I", // ASAP Science: Sleep Explained
	"https://www.youtube.com/embed/302eJ3TzJQU", // Numberphile: Prime Numbers
	"https://www.youtube.com/embed/XZo4xyJXCak", // Numberphile: Pi Explained
	"https://www.youtube.com/embed/KzfWUEJjG18", // 3Blue1Brown: Visualizing 4D
	"https://www.youtube.com/embed/Vejt_RC0pHY", // 3Blue1Brown: Intro to Calculus
	"https://www.youtube.com/embed/PUB0TaZ7bhA", // Veritasium: How Solar System Formed
	"https://www.youtube.com/embed/T6_wKPAbf2k", // Veritasium: What is Gravity
	"https://www.youtube.com/embed/e_C-V5vJv80", // SmarterEveryDay: How Wings Work
	"https://www.youtube.com/embed/mc979OhitAg"  // SmarterEveryDay: Fluid Dynamics
    ];

    const videoBar = document.getElementById("video-bar");

    function getRandomVideos(arr, count) {
        const shuffled = [...arr].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, count);
    }

    const selectedVideos = getRandomVideos(khanVideos, 10);

    selectedVideos.forEach(video => {
        const iframe = document.createElement("iframe");
        iframe.src = video;
        iframe.width = "300";
        iframe.height = "170";
        iframe.setAttribute("allowfullscreen", ""); // proper fullscreen attribute
        iframe.style.border = "none";
        iframe.style.borderRadius = "10px";
        videoBar.appendChild(iframe);
    });

}); // closes the DOMContentLoaded