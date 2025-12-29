/**
 * Fingerprint Utility for Essay Architect
 * Strictly for tracking free usage limits without user accounts.
 * Generates a stable ID based on the browser's hardware and software signature.
 */

export const getVisitorID = async () => {
    const components = [
        navigator.userAgent,
        navigator.language,
        new Date().getTimezoneOffset(),
        window.screen.width + 'x' + window.screen.height,
        window.screen.colorDepth,
        navigator.hardwareConcurrency,
        navigator.deviceMemory,
        // Canvas Fingerprinting
        getCanvasFingerprint()
    ];

    const fingerprintString = components.join('###');

    // Hash the result for a clean ID
    const msgUint8 = new TextEncoder().encode(fingerprintString);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    return hashHex;
};

const getCanvasFingerprint = () => {
    try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return 'no-canvas';

        canvas.width = 200;
        canvas.height = 50;

        ctx.textBaseline = "top";
        ctx.font = "14px 'Arial'";
        ctx.textBaseline = "alphabetic";
        ctx.fillStyle = "#f60";
        ctx.fillRect(125, 1, 62, 20);
        ctx.fillStyle = "#069";
        ctx.fillText("EssayArchitect_Ghost_v1", 2, 15);
        ctx.fillStyle = "rgba(102, 204, 0, 0.7)";
        ctx.fillText("EssayArchitect_Ghost_v1", 4, 17);

        return canvas.toDataURL();
    } catch (e) {
        return 'canvas-err';
    }
};
