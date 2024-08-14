
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
            overflow-y-hidden
            px-[40px]'>
                <div className='flex'>
                    {headerNames.map((headerName) => (
                        <div className="
                        bg-mainBackgroundColor
                        text-md
                        h-[60px]
                        w-[350px]
                        cursor-grab
                        p-3
                        font-bold
                        border-columnBackgroundColor
                        flex
                        items-center
                        justify-between
                        ">
                            {headerName}
                        </div>
                    ))}
                </div>
        </div>
    )
}

export default ColumnHeaderContainer