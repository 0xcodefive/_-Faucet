const web3Handlers = require("./web3Handlers");

async function main() {
    const addr = "0x95a9528287836C0D86113d33D4d7281e17eF5425";
    const result = await web3Handlers.sendEthToWallet(addr, 'hohoho');
    console.log(`result: ${result.result}`);
    console.log(result.message);
}

main().then(async () => {
    console.log("===================");
});