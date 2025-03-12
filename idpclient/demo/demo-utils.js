
function getAudio(id) {
    const el = document.getElementById(id);
    if (!(el instanceof HTMLAudioElement)) {
        throw new Error(`Element "${id}" not found or not an audio element.`);
    }
    return el;
}
function getButton(id) {
    const el = document.getElementById(id);
    if (!(el instanceof HTMLButtonElement)) {
        throw new Error(`Element "${id}" not found or not a button element.`);
    }
    return el;
}
function getButtons(id) {
    const els = document.getElementsByClassName(id);
    if (!els.length) {
        throw new Error(`Elements "${id}" not found.`);
    }
    const buttons = [];
    for (let i = 0; i < els.length; i++) {
        const el = els[i];
        if (!(el instanceof HTMLButtonElement)) {
            throw new Error(`Element ${i} of "${id}" not a button element.`);
        }
        buttons.push(el);
    }
    return buttons;
}
function getDiv(id) {
    const el = document.getElementById(id);
    if (!(el instanceof HTMLDivElement)) {
        throw new Error(`Element "${id}" not found or not a div element.`);
    }
    return el;
}
function getInput(id) {
    const el = document.getElementById(id);
    if (!(el instanceof HTMLInputElement)) {
        throw new Error(`Element "${id}" not found or not an input element.`);
    }
    return el;
}
function getSpan(id) {
    const el = document.getElementById(id);
    if (!(el instanceof HTMLSpanElement)) {
        throw new Error(`Element "${id}" not found or not a span element.`);
    }
    return el;
}
function getVideo(id) {
    const el = document.getElementById(id);
    if (!(el instanceof HTMLVideoElement)) {
        throw new Error(`Element "${id}" not found or not a video element.`);
    }
    return el;
}
function getTextArea(id) {
    const el = document.getElementById(id);
    if (!(el instanceof HTMLTextAreaElement)) {
        throw new Error(`Element "${id}" not found or not a textarea element.`);
    }
    return el;
}
