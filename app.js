import React, { useCallback, useReducer } from 'react';
import { clearPassword, getSpeechUrl } from './ai.js';

const x = React.createElement.bind(React);

const ACTION_ON_CHANGE = 'ON_CHANGE';
const ACTION_ON_CONVERT = 'ON_CONVERT';
const ACTION_ON_ERROR = 'ON_ERROR';
const ACTION_ON_LOAD = 'ON_LOAD';

const INITIAL_STATE = {
    inputText: '',
    audioUrl: null,
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
                const url = await getSpeechUrl(state.inputText);
                dispatch(({
                    type: ACTION_ON_CONVERT,
                    payload: {
                        value: url,
                    },
                }))
            } catch(error) {
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
        return x(
            "div",
            { className: 'error-box' },
            'Error: ',
            state.error
        );
    }

    return x(
        'div',
        null,
        x(
            'div',
            { className: 'dual-wrapper' },
            x(
                'div',
                { className: 'text-wrapper' },
                x(
                    'textarea',
                    { value: state.inputText, onInput: onInputChange }
                ),
            ),
        ),
        x(
            'div',
            { className: 'action-wrapper' },
            x(
                'button',
                { onClick: loadSpeech, disabled: state.loading },
                'Read'
            )
        ),
        state.audioUrl !== null ? x(
            'audio',
            { controls: true, src: state.audioUrl }
        ) : null,
    );
};
