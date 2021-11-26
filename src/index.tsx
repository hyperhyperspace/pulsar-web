import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import { IdbBackend, Resources, Store } from '@hyper-hyper-space/core';
import ChainView from './ChainView';
import { PeerComponent } from '@hyper-hyper-space/react';
//import reportWebVitals from './reportWebVitals';
import { } from '@hyper-hyper-space/pulsar';
import App from './App';

const main = async () => {

  //const wordCode = ['theater','milk','wander'];
  //const wordCode = ['butcher','fire','flag'];
  //const wordCodeLang = 'en';

  


  ReactDOM.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
    document.getElementById('root')
  );
}



// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
//reportWebVitals();

main();
