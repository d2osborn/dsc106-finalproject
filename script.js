const video = document.getElementById('source-video');
const canvas = document.getElementById('effect-canvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

function drawVideo() {
    if (video.readyState >= 2) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    }
    requestAnimationFrame(drawVideo);
}

video.addEventListener('canplay', () => {
    video.play();
    drawVideo();
});
