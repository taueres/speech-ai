import { useCallback, useReducer, html } from 'preact';
import { clearPassword, getSpeechData, getSpeechUrls } from './ai.js';

const SPEEDS = [0.75, 0.90, 1, 1.10, 1.25];

const ACTION_ON_TEXT_CHANGE = 'ON_TEXT_CHANGE';
const ACTION_ON_SPEED_CHANGE = 'ON_SPEED_CHANGE';
const ACTION_ON_CONVERT = 'ON_CONVERT';
const ACTION_ON_ERROR = 'ON_ERROR';
const ACTION_ON_LOAD = 'ON_LOAD';

const INITIAL_STATE = {
    inputText: '',
    audioUrls: [],
    download: null,
    error: null,
    loading: false,
    speed: '1',
};

const reducer = (state, action) => {
    switch (action.type) {
        case ACTION_ON_TEXT_CHANGE: {
            return {
                ...state,
                inputText: action.payload.value,
            };
        }
        case ACTION_ON_SPEED_CHANGE: {
            return {
                ...state,
                speed: action.payload.value,
            };
        }
        case ACTION_ON_CONVERT: {
            return {
                ...state,
                audioUrls: action.payload.value,
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
                audioUrls: [],
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
            type: ACTION_ON_TEXT_CHANGE,
            payload: {
                value: event.target.value
            }
        });
    }, []);

    const onSpeedChange = useCallback((event) => {
        dispatch({
            type: ACTION_ON_SPEED_CHANGE,
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
                const urls = await getSpeechData(state.inputText, state.speed);
                dispatch(({
                    type: ACTION_ON_CONVERT,
                    payload: {
                        value: urls,
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
        [state.inputText, state.speed],
    );

    const downloadSpeech = useCallback(
        async () => {
            if (state.inputText === '') {
                return;
            }

            try {
                dispatch({ type: ACTION_ON_LOAD });
                const urls = await getSpeechUrls(state.inputText, state.speed);
                dispatch(({
                    type: ACTION_ON_CONVERT,
                    payload: {
                        download: true,
                        value: urls,
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
        [state.inputText, state.speed],
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
            Speed:${' '}
            <select onChange=${onSpeedChange} value=${state.speed}>
                ${SPEEDS.map(x => html`<option value="${x}">${x}</option>`)}
            </select>
            <div className="action-wrapper">
                <button onClick=${loadSpeech} disabled=${state.loading}>Read</button>
                <button onClick=${downloadSpeech} disabled=${state.loading}>Download</button>
            </div>
            ${state.download && html`${state.audioUrls.map(u => html`<a href=${u} download="speech">Download</a><br />`)}`}
            ${!state.download && html`${state.audioUrls.map(u => html`<audio controls src=${u}></audio>`)}`}
        </div>`;
};
