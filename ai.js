import OpenAI from 'openai';
import CryptoJS from 'crypto-js';

const ENCRYPTED = 'U2FsdGVkX19sRMe2jrYUptbmN6BB9w3UK0uR9pQ9igO6MDugmpjfgNpi56QKaPEe2P4dJqEUjEF/J1aWuoWp13cVlVytXNzDi3R+aMJ8mTU=';
const STORAGE_KEY = 'stored_pw';

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

export const getSpeechData = async (text, mediaSource) => {
    const openai = createClient();
    const response = await openai.audio.speech.create(
        {
            model: "tts-1",
            voice: "alloy",
            input: text,
            response_format: "opus",
        },
    );

    const reader = response.body.getReader();
    const sourceBuffer = mediaSource.addSourceBuffer('audio/opus');

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        sourceBuffer.appendBuffer(value);
        await new Promise(resolve => {
            sourceBuffer.addEventListener('updateend', resolve, { once: true });
        });
    }

    mediaSource.endOfStream();
}

export const clearPassword = () => {
    window.localStorage.removeItem(STORAGE_KEY);
};
