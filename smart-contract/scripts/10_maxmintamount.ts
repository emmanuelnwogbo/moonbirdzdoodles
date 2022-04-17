import NftContractProvider from '../lib/NftContractProvider';

async function main() {
  const contract = await NftContractProvider.getContract();

  await (await contract.setMaxMintAmountPerTx(3)).wait();

  console.log('max mint amount changed');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});