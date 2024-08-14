import React from 'react'

interface Props {
    name: string;
}

function RowDetails(props: Props) {
    const {name} = props;

    return (
        <div className='w-[200px] flex-none'
        >
            {name}
        </div>
    )
}

export default RowDetails