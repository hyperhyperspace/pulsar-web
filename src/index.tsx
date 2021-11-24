import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import { IdbBackend, Resources, Store } from '@hyper-hyper-space/core';
import ChainView from './ChainView';
import { PeerComponent } from '@hyper-hyper-space/react';
//import reportWebVitals from './reportWebVitals';
import { } from '@hyper-hyper-space/pulsar';

const main = async () => {

  //const wordCode = ['theater','milk','wander'];
  const wordCode = ['butcher','fire','flag'];
  const wordCodeLang = 'en';

  const backend = new IdbBackend(wordCode.join('-') + '-' + wordCodeLang);

  let backendError = undefined;

  try {
    await backend.ready();
  } catch (e) {
    backendError = e;
  }
  

  const store     = new Store(backend);
  const resources = await Resources.create({store: store});
  
  const init = { wordCode: wordCode, wordCodeLang: wordCodeLang}



  ReactDOM.render(
    <React.StrictMode>
      <PeerComponent resources={resources}>
        <ChainView  resources={resources} init={init}/>
      </PeerComponent>
    </React.StrictMode>,
    document.getElementById('root')
  );
}



// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
//reportWebVitals();

main();
