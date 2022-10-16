import { Hash, HashedObject, Identity, PeerGroupState, Resources, Space, SpaceInit } from '@hyper-hyper-space/core';
import { Blockchain, BlockOp, FixedPoint } from '@hyper-hyper-space/pulsar';
import { useSpace, useObjectState } from '@hyper-hyper-space/react';
import React, { useEffect, useRef, useState } from 'react';

import './ChainView.css';

function useInterval(callback: () => void, delay: number) {
    const savedCallback = useRef<() => void>(callback);
  
    // Remember the latest callback.
    useEffect(() => {
      savedCallback.current = callback;
    }, [callback]);
  
    // Set up the interval.
    useEffect(() => {
      function tick() {
        savedCallback.current();
      }
      if (delay !== null) {
        let id = setInterval(tick, delay);
        return () => clearInterval(id);
      }
    }, [delay]);
  }

function ChainView(props: {resources: Resources, init?: SpaceInit}) {

    const space      = useSpace<Blockchain>(props.init, true);
    const [loadedAll, setLoadedAll]  = useState(false);

    useEffect(() => {
        if (space !== undefined) {
            space.loadAndWatchForChanges().then(() => { setLoadedAll(true) });
        }
    }, [space]);

    const blockchain = useObjectState(space);

    useEffect(() => {
        console.log('HEAD BLOCK IS', blockchain?.value?._headBlock?.blockNumber);
    }, [blockchain]);

    
    const [lastBlocks, setLastBlocks] = useState<Array<BlockOp>>([]);
    //const [whales, setWhales]         = useState<Array<[Hash, bigint]>>([]);

    //space?.startSync();

    const loadedSpace = space !== undefined;
    const loadedChain = loadedSpace && loadedAll;

    const headBlock       = blockchain?.value?._headBlock;
    const headBlockNumber = headBlock?._blockNumber;

    const [blockTime, setBlockTime] = useState<number|undefined>(undefined);

    useEffect(() => {
        const prevBlockHash = headBlock?.getPrevBlockHash();
        if (prevBlockHash !== undefined) {
            props.resources.store.load<BlockOp>(prevBlockHash, false).then((prevBlock?: BlockOp) => {
                if (headBlock === undefined || prevBlock === undefined) {
                    setBlockTime(undefined);
                } else {
                    setBlockTime(Number(headBlock.getTimestampMillisecs() - prevBlock.getTimestampMillisecs()))
                }
            })
        } else {
            setBlockTime(undefined);
        }
    }, [headBlock]);

    const headBlockNumberForLoading = headBlockNumber === undefined? undefined :
                                        ((headBlockNumber < BigInt(10)) ?
                                            headBlockNumber
                                        :
                                            (headBlockNumber - headBlockNumber % BigInt(10))
                                        );

    const [peerGroupState, setPeerGroupState] = useState<PeerGroupState>();

    useInterval(async () => {
        const space2 = blockchain?.getValue();
        const state = await space2?._node?.getPeerGroupStateForSyncObj(space2);
        setPeerGroupState(state);

    }, 5000);

    const [whales, setWhales] = useState<Array<[Hash, bigint]>>([]);

    const [whaleInfo, setWhaleInfo] = useState<Map<Hash, any>>(new Map());

    

    useEffect(() => {
        if (loadedAll && blockchain !== undefined && blockchain.value !== undefined) {
            const all = Array.from(blockchain.value._ledger.balances.entries());
                    
            all.sort((b1, b2) => { 
                const r = b2[1] - b1[1];
                if (r > BigInt(0)) {
                    return 1;
                } else if (r < BigInt(0)) {
                    return -1;
                } else {
                    return 0;
                }
            });
    
            setWhales(all.slice(0, 10));
        };

        if (headBlock !== undefined && (lastBlocks.length === 0 || lastBlocks[0].getLastHash() !== headBlock.getLastHash())) {
            lastBlocks.unshift(headBlock);
            if (lastBlocks.length > 10) {
                lastBlocks.splice(10, 1);
            }
            setLastBlocks(lastBlocks);
        }
    }, [blockchain, loadedAll])
    

    useEffect(() => {
        const newWhaleInfo = new Map<Hash, any>();

        const promises = new Array<Promise<void>>();

        for (const pair of whales) {
            if (whaleInfo.has(pair[0])) {
                newWhaleInfo.set(pair[0], whaleInfo.get(pair[0]));
            } else {
                promises.push(props.resources.store.load(pair[0]).then((obj?: HashedObject) => {
                    if (obj instanceof Identity) {
                        newWhaleInfo.set(pair[0], obj.info);
                    }
                }));
            }
        }

        Promise.all(promises).then(() => {
                setWhaleInfo(newWhaleInfo);
            }
        );
    }, [whales]);
    

    const circulating = blockchain?.getValue()?._ledger?.getSupply();
    
    return (
        <div id="chainView">
            <div className="page inner width padding">
                <h1>Pulsar - The Web Blockchain</h1>
            </div>
            <div className="page inner width">
            { loadedSpace &&
                <React.Fragment>
                    <div>
                        <h5>Network: {Space.getWordCodingForHash(space.getLastHash()).join(' ')}</h5>
                        <span className="text-padding tiny"><b>Hash:</b> {space.getLastHash()}</span>
                        <br /><br />
                        {peerGroupState && 
                        <table>
                        <thead>
                        <tr>
                            <td className="text-padding tiny">Status</td>
                            <td className="text-padding tiny">Peers</td>
                            <td className="text-padding tiny">Supply</td>
                            <td className="text-padding tiny">Block time</td>
                            <td className="text-padding tiny">Mov. min speed</td>
                            <td className="text-padding tiny">Mov. max speed</td>
                            <td className="text-padding tiny">Speed ratio</td>
                            
                        </tr>
                        </thead>

                        <tbody>
                            <tr>
                                <td className="text-padding tiny">
                                    {peerGroupState.remote.size === 0 && <b style={{color: 'red'}}>Not connected</b>}
                                    {peerGroupState.remote.size > 0 && <b style={{color: 'green'}}>Connected</b>}
                                </td>
                                <td className="text-padding tiny">
                                    <b>{peerGroupState.remote.size}</b>
                                </td>
                                <td className="text-padding tiny">
                                    {circulating !== undefined && <span>{FixedPoint.toNumber(circulating)}</span>}
                                </td>
                                <td className="text-padding tiny">
                                    {blockTime !== undefined && 
                                    <span>{(Number(blockTime)/(10**(FixedPoint.DECIMALS+3))).toFixed(1)}s</span>
                                    }
                                </td>
                                <td className="text-padding tiny">
                                {headBlock !== undefined &&
                                    <span>{(Number(headBlock.getMovingMinSpeed()) / 10**FixedPoint.DECIMALS)?.toFixed(1)}s</span>
                                }
                                </td>
                                <td className="text-padding tiny">
                                {headBlock !== undefined &&
                                    <span>{(Number(headBlock.getMovingMaxSpeed()) / 10**FixedPoint.DECIMALS)?.toFixed(1)}s</span>
                                }
                                </td>
                                <td className="text-padding tiny">
                                {headBlock !== undefined &&
                                    <span>{(Number(FixedPoint.divTrunc(headBlock.getMovingMaxSpeed(), headBlock.getMovingMinSpeed())) / 10**FixedPoint.DECIMALS).toFixed(1)}</span>
                                }
                                </td>
                            </tr>
                        </tbody>
                        </table>
                        }
                        
                    </div>
                    { loadedChain &&
                        <React.Fragment>
                            
                            <div>
                                <h5>Last blocks:</h5>
                                <table>
                                    <thead>
                                    <tr>
                                        <td className="text-padding tiny"></td>
                                        <td className="text-padding tiny">Block Hash</td>
                                        <td className="text-padding tiny">Coinbase</td>
                                        <td className="text-padding tiny">Tx</td>
                                        <td className="text-padding tiny">Timestamp</td>
                                    </tr>
                                    </thead>

                                    <tbody>
                                    {lastBlocks.map((block?: BlockOp) => 
                                        (<tr key={block?.getLastHash()}>
                                            <td className="text-padding tiny">#{block?._blockNumber?.toString(10)}</td>
                                            <td className="text-padding tiny">{block?.getLastHash()}</td>
                                            <td className="text-padding tiny">{block?.getAuthor()?.getLastHash()}</td>
                                            <td className="text-padding tiny">{block?.transactions?.length || 0}</td>
                                            <td className="text-padding tiny">{new Date(Number(block?.getTimestampMillisecs())/10**(FixedPoint.DECIMALS)).toLocaleString()}</td>
                                        </tr>)
                                    )}
                                    </tbody>
                                </table>
                                <h5>Whales:</h5>
                                <table>
                                    <thead>
                                        <tr>
                                            <td className="text-padding tiny">Address</td>
                                            <td className="text-padding tiny">Code</td>
                                            <td className="text-padding tiny">Info</td>
                                            <td className="text-padding tiny">Balance</td>
                                        </tr>
                                    </thead>
                                    <tbody>
                                    {whales.map((pair: [Hash, bigint]) => 
                                        (<tr key={pair[0]}>
                                            <td className="text-padding tiny">{pair[0]}</td>
                                            <td className="text-padding tiny">{Space.getWordCodingForHash(pair[0]).join(' ')}</td>
                                            <td className="text-padding tiny">{whaleInfo.get(pair[0])?.name !== undefined && <React.Fragment>{whaleInfo.get(pair[0])?.name}</React.Fragment>}{whaleInfo.get(pair[0])?.name === undefined && <React.Fragment><i>anonymous</i></React.Fragment>}</td>
                                            <td className="text-padding tiny">{FixedPoint.toNumber(pair[1])}</td>
                                        </tr>)
                                    )}
                                    </tbody>
                                </table>
                            </div>
                        </React.Fragment>
                    }
                    { !loadedChain && 
                        <React.Fragment>
                            { headBlockNumberForLoading === undefined &&
                                <span>Initializing...</span>
                            }
                            { headBlockNumberForLoading !== undefined &&
                                <span>Loading block #{headBlockNumberForLoading.toString(10)}</span>
                            }
                        </React.Fragment>
                    }
                </React.Fragment>
            }
            { !loadedSpace &&
                <React.Fragment>
                    <span>Connecting to chain, make sure someone is hosting it!</span>
                </React.Fragment>
            }
            </div>
        </div>
    );

}

export default ChainView;