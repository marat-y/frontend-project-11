import 'bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import * as yup from 'yup';
// import keyBy from 'lodash/keyBy.js';
import { input, watchedState } from './view';
import i18n from 'i18next';

const form = document.querySelector('form');
const formData = () => Object.fromEntries(new FormData(form).entries());

const schema = yup.object({
  url: yup.string()
    .url()
    .required()
    .notOneOf(watchedState.feeds),
});

const addFeed = () => {
  watchedState.feeds.push(formData().url);
}

const prepareInput = () => {
  input.value = '';
  input.focus();
}

const onValidSubmit = () => {
  addFeed();
  prepareInput();
}

const validate = (fields) => {
  schema.isValid(fields)
    .then((valid) => {
        watchedState.state = valid ? 'valid' : 'invalid';
        if (valid) onValidSubmit();
      });
};

const onFormSubmit = (e) => {
  e.preventDefault();
  validate(formData());
}

form.addEventListener('submit', onFormSubmit);

i18n.init({
  lng: 'ru',
  debug: true,
  resources: {
    ru: {
      translation: {
      }
    }
  }
});
