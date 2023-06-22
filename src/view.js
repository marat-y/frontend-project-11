import onChange from 'on-change';

export const input = document.querySelector('#url-input');

const state = { state: 'valid', feeds: [] };

export const watchedState = onChange(state, () => {
  input.classList.toggle('is-invalid', watchedState.state != 'valid');
});
