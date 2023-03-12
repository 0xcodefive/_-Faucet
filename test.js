const web3Handlers = require("./web3Handlers");

async function main() {
    const addr = "0xc0dedbfd9224c8c7e0254825820cc706180259f2";
    const ip = "8.8.8.8";

    // const result = await web3Handlers.sendEthToWallet(addr, ip);
    // console.log(`result: ${result.result}`);
    // console.log(result.message);

    const val = await web3Handlers.isValidAddress(addr, ip);
    console.log(`result: ${val.result}`);
    console.log(val.message);
}

main().then(async () => {
    console.log("===================");
});