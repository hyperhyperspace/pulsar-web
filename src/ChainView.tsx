import { Hash, Identity, Resources, SpaceInit } from '@hyper-hyper-space/core';
import { Blockchain, BlockOp, FixedPoint } from '@hyper-hyper-space/pulsar';
import { useSpace, useStateObject } from '@hyper-hyper-space/react';
import React, { useState } from 'react';

import './ChainView.css';

function ChainView(props: {resources: Resources, init: SpaceInit}) {

    const space      = useSpace<Blockchain>(props.init, true, false);
    const blockchain = useStateObject(space, true)?.value;
    
    const [lastBlocks, setLastBlocks] = useState<Array<BlockOp>>([]);
    //const [whales, setWhales]         = useState<Array<[Hash, bigint]>>([]);

    space?.startSync();

    console.log(blockchain?._headBlock?._blockNumber)
    console.log(blockchain?.hasLoadedAllChanges())
    console.log(blockchain?.isSynchronizing())

    const loadedSpace = space !== undefined;
    const loadedChain = loadedSpace && blockchain?.hasLoadedAllChanges();

    const headBlock       = blockchain?._headBlock;
    const headBlockNumber = headBlock?._blockNumber;

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
        <div id="chatView">
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
                                        <td className="text-padding small"></td>
                                        <td className="text-padding small">Block Hash</td>
                                        <td className="text-padding small">Coinbase</td>
                                        <td className="text-padding small">Tx</td>
                                        <td className="text-padding small">Timestamp</td>
                                    </tr>
                                    </thead>

                                    <tbody>
                                    {lastBlocks.map((block?: BlockOp) => 
                                        (<tr key={block?.getLastHash()}>
                                            <td className="text-padding small">#{block?._blockNumber?.toString(10)}</td>
                                            <td className="text-padding small">{block?.getLastHash()}</td>
                                            <td className="text-padding small">{block?.getAuthor()?.getLastHash()}</td>
                                            <td className="text-padding small">{block?.transactions?.length || 0}</td>
                                            <td className="text-padding small">{new Date(Number(block?.getTimestampMillisecs())/10**(FixedPoint.DECIMALS)).toLocaleString()}</td>
                                        </tr>)
                                    )}
                                    </tbody>
                                </table>
                                <h5>Whales:</h5>
                                <table>
                                    <thead>
                                        <tr>
                                            <td className="text-padding small">Address</td>
                                            <td className="text-padding small">Balance</td>
                                        </tr>
                                    </thead>
                                    <tbody>
                                    {whales.map((pair: [Hash, bigint]) => 
                                        (<tr key={pair[0]}>
                                            <td className="text-padding small">#{pair[0]}</td>
                                            <td className="text-padding small">{pair[1].toString(10)}</td>
                                        </tr>)
                                    )}
                                    </tbody>
                                </table>
                            </div>
                        </React.Fragment>
                    }
                    { !loadedChain && 
                        <React.Fragment>
                            <span>Loading block #{headBlockNumber?.toString(10)}</span>
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