import 'bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import * as yup from 'yup';
import i18n from 'i18next';
import _ from 'lodash';
import axios from 'axios';
import watchState from './view';

const form = document.querySelector('form');
const formData = () => Object.fromEntries(new FormData(form).entries());
const input = document.querySelector('#url-input');

const state = { state: 'valid', 
                errors: [],
                feeds: [],
                posts: [],
                feedback: ''
              };

i18n.init({
  lng: 'ru',
  debug: true,
  resources: {
    ru: {
      translation: {
        feeds: 'Фиды',
        posts: 'Посты',
        view: 'Просмотр',
        success: 'RSS успешно загружен',
        errors: {
          invalid_url: 'Ссылка должна быть валидным URL',
          parsing_error: 'Проблемы с парсингом фида, это точно RSS?'
        }
      }
    }
  }
});

const watchedState = watchState(state, i18n, input);

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

const downloadFeed = (url) => {
  const encodedUrl = encodeURIComponent(url);
  const proxifiedUrl = `https://allorigins.hexlet.app/get?disableCache=true&url=${encodedUrl}`
  return axios.get(proxifiedUrl)
    .then((response) => {
      const domParser = new DOMParser;
      const parsedResponse = domParser.parseFromString(response.data.contents, 'text/xml');
      return parsedResponse;
    })
    .catch((error) => {
      // handle error
      console.log(error);
    })
};

const handleSubmission = () => {
  const newFeed = { id: _.uniqueId(), url: formData().url }
  downloadFeed(newFeed.url)
    .then((rawFeed) => {
      const channel = rawFeed.querySelector('channel');
      newFeed.title = channel.querySelector('title').textContent;
      newFeed.description = channel.querySelector('description')?.textContent;
      watchedState.feeds.push(newFeed);

      const rawPosts = channel.querySelectorAll('item');
      rawPosts.forEach((rawPost) => {
        const post = { id: _.uniqueId, feed_id: newFeed.id }
        post.title = rawPost.querySelector('title').textContent;
        post.description = rawPost.querySelector('description').textContent;
        post.link = rawPost.querySelector('link').textContent;
        watchedState.posts.push(post);
      })
      watchedState.feedback = i18n.t('success');
      prepareInput();
    })
    .catch((error) => {
      console.log(error);
      watchedState.state = 'invalid';
      watchedState.feedback = i18n.t('errors.parsing_error')
    })
}

const prepareInput = () => {
  input.value = '';
  input.focus();
}

const validate = (fields) => {
  watchedState.feedback = '';
  schema.validate(fields, { abortEarly: false })
    .then(() => {
      watchedState.state = 'valid';
      handleSubmission();
    })
    .catch((e) => {
      watchedState.state = 'invalid';
      watchedState.feedback = i18n.t(`errors.${e.errors[0]}`)
    });
};

const onFormSubmit = (e) => {
  e.preventDefault();
  validate(formData());
}

form.addEventListener('submit', onFormSubmit);
