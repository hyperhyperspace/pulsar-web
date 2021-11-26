import { Hash, Hashing, IdbBackend, Mesh, Resources, Space, Store } from "@hyper-hyper-space/core";
import { PeerComponent } from "@hyper-hyper-space/react";
import { useEffect, useState } from "react";
import ChainView from "./ChainView";

type WordCodeStruct  = {lang: string, words: string[]}

function App() {

    const [wordCode, setWordCode]         = useState<WordCodeStruct|undefined>(undefined);
    const [hash, setHash]                 = useState<string|undefined>(undefined);
    const [chainResources, setChainResources] = useState<Resources|undefined>(undefined);
    const [backendError, setBackendError] = useState<any>(undefined);

    const lookupChain = () => {

    const location = window.location.hash.substr(2);

    const parts = location.split('/');

    console.log(parts)

    if (parts[0] === 'words') {

        const newLang  = parts[1];
        const newWordsRaw = parts[2];

        const newWords = newWordsRaw !== undefined? newWordsRaw.split('-') : undefined;

        const newWordCode = newLang !== undefined && newWords !== undefined? {lang: newLang, words: newWords } : undefined;

        if (newLang != wordCode?.lang || newWords?.join('-') !== wordCode?.words?.join('-')) {
            setWordCode(newWordCode);
            setHash(undefined);
        }
    } else if (parts[0] === 'hash') { 
          setHash(parts[1]);
          const newLang = 'en';
          const newWords = Space.getWordCodingForHash(hash as Hash, 3, newLang);
          setWordCode({lang: newLang, words: newWords});
    } else {
        window.location.hash = '';
        setWordCode(undefined);    
        setHash(undefined);
    }
  }

  useEffect(() => {
    lookupChain();
  });

  useEffect(() => {
    const init = (wordCode === undefined)?
                    undefined
                : 
                  {wordCode: wordCode.words, wordCodeLang: wordCode.lang, hash: hash};



    if (wordCode !== undefined) {
      const chainBackend = new IdbBackend(wordCode.words.join('-') + '-' + wordCode.lang);
      setBackendError(undefined);
      chainBackend.ready().catch((e) => {
        setBackendError(e);
      });

      const chainStore = new Store(chainBackend);

      Resources.create({mesh: new Mesh(), store: chainStore}).then((resources: Resources) => {
          setChainResources(resources);
      });
    }
    return () => {
      chainResources?.store?.close();
      //chainResources?.mesh?.shutdown(); // FIXME: how the heck do we shut it down?
    };
  }, [wordCode]);
        
    
    

    

  

  window.onpopstate = lookupChain;

  
  

  if (wordCode === undefined) {
    return (
      <div>
        <span>Use the following URL format to load a chain: /#/words/en/butcher-fire-flag (for a 3 word code) or /#/hash/NfVTFnudMkjrE%2Bwj6bmM0ktcFco%3D (for a hash).</span>
      </div>
    );
  } else if (chainResources === undefined) { 
    return (
      <div>
        <span>Initializing chain local resources...</span>
      </div>
    );
  } else {



    return (
      <PeerComponent resources={chainResources}>
        <ChainView  resources={chainResources} init={{wordCode: wordCode.words, wordCodeLang: wordCode.lang, hash: hash}}/>
      </PeerComponent>
    );
  }
  
                  


}

export default App;
