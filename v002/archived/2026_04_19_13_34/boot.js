// pos/boot/boot.js
import { registerApplication } from '../gui/registry.js';

const PSHELL_SVG = `<svg viewBox="0 0 250 200" xmlns="http://www.w3.org/2000/svg">
    <g transform="translate(120,100) scale(0.105,-0.105) translate(-3000,-1635)" fill="currentColor">
        <path d="M2728 2539 c-93 -12 -226 -63 -311 -118 -111 -73 -225 -200 -280
        -313 -69 -139 -82 -196 -82 -373 0 -130 3 -160 23 -225 32 -99 63 -160 128
        -247 75 -101 231 -221 322 -248 21 -6 22 -4 22 63 l0 70 -43 25 c-146 86 -258
        232 -303 398 -27 97 -24 263 5 359 70 230 252 406 481 465 96 25 272 17 362
        -17 96 -36 171 -84 242 -153 75 -73 126 -154 162 -260 24 -70 28 -95 28 -200
        0 -89 -4 -135 -18 -180 -50 -163 -157 -303 -296 -390 -65 -41 -194 -85 -267
        -92 l-63 -6 0 -69 0 -69 58 6 c245 28 468 164 599 366 88 137 123 262 123 438
        0 391 -281 717 -664 770 -87 12 -131 12 -228 0z"/>
        <path d="M2761 2249 c-135 -23 -252 -99 -331 -217 -60 -89 -81 -151 -87 -262
        -6 -104 8 -178 49 -260 29 -58 130 -180 149 -180 5 0 9 38 9 84 0 74 -4 91
        -30 143 -17 33 -35 87 -41 121 -29 164 63 338 215 409 53 24 73 28 151 28 76
        0 99 -5 147 -27 208 -97 273 -366 128 -531 -44 -51 -102 -83 -178 -98 -52 -11
        -71 -11 -120 1 l-57 15 0 157 c0 148 1 159 22 179 14 14 33 22 53 21 85 -2 99
        -116 18 -145 -13 -5 -18 -17 -18 -46 0 -49 9 -55 66 -46 56 8 117 60 135 112
        6 20 9 57 6 84 -20 170 -240 239 -359 113 -57 -61 -58 -75 -58 -576 0 -483 -2
        -505 -45 -522 -9 -3 -132 -6 -273 -6 -253 0 -256 0 -237 19 46 45 199 108 317
        131 l68 14 -51 28 -51 29 -70 -21 c-152 -46 -293 -129 -353 -207 -41 -53 -44
        -71 -12 -68 12 1 180 3 372 4 l351 1 41 27 c73 47 78 71 76 339 l-3 231 98 -5
        c75 -3 113 0 158 13 223 65 358 290 310 521 -20 102 -56 172 -123 245 -67 72
        -183 133 -283 149 -74 11 -84 11 -159 -1z"/>
        <path d="M3930 2070 c-23 -23 -25 -39 -7 -64 12 -16 10 -37 -14 -140 -16 -66
        -29 -124 -29 -128 0 -3 -20 -18 -44 -32 -52 -30 -78 -69 -127 -189 -20 -48
        -52 -113 -70 -144 -41 -69 -199 -236 -283 -300 -52 -39 -57 -45 -31 -39 80 18
        181 80 261 160 86 87 129 154 195 307 43 102 68 135 116 155 93 40 182 -10
        213 -117 11 -37 -1 -59 -32 -59 -31 0 -90 -38 -120 -77 -16 -20 -44 -89 -67
        -162 -22 -69 -57 -155 -78 -190 -70 -117 -184 -200 -324 -235 -53 -13 -123
        -16 -370 -16 l-304 -1 -22 -34 -22 -35 349 0 c343 0 350 0 427 25 200 63 332
        200 398 413 47 152 58 176 91 210 23 23 41 32 64 32 44 0 90 47 90 92 0 78
        -59 180 -124 215 -18 10 -17 15 20 118 33 92 43 109 66 117 15 5 30 19 33 29
        8 25 -20 69 -44 69 -29 0 -54 -35 -47 -65 5 -20 -6 -50 -50 -131 -52 -98 -75
        -126 -91 -110 -3 3 -1 58 6 123 10 96 15 119 31 130 27 19 25 58 -2 77 -29 20
        -34 20 -58 -4z"/>
    </g>
</svg>`;

