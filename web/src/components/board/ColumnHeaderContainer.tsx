
interface Props {
    headerNames: string[];
}

function ColumnHeaderContainer(props: Props) {
    const { headerNames } = props;

    return (
        <div className='m-auto
            flex
            w-full 
            items-center
            overflow-x-auto
            overflow-y-hidden'>
            <div className='flex flex-row w-full'>
                <div className='w-[200px] flex-none bg-mainBackgroundColor'
                >

                </div>
                <div className='flex grow'>
                {headerNames.map((headerName) => (
                    <div
                        key={headerName} 
                        className="
                        bg-mainBackgroundColor
                        text-md
                        h-[60px]
                        cursor-grab
                        p-3
                        font-bold
                        border-columnBackgroundColor
                        flex
                        items-center
                        justify-between
                        grow
                        ">
                        {headerName}
                    </div>
                ))}
                </div>
            </div>
        </div>
    )
}

export default ColumnHeaderContainer