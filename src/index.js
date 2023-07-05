import 'bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import * as yup from 'yup';
import i18n from 'i18next';
import onChange from 'on-change';

const form = document.querySelector('form');
const formData = () => Object.fromEntries(new FormData(form).entries());
const input = document.querySelector('#url-input');
const feedbackContainer = document.querySelector('.feedback');
const state = { state: 'valid', 
                errors: [],
                feeds: [] };

i18n.init({
  lng: 'ru',
  debug: true,
  resources: {
    ru: {
      translation: {
        errors: {
          invalid_url: 'Ссылка должна быть валидным URL'
        }
      }
    }
  }
});

const watchedState = onChange(state, () => {
  input.classList.toggle('is-invalid', watchedState.state != 'valid');
  if (watchedState.state === 'valid') {
    feedbackContainer.innerHTML = '';
  } else {
    feedbackContainer.innerHTML = i18n.t(`errors.${watchedState.errors[0]}`);
  }
});


yup.setLocale({
  string: {
    url: 'invalid_url'
  },
});

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
  schema.validate(fields, { abortEarly: false })
    .then(() => {
      watchedState.state = 'valid';
      onValidSubmit();
    })
    .catch((e) => {
      watchedState.state = 'invalid';
      watchedState.errors = e.errors;
    });
};

const onFormSubmit = (e) => {
  e.preventDefault();
  validate(formData());
}

form.addEventListener('submit', onFormSubmit);
