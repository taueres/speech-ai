import OpenAI from 'openai';
import CryptoJS from 'crypto-js';

// So that we can encrypt a new apiKey if we need
// sergioCryptoJS.AES.encrypt('apikey', 'mypass').toString();
window.sergioCryptoJS = CryptoJS;

const ENCRYPTED = 'U2FsdGVkX1+htiM/dYmI4NQo3u3ysKX9knVJrpFFkRMgkhPaAC2ySQCMGDtLGJBQQ8sF3HzJO7+2VrjV8oiB5l7wFwUx/a/ci0aHeza35zn1bxa/JUmYwXlb4+BuTXdzctV0o0f4NUGcMoha1ZNQ9Z8a0tvfq1rtfTNz4VG/70bZPYP8FJpCu0ODKXzQVz/HvshGY5CCnR/tNXYHXK8XC+iH6r9UhdG3bxTsRaAEe+Zk4vXkcoIphFSoSKf/p5QI';
const STORAGE_KEY = 'stored_pw';

const BLOCK_SIZE = 4050;

const splitText = (text) => {
    const chunks = [];
    let remainingText = text;

    while (remainingText.length > 0) {
        const block = remainingText.slice(0, BLOCK_SIZE);

        let lastFullStop;
        if (block.length < BLOCK_SIZE) {
            lastFullStop = block.length - 1;
        } else {
            lastFullStop = block.lastIndexOf('.');
            if (lastFullStop === -1) {
                lastFullStop = block.lastIndexOf(' ');
            }
            if (lastFullStop === -1) {
                lastFullStop = block.length - 1;
            }
        }
        
        chunks.push(block.slice(0, lastFullStop + 1));
        remainingText = remainingText.slice(lastFullStop + 1);
    }

    return chunks;
};

const readPassword = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const reset = urlParams.get('reset');
    if (reset) {
        window.localStorage.removeItem(STORAGE_KEY);
    }

    let password = window.localStorage.getItem(STORAGE_KEY);
    if (password === null) {
        password = prompt('Password');
    }

    if (password === null) {
        throw new Error('Password is required to access the service.');
    }

    window.localStorage.setItem(STORAGE_KEY, password);

    return password;
}

let openai;
const createClient = () => {
    if (openai) {
        return openai;
    }

    const password = readPassword();
    const decrypted = CryptoJS.AES.decrypt(ENCRYPTED, password);
    const apiKey = decrypted.toString(CryptoJS.enc.Utf8);
    if (!apiKey) {
        throw new Error('ApiKey not available');
    }

    openai = new OpenAI({
        apiKey,
        dangerouslyAllowBrowser: true
    });

    return openai;
}

export const getSpeechData = async (text, speed) => {
    const chunks = splitText(text);
    const urls = [];
    for (const chunk of chunks) {
        const mediaSource = new MediaSource();
        const url = URL.createObjectURL(mediaSource);
        getSpeechDataForSingleText(chunk, speed, mediaSource);
        urls.push(url);
    }
    return urls;
};

const getSpeechDataForSingleText = async (text, speed, mediaSource) => {
    const openai = createClient();
    const response = await openai.audio.speech.create(
        {
            model: "tts-1",
            voice: "alloy",
            input: text,
            speed: Number(speed),
        },
    );

    const reader = response.body.getReader();
    const sourceBuffer = mediaSource.addSourceBuffer('audio/mpeg');

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        sourceBuffer.appendBuffer(value);
        await new Promise(resolve => {
            sourceBuffer.addEventListener('updateend', resolve, { once: true });
        });
    }

    mediaSource.endOfStream();
};

export const getSpeechUrls = async (text, speed) => {
    const chunks = splitText(text);
    const urls = [];
    for (const chunk of chunks) {
        const openai = createClient();
        const response = await openai.audio.speech.create(
            {
                model: "tts-1",
                voice: "alloy",
                input: chunk,
                speed: Number(speed),
            },
        );
        const buffer = await response.arrayBuffer();
        const blob = new Blob([buffer], { type: 'audio/mp3' });
        urls.push(window.URL.createObjectURL(blob));
    }
    return urls;
};

export const clearPassword = () => {
    window.localStorage.removeItem(STORAGE_KEY);
};
