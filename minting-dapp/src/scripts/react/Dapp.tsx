import React from 'react';
import { ethers, BigNumber } from 'ethers'
import { ExternalProvider, Web3Provider } from '@ethersproject/providers';
import detectEthereumProvider from '@metamask/detect-provider';
import NftContractType from '../lib/NftContractType';
import CollectionConfig from '../../../../smart-contract/config/CollectionConfig';
import NetworkConfigInterface from '../../../../smart-contract/lib/NetworkConfigInterface';
import CollectionStatus from './CollectionStatus';
import MintWidget from './MintWidget';
import Whitelist from '../lib/Whitelist';

const ContractAbi = require('../../../../smart-contract/artifacts/contracts/' + CollectionConfig.contractName + '.sol/' + CollectionConfig.contractName + '.json').abi;

interface Props {
}

interface State {
  userAddress: string|null;
  network: ethers.providers.Network|null,
  networkConfig: NetworkConfigInterface,
  totalSupply: number;
  maxSupply: number;
  maxMintAmountPerTx: number;
  tokenPrice: BigNumber;
  isPaused: boolean;
  isWhitelistMintEnabled: boolean;
  isUserInWhitelist: boolean;
  merkleProofManualAddress: string;
  merkleProofManualAddressFeedbackMessage: string|JSX.Element|null;
  errorMessage: string|JSX.Element|null,
  time: String
}

const defaultState: State = {
  userAddress: null,
  network: null,
  networkConfig: CollectionConfig.mainnet,
  totalSupply: 0,
  maxSupply: 0,
  maxMintAmountPerTx: 0,
  tokenPrice: BigNumber.from(0),
  isPaused: true,
  isWhitelistMintEnabled: false,
  isUserInWhitelist: false,
  merkleProofManualAddress: '',
  merkleProofManualAddressFeedbackMessage: null,
  errorMessage: null,
  time: ''
};

export default class Dapp extends React.Component<Props, State> {
  provider!: Web3Provider;

  contract!: NftContractType;

  private merkleProofManualAddressInput!: HTMLInputElement;

  constructor(props: Props) {
    super(props);

    this.state = defaultState;
  }

  componentDidMount = async () => {
    const browserProvider = await detectEthereumProvider() as ExternalProvider;

    //this.timer();

    if (browserProvider?.isMetaMask !== true) {
      
      this.setError( 
        <>
          <div>Metamask not detected</div>
        </>,
      );
    }

    this.provider = new ethers.providers.Web3Provider(browserProvider);

    this.registerWalletEvents(browserProvider);

    //await this.initWallet();
  }


  async mintTokens(amount: number): Promise<void>
  {
    try {
      await this.contract.mint(amount, {value: this.state.tokenPrice.mul(amount)});
    } catch (e) {
      this.setError(e);
    }
  }

  async whitelistMintTokens(amount: number): Promise<void>
  {
    try {
      await this.contract.whitelistMint(amount, Whitelist.getProofForAddress(this.state.userAddress!), {value: this.state.tokenPrice.mul(amount)});
    } catch (e) {
      this.setError('Address has already claimed whitelist. Please wait for public sale');
    }
  }

  private isWalletConnected(): boolean
  {
    return this.state.userAddress !== null;
  }

  private isContractReady(): boolean
  {
    return this.contract !== undefined;
  }

  private isSoldOut(): boolean
  {
    return this.state.maxSupply !== 0 && this.state.totalSupply < this.state.maxSupply;
  }

  private isNotMainnet(): boolean
  {
    return this.state.network !== null && this.state.network.chainId !== CollectionConfig.mainnet.chainId;
  }

  private copyMerkleProofToClipboard(): void
  {
    const merkleProof = Whitelist.getRawProofForAddress(this.state.userAddress ?? this.state.merkleProofManualAddress);

    if (merkleProof.length < 1) {
      this.setState({
        merkleProofManualAddressFeedbackMessage: 'The given address is not in the whitelist, please double-check.',
      });

      return;
    }

    navigator.clipboard.writeText(merkleProof);

    this.setState({
      merkleProofManualAddressFeedbackMessage: 
      <>
        <strong>Congratulations!</strong> <span className="emoji">🎉</span><br />
        Your Merkle Proof <strong>has been copied to the clipboard</strong>. You can paste it into <a href={this.generateContractUrl()} target="_blank">{this.state.networkConfig.blockExplorer.name}</a> to claim your tokens.
      </>,
    });
  }