export { PSHELL_SVG };

const BOOT_ANIM_SVG = `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" style="overflow:visible">
    <path fill="none" stroke="#E03131" stroke-width="3" stroke-linecap="round"
        stroke-dasharray="520" stroke-dashoffset="520"
        style="animation: boot-spiral-draw 1.1s 0.3s cubic-bezier(0.4,0,0.2,1) forwards"
        d="M100 100 C100 90,112 82,120 88 C132 97,133 116,122 126
           C108 138,86 136,74 121 C60 103,64 77,83 65 C103 52,133 57,147 78
           C164 103,157 136,134 151 C108 169,70 161,54 135 C36 105,46 63,75 47
           C106 29,150 40,165 72"/>
    <circle cx="100" cy="100" r="70"
        fill="none" stroke="#E03131" stroke-width="3" stroke-linecap="round"
        stroke-dasharray="440" stroke-dashoffset="440"
        style="animation: boot-ring-draw 0.75s 1.2s cubic-bezier(0.4,0,0.2,1) forwards;
               transform-origin:100px 100px; transform:rotate(-90deg)"/>
    <g style="animation: boot-inner-appear 0.4s 1.95s ease-out forwards; opacity:0; transform-origin:80px 100px">
        <circle cx="90" cy="100" r="22" fill="#E03131"/>
        <circle cx="90" cy="100" r="13" fill="#111111"/>
        <rect x="64" y="74" width="10" height="52" fill="#E03131"/>
    </g>
    <g style="animation: boot-snail-pop 0.45s 2.55s cubic-bezier(0.34,1.56,0.64,1) forwards;
              opacity:0; transform-origin:172px 100px">
        <path d="M172 108 C178 108,184 100,184 93 C184 86,178 80,172 80 C166 80,162 84,160 88"
            fill="none" stroke="#E03131" stroke-width="4" stroke-linecap="round"/>
        <line x1="174" y1="80" x2="170" y2="70" stroke="#E03131" stroke-width="2.5" stroke-linecap="round"/>
        <line x1="179" y1="82" x2="184" y2="73" stroke="#E03131" stroke-width="2.5" stroke-linecap="round"/>
        <circle cx="170" cy="69" r="3" fill="#E03131"/>
        <circle cx="184" cy="72" r="3" fill="#E03131"/>
        <path d="M172 108 C168 112,162 115,155 113"
            fill="none" stroke="#E03131" stroke-width="4" stroke-linecap="round"/>
    </g>
    <circle cx="100" cy="100" r="0" fill="#E03131"
        style="animation: boot-dot-grow 0.4s ease-out forwards"/>
</svg>`;

