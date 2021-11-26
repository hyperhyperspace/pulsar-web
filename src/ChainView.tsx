import { Hash, Identity, Resources, SpaceInit } from '@hyper-hyper-space/core';
import { Blockchain, BlockOp, FixedPoint } from '@hyper-hyper-space/pulsar';
import { useSpace, useStateObject } from '@hyper-hyper-space/react';
import React, { useState } from 'react';

import './ChainView.css';

function ChainView(props: {resources: Resources, init?: SpaceInit}) {

    const space      = useSpace<Blockchain>(props.init, true, false);
    const blockchain = useStateObject(space, true)?.value;
    
    const [lastBlocks, setLastBlocks] = useState<Array<BlockOp>>([]);
    //const [whales, setWhales]         = useState<Array<[Hash, bigint]>>([]);

    space?.startSync();

    const loadedSpace = space !== undefined;
    const loadedChain = loadedSpace && blockchain?.hasLoadedAllChanges();

    const headBlock       = blockchain?._headBlock;
    const headBlockNumber = headBlock?._blockNumber;

    const headBlockNumberForLoading = headBlockNumber === undefined? undefined :
                                        ((headBlockNumber < BigInt(10)) ?
                                            headBlockNumber
                                        :
                                            (headBlockNumber - headBlockNumber % BigInt(10))
                                        );

    let whales: Array<[Hash, bigint]> = [];

    if (loadedChain && blockchain !== undefined) {
        const all = Array.from(blockchain._ledger.balances.entries());
                
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

        whales = all.slice(0, 10);
    }
    

    if (headBlock !== undefined && (lastBlocks.length === 0 || lastBlocks[0].getLastHash() !== headBlock.getLastHash())) {
        lastBlocks.unshift(headBlock);
        if (lastBlocks.length > 10) {
            lastBlocks.splice(10, 1);
        }
        setLastBlocks(lastBlocks);
    }
    
    return (
        <div id="chainView">
            <div className="page inner width padding">
                <h1>Pulsar - The Web Blockchain</h1>
            </div>
            <div className="page inner width">
            { loadedSpace &&
                <React.Fragment>
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
                                            <td className="text-padding tiny">Balance</td>
                                        </tr>
                                    </thead>
                                    <tbody>
                                    {whales.map((pair: [Hash, bigint]) => 
                                        (<tr key={pair[0]}>
                                            <td className="text-padding tiny">{pair[0]}</td>
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