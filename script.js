const forumLatest = "https://cdn.freecodecamp.org/curriculum/forum-latest/latest.json";
const forumTopicUrl = "https://forum.freecodecamp.org/t/";
const forumCategoryUrl = "https://forum.freecodecamp.org/c/";
const avatarUrl = "https://sea1.discourse-cdn.com/freecodecamp";

const postsContainer = document.getElementById("posts-container");
const refreshBtn = document.getElementById("refresh-btn");
const filterBtn = document.getElementById("filter-btn");
const topicsCount = document.getElementById("topics-count");
const lastUpdate = document.getElementById("last-update");
const apiStatus = document.getElementById("api-status");
const footerStatus = document.getElementById("footer-status");
const loadedCount = document.getElementById("loaded-count");
const apiEndpoint = document.getElementById("api-endpoint");

const allCategories = {
    299: { category: "Career Advice", className: "career" },
    409: { category: "Project Feedback", className: "feedback" },
    417: { category: "freeCodeCamp Support", className: "support" },
    421: { category: "JavaScript", className: "javascript" },
    423: { category: "HTML - CSS", className: "html-css" },
    424: { category: "Python", className: "python" },
    432: { category: "You Can Do This!", className: "motivation" },
    560: { category: "Backend Development", className: "backend" },
};

let allTopics = [];
let filteredTopics = [];
let activeFilters = new Set(); // Store active category IDs

// Update status indicators
const updateStatus = (status, type = "info") => {
    const statusColors = {
        success: "var(--accent-success)",
        warning: "var(--accent-warning)",
        error: "var(--accent-error)",
        info: "var(--accent-info)"
    };
    
    apiStatus.textContent = status.toUpperCase();
    apiStatus.style.color = statusColors[type] || statusColors.info;
    footerStatus.textContent = status.toUpperCase();
    footerStatus.style.color = statusColors[type] || statusColors.info;
};