const PAUSE_SVG = `<svg viewBox="0 0 250 200" xmlns="http://www.w3.org/2000/svg">
    <g transform="translate(120,100) scale(0.105,-0.105) translate(-3000,-1635)" fill="white">
        <path d="M2728 2539 c-93 -12 -226 -63 -311 -118 -111 -73 -225 -200 -280
        -313 -69 -139 -82 -196 -82 -373 0 -130 3 -160 23 -225 32 -99 63 -160 128
        -247 75 -101 231 -221 322 -248 21 -6 22 -4 22 63 l0 70 -43 25 c-146 86 -258
        232 -303 398 -27 97 -24 263 5 359 70 230 252 406 481 465 96 25 272 17 362
        -17 96 -36 171 -84 242 -153 75 -73 126 -154 162 -260 24 -70 28 -95 28 -200
        0 -89 -4 -135 -18 -180 -50 -163 -157 -303 -296 -390 -65 -41 -194 -85 -267
        -92 l-63 -6 0 -69 0 -69 58 6 c245 28 468 164 599 366 88 137 123 262 123 438
        0 391 -281 717 -664 770 -87 12 -131 12 -228 0z"/>
        <path d="M2761 2249 c-135 -23 -252 -99 -331 -217 -60 -89 -81 -151 -87 -262
        -6 -104 8 -178 49 -260 29 -58 130 -180 149 -180 5 0 9 38 9 84 0 74 -4 91
        -30 143 -17 33 -35 87 -41 121 -29 164 63 338 215 409 53 24 73 28 151 28 76
        0 99 -5 147 -27 208 -97 273 -366 128 -531 -44 -51 -102 -83 -178 -98 -52 -11
        -71 -11 -120 1 l-57 15 0 157 c0 148 1 159 22 179 14 14 33 22 53 21 85 -2 99
        -116 18 -145 -13 -5 -18 -17 -18 -46 0 -49 9 -55 66 -46 56 8 117 60 135 112
        6 20 9 57 6 84 -20 170 -240 239 -359 113 -57 -61 -58 -75 -58 -576 0 -483 -2
        -505 -45 -522 -9 -3 -132 -6 -273 -6 -253 0 -256 0 -237 19 46 45 199 108 317
        131 l68 14 -51 28 -51 29 -70 -21 c-152 -46 -293 -129 -353 -207 -41 -53 -44
        -71 -12 -68 12 1 180 3 372 4 l351 1 41 27 c73 47 78 71 76 339 l-3 231 98 -5
        c75 -3 113 0 158 13 223 65 358 290 310 521 -20 102 -56 172 -123 245 -67 72
        -183 133 -283 149 -74 11 -84 11 -159 -1z"/>
        <g style="transform-origin:211px 51px; animation: snail-look 4.5s 1.5s ease-in-out infinite">
            <path d="M3930 2070 c-23 -23 -25 -39 -7 -64 12 -16 10 -37 -14 -140 -16 -66
            -29 -124 -29 -128 0 -3 -20 -18 -44 -32 -52 -30 -78 -69 -127 -189 -20 -48
            -52 -113 -70 -144 -41 -69 -199 -236 -283 -300 -52 -39 -57 -45 -31 -39 80 18
            181 80 261 160 86 87 129 154 195 307 43 102 68 135 116 155 93 40 182 -10
            213 -117 11 -37 -1 -59 -32 -59 -31 0 -90 -38 -120 -77 -16 -20 -44 -89 -67
            -162 -22 -69 -57 -155 -78 -190 -70 -117 -184 -200 -324 -235 -53 -13 -123
            -16 -370 -16 l-304 -1 -22 -34 -22 -35 349 0 c343 0 350 0 427 25 200 63 332
            200 398 413 47 152 58 176 91 210 23 23 41 32 64 32 44 0 90 47 90 92 0 78
            -59 180 -124 215 -18 10 -17 15 20 118 33 92 43 109 66 117 15 5 30 19 33 29
            8 25 -20 69 -44 69 -29 0 -54 -35 -47 -65 5 -20 -6 -50 -50 -131 -52 -98 -75
            -126 -91 -110 -3 3 -1 58 6 123 10 96 15 119 31 130 27 19 25 58 -2 77 -29 20
            -34 20 -58 -4z"/>
        </g>
    </g>
</svg>`;

export { PAUSE_SVG, BOOT_ANIM_SVG };

export async function runBoot(onComplete) {
    const bootContainer = document.getElementById('pos-boot');

    bootContainer.innerHTML = `
        <div class="boot-logo-stage">${BOOT_ANIM_SVG}</div>
        <div class="boot-wordmark">P.SHELL</div>
        <button class="boot-click-to-start" id="boot-trigger">
            &gt; CLICK TO INITIALIZE
        </button>
    `;

    document.getElementById('boot-trigger').onclick = async () => {
        try { await document.documentElement.requestFullscreen(); }
        catch (e) { console.warn('Fullscreen deferred:', e); }

        bootContainer.innerHTML = `
            <div class="boot-logo-stage">${BOOT_ANIM_SVG}</div>
            <div class="boot-wordmark">P.SHELL</div>
            <div class="boot-progress-container">
                <div class="boot-progress-bar" id="boot-bar"></div>
            </div>
            <div class="boot-status-text" id="boot-status">LOADING...</div>
        `;

        const bar    = document.getElementById('boot-bar');
        const status = document.getElementById('boot-status');

        const stages = [
            [20,  'P.SHELL: MEM_CHECK'],
            [45,  'P.SHELL: GUI_INIT'],
            [70,  'P.SHELL: APP_REGISTRY'],
            [90,  'P.SHELL: DOCK_BUILD'],
            [100, 'P.SHELL: READY'],
        ];

        for (const [p, msg] of stages) {
            await new Promise(r => setTimeout(r, 180));
            bar.style.width  = p + '%';
            status.innerText = msg;
        }

        bootContainer.classList.add('fade-out');
        setTimeout(() => {
            bootContainer.style.display = 'none';
            onComplete();
        }, 600);
    };
}
