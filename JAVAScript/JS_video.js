// VIDEO CONTROLS: seek forward/back and keyboard shortcuts
// This file contains only the video-related behavior split out from script.js

document.addEventListener('DOMContentLoaded', function() {
    const videos = document.querySelectorAll('.video-wrapper video, video');
    if (!videos.length) return;

    const SEEK_SHORT = 5;  // seconds with arrow keys
    const SEEK_LONG = 10;  // seconds with buttons/J/L

    let activeVideo = null;

    function seek(video, delta) {
        if (!video) return;
        try {
            const duration = isFinite(video.duration) ? video.duration : Infinity;
            const newTime = Math.min(Math.max(0, video.currentTime + delta), duration);
            video.currentTime = newTime;
        } catch (e) {
            // ignore seeking errors
        }
    }

    function makeButton(label, delta) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.textContent = label;
        btn.setAttribute('aria-label', delta > 0 ? `Naprej ${Math.abs(delta)}s` : `Nazaj ${Math.abs(delta)}s`);
        // minimal inline styling so no CSS changes required
        btn.style.position = 'absolute';
        btn.style.bottom = '8px';
        if (delta > 0) btn.style.right = '8px'; else btn.style.left = '8px';
        btn.style.background = 'rgba(0,0,0,0.6)';
        btn.style.color = '#fff';
        btn.style.border = 'none';
        btn.style.padding = '6px 10px';
        btn.style.borderRadius = '4px';
        btn.style.cursor = 'pointer';
        btn.style.zIndex = '2';
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const vid = activeVideo || btn.closest('.video-wrapper')?.querySelector('video');
            seek(vid, delta);
        });
        return btn;
    }

    videos.forEach(v => {
        v.addEventListener('play', () => activeVideo = v);
        v.addEventListener('click', () => activeVideo = v);
        v.addEventListener('mouseenter', () => activeVideo = v);

        // add on-screen buttons once per wrapper
        const wrapper = v.closest('.video-wrapper') || v.parentElement;
        if (wrapper && !wrapper._seekButtonsAdded) {
            if (!wrapper.style.position) wrapper.style.position = 'relative';
            wrapper.appendChild(makeButton('↺ 10s', -SEEK_LONG));
            wrapper.appendChild(makeButton('10s ↻', SEEK_LONG));
            wrapper._seekButtonsAdded = true;
        }
    });

    // Keyboard shortcuts: Left/Right = 5s, J/L = 10s, K or Space = play/pause
    document.addEventListener('keydown', (e) => {
        // ignore when typing in inputs/textareas
        const tag = (e.target && e.target.tagName) ? e.target.tagName.toUpperCase() : '';
        if (tag === 'INPUT' || tag === 'TEXTAREA') return;

        const focusedVideo = document.activeElement && document.activeElement.tagName === 'VIDEO' ? document.activeElement : null;
        const v = focusedVideo || activeVideo;
        if (!v) return;

        if (e.key === 'ArrowLeft') {
            seek(v, -SEEK_SHORT);
            e.preventDefault();
        } else if (e.key === 'ArrowRight') {
            seek(v, SEEK_SHORT);
            e.preventDefault();
        } else if (typeof e.key === 'string' && e.key.toLowerCase() === 'j') {
            seek(v, -SEEK_LONG);
            e.preventDefault();
        } else if (typeof e.key === 'string' && e.key.toLowerCase() === 'l') {
            seek(v, SEEK_LONG);
            e.preventDefault();
        } else if (e.key === ' ' || (typeof e.key === 'string' && e.key.toLowerCase() === 'k')) {
            if (v.paused) v.play(); else v.pause();
            e.preventDefault();
        }
    }, { passive: false });
});