const updateLastUpdateTime = () => {
    const now = new Date();
    const dateString = now.toLocaleDateString('en-US', { 
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
    const timeString = now.toLocaleTimeString('en-US', { 
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
    lastUpdate.textContent = `${dateString} ${timeString}`;
};

const forumCategory = (id) => {
    let selectedCategory = {};

    if (allCategories.hasOwnProperty(id)) {
        const { className, category } = allCategories[id];
        selectedCategory.className = className;
        selectedCategory.category = category;
    } else {
        selectedCategory.className = "general";
        selectedCategory.category = "General";
    }

    return `<span class="category-tag category-${selectedCategory.className}">${selectedCategory.category}</span>`;
};

const timeAgo = (time) => {
    const currentTime = new Date();
    const lastPost = new Date(time);
    const timeDifference = currentTime - lastPost;
    const msPerMinute = 1000 * 60;

    const minutesAgo = Math.floor(timeDifference / msPerMinute);
    const hoursAgo = Math.floor(minutesAgo / 60);
    const daysAgo = Math.floor(hoursAgo / 24);

    if (minutesAgo < 60) {
        return `<span style="color: var(--accent-success)">${minutesAgo}m</span>`;
    }

    if (hoursAgo < 24) {
        return `<span style="color: var(--accent-warning)">${hoursAgo}h</span>`;
    }

    return `<span style="color: var(--accent-error)">${daysAgo}d</span>`;
};

const viewCount = (views) => {
    const thousands = Math.floor(views / 1000);

    if (views >= 1000) {
        return `${thousands}k`;
    }

    return views;
};

// Filter topics based on active category filters
const filterTopics = () => {
    if (activeFilters.size === 0) {
        filteredTopics = [...allTopics];
    } else {
        filteredTopics = allTopics.filter(topic => 
            activeFilters.has(topic.category_id.toString())
        );
    }
    displayTopics(filteredTopics);
};

// Display topics in the table
const displayTopics = (topics) => {
    if (!topics || topics.length === 0) {
        postsContainer.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; padding: 40px; color: var(--text-dim);">
                    No topics found ${activeFilters.size > 0 ? 'for selected categories' : ''}
                </td>
            </tr>
        `;
        return;
    }

    const postsHTML = topics.map((item) => {
        const {
            id,
            title,
            views,
            posts_count,
            slug,
            category_id,
            bumped_at,
        } = item;

        return `
        <tr>
            <td>
                <a class="topic-link" target="_blank" href="${forumTopicUrl}${slug}/${id}">
                    ${title}
                </a>
            </td>
            <td>${forumCategory(category_id)}</td>
            <td style="text-align: center; color: var(--accent-info); font-weight: 600;">
                ${posts_count - 1}
            </td>
            <td style="text-align: center; color: var(--accent-cyan); font-weight: 600;">
                ${viewCount(views)}
            </td>
            <td style="text-align: center; font-weight: 600;">
                ${timeAgo(bumped_at)}
            </td>
        </tr>`;
    }).join("");

    postsContainer.innerHTML = postsHTML;
    topicsCount.textContent = topics.length;
    loadedCount.textContent = `${topics.length}${activeFilters.size > 0 ? ` (filtered)` : ''}`;
};

// Show filter modal
const showFilterModal = () => {
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
    `;

    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
        background: var(--bg-primary);
        border: 2px solid var(--border-primary);
        border-radius: 0;
        padding: 24px;
        max-width: 500px;
        width: 90%;
        max-height: 80vh;
        overflow-y: auto;
    `;

    modalContent.innerHTML = `
        <div style="margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center;">
            <h3 style="color: var(--text-primary); margin: 0;">FILTER CATEGORIES</h3>
            <button id="close-modal" style="background: none; border: none; color: var(--text-dim); cursor: pointer; font-size: 1.2em; margin-left: auto;">✕</button>
        </div>
        
        <div style="margin-bottom: 20px;">
            <div style="display: flex; gap: 10px; margin-bottom: 15px;">
                <button id="select-all" class="terminal-btn" style="font-size: 0.8em;">SELECT ALL</button>
                <button id="clear-all" class="terminal-btn" style="font-size: 0.8em;">CLEAR ALL</button>
            </div>
            <div id="category-filters" style="display: grid; grid-template-columns: 1fr; gap: 10px;">
                ${Object.entries(allCategories).map(([id, category]) => `
                    <label style="display: flex; align-items: center; gap: 10px; padding: 10px; background: var(--bg-secondary); border-radius: 0; cursor: pointer;">
                        <input type="checkbox" value="${id}" ${activeFilters.has(id) ? 'checked' : ''} 
                               style="accent-color: var(--accent-info);">
                        <span class="category-tag category-${category.className}">${category.category}</span>
                        <span style="color: var(--text-dim); font-size: 0.8em; margin-left: auto;">
                            ${allTopics.filter(topic => topic.category_id.toString() === id).length} topics
                        </span>
                    </label>
                `).join('')}
            </div>
        </div>
        
        <div style="display: flex; gap: 10px;">
            <button id="apply-filters" class="terminal-btn primary" style="flex: 1;">APPLY FILTERS</button>
            <button id="cancel-filters" class="terminal-btn" style="flex: 1;">CANCEL</button>
        </div>
    `;

    modal.appendChild(modalContent);
    document.body.appendChild(modal);

    // Event listeners for modal
    modal.querySelector('#close-modal').addEventListener('click', () => {
        document.body.removeChild(modal);
    });

    modal.querySelector('#cancel-filters').addEventListener('click', () => {
        document.body.removeChild(modal);
    });

    modal.querySelector('#select-all').addEventListener('click', () => {
        modal.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            checkbox.checked = true;
        });
    });

    modal.querySelector('#clear-all').addEventListener('click', () => {
        modal.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            checkbox.checked = false;
        });
    });

    modal.querySelector('#apply-filters').addEventListener('click', () => {
        const checkedBoxes = modal.querySelectorAll('input[type="checkbox"]:checked');
        activeFilters.clear();
        checkedBoxes.forEach(checkbox => {
            activeFilters.add(checkbox.value);
        });
        filterTopics();
        document.body.removeChild(modal);
        
        // Update filter button appearance
        if (activeFilters.size > 0) {
            filterBtn.innerHTML = `<span class="btn-text">FILTERS (${activeFilters.size})</span>`;
            filterBtn.style.borderColor = "var(--accent-info)";
        } else {
            filterBtn.innerHTML = `<span class="btn-text">FILTER_CATEGORIES</span>`;
            filterBtn.style.borderColor = "";
        }
    });

    // Close modal when clicking outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            document.body.removeChild(modal);
        }
    });
};

const fetchData = async () => {
    try {
        updateStatus("fetching", "info");
        postsContainer.innerHTML = `
            <tr class="loading-row">
                <td colspan="5" class="loading-cell">
                    <span class="loading-dots">FETCHING LATEST TOPICS</span>
                </td>
            </tr>
        `;

        const res = await fetch(forumLatest);
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        
        const data = await res.json();
        updateStatus("success", "success");
        
        allTopics = data.topic_list?.topics || [];
        filterTopics(); // This will display either all or filtered topics
        updateLastUpdateTime();
        
    } catch (err) {
        console.error("Fetch error:", err);
        updateStatus("error", "error");
        postsContainer.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; padding: 40px; color: var(--accent-error);">
                    ERROR: Failed to load forum data
                </td>
            </tr>
        `;
    }
};

// Event Listeners
refreshBtn.addEventListener("click", () => {
    fetchData();
});

filterBtn.addEventListener("click", () => {
    if (allTopics.length > 0) {
        showFilterModal();
    } else {
        updateStatus("no data", "warning");
        setTimeout(() => updateStatus("success", "success"), 2000);
    }
});

// Add keyboard shortcut
document.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
        e.preventDefault();
        fetchData();
    }
});

// Initialize with a slight delay for better UX
setTimeout(() => {
    fetchData();
}, 500);

// Auto-refresh every 2 minutes
setInterval(() => {
    if (apiStatus.textContent === "SUCCESS") {
        fetchData();
    }
}, 120000);