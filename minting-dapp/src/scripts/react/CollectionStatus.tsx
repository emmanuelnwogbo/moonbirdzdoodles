import React from 'react';

interface Props {
  userAddress: string|null;
  totalSupply: number;
  maxSupply: number;
  isPaused: boolean;
  isWhitelistMintEnabled: boolean;
  isUserInWhitelist: boolean;
}

interface State {

}

const defaultState: State = {
  
};

export default class CollectionStatus extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = defaultState;
  }

  private isSaleOpen(): boolean
  {
    return this.props.isWhitelistMintEnabled || !this.props.isPaused;
  }

  render() {
    return (
      <>
        <div className="collection-status">
          <div className="dapp__mint--useraddress">
            <span className="label">Wallet address:</span>
            <span className="address">{this.props.userAddress}</span>
          </div>
          
          <div className="supply">
            <span className="label"></span>
            
          </div>

          <div className="current-sale">
            <span className="label"></span>
            {this.isSaleOpen() ?
              <>
                {this.props.isWhitelistMintEnabled ? ' Sale is currently whitelist only' : ''}
              </>
              :
              ''
            }
          </div>
        </div>
      </>
    );
  }
}
