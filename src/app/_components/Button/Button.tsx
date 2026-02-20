import './Button.css';
interface ButtonProps{
    onClick?: any
    label: string
}

export default function Button(props:ButtonProps){
    const {label, onClick} = props;
    return(
        <button onClick={onClick} className="btn-primary">
            {label}
        </button>
    );
}