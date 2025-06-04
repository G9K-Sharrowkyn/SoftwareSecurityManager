import React, { useRef, useEffect } from 'react';
import Dos from 'js-dos';
import '../../assets/css/Registration.css';


const DosComponent = ({ commandLine = "dir" }) => {
    const dosRef = useRef(null);

    useEffect(() => {

        const dosbox = Dos({
            wdosboxUrl: "../../public/dos/wdosbox.js",
            root: dosRef.current
        });

        dosbox.run(["COMMAND.COM", "/C", commandLine]).catch(e => console.error(e));

        return () => dosbox.exit();
    }, [commandLine]);

    return <div ref={dosRef} className="DosBoxContainer" />;
};

export default DosComponent;
