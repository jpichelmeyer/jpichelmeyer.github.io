// /v003/live/script.js
const fsButton = document.getElementById('btn-desktop-cmd-full-screen');

// Adding logic to desktop command button (full screen)
fsButton.addEventListener('click', () => {
    if (!document.fullscreenElement) {
        // If the screen is not full, expand it
        document.documentElement.requestFullscreen().catch((err) => {
            console.error(`Error attempting to enable fullscreen: ${err.message}`);
        });
    } else {
        // If already full, exit
        document.exitFullscreen();
    }
});


