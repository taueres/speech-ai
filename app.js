import { useCallback, useReducer, html } from 'preact';
import { clearPassword, getSpeechData, getSpeechUrl } from './ai.js';

const ACTION_ON_CHANGE = 'ON_CHANGE';
const ACTION_ON_CONVERT = 'ON_CONVERT';
const ACTION_ON_ERROR = 'ON_ERROR';
const ACTION_ON_LOAD = 'ON_LOAD';

const INITIAL_STATE = {
    inputText: '',
    audioUrl: null,
    download: null,
    error: null,
    loading: false,
};

const reducer = (state, action) => {
    switch (action.type) {
        case ACTION_ON_CHANGE: {
            return {
                ...state,
                inputText: action.payload.value,
            };
        }
        case ACTION_ON_CONVERT: {
            return {
                ...state,
                audioUrl: action.payload.value,
                download: action.payload.download,
                loading: false,
            };
        }
        case ACTION_ON_ERROR: {
            return {
                ...state,
                error: action.payload.value,
                loading: false,
            };
        }
        case ACTION_ON_LOAD: {
            return {
                ...state,
                audioUrl: null,
                download: null,
                error: null,
                loading: true,
            }
        }
        default:
            return state;
    }
};

export const App = () => {
    const [state, dispatch] = useReducer(reducer, INITIAL_STATE);

    const onInputChange = useCallback((event) => {
        dispatch({
            type: ACTION_ON_CHANGE,
            payload: {
                value: event.target.value
            }
        });
    }, []);

    const loadSpeech = useCallback(
        async () => {
            if (state.inputText === '') {
                return;
            }

            try {
                dispatch({ type: ACTION_ON_LOAD });
                const mediaSource = new MediaSource();
                const url = URL.createObjectURL(mediaSource);
                getSpeechData(state.inputText, mediaSource);
                dispatch(({
                    type: ACTION_ON_CONVERT,
                    payload: {
                        value: url,
                    },
                }));
            } catch (error) {
                console.error(error);
                clearPassword();
                dispatch({
                    type: ACTION_ON_ERROR,
                    payload: {
                        value: error.message,
                    },
                });
            }
        },
        [state.inputText],
    );

    const downloadSpeech = useCallback(
        async () => {
            if (state.inputText === '') {
                return;
            }

            try {
                dispatch({ type: ACTION_ON_LOAD });
                const url = await getSpeechUrl(state.inputText);
                dispatch(({
                    type: ACTION_ON_CONVERT,
                    payload: {
                        download: true,
                        value: url,
                    },
                }));
            } catch (error) {
                console.error(error);
                clearPassword();
                dispatch({
                    type: ACTION_ON_ERROR,
                    payload: {
                        value: error.message,
                    },
                });
            }
        },
        [state.inputText],
    );

    if (state.error) {
        return html`<div className="error-box">Error: ${state.error}</div>`;
    }

    return html`
        <div>
            <div className="dual-wrapper">
                <div className="text-wrapper">
                    <textarea value=${state.inputText} onInput=${onInputChange}></textarea>
                </div>
            </div>
            <p>Characters: ${state.inputText.length} / 4096</p>
            <div className="action-wrapper">
                <button onClick=${loadSpeech} disabled=${state.loading}>Read</button>
                <button onClick=${downloadSpeech} disabled=${state.loading}>Download</button>
            </div>
            ${state.audioUrl !== null && !state.download ? html`<audio controls src=${state.audioUrl}></audio>` : null}
            ${state.audioUrl !== null && state.download ? html`<a href=${state.audioUrl} download="speech">Download</a>` : null}
        </div>`;
};
