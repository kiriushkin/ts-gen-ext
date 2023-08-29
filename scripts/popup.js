(async () => {
  try {
    // const API_URL = 'http://192.168.31.3:3000';
    const API_URL = 'https://api.kiriushkin.pro/ts-gen-api';

    const [loadedState, landId] = await loadState();

    const state = loadedState ? loadedState : await init();

    const { af, formType, data, paths, values } = state;

    const afElement = document.querySelector('#af');
    afElement.textContent = af;

    const pathInput = document.querySelector('#path-input');
    pathInput.value = paths.path;

    pathInput.oninput = async (e) => {
      const path = e.target.value;
      const result = path.match(/^\w+\//);

      paths.path = path;

      saveState();

      if (!result) return;

      const mark = result[0].replace('/', '');

      const resp = await axios.get(`${API_URL}/repos`, { params: { mark } });
      const repo = resp?.data;

      const domain = repo.domainOverride
        ? repo.domain
        : `${repo.mark}-default.sbs`;
      const localUrl = `${repo.prefix}/${domain}/${path}`;
      const url = `https://${domain}/${path}`;

      paths.localUrl = localUrl;
      paths.url = url;

      updatePathsContainer();
      saveState();
    };

    const mainContainer = document.querySelector('#main-container');
    const resultContainer = document.querySelector('#result-container');
    const pathsContainer = document.querySelector('#paths-container');

    resultContainer.addEventListener('click', selectElement);
    pathsContainer.addEventListener('click', selectElement);

    const array = data.fields ? data.fields : data.params;
    array.forEach((field, index) => {
      const el = document.createElement('div');
      el.classList.add('menu__input');

      const titleEl = document.createElement('div');
      titleEl.classList.add('menu__input-title');
      titleEl.textContent = field.title;

      const input = document.createElement('input');
      input.classList.add('menu__input-el');

      input.placeholder = field.example;
      input.value = values[index].value;

      input.oninput = (e) => {
        values[index].value = e.target.value;
        updateResultContainer(values);
        saveState();
      };

      el.appendChild(titleEl);
      el.appendChild(input);

      mainContainer.insertBefore(
        el,
        mainContainer.children[mainContainer.children.length - 1]
      );
    });

    updatePathsContainer();
    updateResultContainer();
    saveState();

    function updateResultContainer() {
      const text = [
        `*ВЕРСТКЕ*`,
        ...values.map((_) => `${_.title} - &#8203;${_.value}&#8203;`),
      ];
      resultContainer.innerHTML = text.join('</br>');
    }

    function updatePathsContainer() {
      pathsContainer.innerHTML = `${paths.localUrl}</br>${paths.url}`;
    }

    function saveState() {
      const state = JSON.stringify({ af, formType, data, paths, values });
      localStorage.setItem(landId, state);
    }

    async function loadState() {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

      const landId = await chrome.tabs.sendMessage(tab.id, 'get-land-id');

      const loadedState = localStorage.getItem(landId);

      if (!loadedState) return [null, landId];

      const state = JSON.parse(loadedState);

      const { data } = await axios.get(`${API_URL}/af`, {
        params: { title: state?.af },
      });

      const values = data.fields
        ? data.fields.map((_) => {
            return {
              value: state.values.find((i) => i.title === _.title)?.value
                ? state.values.find((i) => i.title === _.title).value
                : '',
              title: _.title,
            };
          })
        : data.params.map((_) => {
            return {
              value: state.values.find((i) => i.title === _.title)?.value
                ? state.values.find((i) => i.title === _.title).value
                : '',
              title: _.title,
            };
          });

      return [state ? { ...state, values, data } : null, landId];
    }

    async function init() {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

      const { af, formType } = await chrome.tabs.sendMessage(
        tab.id,
        'get-info'
      );

      const { data } = await axios.get(`${API_URL}/af`, {
        params: { title: af },
      });

      const paths = {
        path: '',
        localUrl: '/-default.sbs/',
        url: 'https://-default.sbs/',
      };

      console.log(data, af);

      const values = data.fields
        ? data?.fields.map((_) => {
            return { value: '', title: _.title };
          })
        : data?.params.map((_) => {
            return { value: '', title: _.title };
          });

      return { af, formType, data, paths, values };
    }

    function selectElement(e) {
      const range = new Range();
      range.selectNodeContents(e.target);
      document.getSelection().removeAllRanges();
      document.getSelection().addRange(range);
      console.log('Selected');
    }
  } catch (err) {
    console.log(err);
  }
})();
