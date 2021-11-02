import cx from 'classnames';
import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { Sample } from '../../api';
import { baseUrl } from '../../config';
import download from '../../helpers/download';
import { player, TogglePlayOptions } from '../../helpers/Player';
import ContextMenu from '../ContextMenu';
import VisualizeAnalyserNode from './VisualizeAnalyserNode';

export interface SampleItemProps {
    sample: Sample;
}

function usePlayer(sample: Sample): {
    togglePlay(options?: TogglePlayOptions): void;
    isPlaying: boolean;
    progresses: number[];
    analyserNode: AnalyserNode | null;
} {
    const [isPlaying, setPlaying] = useState<boolean>(() =>
        player.isPlaying(sample.key),
    );
    const [progresses, setProgresses] = useState<number[]>(() =>
        player.getProgresses(sample.key),
    );
    const [analyserNode, setAnalyserNode] = useState<AnalyserNode | null>(() =>
        player.getAnalyserNode(sample.key),
    );

    useEffect(() => {
        function handlePlay() {
            setPlaying(true);
            setAnalyserNode(player.getAnalyserNode(key));
        }

        function handleEnded() {
            setPlaying(false);
            setAnalyserNode(null);
        }

        function handleProgress() {
            setProgresses(player.getProgresses(key));
        }

        const { key } = sample;
        player.on('play', key, handlePlay);
        player.on('ended', key, handleEnded);
        player.on('progress', key, handleProgress);

        return () => {
            player.off('play', key, handlePlay);
            player.off('ended', key, handleEnded);
            player.off('progress', key, handleProgress);
        };
    }, [sample]);

    const togglePlay = useCallback(
        (options) => {
            player.togglePlay(sample, options);
        },
        [sample],
    );

    return { togglePlay, isPlaying, progresses, analyserNode };
}

// TODO: Move sample navigation code to SampleList

type ArrowKey = 'ArrowUp' | 'ArrowDown' | 'ArrowLeft' | 'ArrowRight';
type Direction = 'up' | 'down' | 'left' | 'right';

const keyToDirection: Record<ArrowKey, Direction> = {
    ArrowUp: 'up',
    ArrowDown: 'down',
    ArrowLeft: 'left',
    ArrowRight: 'right',
};

function navigateSample(target: HTMLElement, direction: Direction) {
    let nextTarget = null;

    switch (direction) {
        case 'left':
            nextTarget = target.previousElementSibling;
            break;
        case 'right':
            nextTarget = target.nextElementSibling;
            break;
        case 'up':
            nextTarget = findClosest(
                target,
                target.parentElement?.previousElementSibling,
            );
            break;
        case 'down':
            nextTarget = findClosest(
                target,
                target.parentElement?.nextElementSibling,
            );
            break;
    }

    if (nextTarget instanceof HTMLElement) {
        nextTarget.focus();
    }
}

function findClosest(
    target: Element,
    row: Element | undefined | null,
): Element | null {
    if (row === null || row === undefined) {
        return null;
    }

    const { left: targetMin, right: targetMax } =
        target.getBoundingClientRect();
    const targetMean = (targetMin + targetMax) / 2;

    let closest = null;
    let closestDissimilarity = Infinity;

    Array.from(row.children).forEach((child) => {
        const { left: childMin, right: childMax } =
            child.getBoundingClientRect();
        const childMean = (childMin + childMax) / 2;

        const dissimilarity =
            Math.abs(targetMean - childMean) /
            (Math.max(targetMax, childMax) - Math.min(targetMin, childMin));

        if (dissimilarity < closestDissimilarity) {
            closest = child;
            closestDissimilarity = dissimilarity;
        }
    });

    return closest;
}

export default function SampleItem({ sample }: SampleItemProps) {
    const { togglePlay, isPlaying, progresses, analyserNode } =
        usePlayer(sample);

    const contextMenuItems = useMemo(
        () => [
            {
                title: isPlaying ? 'Stop' : 'Play',
                shortcut: 'Click',
                onClick: () => {
                    togglePlay();
                },
            },
            {
                title: 'Loop',
                shortcut: 'Ctrl + Click',
                onClick: () => {
                    togglePlay({ loop: true });
                },
            },
            {
                title: 'Spam',
                shortcut: 'Shift + Click',
                onClick: () => {
                    togglePlay({ spam: true });
                },
            },
            {
                title: 'Copy URL',
                onClick: async () => {
                    const url = baseUrl + sample.id;
                    await navigator.clipboard.writeText(url);
                },
            },
            {
                title: 'Download',
                onClick: () => {
                    const fileName = decodeURIComponent(sample.path).replace(
                        /\//g,
                        '_',
                    );
                    download(sample.url, fileName);
                },
            },
        ],
        [togglePlay, isPlaying, sample],
    );

    return (
        <ContextMenu items={contextMenuItems}>
            {(props) => (
                <button
                    className={cx('SampleItem', {
                        'SampleItem--isPlaying': isPlaying,
                    })}
                    onClick={(e) => {
                        togglePlay({
                            spam: e.shiftKey,
                            loop: e.ctrlKey,
                        });
                        e.preventDefault();
                        e.stopPropagation();
                    }}
                    onKeyDown={(e) => {
                        const { key } = e;

                        if (key in keyToDirection) {
                            e.preventDefault();
                            navigateSample(
                                e.target as HTMLElement,
                                keyToDirection[
                                    key as keyof typeof keyToDirection
                                ],
                            );
                        }
                    }}
                    {...props}
                >
                    <span className="SampleItem__name">{sample.name}</span>
                    <span className="SampleItem__detail">
                        {sample.categories.join(' / ')}
                    </span>
                    {isPlaying && (
                        <>
                            {progresses.map((progress, index) => (
                                <div
                                    key={index}
                                    className="SampleItem__progress"
                                    style={{ transform: `scaleX(${progress})` }}
                                />
                            ))}

                            <VisualizeAnalyserNode
                                analyserNode={analyserNode}
                            />
                        </>
                    )}
                </button>
            )}
        </ContextMenu>
    );
}