  render() {
    return (
      <>
       <div className="dapp">
        <div className="header">
          <div className="header__left">
            <div className="header__left--name">
              <figure className="header__left--figure">
                <img src="/build/images/REBELLION.png" />
              </figure>
            </div>
          </div>
          <div className="header__right">
            <span className="social" onClick={() => window.open("https://discord.gg/wmCcTtXUps")}>
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="52" viewBox="0 0 48 52" fill="none" data-v-379a16a5=""><g filter="url(#filter0_d_15_140)" data-v-379a16a5=""><path d="M24 44C35.0457 44 44 35.0457 44 24C44 12.9543 35.0457 4 24 4C12.9543 4 4 12.9543 4 24C4 35.0457 12.9543 44 24 44Z" fill="#5865F2" data-v-379a16a5=""></path> <path d="M32.8566 15.781C31.1358 15.026 29.2904 14.4697 27.3609 14.1511C27.3257 14.1449 27.2906 14.1603 27.2725 14.191C27.0352 14.5946 26.7723 15.1212 26.5882 15.5351C24.513 15.238 22.4483 15.238 20.4156 15.5351C20.2315 15.112 19.959 14.5946 19.7206 14.191C19.7025 14.1613 19.6674 14.1459 19.6323 14.1511C17.7039 14.4686 15.8585 15.0249 14.1366 15.781C14.1216 15.7872 14.1089 15.7974 14.1004 15.8107C10.6001 20.8112 9.64116 25.6888 10.1116 30.506C10.1137 30.5295 10.1275 30.5521 10.1467 30.5664C12.4561 32.1881 14.6932 33.1727 16.8887 33.8253C16.9238 33.8355 16.9611 33.8232 16.9834 33.7956C17.5028 33.1174 17.9657 32.4023 18.3627 31.6503C18.3861 31.6062 18.3637 31.554 18.3158 31.5366C17.5815 31.2702 16.8823 30.9454 16.2097 30.5766C16.1565 30.5469 16.1522 30.4742 16.2012 30.4393C16.3427 30.3379 16.4843 30.2324 16.6194 30.1258C16.6439 30.1064 16.678 30.1023 16.7067 30.1146C21.1254 32.0437 25.9092 32.0437 30.2758 30.1146C30.3046 30.1013 30.3386 30.1054 30.3642 30.1248C30.4994 30.2314 30.6409 30.3379 30.7835 30.4393C30.8324 30.4742 30.8292 30.5469 30.776 30.5766C30.1034 30.9526 29.4042 31.2702 28.6688 31.5356C28.6209 31.553 28.5997 31.6062 28.6231 31.6503C29.0285 32.4012 29.4915 33.1163 30.0013 33.7945C30.0226 33.8232 30.0608 33.8355 30.096 33.8253C32.3022 33.1727 34.5392 32.1881 36.8486 30.5664C36.8688 30.5521 36.8816 30.5305 36.8837 30.507C37.4467 24.9378 35.9408 20.1002 32.8917 15.8117C32.8843 15.7974 32.8715 15.7872 32.8566 15.781ZM19.0225 27.5728C17.6922 27.5728 16.596 26.4049 16.596 24.9706C16.596 23.5364 17.6709 22.3685 19.0225 22.3685C20.3847 22.3685 21.4703 23.5466 21.449 24.9706C21.449 26.4049 20.3741 27.5728 19.0225 27.5728ZM27.9941 27.5728C26.6638 27.5728 25.5676 26.4049 25.5676 24.9706C25.5676 23.5364 26.6425 22.3685 27.9941 22.3685C29.3563 22.3685 30.4419 23.5466 30.4206 24.9706C30.4206 26.4049 29.3563 27.5728 27.9941 27.5728Z" fill="white" data-v-379a16a5=""></path></g> <defs data-v-379a16a5=""><filter id="filter0_d_15_140" x="-4" y="0" width="56" height="56" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB" data-v-379a16a5=""><feFlood flood-opacity="0" result="BackgroundImageFix" data-v-379a16a5=""></feFlood> <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" data-v-379a16a5=""></feColorMatrix> <feOffset dy="4" data-v-379a16a5=""></feOffset> <feGaussianBlur stdDeviation="2" data-v-379a16a5=""></feGaussianBlur> <feComposite in2="hardAlpha" operator="out" data-v-379a16a5=""></feComposite> <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0" data-v-379a16a5=""></feColorMatrix> <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_15_140" data-v-379a16a5=""></feBlend> <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_15_140" result="shape" data-v-379a16a5=""></feBlend></filter></defs></svg>
            </span>
            <span className="social" onClick={() => window.open("https://twitter.com/TherebellionNFT")}>
              <svg xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" width="45" height="45" viewBox="0 0 45 45" fill="none" data-v-379a16a5=""><rect width="45" height="45" fill="url(#pattern0)" data-v-379a16a5=""></rect> <defs data-v-379a16a5=""><pattern id="pattern0" patternContentUnits="objectBoundingBox" width="1" height="1" data-v-379a16a5=""><use xlinkHref="#image0_15_143" transform="scale(0.0104167)" data-v-379a16a5=""></use></pattern> <image id="image0_15_143" width="96" height="96" xlinkHref="data:image/png;base64,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" data-v-379a16a5=""></image></defs></svg>
            </span>
            <span className="social" onClick={() => window.open("https://opensea.io/collection/the-rebellion-nft")}>
              <svg xmlns="http://www.w3.org/2000/svg" width="38" height="38" viewBox="0 0 90 90" fill="none">
                <path d="M90 45C90 69.8514 69.8514 90 45 90C20.1486 90 0 69.8514 0 45C0 20.1486 20.1486 0 45 0C69.8566 0 90 20.1486 90 45Z" fill="#2081E2"/>
                <path d="M22.2011 46.512L22.3953 46.2069L34.1016 27.8939C34.2726 27.6257 34.6749 27.6535 34.8043 27.9447C36.76 32.3277 38.4475 37.7786 37.6569 41.1721C37.3194 42.5683 36.3948 44.4593 35.3545 46.2069C35.2204 46.4612 35.0725 46.7109 34.9153 46.9513C34.8413 47.0622 34.7165 47.127 34.5824 47.127H22.5432C22.2196 47.127 22.0301 46.7756 22.2011 46.512Z" fill="white"/>
                <path d="M74.38 49.9149V52.8137C74.38 52.9801 74.2783 53.1281 74.1304 53.1928C73.2242 53.5812 70.1219 55.0052 68.832 56.799C65.5402 61.3807 63.0251 67.932 57.4031 67.932H33.949C25.6362 67.932 18.9 61.1727 18.9 52.8322V52.564C18.9 52.3421 19.0803 52.1618 19.3023 52.1618H32.377C32.6359 52.1618 32.8255 52.4022 32.8024 52.6565C32.7099 53.5072 32.8671 54.3764 33.2693 55.167C34.0461 56.7435 35.655 57.7283 37.3934 57.7283H43.866V52.675H37.4673C37.1391 52.675 36.9449 52.2959 37.1345 52.0277C37.2038 51.9214 37.2824 51.8104 37.3656 51.6856C37.9713 50.8257 38.8358 49.4895 39.6958 47.9684C40.2829 46.9421 40.8516 45.8463 41.3093 44.746C41.4018 44.5472 41.4758 44.3438 41.5497 44.1449C41.6746 43.7936 41.804 43.4653 41.8965 43.1371C41.9889 42.8597 42.0629 42.5684 42.1369 42.2956C42.3542 41.3617 42.4467 40.3723 42.4467 39.3459C42.4467 38.9437 42.4282 38.523 42.3912 38.1207C42.3727 37.6815 42.3172 37.2423 42.2617 36.8031C42.2247 36.4147 42.1554 36.031 42.0814 35.6288C41.9889 35.0416 41.8595 34.4591 41.7115 33.8719L41.6607 33.65C41.5497 33.2478 41.4573 32.864 41.3278 32.4618C40.9626 31.1996 40.5418 29.9698 40.098 28.8186C39.9362 28.3609 39.7512 27.9217 39.5663 27.4825C39.2935 26.8213 39.0161 26.2203 38.7619 25.6516C38.6324 25.3927 38.5214 25.1569 38.4105 24.9165C38.2857 24.6437 38.1562 24.371 38.0268 24.112C37.9343 23.9132 37.8279 23.7283 37.754 23.5434L36.9634 22.0824C36.8524 21.8836 37.0374 21.6478 37.2546 21.7079L42.2016 23.0487H42.2155C42.2247 23.0487 42.2294 23.0533 42.234 23.0533L42.8859 23.2336L43.6025 23.437L43.866 23.511V20.5706C43.866 19.1512 45.0034 18 46.4089 18C47.1116 18 47.7496 18.2866 48.2073 18.7536C48.665 19.2206 48.9517 19.8586 48.9517 20.5706V24.935L49.4787 25.0829C49.5204 25.0968 49.562 25.1153 49.599 25.143C49.7284 25.2401 49.9133 25.3835 50.1491 25.5591C50.3341 25.7071 50.5329 25.8874 50.7733 26.0723C51.2495 26.4561 51.8181 26.9508 52.4423 27.5194C52.6087 27.6628 52.7706 27.8107 52.9185 27.9587C53.723 28.7076 54.6245 29.5861 55.4845 30.557C55.7249 30.8297 55.9607 31.1071 56.2011 31.3984C56.4415 31.6943 56.6958 31.9856 56.9177 32.2769C57.209 32.6652 57.5233 33.0674 57.7961 33.4882C57.9256 33.687 58.0735 33.8904 58.1984 34.0892C58.5497 34.6209 58.8595 35.1711 59.1554 35.7212C59.2802 35.9755 59.4097 36.2529 59.5206 36.5257C59.8489 37.2608 60.1078 38.0098 60.2742 38.7588C60.3251 38.9206 60.3621 39.0963 60.3806 39.2535V39.2904C60.436 39.5124 60.4545 39.7482 60.473 39.9886C60.547 40.756 60.51 41.5235 60.3436 42.2956C60.2742 42.6239 60.1818 42.9336 60.0708 43.2619C59.9598 43.5763 59.8489 43.9045 59.7056 44.2143C59.4282 44.8569 59.0999 45.4996 58.7115 46.1006C58.5867 46.3225 58.4388 46.5583 58.2908 46.7802C58.129 47.016 57.9626 47.238 57.8146 47.4553C57.6112 47.7327 57.3939 48.0239 57.172 48.2828C56.9732 48.5556 56.7697 48.8284 56.5478 49.0688C56.2381 49.434 55.9422 49.7808 55.6324 50.1137C55.4475 50.331 55.2487 50.5529 55.0452 50.7517C54.8464 50.9736 54.643 51.1724 54.4581 51.3573C54.1483 51.6671 53.8894 51.9075 53.6721 52.1063L53.1635 52.5733C53.0896 52.638 52.9925 52.675 52.8908 52.675H48.9517V57.7283H53.9079C55.0175 57.7283 56.0716 57.3353 56.9223 56.6141C57.2136 56.3598 58.485 55.2594 59.9876 53.5997C60.0384 53.5442 60.1032 53.5026 60.1771 53.4841L73.8668 49.5265C74.1211 49.4525 74.38 49.6467 74.38 49.9149Z" fill="white"/>
              </svg>
            </span>
          </div>
        </div>
       <div className="jumbotron">
       <div className="dapp__left">
         <div className="dapp__left--midphrase">
          <span className="fff">A community driven brand</span>
          <span className="transparent">4600 hand painted NFTs ready to</span>
          <span className="transparent">take web3 by storm.</span>
         </div>

          <div className="dapp__mint">
          <div className="collection-sold-out">
            <h2>Tokens have been <strong>sold out</strong>! <span className="emoji">🥳</span></h2>

            You can check us out on <a className="proj-link" href="https://opensea.io/collection/the-rebellion-nft" target="_blank">{CollectionConfig.marketplaceConfig.name} </a><span>for reveal!</span>
          </div>
          {this.isNotMainnet() ?
          <div className="not-mainnet">
            <span className="small">Current network: <span className="dapp__mint--mainnetlabel">{this.state.network?.name}</span></span>
          </div>
          : <div className="dapp__mint--mainnet">
          <span className="small">{this.state.network ? 'Current network: ' : '' }<span className="dapp__mint--mainnetlabel">{this.state.network?.name === 'homestead' ? 'mainnet' : ''}</span></span>
        </div>}

        {this.state.errorMessage ? <div className="error"><p>{this.state.errorMessage}</p><button className="close" onClick={() => this.setError()}>Close</button></div> : null}
        
        {/*this.isWalletConnected() ?
          <>
            {this.isContractReady() ?
              <>
                <CollectionStatus
                  userAddress={this.state.userAddress}
                  maxSupply={this.state.maxSupply}
                  totalSupply={this.state.totalSupply}
                  isPaused={this.state.isPaused}
                  isWhitelistMintEnabled={this.state.isWhitelistMintEnabled}
                  isUserInWhitelist={this.state.isUserInWhitelist}
                />
                {this.state.totalSupply < this.state.maxSupply ?
                  <MintWidget
                    maxSupply={this.state.maxSupply}
                    totalSupply={this.state.totalSupply}
                    tokenPrice={this.state.tokenPrice}
                    maxMintAmountPerTx={this.state.maxMintAmountPerTx}
                    isPaused={this.state.isPaused}
                    isWhitelistMintEnabled={this.state.isWhitelistMintEnabled}
                    isUserInWhitelist={this.state.isUserInWhitelist}
                    mintTokens={(mintAmount) => this.mintTokens(mintAmount)}
                    whitelistMintTokens={(mintAmount) => this.whitelistMintTokens(mintAmount)}
                  />
                  :
                  <div className="collection-sold-out">
                    <h2>Tokens have been <strong>sold out</strong>! <span className="emoji">🥳</span></h2>

                    You can check us out on <a className="proj-link" href="https://opensea.io/collection/the-rebellion-nft" target="_blank">{CollectionConfig.marketplaceConfig.name} </a><span>for reveal!</span>
                  </div>
                }
              </>
              :
              <div className="collection-not-ready">
                Loading Rebellion data...
              </div>
            }
          </>
          : null*/}

        {/*!this.isWalletConnected() || !this.isSoldOut() ?
          <div className="no-wallet">
            {!this.isWalletConnected() ? <button className="primary connect" disabled={this.provider === undefined} onClick={() => this.connectWallet()}>Connect Wallet</button> : null}
          </div>
        : <div></div>*/}
          </div>

       </div>
       <div className="dapp__right">
          <div className="dapp__right--imgs">
          <figure>
            <img src="/build/images/male--character-237.png" />
          </figure>
          </div>
       </div>
       </div>
       </div>
      </>
    );
  }

  private setError(error: any = null): void
  {
    let errorMessage = 'Unknown error...';

    if (null === error || typeof error === 'string') {
      errorMessage = error;
    } else if (typeof error === 'object') {
      // Support any type of error from the Web3 Provider...
      if (error?.error?.message !== undefined) {
        errorMessage = error.error.message;
      } else if (error?.data?.message !== undefined) {
        errorMessage = error.data.message;
      } else if (error?.message !== undefined) {
        errorMessage = error.message;
      } else if (React.isValidElement(error)) {
        this.setState({errorMessage: error});
  
        return;
      }
    }

    this.setState({
      errorMessage: null === errorMessage ? null : errorMessage.charAt(0).toUpperCase() + errorMessage.slice(1),
    });
  }

  private generateContractUrl(): string
  {
    return this.state.networkConfig.blockExplorer.generateContractUrl(CollectionConfig.contractAddress!);
  }

  private generateMarketplaceUrl(): string
  {
    return CollectionConfig.marketplaceConfig.generateCollectionUrl(CollectionConfig.marketplaceIdentifier, !this.isNotMainnet());
  }

  private async connectWallet(): Promise<void>
  {
    try {
      await this.provider.provider.request!({ method: 'eth_requestAccounts' });

      this.initWallet();
    } catch (e) {
      this.setError(e);
    }
  }

  private async initWallet(): Promise<void>
  {
    const walletAccounts = await this.provider.listAccounts();
    
    this.setState(defaultState);

    if (walletAccounts.length === 0) {
      return;
    }

    const network = await this.provider.getNetwork();
    let networkConfig: NetworkConfigInterface;

    if (network.chainId === CollectionConfig.mainnet.chainId) {
      networkConfig = CollectionConfig.mainnet;
    } else if (network.chainId === CollectionConfig.testnet.chainId) {
      networkConfig = CollectionConfig.testnet;
    } else {
      this.setError('Unsupported network!');

      return;
    }
    
    this.setState({
      userAddress: walletAccounts[0],
      network,
      networkConfig,
    });

    if (await this.provider.getCode(CollectionConfig.contractAddress!) === '0x') {
      this.setError('Could not find the contract, are you connected to the right chain?');

      return;
    }

    this.contract = new ethers.Contract(
      CollectionConfig.contractAddress!,
      ContractAbi,
      this.provider.getSigner(),
    ) as NftContractType;

    this.setState({
      maxSupply: (await this.contract.maxSupply()).toNumber(),
      totalSupply: (await this.contract.totalSupply()).toNumber(),
      maxMintAmountPerTx: (await this.contract.maxMintAmountPerTx()).toNumber(),
      tokenPrice: await this.contract.cost(),
      isPaused: await this.contract.paused(),
      isWhitelistMintEnabled: await this.contract.whitelistMintEnabled(),
      isUserInWhitelist: Whitelist.contains(this.state.userAddress ?? ''),
    });
  }

  private registerWalletEvents(browserProvider: ExternalProvider): void
  {
    // @ts-ignore
    browserProvider.on('accountsChanged', () => {
      this.initWallet();
    });

    // @ts-ignore
    browserProvider.on('chainChanged', () => {
      window.location.reload();
    });
  }
}
