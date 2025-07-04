import React from 'react';
import Svg, { Path } from 'react-native-svg';

const PackageIcon = ({size}:{size:number}) => {
    return (
        <Svg
            viewBox="0 0 1024 1024"
            width={size}
            height={size}
        >
            <Path
                d="M1007.99 236.38a29.823 29.823 0 0 0-6.7-3.14L524.96 5.01a29.988 29.988 0 0 0-25.93 0L21.25 233.95c-1.79 0.69-3.53 1.56-5.18 2.6a29.966 29.966 0 0 0-11.33 13.02c-0.09 0.19-0.17 0.38-0.25 0.57-0.15 0.35-0.3 0.71-0.44 1.07-0.14 0.37-0.28 0.74-0.41 1.12-0.05 0.16-0.11 0.32-0.16 0.49-0.96 2.94-1.48 6.05-1.48 9.24 0 0.49 0.03 0.98 0.05 1.47v498.4c0 11.54 6.62 22.07 17.04 27.05l480 230c4.11 1.97 8.54 2.95 12.96 2.95 5.46 0 10.9-1.5 15.69-4.44l477.22-228.67a30.006 30.006 0 0 0 17.04-27.05v-500c0-10.31-5.29-19.89-14.01-25.39zM512 65.33l410.27 196.59-410.42 196.65-410.26-196.58L512 65.33zM62.05 309.73L482 510.96v433.31L62.05 743.04V309.73z m480 634.37V510.93L962 309.71v433.17L542.05 944.1z"
                fill="#707070"
            />
            <Path
                d="M365.02 556.98l-160-76.67c-14.94-7.16-32.86-0.85-40.02 14.09-7.16 14.94-0.85 32.86 14.09 40.02l160 76.67c4.18 2 8.59 2.95 12.94 2.95 11.18 0 21.92-6.28 27.08-17.04 7.16-14.95 0.85-32.86-14.09-40.02z"
                fill="#707070"
            />
        </Svg>
    );
};

export default PackageIcon;
    