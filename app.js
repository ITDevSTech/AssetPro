function initIcons() {
    if (window.lucide) lucide.createIcons()
}
document.addEventListener("DOMContentLoaded", initIcons)

function toggleSidebar() {
    const sidebar = document.getElementById("sidebar")
    sidebar.classList.toggle("collapsed")
}

function toggleMobileSidebar() {
    const sidebar = document.getElementById("sidebar")
    sidebar.classList.toggle("mobile-open")
}

document.addEventListener("DOMContentLoaded", () => {
    if (window.lucide) lucide.createIcons()
})
