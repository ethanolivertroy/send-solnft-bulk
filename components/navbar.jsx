import { WalletMultiButton, WalletDisconnectButton } from '@solana/wallet-adapter-react-ui'

import Link from 'next/link';
import { useState } from 'react';

export const Navbar = () => {
  const [active, setActive] = useState(false);

  const handleClick = () => {
    setActive(!active);
  };

  return (
    <>
      <nav className='flex flex-wrap items-center p-3 py-4 bg-orange-300'>
        <Link href='/'>
          <a className='inline-flex items-center p-3 mr-4 '>
          <img
                        src="https://raw.githubusercontent.com/Mango-Heroes/mh-website/6b18dcb1d537ca84de21c17e52e91b9568222846/template/public/images/mango_logo.png?token=GHSAT0AAAAAABSQCHQUADBKQLZOFTCVQUN4YTI6XZA"
                        className="h-20 p-2 hover:bg-white hover:bg-opacity-10 rounded"
                    />
          </a>
        </Link>
        <Link href='https://www.mangoheroes.com/'>
            <button className='font-bold tracking-wide uppercase'>
              Home
            </button>
          
        </Link>

        {/*Note that in this div we will use a ternary operator to decide whether or not to display the content of the div  */}
        <div
          className={`${
            active ? '' : 'hidden'
          }   w-full lg:inline-flex lg:flex-grow lg:w-auto`}
        >
          <div className='flex flex-col items-start w-full lg:inline-flex lg:flex-row lg:ml-auto lg:w-auto lg:items-center lg:h-auto'>
          <WalletMultiButton />
          
          </div>
          
        </div>
        
      </nav>
    </>
  );
};
