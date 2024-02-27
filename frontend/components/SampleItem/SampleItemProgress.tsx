import React, { useEffect, useState } from 'react';

import { Sample } from '../../api';
import { player } from '../../helpers/Player';

function usePlayerProgress(sample: Sample): number[] {
    const [progresses, setProgresses] = useState<number[]>(() =>
        player.getProgresses(sample.key),
    );

    useEffect(() => {
        function handleProgress() {
            setProgresses(player.getProgresses(sample.key));
        }

        player.on('progress', sample.key, handleProgress);
        return () => {
            player.off('progress', sample.key, handleProgress);
        };
    }, [sample]);

    return progresses;
}

export default function SampleItemProgress(props: {
    sample: Sample;
}): JSX.Element {
    const { sample } = props;
    const progresses = usePlayerProgress(sample);

    return (
        <svg className="SampleItem__progress">
            {progresses.map((progress, index) => (
                <rect key={index} width={`${progress * 100}%`} height="100%" />
            ))}
        </svg>
    );
}
