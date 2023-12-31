(async () => {
  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    // LAND ID
    if (msg === 'get-land-id')
      return sendResponse(
        location.pathname.match(/LAND-[0-9]+/)[0].replace('LAND-', '')
      );
    // AFFILIATE PROGRAM
    if (msg === 'get-info') {
      const descElement = document.querySelector('#description-val');

      let pWithAf;

      descElement.querySelectorAll('p').forEach((p) => {
        if (p.innerHTML.match('<b>ПП</b>')) return (pWithAf = p);
      });

      const af = pWithAf.innerHTML
        .split('\n')
        [pWithAf.innerHTML.split('\n').findIndex((_) => _.match('ПП'))].replace(
          '<b>ПП</b>: ',
          ''
        )
        .replace('<br>', '')
        .trim()
        .replace(/[хХ]/g, 'x')
        .replace(/[сС]/g, 'c')
        .replace(/\s/g, '');

      const formType = pWithAf.innerHTML
        .split('\n')[0]
        .replace('<b>Форма заказа</b>: ', '')
        .replace('<br>', '');

      sendResponse({ af, formType });
    }
  });
})();
