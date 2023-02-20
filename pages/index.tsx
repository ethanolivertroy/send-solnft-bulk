import { NextPage } from 'next'
import Head from 'next/head'
import Image from 'next/image'
import { Navbar } from '../components/navbar'
import { useMemo, useState } from 'react'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { LAMPORTS_PER_SOL, Transaction, PublicKey } from '@solana/web3.js'
import { gql, useQuery } from '@apollo/client'
import client from '../client'
import {
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddress,
  getOrCreateAssociatedTokenAccount,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createTransferInstruction
} from '@solana/spl-token'

const Home: NextPage = () => {
  const { publicKey, signTransaction } = useWallet()
  const { connection } = useConnection()

  const massSend = async (list: Nft[], to: String) => {
    if (!list || !to || !connection || !publicKey || !signTransaction) {
      console.log('returning')
      return
    }

    try {
      new PublicKey(to)
      console.log('valid dest address: ', to)
    } catch (e) {
      console.log('bad dest address')
      return
    }

    if (!list.length) {
      console.log('probably want to select some nfts')
      return
    }

    const tx = new Transaction()
    for (var i = 0; i < list.length; i++) {
      const mintPublicKey = new PublicKey(list[i].mintAddress)
      const fromTokenAccount = await getAssociatedTokenAddress(
        mintPublicKey,
        publicKey
      )
      const fromPublicKey = publicKey
      const destPublicKey = new PublicKey(to)
      const destTokenAccount = await getAssociatedTokenAddress(
        mintPublicKey,
        destPublicKey
      )
      const receiverAccount = await connection.getAccountInfo(destTokenAccount)

      if (receiverAccount === null) {
        tx.add(
          createAssociatedTokenAccountInstruction(
            fromPublicKey,
            destTokenAccount,
            destPublicKey,
            mintPublicKey,
            TOKEN_PROGRAM_ID,
            ASSOCIATED_TOKEN_PROGRAM_ID
          )
        )
      }

      tx.add(
        createTransferInstruction(
          fromTokenAccount,
          destTokenAccount,
          fromPublicKey,
          1
        )
      )
    }
    tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash
    tx.feePayer = publicKey

    let signed: Transaction | undefined = undefined

    try {
      signed = await signTransaction(tx)
    } catch (e) {
      console.log(e.message)
      return
    }

    let signature: string | undefined = undefined

    try {
      signature = await connection.sendRawTransaction(signed.serialize())

      await connection.confirmTransaction(signature, 'confirmed')
    } catch (e) {
      console.log(e.message)
    }
  }

  const GET_NFTS = gql`
    query GetNfts($owners: [PublicKey!], $limit: Int!, $offset: Int!) {
      nfts(owners: $owners, limit: $limit, offset: $offset) {
        address
        mintAddress
        name
        description
        image
        owner {
          address
          associatedTokenAccountAddress
        }
      }
    }
  `

  interface Nft {
    name: string
    address: string
    description: string
    image: string
    mintAddress: string
  }

  const [nfts, setNfts] = useState<Nft[]>([])
  const [sending, setSending] = useState<Nft[]>([])
  const [to, setTo] = useState('')

  useMemo(() => {
    if (publicKey?.toBase58()) {
      client
        .query({
          query: GET_NFTS,
          variables: {
            owners: [publicKey?.toBase58()],
            offset: 0,
            limit: 200
          }
        })
        .then(res => setNfts(res.data.nfts))
    } else {
      setNfts([])
    }
  }, [publicKey?.toBase58()])

  return (
    <div>
      <Head>
        <title>Mango Heroes: Hero Send</title>
        <meta name='description' content='The No Fee Bulk NFT Sender of Solana' />
        <link rel='icon' href='/favicon.ico' />
      </Head>
      <Navbar />

      <div className='container border-2 border-white border-opacity-20 rounded-xl p-6 md:p-8 lg:p-12 mt-8 bg-orange-300 bg-opacity-70 justify-center items-center'>
        <div className='grid grid-cols-2 gap-2'>
        <h2 className="col-span-2 tracking-wider font-sans text-white text-3xl md:text-2xl lg:text-5xl bg-clip-text bg-gradient-to-b from-green-600 to-indigo-600 justify-center">Choose your NFTs</h2>
          <div>
            <ul>
            <h1>From: {publicKey?.toBase58()}</h1>
              {nfts.map(e => (
                <li
                  className='flex mx-10 my-1 rounded-xl'
                  style={{ border: 'solid 2px black', marginTop: '0px' }}
                >
                  <img src={e.image} width={'50px'} className='rounded-xl'/>
                  <span className='block px-1'>{e.name}</span>
                  <button
                    onClick={() => {
                      setSending([...sending, e])
                      setNfts(nfts.filter((item)=> item !== e))
                    }}
                    className='flex items-center font-hand font-bold text-white pt-1 pb-1 px-2 bg-orange-500 rounded-lg hover:bg-orange-400 border-2 border-orange-300 ml-3 h-7'
                  >
                    Select
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h1> Send To: </h1>
            <input
              type='text'
              className='justify-left'
              placeholder='Wallet address or .sol domain'
              onChange={e => {
                setTo(e.target.value)
              }}
            />
              <button
              onClick={() => massSend(sending, to)}
              className='flex items-center font-hand font-bold text-white pt-1 pb-1 px-2 bg-red-500 rounded-lg hover:bg-red-400 border-2 border-red-300 ml-10 h-7 justify-right'
            >
              Send
            </button>
            <ul>
              {sending.map(e => (
                <li
                className='flex mx-10 my-1 rounded-xl'
                  style={{ border: 'solid 2px black', marginTop: '0px' }}
              >
                <img src={e.image} width={'50px'} className='rounded-xl'/>
                <span className='block'>{e.name}</span>
                <button
                  onClick={() => {
                    setSending(sending.filter((item)=>item !== e))
                    setNfts([...nfts, e])
                  }}
                  className='flex items-center font-hand font-bold text-white pt-1 pb-1 px-2 bg-orange-500 rounded-lg hover:bg-orange-400 border-2 border-orange-300 ml-10 h-7'
                >
                  Remove
                </button>
              </li>
              ))}
            </ul>
          
          </div>
        </div>
      </div>

      <footer>Yes we did it.</footer>
    </div>
  )
}

export default Home
