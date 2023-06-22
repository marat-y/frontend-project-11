import 'bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import * as yup from 'yup';
import keyBy from 'lodash/keyBy.js';
import { input, watchedState } from './view';

const form = document.querySelector('form');

const schema = yup.object({
  url: yup.string()
    .url()
    .required()
    .notOneOf(watchedState.feeds),
});

const validate = (fields) => {
  try {
    schema.validateSync(fields, { abortEarly: false });
    return {};
  } catch (e) {
    return keyBy(e.inner, 'path');
  }
};

const onFormSubmit = (e) => {
  e.preventDefault();
  const formData = new FormData(e.target);
  const errors = validate(Object.fromEntries(formData.entries()));
  const valid = Object.keys(errors).length === 0;
  watchedState.state = valid ? 'valid' : 'invalid';
  if (valid) {
    watchedState.feeds.push(formData.get('url'));
    input.value = '';
    input.focus();
  }
}

form.addEventListener('submit', onFormSubmit);
