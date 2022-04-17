import NftContractProvider from '../lib/NftContractProvider';

async function main() {
  const contract = await NftContractProvider.getContract();

  await(await (await contract.withdraw()).wait());

  console.log('your funds have been withdrawn')
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});