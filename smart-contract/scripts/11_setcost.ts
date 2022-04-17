import NftContractProvider from '../lib/NftContractProvider';

async function main() {
  const contract = await NftContractProvider.getContract();

  await (await contract.setCost(0)).wait();

  console.log('const to mint changed');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});